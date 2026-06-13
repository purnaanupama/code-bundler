import httpx
import base64
import asyncio


# File extensions we treat as binary / not useful to bundle.
BINARY_EXTENSIONS = {
    "png", "jpg", "jpeg", "gif", "webp", "svg", "ico",
    "pdf", "zip", "tar", "gz", "rar",
    "exe", "dll", "so", "dylib",
    "ttf", "woff", "woff2", "eot",
    "mp3", "mp4", "wav", "avi", "mov",
    "pyc", "pyo", "pyd",
    "db", "sqlite", "sqlite3",
    "lock", "m4a", "webm", "ogg",
}

# Folders that are almost never useful to include in a bundle.
IGNORED_FOLDERS = {
    "node_modules", "venv", ".venv", "env",
    ".git", "__pycache__", ".mypy_cache", ".pytest_cache",
    "dist", "build", ".next", "out",
    ".idea", ".vscode",
}


class GitHubService:
    BASE = "https://api.github.com"

    def __init__(self, token: str | None = None):
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        self.client = httpx.AsyncClient(headers=headers, timeout=30.0)

    async def close(self):
        await self.client.aclose()

    # ------------------------------------------------------------------
    # Parse a GitHub URL into owner + repo name
    # ------------------------------------------------------------------
    @staticmethod
    def parse_url(url: str) -> tuple[str, str]:
        url = url.strip().rstrip("/")
        url = url.replace("https://", "").replace("http://", "")
        url = url.replace("github.com/", "")
        url = url.removesuffix(".git")
        parts = url.split("/")
        if len(parts) < 2:
            raise ValueError(f"Could not parse GitHub URL: {url}")
        return parts[0], parts[1]

    # ------------------------------------------------------------------
    # Fetch all branches for the repo
    # ------------------------------------------------------------------
    async def get_branches(self, owner: str, repo: str) -> list[str]:
        r = await self.client.get(
            f"{self.BASE}/repos/{owner}/{repo}/branches?per_page=100"
        )
        r.raise_for_status()
        return [b["name"] for b in r.json()]

    # ------------------------------------------------------------------
    # Fetch the full file tree of a repo in one API call
    # ------------------------------------------------------------------
    async def get_tree(self, owner: str, repo: str, branch: str | None = None) -> dict:
        r = await self.client.get(f"{self.BASE}/repos/{owner}/{repo}")
        if r.status_code == 404:
            raise ValueError(
                "Repository not found. Check the URL and make sure your token has access.")
        if r.status_code == 401:
            raise ValueError(
                "Unauthorized. Your Personal Access Token is invalid or expired.")
        r.raise_for_status()

        default_branch = r.json()["default_branch"]
        target_branch = branch or default_branch

        r = await self.client.get(
            f"{self.BASE}/repos/{owner}/{repo}/git/trees/{target_branch}?recursive=1"
        )
        r.raise_for_status()
        data = r.json()

        if data.get("truncated"):
            print(f"Warning: tree was truncated for {owner}/{repo}")

        raw_tree = data.get("tree", [])

        annotated = []
        for item in raw_tree:
            path = item["path"]
            parts = path.split("/")

            in_ignored_folder = any(p in IGNORED_FOLDERS for p in parts[:-1])
            extension = parts[-1].rsplit(".",
                                         1)[-1].lower() if "." in parts[-1] else ""
            is_binary = extension in BINARY_EXTENSIONS

            annotated.append({
                "path": path,
                "type": item["type"],
                "size": item.get("size", 0),
                "sha": item["sha"],
                "extension": extension,
                "is_binary": is_binary,
                "ignored": in_ignored_folder or (item["type"] == "tree" and parts[-1] in IGNORED_FOLDERS),
            })

        return {
            "tree": annotated,
            "default_branch": default_branch,
            "owner": owner,
            "repo": repo,
        }

    # ------------------------------------------------------------------
    # Fetch the content of a single file
    # ------------------------------------------------------------------
    async def get_file(
        self, owner: str, repo: str, path: str, branch: str | None = None
    ) -> str:
        params = {}
        if branch:
            params["ref"] = branch

        r = await self.client.get(
            f"{self.BASE}/repos/{owner}/{repo}/contents/{path}",
            params=params,
        )
        if r.status_code == 404:
            raise ValueError(f"File not found: {path}")
        r.raise_for_status()

        data = r.json()
        raw = data.get("content", "").replace("\n", "")
        decoded = base64.b64decode(raw).decode("utf-8", errors="replace")
        return decoded

    # ------------------------------------------------------------------
    # Fetch multiple files in parallel
    # ------------------------------------------------------------------
    async def get_files_batch(
        self, owner: str, repo: str, paths: list[str], branch: str | None = None
    ) -> dict[str, str]:
        tasks = [self.get_file(owner, repo, path, branch=branch)
                 for path in paths]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        files = {}
        for path, result in zip(paths, results):
            if isinstance(result, Exception):
                files[path] = f"# Error reading file: {result}"
            else:
                files[path] = result

        return files
