#!/usr/bin/env python3
"""Format raw HTML article to clean Markdown with code block formatting.

Usage: python3 format_article.py <input.html> <output.md>
"""

import re, subprocess, sys
from bs4 import BeautifulSoup
from markdownify import markdownify as md

PRETTIER_PARSERS = {
    "javascript": "babel", "js": "babel",
    "typescript": "typescript", "ts": "typescript",
    "css": "css", "json": "json", "yaml": "yaml", "html": "html",
}


def detect_lang(text: str) -> str:
    if re.search(r"\b(CREATE TABLE|DROP TABLE|INSERT INTO|SELECT .+ FROM)\b", text, re.IGNORECASE):
        return "sql"
    if re.search(r"^(npx|pip|python|curl|cd|mkdir|git|npm|yarn|docker|sudo)\s", text):
        return "bash"
    if re.search(r"\b(const|let|var|function|async|await|export|import)\b", text) and "{" in text:
        return "javascript"
    if re.search(r"^\[[\w.-]+\]", text) or re.search(r"^[\w_]+ = ", text):
        return "toml"
    if text.lstrip().startswith("<"):
        return "html"
    return ""


def format_code(text: str, lang: str) -> str:
    # Prettier for JS/TS/CSS/JSON/YAML/HTML
    if lang in PRETTIER_PARSERS:
        try:
            r = subprocess.run(["prettier", "--parser", PRETTIER_PARSERS[lang]], input=text, capture_output=True, text=True, timeout=15)
            if r.returncode == 0 and r.stdout.strip():
                return r.stdout.strip()
        except Exception:
            pass
    # sql-formatter for SQL
    if lang == "sql":
        try:
            r = subprocess.run(["sql-formatter"], input=text, capture_output=True, text=True, timeout=15)
            if r.returncode == 0 and r.stdout.strip():
                return r.stdout.strip()
        except Exception:
            pass
    # TOML: regex
    if lang == "toml":
        result = re.sub(r"\s+(\[[a-zA-Z])", r"\n\n\1", text)
        result = re.sub(r'(")\s+([a-zA-Z_][a-zA-Z0-9_]*\s*=)', r"\1\n\2", result)
        result = re.sub(r"(\])\s+([a-zA-Z_][a-zA-Z0-9_]*\s*=)", r"\1\n\2", result)
        return result.strip()
    # Bash: regex
    if lang == "bash":
        return re.sub(
            r"(?<=[a-zA-Z0-9._/\]])\s+(?=npx\s|pip\s|python3?\s|curl\s|cd\s|mkdir\s|echo\s|git\s|npm\s|yarn\s|docker\s|sudo\s)",
            "\n", text,
        ).strip()
    # Generic fallback
    return re.sub(r"(?<=[;{}\)\]])(\s)(\s+)", r"\n\2", text).strip()


def process(input_path: str, output_path: str) -> None:
    with open(input_path, "r", encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")

    # Fix images
    for img in soup.find_all("img"):
        src = img.get("data-src") or img.get("src") or ""
        if src:
            img["src"] = src
        else:
            img.decompose()

    # Remove scripts/styles
    for tag in soup.find_all(["script", "style"]):
        tag.decompose()

    # Format code blocks
    for pre in soup.find_all("pre"):
        text = pre.get_text().replace("\xa0", " ")
        lang = detect_lang(text)
        formatted = format_code(text, lang)
        pre.clear()
        code_tag = soup.new_tag("code")
        code_tag.string = formatted
        pre.append(code_tag)
        pre["data-lang"] = lang

    # Convert to markdown
    content = md(str(soup), heading_style="ATX")
    content = re.sub(r"\n{3,}", "\n\n", content).strip()

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Formatted: {len(content)} chars → {output_path}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: format_article.py <input.html> <output.md>", file=sys.stderr)
        sys.exit(1)
    process(sys.argv[1], sys.argv[2])
