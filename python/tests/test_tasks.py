"""Unit tests for msgflow Python task runner."""

import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


class TestRegistry:
    def test_register_and_get(self) -> None:
        from lib.registry import Registry

        r = Registry("test")

        @r.register
        class Foo:
            name = "foo"

        assert r.get("foo") is not None
        assert r.get("bar") is None

    def test_find(self) -> None:
        from lib.registry import Registry

        r = Registry("test")

        @r.register
        class A:
            name = "a"
            def can_handle(self, url: str) -> bool:
                return "example" in url

        assert r.find(lambda x: x.can_handle("https://example.com")) is not None
        assert r.find(lambda x: x.can_handle("https://other.com")) is None


class TestFetchers:
    def test_weixin_can_handle(self) -> None:
        from fetchers.weixin import WeixinFetcher

        f = WeixinFetcher()
        assert f.can_handle("https://mp.weixin.qq.com/s/abc123")
        assert not f.can_handle("https://example.com")

    def test_feishu_can_handle(self) -> None:
        from fetchers.feishu import FeishuFetcher

        f = FeishuFetcher()
        assert f.can_handle("https://xxx.feishu.cn/wiki/abc")
        assert f.can_handle("https://xxx.larksuite.com/docx/abc")
        assert not f.can_handle("https://example.com")

    def test_jina_can_handle(self) -> None:
        from fetchers.jina import JinaFetcher

        f = JinaFetcher()
        assert f.can_handle("https://example.com")
        assert f.can_handle("https://mp.weixin.qq.com/s/abc")
        assert not f.can_handle("ftp://something")

    def test_feishu_parse_url(self) -> None:
        from fetchers.feishu import FeishuFetcher

        f = FeishuFetcher()
        doc_id, doc_type = f._parse_url("https://xxx.feishu.cn/wiki/ABC123")
        assert doc_id == "ABC123"
        assert doc_type == "wiki"

        doc_id, doc_type = f._parse_url("https://xxx.feishu.cn/docx/DEF456")
        assert doc_id == "DEF456"
        assert doc_type == "docx"

        doc_id, doc_type = f._parse_url("https://example.com")
        assert doc_id is None

    def test_fetch_dispatch_order(self) -> None:
        """Weixin should be checked before Jina for weixin URLs."""
        from fetchers import fetchers

        url = "https://mp.weixin.qq.com/s/test"
        handler = fetchers.find(lambda f: f.can_handle(url))
        assert handler is not None
        assert handler.name == "weixin"


class TestFileStore:
    def test_save(self, tmp_path: Path) -> None:
        from lib.file_store import save

        path = save("hello world", directory=str(tmp_path / "output"), prefix="test")
        assert Path(path).exists()
        assert Path(path).read_text() == "hello world"
        assert "test-" in path
        assert path.endswith(".md")

    def test_save_creates_dir(self, tmp_path: Path) -> None:
        from lib.file_store import save

        deep_dir = str(tmp_path / "a" / "b" / "c")
        path = save("content", directory=deep_dir)
        assert Path(path).exists()


class TestPipelines:
    def test_pipeline_registration(self) -> None:
        from pipelines import pipelines

        assert pipelines.get("fetch") is not None
        assert pipelines.get("rewrite") is not None
        assert pipelines.get("query") is not None
        assert pipelines.get("distill") is not None
        assert pipelines.get("publish") is not None

    def test_fetch_pipeline_no_content(self) -> None:
        """Fetch pipeline should return failure when content can't be fetched."""
        from pipelines.fetch import FetchPipeline

        pipeline = FetchPipeline()
        with patch("fetchers.fetch", return_value=None):
            result = pipeline.execute("https://nonexistent.invalid/page")
            assert not result.success
            assert "无法获取" in result.error

    def test_publish_pipeline_file_not_found(self) -> None:
        from pipelines.publish import PublishPipeline

        pipeline = PublishPipeline()
        result = pipeline.execute("/nonexistent/file.md")
        assert not result.success
        assert "不存在" in result.error


class TestMdFixer:
    def test_fix_markdown_no_key(self) -> None:
        """Should return original content when no API key is set."""
        from lib.md_fixer import fix_markdown

        with patch.dict("os.environ", {}, clear=True):
            result = fix_markdown("broken content")
            assert result == "broken content"


class TestCLI:
    def test_help(self) -> None:
        """CLI should show help without errors."""
        from typer.testing import CliRunner

        sys.path.insert(0, str(Path(__file__).parent.parent / "src"))
        from run_task import app

        runner = CliRunner()
        result = runner.invoke(app, ["--help"])
        assert result.exit_code == 0
        assert "fetch" in result.stdout
        assert "rewrite" in result.stdout

    def test_fetch_help(self) -> None:
        from typer.testing import CliRunner
        from run_task import app

        runner = CliRunner()
        result = runner.invoke(app, ["fetch", "--help"])
        assert result.exit_code == 0
        assert "URL" in result.stdout
