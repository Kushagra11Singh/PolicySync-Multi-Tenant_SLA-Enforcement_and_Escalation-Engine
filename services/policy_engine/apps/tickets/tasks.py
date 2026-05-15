from celery import shared_task
from django.utils import timezone

from shared.models import Ticket, EscalationRule, EscalationLog, TicketStatus
from shared.utils.logger import get_logger

logger = get_logger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60, name="apps.tickets.tasks.check_sla_breaches")
def check_sla_breaches(self):
    """
    Runs every 60 seconds via Celery beat.
    Scans all non-resolved tickets for SLA breaches and queues escalation tasks.
    This task itself is lightweight — it just identifies and routes.
    The actual escalation_worker does the heavy lifting.
    """
    from celery import current_app

    now = timezone.now()
    logger.info("sla_check_started")

    open_tickets = (
        Ticket.objects
        .select_related("sla_policy", "tenant", "assigned_agent")
        .filter(
            status__in=[
                TicketStatus.OPEN,
                TicketStatus.IN_PROGRESS,
                TicketStatus.PENDING,
            ],
            sla_resolution_deadline__isnull=False,
            sla_policy__isnull=False,
        )
    )

    queued = 0

    for ticket in open_tickets:
        try:
            total = (ticket.sla_resolution_deadline - ticket.created_at).total_seconds()
            if total <= 0:
                continue

            elapsed = (now - ticket.created_at).total_seconds()
            percent_elapsed = min((elapsed / total) * 100, 100)

            rules = (
                EscalationRule.objects
                .filter(
                    sla_policy=ticket.sla_policy,
                    is_active=True,
                    escalate_at_percent__lte=percent_elapsed,
                )
                .order_by("level")
            )

            for rule in rules:
                already_fired = EscalationLog.objects.filter(
                    ticket=ticket, level=rule.level
                ).exists()
                if already_fired:
                    continue

                # Route to escalation_worker via RabbitMQ
                current_app.send_task(
                    "process_sla_escalation",
                    kwargs={
                        "ticket_id": str(ticket.id),
                        "rule_id": str(rule.id),
                        "percent_elapsed": round(percent_elapsed, 2),
                    },
                    queue="escalation",
                )
                queued += 1

        except Exception as exc:
            logger.error(
                "sla_check_ticket_error",
                extra={"ticket_id": str(ticket.id), "error": str(exc)},
            )

    logger.info(
        "sla_check_done",
        extra={"tickets_checked": open_tickets.count(), "events_queued": queued},
    )
