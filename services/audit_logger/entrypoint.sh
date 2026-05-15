#!/bin/bash
set -e

echo "[audit_logger] Waiting for postgres..."
while ! nc -z postgres 5432; do sleep 0.5; done
echo "[audit_logger] Postgres ready."

exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 2 \
  --reload \
  --access-logfile -
