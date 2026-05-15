import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from config.celery import app
from shared.models import AuditLog, Tenant
from shared.utils.logger import get_logger

logger = get_logger(__name__)


@app.task(name="record_audit_event", bind=True, max_retries=3, default_retry_delay=15)
def record_audit_event(
    self,
    action: str,
    resource_type: str,
    resource_id: str = "",
    user_id: str = "",
    user_email: str = "",
    tenant_id: str | None = None,
    metadata: dict | None = None,
    ip_address: str | None = None,
    user_agent: str = "",
):
    """
    Consumes from 'audit' queue. Writes one AuditLog row per event.
    This is append-only — no updates, no deletes.
    """
    try:
        tenant = None
        if tenant_id:
            tenant = Tenant.objects.filter(id=tenant_id).first()

        AuditLog.objects.create(
            tenant=tenant,
            user_id=user_id or "",
            user_email=user_email or "",
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata=metadata or {},
            ip_address=ip_address,
            user_agent=user_agent,
        )

        logger.info(
            "audit_event_recorded",
            extra={
                "action": action,
                "resource_type": resource_type,
                "tenant_id": tenant_id,
            },
        )
    except Exception as exc:
        logger.error("audit_write_failed", extra={"error": str(exc), "action": action})
        raise self.retry(exc=exc)
