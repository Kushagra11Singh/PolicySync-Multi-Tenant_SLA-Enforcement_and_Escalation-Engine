from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from shared.models import SLAPolicy, EscalationRule
from shared.utils.logger import get_logger
from .serializers import SLAPolicySerializer, EscalationRuleSerializer
from apps.tenants.permissions import IsTenantAdmin

logger = get_logger(__name__)


class SLAPolicyViewSet(viewsets.ModelViewSet):
    serializer_class = SLAPolicySerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsTenantAdmin()]

    def get_queryset(self):
        return (
            SLAPolicy.objects
            .prefetch_related("escalation_rules__escalate_to")
            .filter(tenant=self.request.user.tenant)
            .order_by("name")
        )

    def perform_destroy(self, instance):
        # Soft delete — hard deleting breaks existing ticket FK references
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        logger.info(
            "sla_policy_deactivated",
            extra={"policy_id": str(instance.id), "tenant_id": str(instance.tenant_id)},
        )


class EscalationRuleViewSet(viewsets.ModelViewSet):
    serializer_class = EscalationRuleSerializer
    permission_classes = [IsTenantAdmin]

    def get_queryset(self):
        return (
            EscalationRule.objects
            .select_related("escalate_to", "sla_policy")
            .filter(tenant=self.request.user.tenant)
            .order_by("sla_policy", "level")
        )

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
