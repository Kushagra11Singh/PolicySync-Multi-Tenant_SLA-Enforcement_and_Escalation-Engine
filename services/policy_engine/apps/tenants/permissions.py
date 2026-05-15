from rest_framework.permissions import BasePermission
from shared.models import UserRole


class IsSystemAdmin(BasePermission):
    """Platform-level admin — no tenant FK."""
    message = "Only system administrators can do this."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == UserRole.ADMIN
            and request.user.tenant_id is None
        )


class IsTenantAdmin(BasePermission):
    """Admin within their own tenant."""
    message = "Only tenant administrators can do this."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == UserRole.ADMIN
            and request.user.tenant_id is not None
        )


class IsTenantManager(BasePermission):
    """Manager or admin within their tenant."""
    message = "Only managers and admins can do this."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in (UserRole.ADMIN, UserRole.MANAGER)
            and request.user.tenant_id is not None
        )
