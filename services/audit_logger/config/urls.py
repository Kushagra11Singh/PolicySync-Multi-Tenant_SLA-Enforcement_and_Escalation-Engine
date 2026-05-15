from django.urls import path, include

urlpatterns = [
    path("api/v1/audit/", include("apps.logs.urls")),
]
