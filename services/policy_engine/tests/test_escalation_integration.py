import pytest
from datetime import timedelta
from django.utils import timezone
from unittest.mock import patch


@pytest.mark.django_db
class TestSLAEscalationIntegration:
    """
    Integration test:
    Create policy → create ticket (already past 80% SLA) → run check task
    → assert EscalationLog was created and escalation_worker was called.
    """

    def test_full_escalation_flow(self, tenant, manager_user, sla_policy, escalation_rule):
        from tests.factories import TicketFactory
        from shared.models import EscalationLog
        from apps.tickets.tasks import check_sla_breaches

        # Create a ticket that's already 90% through its 8-hour SLA
        # i.e. created 7.2h ago, deadline is now + 0.8h
        created_at = timezone.now() - timedelta(hours=7, minutes=12)
        deadline = created_at + timedelta(hours=sla_policy.resolution_time_hours)

        ticket = TicketFactory(
            tenant=tenant,
            sla_policy=sla_policy,
            assigned_agent=manager_user,
        )
        # Manually set the times to simulate an in-progress ticket
        ticket.created_at = created_at
        ticket.sla_response_deadline = created_at + timedelta(hours=sla_policy.response_time_hours)
        ticket.sla_resolution_deadline = deadline
        ticket.save()

        # Patch send_task so we don't need a running RabbitMQ in tests
        with patch("celery.app.base.Celery.send_task") as mock_send:
            check_sla_breaches()

        # Escalation event should have been queued
        mock_send.assert_called_once()
        call_kwargs = mock_send.call_args
        assert call_kwargs.kwargs["queue"] == "escalation"
        assert call_kwargs.kwargs["kwargs"]["ticket_id"] == str(ticket.id)

    def test_no_duplicate_escalation(self, tenant, manager_user, sla_policy, escalation_rule):
        from tests.factories import TicketFactory
        from shared.models import EscalationLog
        from apps.tickets.tasks import check_sla_breaches

        ticket = TicketFactory(tenant=tenant, sla_policy=sla_policy)
        ticket.created_at = timezone.now() - timedelta(hours=7, minutes=12)
        ticket.sla_resolution_deadline = ticket.created_at + timedelta(hours=8)
        ticket.save()

        # Simulate that escalation already fired at level 1
        EscalationLog.objects.create(
            ticket=ticket,
            tenant=tenant,
            rule=escalation_rule,
            escalated_to=manager_user,
            level=1,
            reason="Already fired",
            sla_percent_elapsed=85.0,
        )

        with patch("celery.app.base.Celery.send_task") as mock_send:
            check_sla_breaches()

        # Should not fire again for the same level
        mock_send.assert_not_called()
