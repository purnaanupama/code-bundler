# app/services/tree_builder.py

def build_ascii_tree(flat_tree: list, repo_name: str) -> str:
    """
    Takes the flat list of files GitHub API returns and turns it
    into a nice ASCII tree like you see in the examples.

    flat_tree items look like: {"path": "app/main.py", "type": "blob"}
    blob = file, tree = folder
    """

    # Step 1: build a nested dict from the flat path list
    root = {}
    for item in sorted(flat_tree, key=lambda x: x["path"]):
        parts = item["path"].split("/")
        node = root
        for part in parts[:-1]:
            node = node.setdefault(part, {})
        leaf = parts[-1]
        if item["type"] == "blob":
            node[leaf] = None       # None = this is a file (leaf node)
        else:
            node.setdefault(leaf, {})  # {} = this is a folder

    # Step 2: render the nested dict into lines
    lines = [f"{repo_name}/"]
    _render(root, lines, "")
    return "\n".join(lines)


def _render(node: dict, lines: list, prefix: str):
    """Recursively renders the tree with proper ├── and └── connectors."""
    items = list(node.items())
    for i, (name, children) in enumerate(items):
        is_last = (i == len(items) - 1)
        connector = "└── " if is_last else "├── "
        is_folder = isinstance(children, dict)
        lines.append(prefix + connector + name + ("/" if is_folder else ""))
        if is_folder:
            extension = "    " if is_last else "│   "
            _render(children, lines, prefix + extension)
