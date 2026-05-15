from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TenantViewSet, TenantSettingViewSet

router = DefaultRouter()
router.register(r"", TenantViewSet, basename="tenant")
router.register(r"settings", TenantSettingViewSet, basename="tenant-setting")

urlpatterns = [path("", include(router.urls))]
