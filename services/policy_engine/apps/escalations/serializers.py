from rest_framework import serializers
from shared.models import EscalationLog, EscalationNotification


class EscalationNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EscalationNotification
        fields = ["id", "channel_type", "destination", "status", "sent_at", "retry_count"]


class EscalationLogSerializer(serializers.ModelSerializer):
    ticket_title = serializers.CharField(source="ticket.title", read_only=True)
    escalated_to_email = serializers.EmailField(
        source="escalated_to.email", read_only=True
    )
    escalated_to_name = serializers.CharField(
        source="escalated_to.full_name", read_only=True
    )
    notifications = EscalationNotificationSerializer(many=True, read_only=True)

    class Meta:
        model = EscalationLog
        fields = [
            "id", "ticket", "ticket_title",
            "level", "reason", "sla_percent_elapsed",
            "escalated_to", "escalated_to_email", "escalated_to_name",
            "notifications", "created_at",
        ]
