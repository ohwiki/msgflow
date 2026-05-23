"""Publishers — auto-registered on import."""

from pycore.registry import Registry

publishers: Registry = Registry("publisher")

from writers.mowen import MowenPublisher  # noqa: E402, F401
from writers.feishu import FeishuPublisher  # noqa: E402, F401


def publish(name: str, title: str, content: str, **kwargs: object) -> bool:
    """Publish to a named publisher. Returns success."""
    pub = publishers.get(name)
    if not pub:
        return False
    return pub.publish(title, content, kwargs)
