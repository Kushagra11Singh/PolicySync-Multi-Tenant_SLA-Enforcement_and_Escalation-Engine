# PolicySync

PolicySync is a multi-tenant SLA enforcement platform built to simulate how real support systems handle ticket deadlines and escalations.

The idea was simple:

Different companies should be able to create their own SLA policies like:

- Resolve high priority tickets within 4 hours
- Escalate unresolved tickets to managers
- Notify teams when deadlines are close

The system tracks ticket deadlines, detects SLA breaches, triggers escalations, sends notifications, and keeps audit logs.

This project was built mainly to learn backend architecture beyond simple CRUD apps.

---

## Tech Stack

### Backend
- Django REST Framework
- PostgreSQL
- JWT Authentication
- Celery
- RabbitMQ
- Pytest

### Frontend
- React
- TypeScript
- Vite
- React Query
- Axios

### Infra / DevOps
- Docker Compose
- Prometheus
- GitHub Actions CI

---

## Architecture

### Policy Engine
Handles:
- tenants
- users
- tickets
- SLA policies
- core business logic

### Escalation Worker
Consumes SLA breach events and processes escalations.

### Notification Dispatcher
Handles email/webhook notifications.

### Audit Logger
Stores compliance logs for important actions.

---

## Features

- Multi-tenant architecture
- Role based access control
- SLA deadline tracking
- Automatic escalations
- RabbitMQ messaging
- Dead letter queue retries
- Audit logging
- Prometheus monitoring
- Integration testing

---

## Current Status

Working:
- API running
- Swagger docs working
- Docker containers running
- RabbitMQ + Celery working
- Integration tests passing
- Tenant isolation working

Known issue:
- 1 failing test related to `sla_resolution_deadline` serializer response field

---

## Running locally

```bash
docker compose up --build
