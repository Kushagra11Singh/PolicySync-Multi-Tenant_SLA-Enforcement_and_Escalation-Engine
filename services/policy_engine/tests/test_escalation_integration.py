import pytest
from datetime import timedelta
from django.utils import timezone
from unittest.mock import patch


@pytest.mark.django_db
class TestSLAEscalationIntegration:
    """
    Integration test:
    Create policy → create ticket → simulate 90% SLA elapsed →
    run check task → assert escalation_worker was called.
    """

    def test_full_escalation_flow(self, tenant, manager_user, sla_policy, escalation_rule):
        from tests.factories import TicketFactory
        from apps.tickets.tasks import check_sla_breaches

        # Create ticket then manually backdate created_at and set deadline
        # via .update() because auto_now_add blocks direct assignment
        ticket = TicketFactory(
            tenant=tenant,
            sla_policy=sla_policy,
            assigned_agent=manager_user,
        )
        created_at = timezone.now() - timedelta(hours=7, minutes=30)
        deadline = created_at + timedelta(hours=sla_policy.resolution_time_hours)

        from shared.models import Ticket
        Ticket.objects.filter(id=ticket.id).update(
            created_at=created_at,
            sla_response_deadline=created_at + timedelta(hours=sla_policy.response_time_hours),
            sla_resolution_deadline=deadline,
        )

        with patch("celery.app.base.Celery.send_task") as mock_send:
            check_sla_breaches()

        mock_send.assert_called_once()
        call_kwargs = mock_send.call_args
        assert call_kwargs.kwargs["queue"] == "escalation"
        assert call_kwargs.kwargs["kwargs"]["ticket_id"] == str(ticket.id)

    def test_no_duplicate_escalation(self, tenant, manager_user, sla_policy, escalation_rule):
        from tests.factories import TicketFactory
        from shared.models import EscalationLog, Ticket
        from apps.tickets.tasks import check_sla_breaches

        ticket = TicketFactory(tenant=tenant, sla_policy=sla_policy)
        created_at = timezone.now() - timedelta(hours=7, minutes=30)
        Ticket.objects.filter(id=ticket.id).update(
            created_at=created_at,
            sla_resolution_deadline=created_at + timedelta(hours=8),
        )

        EscalationLog.objects.create(
            ticket=ticket,
            tenant=tenant,
            rule=escalation_rule,
            escalated_to=manager_user,
            level=1,
            reason="Already fired in a previous check cycle",
            sla_percent_elapsed=85.0,
        )

        with patch("celery.app.base.Celery.send_task") as mock_send:
            check_sla_breaches()

        mock_send.assert_not_called()
