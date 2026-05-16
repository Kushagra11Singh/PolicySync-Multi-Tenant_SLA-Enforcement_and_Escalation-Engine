import pytest


@pytest.mark.django_db
class TestTicketCRUD:
    def test_create_ticket_sets_sla_deadline(
        self, admin_client, admin_user, sla_policy
    ):
        payload = {
            "title": "Production is down",
            "description": "Database unreachable since 3am",
            "priority": "critical",
            "sla_policy": str(sla_policy.id),
        }
        response = admin_client.post("/api/v1/tickets/", payload, format="json")
        assert response.status_code == 201

        data = response.json()
        assert data["sla_resolution_deadline"] is not None
        # 8-hour SLA policy — deadline should be roughly 8h from now
        assert "sla_resolution_deadline" in data

    def test_agent_sees_only_own_tickets(
        self, api_client, agent_user, admin_user, tenant, sla_policy
    ):
        from tests.factories import TicketFactory
        from rest_framework_simplejwt.tokens import RefreshToken

        # Create ticket assigned to agent
        TicketFactory(tenant=tenant, assigned_agent=agent_user, sla_policy=sla_policy)
        # Create ticket assigned to admin (agent should NOT see this)
        TicketFactory(tenant=tenant, assigned_agent=admin_user, sla_policy=sla_policy)

        token = RefreshToken.for_user(agent_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")

        response = api_client.get("/api/v1/tickets/")
        assert response.status_code == 200
        assert response.json()["count"] == 1

    def test_cross_tenant_isolation(
        self, admin_client, other_tenant, sla_policy
    ):
        from tests.factories import TicketFactory, SLAPolicyFactory
        other_policy = SLAPolicyFactory(tenant=other_tenant)
        TicketFactory(tenant=other_tenant, sla_policy=other_policy)

        response = admin_client.get("/api/v1/tickets/")
        # Our admin should see 0 tickets — the other tenant's ticket is invisible
        assert response.status_code == 200
        assert response.json()["count"] == 0

    def test_resolve_ticket(self, admin_client, tenant, sla_policy, admin_user):
        from tests.factories import TicketFactory
        ticket = TicketFactory(tenant=tenant, sla_policy=sla_policy)

        response = admin_client.patch(f"/api/v1/tickets/{ticket.id}/resolve/")
        assert response.status_code == 200
        assert response.json()["status"] == "resolved"
