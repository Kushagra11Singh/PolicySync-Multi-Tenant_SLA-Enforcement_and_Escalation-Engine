import uuid
from django.db import models
from .tenant import Tenant
from .user import User
from .policy import SLAPolicy


class TicketStatus(models.TextChoices):
    OPEN = "open", "Open"
    IN_PROGRESS = "in_progress", "In Progress"
    PENDING = "pending", "Pending Customer"
    RESOLVED = "resolved", "Resolved"
    CLOSED = "closed", "Closed"


class Tag(models.Model):
    """Reusable ticket labels scoped per tenant."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="tags")
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default="#6366f1")  # hex color

    class Meta:
        db_table = "tags"
        unique_together = [("tenant", "name")]

    def __str__(self):
        return f"{self.name} [{self.tenant.slug}]"


class Ticket(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="tickets")
    title = models.CharField(max_length=500)
    description = models.TextField()
    status = models.CharField(
        max_length=20, choices=TicketStatus.choices, default=TicketStatus.OPEN
    )
    priority = models.CharField(
        max_length=20,
        choices=[
            ("low", "Low"),
            ("medium", "Medium"),
            ("high", "High"),
            ("critical", "Critical"),
        ],
        default="medium",
    )
    sla_policy = models.ForeignKey(
        SLAPolicy,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tickets",
    )
    assigned_agent = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tickets",
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_tickets",
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name="tickets")

    # SLA deadline tracking
    sla_response_deadline = models.DateTimeField(null=True, blank=True)
    sla_resolution_deadline = models.DateTimeField(null=True, blank=True)
    first_response_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    is_escalated = models.BooleanField(default=False)
    escalation_level = models.PositiveSmallIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tickets"
        indexes = [
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["tenant", "is_escalated"]),
            models.Index(fields=["sla_resolution_deadline"]),
            models.Index(fields=["tenant", "assigned_agent"]),
        ]

    def __str__(self):
        return f"[{self.priority.upper()}] {self.title[:60]}"


class TicketComment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(
        Ticket, on_delete=models.CASCADE, related_name="comments"
    )
    author = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="comments"
    )
    body = models.TextField()
    is_internal = models.BooleanField(
        default=False,
        help_text="Internal notes — hidden from the customer-facing view",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ticket_comments"
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment on ticket {self.ticket_id} by {self.author_id}"
