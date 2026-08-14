"""
Sentinel Layer — FastAPI application entrypoint.

Phase 0 scope: app boots, /health returns 200. Nothing else is wired up
yet — see PHASE.md for what each later phase adds here.
"""
from fastapi import FastAPI

from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description=(
        "A runtime firewall for prompt-injection and agentic-AI risk. "
        "See /docs for the live API reference once Phase 1+ endpoints land."
    ),
)


@app.get("/health", tags=["system"])
async def health() -> dict:
    """Liveness check. Phase 0 exit criterion."""
    return {"status": "ok", "version": settings.version}
