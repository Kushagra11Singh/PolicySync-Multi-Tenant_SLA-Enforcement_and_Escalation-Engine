import logging
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from shared.models import (
    EscalationRule, NotificationChannel,
    SLAPolicy, Tenant, Ticket, TicketStatus, User,
)

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Seeds a complete demo environment — idempotent, safe to run multiple times."

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("\nSeeding PolicySync demo data...\n"))

        tenant = self._create_tenant()
        admin, manager, agent1, agent2 = self._create_users(tenant)
        critical, standard, low = self._create_policies(tenant)
        self._create_escalation_rules(tenant, critical, standard, low, manager, admin)
        self._create_notification_channel(tenant)
        self._create_tickets(tenant, admin, manager, agent1, agent2, critical, standard, low)

        self.stdout.write(self.style.SUCCESS("\n✓ Done!\n"))
        self.stdout.write(self.style.WARNING("Login credentials (password: Demo1234!):"))
        self.stdout.write("  admin@acme.com    — Tenant Admin")
        self.stdout.write("  manager@acme.com  — Manager")
        self.stdout.write("  agent1@acme.com   — Agent (Aaron)")
        self.stdout.write("  agent2@acme.com   — Agent (Beth)")
        self.stdout.write("\n  → Open http://localhost:3000 and log in as admin@acme.com\n")

    # ── helpers ───────────────────────────────────────────────────

    def _create_tenant(self):
        tenant, created = Tenant.objects.get_or_create(
            slug="acme",
            defaults={"name": "Acme Corporation", "is_active": True},
        )
        self.stdout.write(f"  {'Created' if created else 'Found'} tenant: {tenant.name}")
        return tenant

    def _create_users(self, tenant):
        users = []
        specs = [
            ("admin@acme.com",   "Alice Admin",   "admin"),
            ("manager@acme.com", "Marcus Manager", "manager"),
            ("agent1@acme.com",  "Aaron Agent",    "agent"),
            ("agent2@acme.com",  "Beth Agent",     "agent"),
        ]
        for email, full_name, role in specs:
            try:
                u = User.objects.get(email=email)
            except User.DoesNotExist:
                u = User.objects.create_user(
                    email=email,
                    full_name=full_name,
                    role=role,
                    tenant=tenant,
                    password="Demo1234!",
                )
                self.stdout.write(f"  Created user: {email} [{role}]")
            users.append(u)
        return users

    def _create_policies(self, tenant):
        specs = [
            ("P1 — Critical",     "critical", 1,  4,  "Production incidents. Tight SLA."),
            ("P2 — Standard",     "medium",   2,  8,  "Normal business-hours tickets."),
            ("P3 — Low Priority", "low",      4,  24, "Non-urgent requests and improvements."),
        ]
        policies = []
        for name, priority, rth, rsth, desc in specs:
            p, created = SLAPolicy.objects.get_or_create(
                tenant=tenant,
                name=name,
                defaults={
                    "description": desc,
                    "priority": priority,
                    "response_time_hours": rth,
                    "resolution_time_hours": rsth,
                    "is_active": True,
                },
            )
            if created:
                self.stdout.write(f"  Created policy: {name} ({rsth}h resolution)")
            policies.append(p)
        return policies

    def _create_escalation_rules(self, tenant, *policies_and_users):
        policies = policies_and_users[:3]
        manager, admin = policies_and_users[3], policies_and_users[4]
        for policy in policies:
            EscalationRule.objects.get_or_create(
                sla_policy=policy, level=1,
                defaults={"tenant": tenant, "escalate_at_percent": 80, "escalate_to": manager, "is_active": True},
            )
            EscalationRule.objects.get_or_create(
                sla_policy=policy, level=2,
                defaults={"tenant": tenant, "escalate_at_percent": 95, "escalate_to": admin, "is_active": True},
            )
        self.stdout.write("  Escalation rules: L1@80% → manager, L2@95% → admin")

    def _create_notification_channel(self, tenant):
        NotificationChannel.objects.get_or_create(
            tenant=tenant, name="Default Email",
            defaults={
                "channel_type": "email",
                "config": {"to": "admin@acme.com"},
                "is_active": True,
            },
        )

    def _create_tickets(self, tenant, admin, manager, agent1, agent2, critical, standard, low):
        now = timezone.now()

        specs = [
            # (title, priority, policy, agent, hours_ago, status, is_escalated, esc_level)
            ("Production database is rejecting connections",
             "critical", critical, agent1, 3.3, TicketStatus.IN_PROGRESS, False, 0),

            ("API latency spike on payment service",
             "high", standard, agent2, 7.5, TicketStatus.IN_PROGRESS, True, 1),

            ("User cannot reset password — email not arriving",
             "medium", standard, agent1, 9.2, TicketStatus.OPEN, True, 2),

            ("SSL certificate expiring in 7 days",
             "high", critical, agent2, 4.5, TicketStatus.OPEN, True, 2),

            ("Export to CSV broken for date ranges over 90 days",
             "medium", standard, agent1, 2.1, TicketStatus.OPEN, False, 0),

            ("Add dark mode to the customer portal",
             "low", low, agent2, 5.0, TicketStatus.OPEN, False, 0),

            ("Onboarding docs link in welcome email is broken",
             "low", low, agent1, 1.0, TicketStatus.OPEN, False, 0),

            ("Billing page throws 500 for enterprise accounts",
             "critical", critical, agent2, 0.5, TicketStatus.OPEN, False, 0),

            ("Search returns no results after latest deploy",
             "high", standard, agent1, 6.8, TicketStatus.IN_PROGRESS, True, 1),

            ("Rate limiting too aggressive on free tier",
             "low", low, agent2, 12.0, TicketStatus.RESOLVED, False, 0),
        ]

        created = 0
        for title, priority, policy, agent, hours_ago, status, is_esc, esc_level in specs:
            if Ticket.objects.filter(tenant=tenant, title=title).exists():
                continue

            created_at = now - timedelta(hours=hours_ago)
            response_dl = created_at + timedelta(hours=policy.response_time_hours)
            resolution_dl = created_at + timedelta(hours=policy.resolution_time_hours)

            ticket = Ticket(
                tenant=tenant,
                title=title,
                description=f"This is a demo ticket. Priority: {priority}.",
                priority=priority,
                status=status,
                sla_policy=policy,
                assigned_agent=agent,
                created_by=admin,
                is_escalated=is_esc,
                escalation_level=esc_level,
                sla_response_deadline=response_dl,
                sla_resolution_deadline=resolution_dl,
                resolved_at=now if status == TicketStatus.RESOLVED else None,
            )
            ticket.save()
            # Override auto_now_add so the SLA timers are meaningful
            Ticket.objects.filter(id=ticket.id).update(created_at=created_at)
            created += 1

        self.stdout.write(f"  Created {created} sample tickets")
