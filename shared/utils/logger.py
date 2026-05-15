import logging
import os
from pythonjsonlogger import jsonlogger

SERVICE_NAME = os.getenv("SERVICE_NAME", "unknown")


class PolicySyncFormatter(jsonlogger.JsonFormatter):
    """
    Structured JSON logs — every line gets service_name and tenant_id
    so CloudWatch Logs Insights can filter by either field easily.
    """

    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        log_record["service_name"] = SERVICE_NAME
        log_record["level"] = record.levelname
        log_record["logger"] = record.name
        log_record.setdefault("tenant_id", None)


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)

    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(
            PolicySyncFormatter(
                fmt="%(asctime)s %(level)s %(service_name)s %(tenant_id)s %(message)s"
            )
        )
        logger.addHandler(handler)
        logger.setLevel(
            logging.DEBUG if os.getenv("DEBUG") == "True" else logging.INFO
        )

    return logger
