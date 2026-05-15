import uuid
from django.db import models
from .tenant import Tenant


class NotificationChannel(models.Model):
    class ChannelType(models.TextChoices):
        EMAIL = "email", "Email"
        WEBHOOK = "webhook", "Webhook"
        SLACK = "slack", "Slack"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="notification_channels"
    )
    name = models.CharField(max_length=255)
    channel_type = models.CharField(max_length=20, choices=ChannelType.choices)
    # config schema depends on channel_type:
    #   email:   {"to": "ops@acme.com"}
    #   webhook: {"url": "https://hooks.example.com/...", "secret": "..."}
    #   slack:   {"webhook_url": "https://hooks.slack.com/..."}
    config = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "notification_channels"
        unique_together = [("tenant", "name")]

    def __str__(self):
        return f"{self.name} ({self.channel_type}) — {self.tenant.slug}"
