import hashlib
import hmac
import json
import time

import requests
from shared.utils.logger import get_logger

logger = get_logger(__name__)

REQUEST_TIMEOUT = 10  # seconds


def send_webhook(url: str, payload: dict, secret: str = "") -> bool:
    """
    POSTs a JSON payload to a webhook URL.
    If a secret is provided, includes an HMAC-SHA256 signature header
    so the receiver can verify authenticity.
    """
    body = json.dumps(payload, default=str)
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "PolicySync-Webhook/1.0",
        "X-PolicySync-Timestamp": str(int(time.time())),
    }

    if secret:
        sig = hmac.new(
            secret.encode(), body.encode(), hashlib.sha256
        ).hexdigest()
        headers["X-PolicySync-Signature"] = f"sha256={sig}"

    try:
        resp = requests.post(url, data=body, headers=headers, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        logger.info("webhook_sent", extra={"url": url, "status": resp.status_code})
        return True
    except requests.RequestException as exc:
        logger.error("webhook_failed", extra={"url": url, "error": str(exc)})
        return False
