from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers
from shared.models import Ticket, TicketComment, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "color"]
        read_only_fields = ["id"]


class TicketCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.full_name", read_only=True)

    class Meta:
        model = TicketComment
        fields = ["id", "body", "is_internal", "author_name", "created_at"]
        read_only_fields = ["id", "author_name", "created_at"]


class TicketListSerializer(serializers.ModelSerializer):
    """
    Lightweight — used in list views. Avoids N+1 by relying on select_related
    in the viewset queryset.
    """
    assigned_agent_name = serializers.CharField(
        source="assigned_agent.full_name", read_only=True
    )
    sla_policy_name = serializers.CharField(source="sla_policy.name", read_only=True)
    sla_percent_elapsed = serializers.SerializerMethodField()
    sla_status = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            "id", "title", "status", "priority",
            "assigned_agent_name", "sla_policy_name",
            "sla_resolution_deadline", "sla_percent_elapsed", "sla_status",
            "is_escalated", "escalation_level",
            "created_at", "updated_at",
        ]

    def get_sla_percent_elapsed(self, obj):
        if not obj.sla_resolution_deadline or not obj.created_at:
            return None
        total = (obj.sla_resolution_deadline - obj.created_at).total_seconds()
        if total <= 0:
            return 100.0
        elapsed = (timezone.now() - obj.created_at).total_seconds()
        return round(min((elapsed / total) * 100, 100), 1)

    def get_sla_status(self, obj):
        if obj.status in ("resolved", "closed"):
            return "met"
        percent = self.get_sla_percent_elapsed(obj)
        if percent is None:
            return "none"
        if percent >= 100:
            return "breached"
        if percent >= 80:
            return "at_risk"
        return "ok"


class TicketDetailSerializer(serializers.ModelSerializer):
    comments = TicketCommentSerializer(many=True, read_only=True)
    assigned_agent_name = serializers.CharField(
        source="assigned_agent.full_name", read_only=True
    )
    created_by_name = serializers.CharField(
        source="created_by.full_name", read_only=True
    )
    sla_policy_name = serializers.CharField(source="sla_policy.name", read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id", "title", "description", "status", "priority",
            "assigned_agent", "assigned_agent_name",
            "created_by", "created_by_name",
            "sla_policy", "sla_policy_name",
            "sla_response_deadline", "sla_resolution_deadline",
            "first_response_at", "resolved_at",
            "is_escalated", "escalation_level",
            "tags", "comments",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "created_by", "created_by_name",
            "sla_response_deadline", "sla_resolution_deadline",
            "first_response_at", "resolved_at",
            "is_escalated", "escalation_level",
            "created_at", "updated_at",
        ]

    def validate_assigned_agent(self, agent):
        if agent and agent.tenant_id != self.context["request"].user.tenant_id:
            raise serializers.ValidationError("Agent must belong to your tenant.")
        return agent


class TicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ["title", "description", "priority", "sla_policy", "assigned_agent"]

    def validate_assigned_agent(self, agent):
        if agent and agent.tenant_id != self.context["request"].user.tenant_id:
            raise serializers.ValidationError("Agent must belong to your tenant.")
        return agent

    def validate_sla_policy(self, policy):
        if policy and policy.tenant_id != self.context["request"].user.tenant_id:
            raise serializers.ValidationError("SLA policy must belong to your tenant.")
        return policy

    def create(self, validated_data):
        tenant = self.context["request"].user.tenant
        user = self.context["request"].user
        now = timezone.now()

        sla_policy = validated_data.get("sla_policy")
        sla_response_deadline = None
        sla_resolution_deadline = None

        if sla_policy:
            sla_response_deadline = now + timedelta(hours=sla_policy.response_time_hours)
            sla_resolution_deadline = now + timedelta(hours=sla_policy.resolution_time_hours)

        return Ticket.objects.create(
            tenant=tenant,
            created_by=user,
            sla_response_deadline=sla_response_deadline,
            sla_resolution_deadline=sla_resolution_deadline,
            **validated_data,
        )
