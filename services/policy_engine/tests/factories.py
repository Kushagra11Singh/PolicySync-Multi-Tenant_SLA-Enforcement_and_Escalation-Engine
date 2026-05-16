import factory
from factory.django import DjangoModelFactory

from shared.models import (
    Tenant,
    User,
    SLAPolicy,
    Ticket,
    EscalationRule,

)


class TenantFactory(DjangoModelFactory):
    class Meta:
        model = Tenant

    name = factory.Sequence(lambda n: f"Acme Corp {n}")
    slug = factory.Sequence(lambda n: f"acme-corp-{n}")
    is_active = True


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User

    tenant = factory.SubFactory(TenantFactory)
    email = factory.Sequence(lambda n: f"user{n}@example.com")
    full_name = factory.Faker("name")
    role = "agent"
    is_active = True

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        password = kwargs.pop("password", "testpass123!")
        return model_class.objects.create_user(password=password, **kwargs)


class SLAPolicyFactory(DjangoModelFactory):
    class Meta:
        model = SLAPolicy

    tenant = factory.SubFactory(TenantFactory)
    name = factory.Sequence(lambda n: f"Standard SLA {n}")
    response_time_hours = 2
    resolution_time_hours = 8
    priority = "medium"
    is_active = True


class EscalationRuleFactory(DjangoModelFactory):
    class Meta:
        model = EscalationRule

    tenant = factory.SubFactory(TenantFactory)
    sla_policy = factory.SubFactory(SLAPolicyFactory)
    level = 1
    escalate_at_percent = 80
    is_active = True


class TicketFactory(DjangoModelFactory):
    class Meta:
        model = Ticket

    tenant = factory.SubFactory(TenantFactory)
    title = factory.Faker("sentence", nb_words=6)
    description = factory.Faker("paragraph")
    status = "open"
    priority = "medium"
