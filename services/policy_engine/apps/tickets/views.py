from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from shared.models import Ticket, TicketComment, TicketStatus
from shared.utils.audit import emit_audit_event
from shared.utils.logger import get_logger
from .serializers import (
    TicketListSerializer,
    TicketDetailSerializer,
    TicketCreateSerializer,
    TicketCommentSerializer,
)

logger = get_logger(__name__)


class TicketViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return TicketCreateSerializer
        if self.action in ("retrieve", "update", "partial_update"):
            return TicketDetailSerializer
        return TicketListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = (
            Ticket.objects
            .select_related("sla_policy", "assigned_agent", "created_by", "tenant")
            .prefetch_related("tags", "comments__author")
            .filter(tenant=user.tenant)
        )

        # Agents only see tickets assigned to them
        if user.role == "agent":
            qs = qs.filter(assigned_agent=user)

        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        priority_filter = self.request.query_params.get("priority")
        if priority_filter:
            qs = qs.filter(priority=priority_filter)

        if self.request.query_params.get("escalated") == "true":
            qs = qs.filter(is_escalated=True)

        return qs.order_by("-created_at")

    def perform_create(self, serializer):
        ticket = serializer.save()
        logger.info(
            "ticket_created",
            extra={
                "ticket_id": str(ticket.id),
                "tenant_id": str(ticket.tenant_id),
                "user_id": str(self.request.user.id),
            },
        )
        emit_audit_event(
            action="ticket.created",
            resource_type="Ticket",
            resource_id=ticket.id,
            user=self.request.user,
            tenant=ticket.tenant,
            metadata={"title": ticket.title, "priority": ticket.priority},
            request=self.request,
        )

    @action(detail=True, methods=["patch"])
    def resolve(self, request, pk=None):
        ticket = self.get_object()
        if ticket.status in (TicketStatus.RESOLVED, TicketStatus.CLOSED):
            return Response(
                {"detail": "Ticket is already closed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ticket.status = TicketStatus.RESOLVED
        ticket.resolved_at = timezone.now()
        ticket.save(update_fields=["status", "resolved_at", "updated_at"])

        logger.info("ticket_resolved", extra={"ticket_id": str(ticket.id)})
        emit_audit_event(
            "ticket.resolved", "Ticket", ticket.id,
            user=request.user, tenant=ticket.tenant, request=request,
        )
        return Response(
            TicketDetailSerializer(ticket, context={"request": request}).data
        )

    @action(detail=True, methods=["post"])
    def comment(self, request, pk=None):
        ticket = self.get_object()
        serializer = TicketCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(ticket=ticket, author=request.user)

        # First reply from an agent records the response time
        if not ticket.first_response_at and request.user.role == "agent":
            ticket.first_response_at = comment.created_at
            ticket.save(update_fields=["first_response_at"])

        return Response(
            TicketCommentSerializer(comment).data,
            status=status.HTTP_201_CREATED,
        )
