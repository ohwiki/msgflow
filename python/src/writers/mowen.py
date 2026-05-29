"""Mowen publisher."""

from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

from pycore import logger

from writers import publishers

log = logger("publisher.mowen")


@publishers.register
class MowenPublisher:
    name = "mowen"

    def publish(self, title: str, content: str, metadata: dict | None = None) -> bool:
        tags = (metadata or {}).get("tags", [])
        tag_args = []
        for t in tags:
            tag_args.extend(["--tag", t])

        tmp: Path | None = None
        try:
            with tempfile.NamedTemporaryFile(mode="w", suffix=".md", encoding="utf-8", delete=False) as f:
                f.write(content)
                tmp = Path(f.name)

            cmd = ["mowen-cli", "publish", str(tmp), "--title", title, *tag_args]
            log.info("Publishing to Mowen", title=title)
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            if result.returncode == 0:
                return True
            log.error("Mowen publish failed", stderr=result.stderr[:300])
            return False
        except (subprocess.TimeoutExpired, FileNotFoundError) as e:
            log.error("Mowen publish error", error=str(e))
            return False
        finally:
            if tmp:
                tmp.unlink(missing_ok=True)
