from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django_prometheus import exports as prometheus_exports

urlpatterns = [
    path("admin/", admin.site.urls),

    # Auth + user management
    path("api/v1/auth/", include("apps.users.urls")),

    # Core resources
    path("api/v1/tenants/", include("apps.tenants.urls")),
    path("api/v1/policies/", include("apps.policies.urls")),
    path("api/v1/tickets/", include("apps.tickets.urls")),
    path("api/v1/escalations/", include("apps.escalations.urls")),

    # OpenAPI / Swagger
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),

    # Prometheus scrape endpoint
    path("metrics", prometheus_exports.ExportToDjangoView, name="prometheus-metrics"),
]
