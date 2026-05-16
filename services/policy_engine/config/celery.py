import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("policy_engine")
app.config_from_object("django.conf:settings", namespace="CELERY")

# Beat schedule — check SLA deadlines every 60 seconds
app.conf.beat_schedule = {
    "sla-breach-check-60s": {
        "task": "apps.tickets.tasks.check_sla_breaches",
        "schedule": 60.0,
        "options": {"queue": "default"},
    },
}

app.autodiscover_tasks()
