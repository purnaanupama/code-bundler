from datetime import datetime, timezone


# Maps file extensions to the language name used in markdown code fences.
# This tells the AI (and syntax highlighters) what language each file is.
EXT_TO_LANG = {
    "py": "python",
    "js": "javascript",
    "jsx": "jsx",
    "ts": "typescript",
    "tsx": "tsx",
    "html": "html",
    "css": "css",
    "scss": "scss",
    "json": "json",
    "yaml": "yaml",
    "yml": "yaml",
    "toml": "toml",
    "md": "markdown",
    "sh": "bash",
    "bash": "bash",
    "zsh": "bash",
    "env": "bash",
    "sql": "sql",
    "rs": "rust",
    "go": "go",
    "java": "java",
    "kt": "kotlin",
    "swift": "swift",
    "c": "c",
    "cpp": "cpp",
    "cs": "csharp",
    "php": "php",
    "rb": "ruby",
    "tf": "hcl",
    "dockerfile": "dockerfile",
    "xml": "xml",
    "graphql": "graphql",
    "gql": "graphql",
    "prisma": "prisma",
    "vue": "vue",
    "svelte": "svelte",
    "r": "r",
    "lua": "lua",
    "dart": "dart",
}


def _get_lang(path: str) -> str:
    """Get the language identifier from a file path."""
    filename = path.split("/")[-1].lower()

    # Handle special filenames with no extension
    special = {
        "dockerfile": "dockerfile",
        "makefile": "makefile",
        "jenkinsfile": "groovy",
        ".env": "bash",
        ".env.example": "bash",
        ".env.local": "bash",
        ".gitignore": "bash",
        ".gitattributes": "bash",
    }
    if filename in special:
        return special[filename]

    ext = filename.rsplit(".", 1)[-1] if "." in filename else ""
    return EXT_TO_LANG.get(ext, "")


def _strip_empty_lines(content: str) -> str:
    """Remove blank lines to save tokens."""
    return "\n".join(line for line in content.splitlines() if line.strip())


def _estimate_tokens(text: str) -> int:
    """
    Rough token estimate. Claude tokenizes ~4 characters per token on average
    for English/code content. This is an approximation, not exact.
    """
    return len(text) // 4


def generate_bundle(
    repo_full_name: str,           # e.g. "owner/repo"
    files: dict[str, str],         # {path: content}
    ascii_tree: str | None = None,  # full project tree (optional)
    strip_empty_lines: bool = False,
) -> dict:
    """
    Generates the final bundle string that gets copied into the AI.

    Returns a dict with:
      - bundle: the full bundle text
      - token_estimate: rough token count
      - file_count: how many files are included
    """

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    file_count = len(files)

    # ── Header ────────────────────────────────────────────────────────
    lines = [
        "=" * 60,
        f"REPO    {repo_full_name}",
        f"DATE    {now}",
        f"FILES   {file_count} included",
        "=" * 60,
        "",
    ]

    # ── Project structure (full tree, not just selected files) ────────
    if ascii_tree:
        lines += [
            "── PROJECT STRUCTURE " + "─" * 39,
            ascii_tree,
            "─" * 60,
            "",
        ]

    # ── File contents ─────────────────────────────────────────────────
    for path, content in files.items():
        lang = _get_lang(path)
        content = content.strip()

        if strip_empty_lines:
            content = _strip_empty_lines(content)

        lines += [
            f"▸ {path}",
            f"```{lang}",
            content,
            "```",
            "",
        ]

    # ── Footer ────────────────────────────────────────────────────────
    lines += [
        "=" * 60,
        "END OF BUNDLE",
        "=" * 60,
    ]

    bundle_text = "\n".join(lines)

    return {
        "bundle": bundle_text,
        "token_estimate": _estimate_tokens(bundle_text),
        "file_count": file_count,
    }
