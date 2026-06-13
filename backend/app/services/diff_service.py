import hashlib
import re


def _hash(content: str) -> str:
    """
    Creates a short fingerprint of a file's content.
    If two files have the same hash, they are identical.
    If the hash differs, the file has changed.
    """
    return hashlib.sha256(content.encode("utf-8")).hexdigest()[:16]


def parse_bundle(bundle_text: str) -> dict[str, str]:
    """
    Reads a previously generated bundle and extracts each file's
    path and content back out of it.

    Returns a dict like:
      {
        "app/main.py": "from fastapi import ...",
        "app/core/config.py": "import os ...",
      }
    """
    result = {}

    # Split the bundle on lines that start with ▸ (our file separator)
    # This gives us alternating chunks: [preamble, path1, block1, path2, block2, ...]
    parts = re.split(r"^▸ (.+)$", bundle_text, flags=re.MULTILINE)

    # parts[0] is the header/structure section — skip it
    # parts[1] is first path, parts[2] is first code block, and so on
    i = 1
    while i < len(parts) - 1:
        path = parts[i].strip()
        block = parts[i + 1]

        # Strip the opening ```lang line and closing ``` line
        # The block looks like:
        #   ```python
        #   actual code here
        #   ```
        #
        code = re.sub(r"^```[^\n]*\n?", "", block.strip())
        code = re.sub(r"\n?```.*$", "", code, flags=re.MULTILINE)
        code = code.strip()

        result[path] = code
        i += 2

    return result


def compute_diff(
    old_bundle_text: str,
    current_files: dict[str, str],  # {path: content} fetched fresh from GitHub
) -> dict:
    """
    Compares a previous bundle against the current state of the repo.

    Returns three lists:
      - changed: files that exist in both but content is different
      - added:   files in the repo now that weren't in the old bundle
      - deleted: files that were in the old bundle but no longer exist in repo
      - unchanged: files that are identical in both (so you can skip them)
    """
    old_files = parse_bundle(old_bundle_text)

    changed = []
    added = []
    deleted = []
    unchanged = []

    # Check every file currently in the repo
    for path, content in current_files.items():
        if path not in old_files:
            added.append(path)
        elif _hash(content) != _hash(old_files[path]):
            changed.append(path)
        else:
            unchanged.append(path)

    # Check for files that were in the old bundle but are now gone
    for path in old_files:
        if path not in current_files:
            deleted.append(path)

    return {
        "changed": sorted(changed),
        "added": sorted(added),
        "deleted": sorted(deleted),
        "unchanged": sorted(unchanged),
        "summary": {
            "changed": len(changed),
            "added": len(added),
            "deleted": len(deleted),
            "unchanged": len(unchanged),
        },
    }
