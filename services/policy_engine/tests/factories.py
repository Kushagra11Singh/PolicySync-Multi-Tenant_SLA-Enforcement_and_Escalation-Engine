import factory
from factory.django import DjangoModelFactory

from shared.models import (
    Tenant,
    User,
    SLAPolicy,
    Ticket,
    EscalationRule,
    EscalationLog,
    Tag,
)


class TenantFactory(DjangoModelFactory):
    class Meta:
        model = Tenant

    name = factory.Sequence(lambda n: f"Acme Corp {n}")
    slug = factory.Sequence(lambda n: f"acme-{n}")
    is_active = True


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User

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

    name = factory.Sequence(lambda n: f"Standard SLA {n}")
    response_time_hours = 2
    resolution_time_hours = 8
    priority = "medium"
    is_active = True


class EscalationRuleFactory(DjangoModelFactory):
    class Meta:
        model = EscalationRule

    level = 1
    escalate_at_percent = 80
    is_active = True


class TicketFactory(DjangoModelFactory):
    class Meta:
        model = Ticket

    title = factory.Faker("sentence", nb_words=6)
    description = factory.Faker("paragraph")
    status = "open"
    priority = "medium"
