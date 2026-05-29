"""Publishers — auto-registered on import."""

from pycore import logger

from lib.registry import Registry
from lib.protocols import Publisher

log = logger("writers")

publishers: Registry[Publisher] = Registry("publisher")

from writers.mowen import MowenPublisher  # noqa: E402, F401
from writers.feishu import FeishuPublisher  # noqa: E402, F401


def publish(name: str, title: str, content: str, **kwargs: object) -> bool:
    """Publish to a named publisher. Returns success."""
    pub = publishers.get(name)
    if not pub:
        log.error("Publisher not found", name=name)
        return False
    metadata = dict(kwargs) if kwargs else None
    return pub.publish(title, content, metadata)
