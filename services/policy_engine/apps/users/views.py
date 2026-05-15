from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from shared.models import User
from shared.utils.logger import get_logger
from .serializers import UserSerializer, UserCreateSerializer, LoginSerializer
from apps.tenants.permissions import IsTenantAdmin, IsTenantManager

logger = get_logger(__name__)


class LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)
        logger.info(
            "user_login",
            extra={
                "user_id": str(user.id),
                "tenant_id": str(user.tenant_id) if user.tenant_id else None,
            },
        )
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        })


class LogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data.get("refresh"))
            token.blacklist()
            logger.info("user_logout", extra={"user_id": str(request.user.id)})
            return Response({"detail": "Logged out successfully."})
        except Exception:
            return Response(
                {"detail": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ("me", "retrieve", "list"):
            return [IsAuthenticated()]
        return [IsTenantAdmin()]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.select_related("tenant").filter(
            tenant=user.tenant, is_active=True
        )
        if user.role == "agent":
            qs = qs.filter(id=user.id)
        return qs

    def perform_destroy(self, instance):
        # Never hard-delete users — soft delete only
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        logger.info("user_deactivated", extra={"user_id": str(instance.id)})

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def me(self, request):
        return Response(UserSerializer(request.user).data)
