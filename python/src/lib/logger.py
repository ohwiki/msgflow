"""Structured logging for msgflow pipelines."""

import logging
import json
import sys
from typing import Any


class StructuredFormatter(logging.Formatter):
    """JSON-line structured log formatter."""

    def format(self, record: logging.LogRecord) -> str:
        entry: dict[str, Any] = {
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname.lower(),
            "msg": record.getMessage(),
            "module": record.module,
        }
        if hasattr(record, "data"):
            entry["data"] = record.data  # type: ignore[attr-defined]
        if record.exc_info:
            entry["error"] = self.formatException(record.exc_info)
        return json.dumps(entry, ensure_ascii=False)


def get_logger(name: str) -> logging.Logger:
    """Get a structured logger instance."""
    logger = logging.getLogger(f"msgflow.{name}")
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stderr)
        handler.setFormatter(StructuredFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger
