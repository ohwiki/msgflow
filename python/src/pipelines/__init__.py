"""Pipelines — auto-registered on import."""

from lib.registry import Registry
from lib.protocols import Pipeline

pipelines: Registry[Pipeline] = Registry("pipeline")

from pipelines.fetch import FetchPipeline  # noqa: E402, F401
from pipelines.rewrite import RewritePipeline  # noqa: E402, F401
from pipelines.query import QueryPipeline  # noqa: E402, F401
from pipelines.distill import DistillPipeline  # noqa: E402, F401
from pipelines.publish import PublishPipeline  # noqa: E402, F401
