import uuid
from django.db import models
from .tenant import Tenant
from .user import User
from .ticket import Ticket
from .policy import SLAPolicy


class EscalationRule(models.Model):
    """
    Defines when to escalate: if 80% of SLA time is gone, fire level-1 escalation.
    Multiple rules per policy allow cascading: L1 at 80%, L2 at 95%, L3 at 100%.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="escalation_rules"
    )
    sla_policy = models.ForeignKey(
        SLAPolicy, on_delete=models.CASCADE, related_name="escalation_rules"
    )
    level = models.PositiveSmallIntegerField()
    escalate_at_percent = models.PositiveSmallIntegerField(
        default=80,
        help_text="Fire when this % of resolution time has elapsed",
    )
    escalate_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="escalation_rules",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "escalation_rules"
        unique_together = [("sla_policy", "level")]
        ordering = ["level"]

    def __str__(self):
        return (
            f"L{self.level} at {self.escalate_at_percent}% → {self.sla_policy.name}"
        )


class EscalationLog(models.Model):
    """One row per escalation event fired against a ticket."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(
        Ticket, on_delete=models.CASCADE, related_name="escalation_logs"
    )
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="escalation_logs"
    )
    rule = models.ForeignKey(
        EscalationRule, on_delete=models.SET_NULL, null=True, related_name="logs"
    )
    escalated_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="received_escalations",
    )
    level = models.PositiveSmallIntegerField()
    reason = models.TextField()
    sla_percent_elapsed = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "escalation_logs"
        unique_together = [("ticket", "level")]
        indexes = [
            models.Index(fields=["tenant", "created_at"]),
            models.Index(fields=["ticket"]),
        ]

    def __str__(self):
        return f"L{self.level} escalation on ticket {self.ticket_id}"


class EscalationNotification(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"
        RETRYING = "retrying", "Retrying"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    escalation_log = models.ForeignKey(
        EscalationLog, on_delete=models.CASCADE, related_name="notifications"
    )
    channel_type = models.CharField(max_length=50)
    destination = models.CharField(max_length=500)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    retry_count = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "escalation_notifications"

    def __str__(self):
        return f"{self.channel_type} → {self.destination} [{self.status}]"
