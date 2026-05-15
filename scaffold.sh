#!/bin/bash
set -e

ROOT="$HOME/Downloads/Projects/policy-sync"

echo "Creating PolicySync project scaffold..."

# ── Root directories ──────────────────────────────────────────
mkdir -p $ROOT/{shared,infra/prometheus,.github/workflows}

# ── Shared package (models + utils shared across all services) ─
mkdir -p $ROOT/shared/{models,utils}
touch $ROOT/shared/__init__.py
touch $ROOT/shared/apps.py
touch $ROOT/shared/models/__init__.py
touch $ROOT/shared/models/{tenant.py,user.py,policy.py,ticket.py,escalation.py,audit.py,notification.py}
touch $ROOT/shared/utils/__init__.py
touch $ROOT/shared/utils/{logger.py,middleware.py}

# ── policy_engine ─────────────────────────────────────────────
mkdir -p $ROOT/services/policy_engine/{config,tests}
mkdir -p $ROOT/services/policy_engine/apps/{tenants,users,policies,tickets,escalations}
for app in tenants users policies tickets escalations; do
  mkdir -p $ROOT/services/policy_engine/apps/$app/migrations
  touch $ROOT/services/policy_engine/apps/$app/{__init__.py,models.py,serializers.py,views.py,urls.py,permissions.py}
  touch $ROOT/services/policy_engine/apps/$app/migrations/__init__.py
done
touch $ROOT/services/policy_engine/config/{__init__.py,settings.py,urls.py,wsgi.py,celery.py,beat_schedule.py}
touch $ROOT/services/policy_engine/tests/{__init__.py,conftest.py,factories.py}
touch $ROOT/services/policy_engine/tests/{test_tenants.py,test_tickets.py,test_escalation_integration.py}
touch $ROOT/services/policy_engine/{manage.py,Dockerfile,requirements.txt,pytest.ini,.flake8,entrypoint.sh}

# ── escalation_worker ─────────────────────────────────────────
mkdir -p $ROOT/services/escalation_worker/{config,tasks}
touch $ROOT/services/escalation_worker/config/{__init__.py,settings.py,celery.py}
touch $ROOT/services/escalation_worker/tasks/{__init__.py,escalation_tasks.py}
touch $ROOT/services/escalation_worker/{Dockerfile,requirements.txt,entrypoint.sh}

# ── notification_dispatcher ───────────────────────────────────
mkdir -p $ROOT/services/notification_dispatcher/{config,handlers}
touch $ROOT/services/notification_dispatcher/config/{__init__.py,settings.py,celery.py}
touch $ROOT/services/notification_dispatcher/handlers/{__init__.py,email_handler.py,webhook_handler.py}
touch $ROOT/services/notification_dispatcher/{Dockerfile,requirements.txt,entrypoint.sh}

# ── audit_logger ──────────────────────────────────────────────
mkdir -p $ROOT/services/audit_logger/{config,apps/logs,tasks}
touch $ROOT/services/audit_logger/config/{__init__.py,settings.py,urls.py,wsgi.py,celery.py}
touch $ROOT/services/audit_logger/apps/__init__.py
touch $ROOT/services/audit_logger/apps/logs/{__init__.py,views.py,urls.py,serializers.py}
touch $ROOT/services/audit_logger/tasks/{__init__.py,audit_tasks.py}
touch $ROOT/services/audit_logger/{manage.py,Dockerfile,requirements.txt,entrypoint.sh}

# ── Frontend ──────────────────────────────────────────────────
# (Vite will populate this — placeholder only for now)
mkdir -p $ROOT/frontend

# ── Infra / DevOps ────────────────────────────────────────────
touch $ROOT/infra/prometheus/prometheus.yml
touch $ROOT/.github/workflows/ci.yml

# ── Root files ────────────────────────────────────────────────
touch $ROOT/{docker-compose.yml,.env.example,.env,.gitignore,README.md,LICENSE,CONTRIBUTING.md}

echo ""
echo "✓ Done. Structure:"
find $ROOT -type d | sort
