from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EscalationLogViewSet

router = DefaultRouter()
router.register(r"logs", EscalationLogViewSet, basename="escalation-log")

urlpatterns = [path("", include(router.urls))]
