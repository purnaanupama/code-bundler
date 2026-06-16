import re

from app.services.bundle_service import normalize_for_compare


def parse_bundle(bundle_text: str) -> dict[str, str]:
    """
    Reads a bundle and extracts each file's path and content.
    Returns {path: content}.
    """
    result = {}
    parts = re.split(r"^▸ (.+)$", bundle_text, flags=re.MULTILINE)

    i = 1
    while i < len(parts) - 1:
        path = parts[i].strip()
        block = parts[i + 1]

        code = re.sub(r"^```[^\n]*\n?", "", block.strip())
        code = re.sub(r"\n?```.*$", "", code, flags=re.MULTILINE)
        code = code.strip()

        result[path] = code
        i += 2

    return result


def get_bundle_file_list(bundle_text: str) -> list[str]:
    """Returns just the file paths present in a bundle, in original order."""
    return list(parse_bundle(bundle_text).keys())


def compute_diff(
    old_bundle_text: str,
    new_bundle_text: str,
) -> dict:
    """
    Compares two bundles (old upload vs freshly regenerated from GitHub)
    file by file. Both bundles went through the identical generate_bundle()
    pipeline, so content is structurally aligned already. We additionally
    normalize whitespace per line before comparing so indentation-only or
    trailing-space differences don't register as changes.

    Only files present in the OLD bundle are considered — this comparison
    is scoped to "did the files I previously bundled change", not a full
    repo diff.
    """
    old_files = parse_bundle(old_bundle_text)
    new_files = parse_bundle(new_bundle_text)

    changed = []
    unchanged = []
    deleted = []

    for path, old_content in old_files.items():
        if path not in new_files:
            deleted.append(path)
            continue

        old_norm = normalize_for_compare(old_content)
        new_norm = normalize_for_compare(new_files[path])

        if old_norm != new_norm:
            changed.append(path)
        else:
            unchanged.append(path)

    return {
        "changed": sorted(changed),
        "deleted": sorted(deleted),
        "unchanged": sorted(unchanged),
        "summary": {
            "changed": len(changed),
            "deleted": len(deleted),
            "unchanged": len(unchanged),
        },
    }
