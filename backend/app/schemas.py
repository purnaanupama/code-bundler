from pydantic import BaseModel


# ──────────────────────────────────────────────
# LOAD REPO
# ──────────────────────────────────────────────

class LoadRepoRequest(BaseModel):
    url: str
    token: str | None = None
    branch: str | None = None  # if None, uses the default branch


class TreeItem(BaseModel):
    path: str
    type: str
    size: int
    sha: str
    extension: str
    is_binary: bool
    ignored: bool


class LoadRepoResponse(BaseModel):
    owner: str
    repo: str
    default_branch: str
    branch: str          # the branch actually loaded
    branches: list[str]  # all available branches for the picker
    tree: list[TreeItem]
    ascii_tree: str


# ──────────────────────────────────────────────
# GENERATE BUNDLE
# ──────────────────────────────────────────────

class BundleRequest(BaseModel):
    owner: str
    repo: str
    token: str | None = None
    branch: str | None = None  # which branch to fetch file contents from
    files: list[str]
    ascii_tree: str | None = None
    include_structure: bool = True
    strip_empty_lines: bool = False


class BundleResponse(BaseModel):
    bundle: str
    token_estimate: int
    file_count: int


# ──────────────────────────────────────────────
# COMPARE (diff against previous bundle)
# ──────────────────────────────────────────────

class CompareRequest(BaseModel):
    owner: str
    repo: str
    token: str | None = None
    branch: str | None = None  # which branch to compare against


class DiffSummary(BaseModel):
    changed: int
    added: int
    deleted: int
    unchanged: int


class CompareResponse(BaseModel):
    changed: list[str]
    added: list[str]
    deleted: list[str]
    unchanged: list[str]
    summary: DiffSummary
