"""Publishers — auto-registered on import."""

from lib.registry import Registry
from lib.protocols import Publisher

publishers: Registry[Publisher] = Registry("publisher")

from writers.mowen import MowenPublisher  # noqa: E402, F401
from writers.feishu import FeishuPublisher  # noqa: E402, F401


def publish(name: str, title: str, content: str, **kwargs: object) -> bool:
    """Publish to a named publisher. Returns success."""
    pub = publishers.get(name)
    if not pub:
        return False
    metadata = dict(kwargs) if kwargs else None
    return pub.publish(title, content, metadata)
