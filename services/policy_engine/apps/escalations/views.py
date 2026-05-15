from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from shared.models import EscalationLog
from .serializers import EscalationLogSerializer


class EscalationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only. Escalation logs are written by escalation_worker —
    the policy engine only exposes them for display.
    """
    serializer_class = EscalationLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = (
            EscalationLog.objects
            .select_related("ticket", "escalated_to", "rule")
            .prefetch_related("notifications")
            .filter(tenant=self.request.user.tenant)
            .order_by("-created_at")
        )

        ticket_id = self.request.query_params.get("ticket")
        if ticket_id:
            qs = qs.filter(ticket_id=ticket_id)

        return qs
