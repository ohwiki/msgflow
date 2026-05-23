"""Mowen (墨问) publisher."""

import subprocess
from lib.interfaces import PublishResult
from lib.registry import register_publisher
from lib.logger import get_logger

log = get_logger("publisher.mowen")


@register_publisher
class MowenPublisher:
    name = "mowen"

    def publish(self, title: str, content: str, metadata: dict | None = None) -> PublishResult:
        tags = (metadata or {}).get("tags", [])
        tag_args = []
        for t in tags:
            tag_args.extend(["--tag", t])

        # Write content to temp file for mowen-cli
        import tempfile
        from pathlib import Path

        tmp = Path(tempfile.mktemp(suffix=".md"))
        tmp.write_text(content, encoding="utf-8")

        cmd = ["mowen-cli", "publish", str(tmp), "--title", title, *tag_args]
        log.info("Publishing to Mowen", extra={"data": {"title": title}})
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            if result.returncode == 0:
                log.info("Published to Mowen", extra={"data": {"title": title}})
                return PublishResult(success=True)
            log.error("Mowen publish failed", extra={"data": {"stderr": result.stderr[:300]}})
            return PublishResult(success=False, error=result.stderr[:300])
        except (subprocess.TimeoutExpired, FileNotFoundError) as e:
            log.error("Mowen publish error", extra={"data": {"error": str(e)}})
            return PublishResult(success=False, error=str(e))
        finally:
            tmp.unlink(missing_ok=True)
