from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from shared.models import Tenant, TenantSetting
from shared.utils.logger import get_logger
from .serializers import TenantSerializer, TenantCreateSerializer, TenantSettingSerializer
from .permissions import IsSystemAdmin, IsTenantAdmin

logger = get_logger(__name__)


class TenantViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSystemAdmin]

    def get_serializer_class(self):
        if self.action == "create":
            return TenantCreateSerializer
        return TenantSerializer

    def get_queryset(self):
        return Tenant.objects.prefetch_related("users", "sla_policies").all()

    def perform_create(self, serializer):
        tenant = serializer.save()
        logger.info(
            "tenant_created",
            extra={"tenant_id": str(tenant.id), "slug": tenant.slug},
        )

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        tenant = self.get_object()
        tenant.is_active = False
        tenant.save(update_fields=["is_active"])
        logger.info("tenant_deactivated", extra={"tenant_id": str(tenant.id)})
        return Response({"detail": "Tenant deactivated."})


class TenantSettingViewSet(viewsets.ModelViewSet):
    serializer_class = TenantSettingSerializer
    permission_classes = [IsTenantAdmin]

    def get_queryset(self):
        return TenantSetting.objects.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
