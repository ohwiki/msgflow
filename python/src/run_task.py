"""msgflow task runner — unified CLI entry point."""

import sys
import argparse
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(prog="msgflow-task", description="msgflow 任务执行器")
    sub = parser.add_subparsers(dest="action", required=True)

    p = sub.add_parser("fetch", help="抓取 URL 为 Markdown")
    p.add_argument("target", help="URL")

    p = sub.add_parser("rewrite", help="改写文章")
    p.add_argument("target", help="URL 或文件路径")
    p.add_argument("--style", default="lu-xun", help="改写风格")

    p = sub.add_parser("query", help="查询知识库")
    p.add_argument("target", help="问题")

    p = sub.add_parser("distill", help="蒸馏人物为 writer skill")
    p.add_argument("target", help="人物名")

    p = sub.add_parser("publish", help="发布文件")
    p.add_argument("target", help="文件路径")
    p.add_argument("--publisher", default="mowen", help="发布目标")

    p = sub.add_parser("skill", help="执行任意 skill")
    p.add_argument("target", help="消息内容")
    p.add_argument("--skill", required=True, help="skill 名称")

    args = parser.parse_args()

    # Import registries (triggers auto-registration)
    import fetchers  # noqa: F401
    import writers  # noqa: F401
    import pipelines  # noqa: F401
    from lib.registry import PIPELINES
    from lib.ai_runner import run_skill
    from lib.logger import get_logger

    log = get_logger("run_task")

    # Dispatch
    if args.action == "skill":
        result_text = run_skill(args.skill, args.target)
        output = result_text or "错误：skill 执行失败"
        success = result_text is not None
    elif args.action in PIPELINES:
        kwargs = vars(args)
        kwargs.pop("action")
        target = kwargs.pop("target")
        result = PIPELINES[args.action].execute(target, **kwargs)
        output = result.output
        success = result.success
    else:
        output = f"错误：未知 action: {args.action}"
        success = False

    # Output
    Path("/tmp/result.txt").write_text(output, encoding="utf-8")
    log.info("Task complete", extra={"data": {"action": args.action, "success": success}})
    print("success" if success else "error")
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
