"""
Sentinel Layer — FastAPI application entrypoint.

Phase 6 scope: 3-stage detection cascade + Policy Engine + Toy Agent & Scenario REST API endpoints.
See PHASE.md for what each phase adds here.
"""
from fastapi import FastAPI

from app.config import get_settings
from app.routers.demo import router as demo_router
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
app.include_router(demo_router)


@app.get("/health", tags=["system"])
async def health() -> dict:
    """Liveness check. Phase 0 exit criterion."""
    return {"status": "ok", "version": settings.version}
