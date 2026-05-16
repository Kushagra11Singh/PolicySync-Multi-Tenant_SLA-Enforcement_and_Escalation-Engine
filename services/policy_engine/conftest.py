# services/policy_engine/conftest.py
import os
from pathlib import Path


def _load_env():
    """
    Load .env from the project root before Django settings initialise.
    This only runs when pytest executes locally outside Docker.
    Inside Docker the env vars are already injected by docker-compose.
    """
    env_file = Path(__file__).resolve().parent.parent.parent / ".env"
    if not env_file.exists():
        return

    for raw in env_file.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())

    # Docker-compose sets DATABASE_URL with hostname "postgres" (the service name).
    # Locally that hostname doesn't resolve — swap it to localhost instead.
    db_url = os.environ.get("DATABASE_URL", "")
    if "//ps_user" in db_url and "@postgres:" in db_url:
        os.environ["DATABASE_URL"] = db_url.replace("@postgres:", "@localhost:")


_load_env()
