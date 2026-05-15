import uuid
from django.db import models
from .tenant import Tenant


class AuditLog(models.Model):
    """
    Append-only compliance log. Written asynchronously by audit_worker —
    never directly from request handlers so it can't slow down the API.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    # Keep user info as strings — users can be deleted but audit records stay forever
    user_id = models.CharField(max_length=100, blank=True)
    user_email = models.EmailField(blank=True)
    action = models.CharField(max_length=100)         # e.g. "ticket.created"
    resource_type = models.CharField(max_length=100)  # e.g. "Ticket"
    resource_id = models.CharField(max_length=100, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "audit_logs"
        indexes = [
            models.Index(fields=["tenant", "created_at"]),
            models.Index(fields=["tenant", "action"]),
            models.Index(fields=["resource_type", "resource_id"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} on {self.resource_type}/{self.resource_id}"
