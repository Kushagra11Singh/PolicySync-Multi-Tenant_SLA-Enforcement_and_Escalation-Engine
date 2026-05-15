import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from shared.utils.logger import get_logger

logger = get_logger(__name__)


def send_email(to: str, subject: str, body_html: str) -> bool:
    """
    Sends an email via SMTP. Returns True on success, False on failure.
    Caller handles retry logic.
    """
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "")
    password = os.getenv("SMTP_PASS", "")

    if not user or not password:
        # In dev/test, just log what would have been sent
        logger.info(
            "email_skipped_no_smtp",
            extra={"to": to, "subject": subject},
        )
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = user
        msg["To"] = to
        msg.attach(MIMEText(body_html, "html"))

        with smtplib.SMTP(host, port) as server:
            server.ehlo()
            server.starttls()
            server.login(user, password)
            server.sendmail(user, [to], msg.as_string())

        logger.info("email_sent", extra={"to": to, "subject": subject})
        return True

    except Exception as exc:
        logger.error("email_send_failed", extra={"to": to, "error": str(exc)})
        return False
