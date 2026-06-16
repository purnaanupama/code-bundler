from datetime import datetime, timezone


EXT_TO_LANG = {
    "py": "python", "js": "javascript", "jsx": "jsx", "ts": "typescript",
    "tsx": "tsx", "html": "html", "css": "css", "scss": "scss", "json": "json",
    "yaml": "yaml", "yml": "yaml", "toml": "toml", "md": "markdown", "sh": "bash",
    "bash": "bash", "zsh": "bash", "env": "bash", "sql": "sql", "rs": "rust",
    "go": "go", "java": "java", "kt": "kotlin", "swift": "swift", "c": "c",
    "cpp": "cpp", "cs": "csharp", "php": "php", "rb": "ruby", "tf": "hcl",
    "dockerfile": "dockerfile", "xml": "xml", "graphql": "graphql", "gql": "graphql",
    "prisma": "prisma", "vue": "vue", "svelte": "svelte", "r": "r", "lua": "lua",
    "dart": "dart",
}


def _get_lang(path: str) -> str:
    filename = path.split("/")[-1].lower()
    special = {
        "dockerfile": "dockerfile", "makefile": "makefile", "jenkinsfile": "groovy",
        ".env": "bash", ".env.example": "bash", ".env.local": "bash",
        ".gitignore": "bash", ".gitattributes": "bash",
    }
    if filename in special:
        return special[filename]
    ext = filename.rsplit(".", 1)[-1] if "." in filename else ""
    return EXT_TO_LANG.get(ext, "")


def _strip_empty_lines(content: str) -> str:
    """Remove blank lines. Always applied now — no toggle."""
    return "\n".join(line for line in content.splitlines() if line.strip())


def normalize_for_compare(content: str) -> str:
    """
    Normalizes content for diffing purposes only (not for bundle output).
    Strips trailing/leading whitespace per line and drops blank lines,
    so indentation/whitespace-only edits don't show up as false changes.
    """
    return "\n".join(line.strip() for line in content.splitlines() if line.strip())


def _estimate_tokens(text: str) -> int:
    return len(text) // 4


def generate_bundle(
    repo_full_name: str,
    files: dict[str, str],
    ascii_tree: str | None = None,
) -> dict:
    """
    Generates the final bundle string. Empty-line stripping is now always
    applied (no strip_empty_lines parameter) so every bundle — old or new —
    is produced identically, which is what makes bundle-to-bundle diffing reliable.
    """
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    file_count = len(files)

    lines = [
        "=" * 60,
        f"REPO    {repo_full_name}",
        f"DATE    {now}",
        f"FILES   {file_count} included",
        "=" * 60,
        "",
    ]

    if ascii_tree:
        lines += [
            "── PROJECT STRUCTURE " + "─" * 39,
            ascii_tree,
            "─" * 60,
            "",
        ]

    for path, content in files.items():
        lang = _get_lang(path)
        content = _strip_empty_lines(content.strip())

        lines += [
            f"▸ {path}",
            f"```{lang}",
            content,
            "```",
            "",
        ]

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
