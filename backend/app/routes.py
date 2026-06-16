import json

from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from app.schemas import (
    LoadRepoRequest,
    LoadRepoResponse,
    BundleRequest,
    BundleResponse,
    CompareRequest,
    CompareResponse,
)
from app.services.github_service import GitHubService
from app.services.tree_builder import build_ascii_tree
from app.services.bundle_service import generate_bundle
from app.services.diff_service import compute_diff, get_bundle_file_list

router = APIRouter()


@router.post("/repo/load", response_model=LoadRepoResponse)
async def load_repo(body: LoadRepoRequest):
    try:
        owner, repo = GitHubService.parse_url(body.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    gh = GitHubService(token=body.token)
    try:
        result = await gh.get_tree(owner, repo, branch=body.branch)
        branches = await gh.get_branches(owner, repo)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"GitHub API error: {str(e)}")
    finally:
        await gh.close()

    ascii_tree = build_ascii_tree(result["tree"], repo)
    active_branch = body.branch or result["default_branch"]

    return LoadRepoResponse(
        owner=owner,
        repo=repo,
        default_branch=result["default_branch"],
        branch=active_branch,
        branches=branches,
        tree=result["tree"],
        ascii_tree=ascii_tree,
    )


@router.post("/bundle/generate", response_model=BundleResponse)
async def generate(body: BundleRequest):
    if not body.files:
        raise HTTPException(status_code=400, detail="No files selected.")

    if len(body.files) > 200:
        raise HTTPException(
            status_code=400,
            detail="Too many files selected (max 200). Try selecting fewer files."
        )

    gh = GitHubService(token=body.token)
    try:
        contents = await gh.get_files_batch(
            body.owner, body.repo, body.files, branch=body.branch,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch files: {str(e)}")
    finally:
        await gh.close()

    tree_for_bundle = body.ascii_tree if body.include_structure else None

    result = generate_bundle(
        repo_full_name=f"{body.owner}/{body.repo}",
        files=contents,
        ascii_tree=tree_for_bundle,
    )

    return BundleResponse(
        bundle=result["bundle"],
        token_estimate=result["token_estimate"],
        file_count=result["file_count"],
    )


@router.post("/bundle/compare", response_model=CompareResponse)
async def compare(
    previous_bundle: UploadFile = File(...),
    request: str = Form(...),
):
    """
    New strategy:
    1. Parse the uploaded old bundle -> get the file list it contains.
    2. Fetch ONLY those same files fresh from GitHub.
    3. Regenerate a bundle from them using the identical pipeline.
    4. Compare old bundle text vs new bundle text, file by file.
    Both bundles are produced by the same generate_bundle() function,
    so any remaining diff is real, not a formatting artifact.
    """
    try:
        body = CompareRequest(**json.loads(request))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request data.")

    try:
        old_bundle_text = (await previous_bundle.read()).decode("utf-8")
    except Exception:
        raise HTTPException(
            status_code=400, detail="Could not read uploaded bundle file.")

    if not old_bundle_text.strip():
        raise HTTPException(
            status_code=400, detail="Uploaded bundle file is empty.")

    file_list = get_bundle_file_list(old_bundle_text)
    if not file_list:
        raise HTTPException(
            status_code=400,
            detail="Could not find any files in the uploaded bundle. Is this a valid bundle file?"
        )

    gh = GitHubService(token=body.token)
    try:
        contents = await gh.get_files_batch(
            body.owner, body.repo, file_list, branch=body.branch,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch files: {str(e)}")
    finally:
        await gh.close()

    new_bundle_result = generate_bundle(
        repo_full_name=f"{body.owner}/{body.repo}",
        files=contents,
        ascii_tree=None,
    )

    diff = compute_diff(old_bundle_text, new_bundle_result["bundle"])

    return CompareResponse(
        files=file_list,
        changed=diff["changed"],
        deleted=diff["deleted"],
        unchanged=diff["unchanged"],
        summary=diff["summary"],
    )


@router.get("/health")
async def health():
    return {"status": "ok"}
