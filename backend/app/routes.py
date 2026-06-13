# import json

# from fastapi import APIRouter, HTTPException, UploadFile, File, Form
# from fastapi.responses import JSONResponse

# from app.schemas import (
#     LoadRepoRequest,
#     LoadRepoResponse,
#     BundleRequest,
#     BundleResponse,
#     CompareRequest,
#     CompareResponse,
# )
# from app.services.github_service import GitHubService
# from app.services.tree_builder import build_ascii_tree
# from app.services.bundle_service import generate_bundle
# from app.services.diff_service import compute_diff

# router = APIRouter()


# # ──────────────────────────────────────────────
# # POST /api/repo/load
# # User pastes a GitHub URL — we fetch the tree
# # ──────────────────────────────────────────────

# @router.post("/repo/load", response_model=LoadRepoResponse)
# async def load_repo(body: LoadRepoRequest):
#     try:
#         owner, repo = GitHubService.parse_url(body.url)
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=str(e))

#     gh = GitHubService(token=body.token)
#     try:
#         result = await gh.get_tree(owner, repo)
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=str(e))
#     except Exception as e:
#         raise HTTPException(
#             status_code=500, detail=f"GitHub API error: {str(e)}")
#     finally:
#         await gh.close()

#     ascii_tree = build_ascii_tree(result["tree"], repo)

#     return LoadRepoResponse(
#         owner=owner,
#         repo=repo,
#         default_branch=result["default_branch"],
#         tree=result["tree"],
#         ascii_tree=ascii_tree,
#     )


# # ──────────────────────────────────────────────
# # POST /api/bundle/generate
# # User selected files — fetch contents and bundle
# # ──────────────────────────────────────────────

# @router.post("/bundle/generate", response_model=BundleResponse)
# async def generate(body: BundleRequest):
#     if not body.files:
#         raise HTTPException(status_code=400, detail="No files selected.")

#     if len(body.files) > 200:
#         raise HTTPException(
#             status_code=400,
#             detail="Too many files selected (max 200). Try selecting fewer files."
#         )

#     gh = GitHubService(token=body.token)
#     try:
#         contents = await gh.get_files_batch(body.owner, body.repo, body.files)
#     except Exception as e:
#         raise HTTPException(
#             status_code=500, detail=f"Failed to fetch files: {str(e)}")
#     finally:
#         await gh.close()

#     tree_for_bundle = body.ascii_tree if body.include_structure else None

#     result = generate_bundle(
#         repo_full_name=f"{body.owner}/{body.repo}",
#         files=contents,
#         ascii_tree=tree_for_bundle,
#         strip_empty_lines=body.strip_empty_lines,
#     )

#     return BundleResponse(
#         bundle=result["bundle"],
#         token_estimate=result["token_estimate"],
#         file_count=result["file_count"],
#     )


# # ──────────────────────────────────────────────
# # POST /api/bundle/compare
# # User uploads old bundle — we find what changed
# # ──────────────────────────────────────────────

# @router.post("/bundle/compare", response_model=CompareResponse)
# async def compare(
#     previous_bundle: UploadFile = File(...),
#     request: str = Form(...),
# ):
#     # The compare request body comes as a form field alongside the file upload
#     try:
#         body = CompareRequest(**json.loads(request))
#     except Exception:
#         raise HTTPException(status_code=400, detail="Invalid request data.")

#     # Read the uploaded bundle file
#     try:
#         old_bundle_text = (await previous_bundle.read()).decode("utf-8")
#     except Exception:
#         raise HTTPException(
#             status_code=400, detail="Could not read uploaded bundle file.")

#     if not old_bundle_text.strip():
#         raise HTTPException(
#             status_code=400, detail="Uploaded bundle file is empty.")

#     # Fetch current repo tree so we know what files exist now
#     gh = GitHubService(token=body.token)
#     try:
#         result = await gh.get_tree(body.owner, body.repo)
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=str(e))
#     except Exception as e:
#         raise HTTPException(
#             status_code=500, detail=f"GitHub API error: {str(e)}")

#     # Get only the file paths (blobs), skip folders
#     file_paths = [
#         item["path"]
#         for item in result["tree"]
#         if item["type"] == "blob" and not item["ignored"]
#     ]

#     # Fetch current content of all non-ignored files
#     try:
#         current_files = await gh.get_files_batch(body.owner, body.repo, file_paths)
#     except Exception as e:
#         raise HTTPException(
#             status_code=500, detail=f"Failed to fetch files: {str(e)}")
#     finally:
#         await gh.close()

#     diff = compute_diff(old_bundle_text, current_files)

#     return CompareResponse(
#         changed=diff["changed"],
#         added=diff["added"],
#         deleted=diff["deleted"],
#         unchanged=diff["unchanged"],
#         summary=diff["summary"],
#     )


# # ──────────────────────────────────────────────
# # GET /api/health
# # Simple check to confirm the server is running
# # ──────────────────────────────────────────────

# @router.get("/health")
# async def health():
#     return {"status": "ok"}

import json

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse

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
from app.services.diff_service import compute_diff

router = APIRouter()


# ──────────────────────────────────────────────
# POST /api/repo/load
# User pastes a GitHub URL — we fetch the tree
# ──────────────────────────────────────────────

@router.post("/repo/load", response_model=LoadRepoResponse)
async def load_repo(body: LoadRepoRequest):
    try:
        owner, repo = GitHubService.parse_url(body.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    gh = GitHubService(token=body.token)
    try:
        # Fetch tree for the requested branch (or default if none specified)
        result = await gh.get_tree(owner, repo, branch=body.branch)

        # Fetch all available branches so the frontend can show a picker
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


# ──────────────────────────────────────────────
# POST /api/bundle/generate
# User selected files — fetch contents and bundle
# ──────────────────────────────────────────────

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
            body.owner,
            body.repo,
            body.files,
            branch=body.branch,
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
        strip_empty_lines=body.strip_empty_lines,
    )

    return BundleResponse(
        bundle=result["bundle"],
        token_estimate=result["token_estimate"],
        file_count=result["file_count"],
    )


# ──────────────────────────────────────────────
# POST /api/bundle/compare
# User uploads old bundle — we find what changed
# ──────────────────────────────────────────────

@router.post("/bundle/compare", response_model=CompareResponse)
async def compare(
    previous_bundle: UploadFile = File(...),
    request: str = Form(...),
):
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

    gh = GitHubService(token=body.token)
    try:
        result = await gh.get_tree(body.owner, body.repo, branch=body.branch)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"GitHub API error: {str(e)}")

    file_paths = [
        item["path"]
        for item in result["tree"]
        if item["type"] == "blob" and not item["ignored"]
    ]

    try:
        current_files = await gh.get_files_batch(
            body.owner,
            body.repo,
            file_paths,
            branch=body.branch,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch files: {str(e)}")
    finally:
        await gh.close()

    diff = compute_diff(old_bundle_text, current_files)

    return CompareResponse(
        changed=diff["changed"],
        added=diff["added"],
        deleted=diff["deleted"],
        unchanged=diff["unchanged"],
        summary=diff["summary"],
    )


# ──────────────────────────────────────────────
# GET /api/health
# Simple check to confirm the server is running
# ──────────────────────────────────────────────

@router.get("/health")
async def health():
    return {"status": "ok"}
