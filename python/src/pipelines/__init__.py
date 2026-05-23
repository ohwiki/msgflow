"""Auto-register all pipelines on import."""

from pipelines.fetch import FetchPipeline  # noqa: F401
from pipelines.rewrite import RewritePipeline  # noqa: F401
from pipelines.query import QueryPipeline  # noqa: F401
from pipelines.distill import DistillPipeline  # noqa: F401
from pipelines.publish import PublishPipeline  # noqa: F401
