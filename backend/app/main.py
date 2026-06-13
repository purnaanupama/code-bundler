from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import router

app = FastAPI(
    title="GitHub Bundler API",
    description="Bundles GitHub repo files into a single AI-ready file.",
    version="1.0.0",
)

# ──────────────────────────────────────────────
# CORS — allows the Next.js frontend (running on
# localhost:3000) to talk to this backend.
# ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Next.js dev server
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routes under /api
app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "GitHub Bundler API is running. Visit /docs for the API explorer."}
