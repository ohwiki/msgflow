"""File storage capability."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

from pycore import logger

log = logger("file_store")


def save(content: str, directory: str, prefix: str = "", suffix: str = ".md") -> str:
    """Save content to a file. Returns the file path."""
    dir_path = Path(directory)
    dir_path.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    name = f"{prefix}-{timestamp}{suffix}" if prefix else f"{timestamp}{suffix}"
    file_path = dir_path / name

    file_path.write_text(content, encoding="utf-8")
    log.info("File saved", path=str(file_path), size=len(content))
    return str(file_path)
