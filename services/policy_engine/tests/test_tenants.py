import pytest


@pytest.mark.django_db
class TestTenantEndpoints:
    def test_list_tenants_requires_system_admin(self, api_client, admin_user, admin_client):
        # admin_user has a tenant FK so they are a tenant admin, not system admin
        # system admins have tenant=None — this test verifies tenant admins are blocked
        response = admin_client.get("/api/v1/tenants/")
        assert response.status_code == 403

    def test_unauthenticated_blocked(self, api_client):
        response = api_client.get("/api/v1/tenants/")
        assert response.status_code == 401
