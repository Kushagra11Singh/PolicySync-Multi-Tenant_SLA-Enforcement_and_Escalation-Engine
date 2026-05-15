import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("notification_dispatcher")
app.config_from_object("django.conf:settings", namespace="CELERY")

# Explicitly register the task module
app.autodiscover_tasks(["handlers.notification_tasks"])
