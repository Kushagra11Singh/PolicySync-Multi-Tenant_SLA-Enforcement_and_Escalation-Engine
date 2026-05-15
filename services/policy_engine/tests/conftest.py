import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .factories import TenantFactory, UserFactory, SLAPolicyFactory, EscalationRuleFactory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def tenant(db):
    return TenantFactory()


@pytest.fixture
def other_tenant(db):
    return TenantFactory()


@pytest.fixture
def admin_user(db, tenant):
    return UserFactory(tenant=tenant, role="admin")


@pytest.fixture
def manager_user(db, tenant):
    return UserFactory(tenant=tenant, role="manager")


@pytest.fixture
def agent_user(db, tenant):
    return UserFactory(tenant=tenant, role="agent")


@pytest.fixture
def admin_client(api_client, admin_user):
    token = RefreshToken.for_user(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")
    return api_client


@pytest.fixture
def agent_client(api_client, agent_user):
    token = RefreshToken.for_user(agent_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")
    return api_client


@pytest.fixture
def sla_policy(db, tenant):
    return SLAPolicyFactory(tenant=tenant)


@pytest.fixture
def escalation_rule(db, tenant, sla_policy, manager_user):
    return EscalationRuleFactory(
        tenant=tenant,
        sla_policy=sla_policy,
        escalate_to=manager_user,
    )
