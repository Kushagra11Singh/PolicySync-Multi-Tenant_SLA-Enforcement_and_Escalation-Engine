from rest_framework import serializers
from shared.models import SLAPolicy, EscalationRule, User


class EscalationRuleSerializer(serializers.ModelSerializer):
    escalate_to_email = serializers.EmailField(
        source="escalate_to.email", read_only=True
    )
    escalate_to_name = serializers.CharField(
        source="escalate_to.full_name", read_only=True
    )

    class Meta:
        model = EscalationRule
        fields = [
            "id", "level", "escalate_at_percent",
            "escalate_to", "escalate_to_email", "escalate_to_name",
            "is_active",
        ]
        read_only_fields = ["id"]

    def validate_escalate_to(self, user):
        request = self.context["request"]
        if user.tenant_id != request.user.tenant_id:
            raise serializers.ValidationError(
                "Escalation target must belong to your tenant."
            )
        return user

    def validate_escalate_at_percent(self, value):
        if not 1 <= value <= 100:
            raise serializers.ValidationError("Must be between 1 and 100.")
        return value


class SLAPolicySerializer(serializers.ModelSerializer):
    escalation_rules = EscalationRuleSerializer(many=True, read_only=True)
    open_ticket_count = serializers.SerializerMethodField()

    class Meta:
        model = SLAPolicy
        fields = [
            "id", "name", "description", "priority",
            "response_time_hours", "resolution_time_hours",
            "is_active", "open_ticket_count", "escalation_rules",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_open_ticket_count(self, obj):
        return obj.tickets.filter(
            status__in=["open", "in_progress", "pending"]
        ).count()

    def create(self, validated_data):
        validated_data["tenant"] = self.context["request"].user.tenant
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("tenant", None)
        return super().update(instance, validated_data)
