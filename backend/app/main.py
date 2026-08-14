"""
Sentinel Layer — FastAPI application entrypoint.

Phase 1 scope: app boots, /health returns 200, /screen returns stub response.
See PHASE.md for what each later phase adds here.
"""
from fastapi import FastAPI

from app.config import get_settings
from app.routers.screen import router as screen_router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description=(
        "A runtime firewall for prompt-injection and agentic-AI risk. "
        "See /docs for the live API reference."
    ),
)

app.include_router(screen_router)


@app.get("/health", tags=["system"])
async def health() -> dict:
    """Liveness check. Phase 0 exit criterion."""
    return {"status": "ok", "version": settings.version}

