from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SLAPolicyViewSet, EscalationRuleViewSet

router = DefaultRouter()
router.register(r"sla", SLAPolicyViewSet, basename="sla-policy")
router.register(r"escalation-rules", EscalationRuleViewSet, basename="escalation-rule")

urlpatterns = [path("", include(router.urls))]
