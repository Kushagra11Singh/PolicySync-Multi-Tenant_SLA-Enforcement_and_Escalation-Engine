from shared.utils.logger import get_logger

from config.celery import app
from shared.models import EscalationLog, EscalationRule, Ticket, Tenant

logger = get_logger(__name__)


@app.task(
    name="process_sla_escalation",
    bind=True,
    max_retries=3,
    default_retry_delay=30,
)
def process_sla_escalation(self, ticket_id: str, rule_id: str, percent_elapsed: float):
    """
    Consumes from the 'escalation' queue.
    Reads the ticket + rule, creates the EscalationLog row,
    then fires a notification task to the 'notifications' queue.
    """
    try:
        ticket = (
            Ticket.objects
            .select_related("tenant", "sla_policy", "assigned_agent")
            .get(id=ticket_id)
        )
        rule = (
            EscalationRule.objects
            .select_related("escalate_to", "sla_policy")
            .get(id=rule_id)
        )
    except (Ticket.DoesNotExist, EscalationRule.DoesNotExist) as exc:
        logger.error(
            "escalation_record_not_found",
            extra={"ticket_id": ticket_id, "rule_id": rule_id, "error": str(exc)},
        )
        return

    # Guard again — beat might have queued before another worker wrote the log
    # With this (atomic get_or_create):
    reason = (
        f"SLA {percent_elapsed:.1f}% elapsed — "
        f"deadline was {ticket.sla_resolution_deadline.strftime('%Y-%m-%d %H:%M UTC')}"
    )

    log, created = EscalationLog.objects.get_or_create(
        ticket=ticket,
        level=rule.level,
        defaults={
            "tenant": ticket.tenant,
            "rule": rule,
            "escalated_to": rule.escalate_to,
            "reason": reason,
            "sla_percent_elapsed": percent_elapsed,
        },
    )
    if not created:
        logger.info(
        "escalation_already_processed",
        extra={"ticket_id": ticket_id, "level": rule.level},
        )
        return

    # Update the ticket's escalation state
    Ticket.objects.filter(id=ticket_id).update(
        is_escalated=True,
        escalation_level=rule.level,
    )

    logger.info(
        "escalation_log_created",
        extra={
            "escalation_log_id": str(log.id),
            "ticket_id": ticket_id,
            "level": rule.level,
            "escalated_to": rule.escalate_to.email if rule.escalate_to else None,
        },
    )

    # Hand off to notification_dispatcher
    app.send_task(
        "send_escalation_notification",
        kwargs={"escalation_log_id": str(log.id)},
        queue="notifications",
    )

    # Also emit an audit event
    app.send_task(
        "record_audit_event",
        kwargs={
            "action": "ticket.escalated",
            "resource_type": "Ticket",
            "resource_id": ticket_id,
            "tenant_id": str(ticket.tenant_id),
            "metadata": {
                "level": rule.level,
                "percent_elapsed": percent_elapsed,
                "escalated_to": rule.escalate_to.email if rule.escalate_to else None,
            },
        },
        queue="audit",
    )
