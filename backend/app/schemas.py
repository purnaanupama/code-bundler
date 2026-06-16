from pydantic import BaseModel


class LoadRepoRequest(BaseModel):
    url: str
    token: str | None = None
    branch: str | None = None


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
    branch: str
    branches: list[str]
    tree: list[TreeItem]
    ascii_tree: str


class BundleRequest(BaseModel):
    owner: str
    repo: str
    token: str | None = None
    branch: str | None = None
    files: list[str]
    ascii_tree: str | None = None
    include_structure: bool = True
    # strip_empty_lines removed — always applied now


class BundleResponse(BaseModel):
    bundle: str
    token_estimate: int
    file_count: int


class CompareRequest(BaseModel):
    owner: str
    repo: str
    token: str | None = None
    branch: str | None = None


class DiffSummary(BaseModel):
    changed: int
    deleted: int
    unchanged: int


class CompareResponse(BaseModel):
    # all file paths found in the uploaded bundle (for auto-select)
    files: list[str]
    changed: list[str]
    deleted: list[str]
    unchanged: list[str]
    summary: DiffSummary
