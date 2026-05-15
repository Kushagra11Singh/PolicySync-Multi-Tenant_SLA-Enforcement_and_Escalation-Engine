from __future__ import annotations


def get_client_ip(request) -> str | None:
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def emit_audit_event(
    action: str,
    resource_type: str,
    resource_id: str,
    user=None,
    tenant=None,
    metadata: dict | None = None,
    request=None,
):
    """
    Fire-and-forget: queues an audit event to RabbitMQ.
    The audit_worker service picks it up and writes to DB.
    Never blocks the request — if this fails, the main action still succeeds.
    """
    from celery import current_app

    payload = {
        "action": action,
        "resource_type": resource_type,
        "resource_id": str(resource_id),
        "user_id": str(user.id) if user else None,
        "user_email": user.email if user else None,
        "tenant_id": str(tenant.id) if tenant else None,
        "metadata": metadata or {},
        "ip_address": get_client_ip(request) if request else None,
        "user_agent": request.META.get("HTTP_USER_AGENT", "") if request else "",
    }

    try:
        current_app.send_task(
            "record_audit_event",
            kwargs=payload,
            queue="audit",
        )
    except Exception:
        # Audit failure must never break the main flow
        import logging
        logging.getLogger(__name__).warning(
            "audit_emit_failed", extra={"action": action, "resource_id": resource_id}
        )
