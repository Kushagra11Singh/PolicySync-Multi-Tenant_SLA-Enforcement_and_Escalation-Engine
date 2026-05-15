import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.utils import timezone
from config.celery import app
from shared.models import EscalationLog, EscalationNotification, NotificationChannel
from shared.utils.logger import get_logger
from .email_handler import send_email
from .webhook_handler import send_webhook

logger = get_logger(__name__)


def _build_email_body(log: EscalationLog) -> str:
    ticket = log.ticket
    return f"""
    <h2>SLA Escalation Alert — Level {log.level}</h2>
    <p><strong>Ticket:</strong> {ticket.title}</p>
    <p><strong>Priority:</strong> {ticket.priority.upper()}</p>
    <p><strong>SLA elapsed:</strong> {log.sla_percent_elapsed:.1f}%</p>
    <p><strong>Reason:</strong> {log.reason}</p>
    <p><strong>Deadline:</strong> {ticket.sla_resolution_deadline}</p>
    <hr>
    <p>Please take action immediately.</p>
    """


@app.task(
    name="send_escalation_notification",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def send_escalation_notification(self, escalation_log_id: str):
    """
    Consumes from 'notifications' queue.
    Reads the escalation log, finds active notification channels for that tenant,
    dispatches email and/or webhook, records delivery status.
    """
    try:
        log = (
            EscalationLog.objects
            .select_related("ticket__tenant", "escalated_to", "rule")
            .get(id=escalation_log_id)
        )
    except EscalationLog.DoesNotExist:
        logger.error(
            "escalation_log_not_found",
            extra={"escalation_log_id": escalation_log_id},
        )
        return

    tenant = log.ticket.tenant
    channels = NotificationChannel.objects.filter(tenant=tenant, is_active=True)

    if not channels.exists():
        # Always at least email the escalation target directly
        if log.escalated_to and log.escalated_to.email:
            _dispatch_email(log, log.escalated_to.email)
        return

    for channel in channels:
        notification = EscalationNotification.objects.create(
            escalation_log=log,
            channel_type=channel.channel_type,
            destination=channel.config.get("to") or channel.config.get("url", ""),
        )
        success = False

        if channel.channel_type == "email":
            to = channel.config.get("to", "")
            if to:
                success = _dispatch_email(log, to)

        elif channel.channel_type == "webhook":
            url = channel.config.get("url", "")
            secret = channel.config.get("secret", "")
            if url:
                payload = {
                    "event": "sla.escalated",
                    "level": log.level,
                    "ticket_id": str(log.ticket_id),
                    "ticket_title": log.ticket.title,
                    "percent_elapsed": log.sla_percent_elapsed,
                    "reason": log.reason,
                }
                success = send_webhook(url, payload, secret)

        notification.status = (
            EscalationNotification.Status.SENT
            if success
            else EscalationNotification.Status.FAILED
        )
        notification.sent_at = timezone.now() if success else None
        notification.save(update_fields=["status", "sent_at"])

        if not success:
            try:
                raise self.retry(
                    countdown=60 * (self.request.retries + 1)
                )
            except self.MaxRetriesExceededError:
                logger.error(
                    "notification_max_retries",
                    extra={"escalation_log_id": escalation_log_id},
                )


def _dispatch_email(log: EscalationLog, to: str) -> bool:
    subject = f"[PolicySync] L{log.level} SLA Escalation — {log.ticket.title[:50]}"
    body = _build_email_body(log)
    return send_email(to, subject, body)
