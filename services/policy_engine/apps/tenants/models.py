# Models live in shared/ — no local models in this app.
# Importing here purely so Django admin registration works cleanly.
from shared.models import Tenant, TenantSetting  # noqa: F401
