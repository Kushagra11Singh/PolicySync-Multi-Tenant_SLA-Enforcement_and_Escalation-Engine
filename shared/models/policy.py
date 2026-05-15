import uuid
from django.db import models
from .tenant import Tenant


class TicketPriority(models.TextChoices):
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"
    CRITICAL = "critical", "Critical"


class SLAPolicy(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="sla_policies"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    priority = models.CharField(
        max_length=20, choices=TicketPriority.choices, default=TicketPriority.MEDIUM
    )
    response_time_hours = models.PositiveIntegerField(
        help_text="Hours before first response is overdue"
    )
    resolution_time_hours = models.PositiveIntegerField(
        help_text="Hours before the ticket itself is overdue"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sla_policies"
        unique_together = [("tenant", "name")]
        indexes = [models.Index(fields=["tenant", "is_active"])]

    def __str__(self):
        return f"{self.name} — {self.resolution_time_hours}h [{self.tenant.slug}]"
