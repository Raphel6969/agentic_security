"""
Sentinel Layer — FastAPI application entrypoint.

Phase 7 scope: 3-stage detection cascade + Policy Engine + Toy Agent Scenarios + SOC Dashboard telemetry API.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers.demo import router as demo_router
from app.routers.events import router as events_router
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

# Enable CORS for React/Vite Dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(screen_router)
app.include_router(demo_router)
app.include_router(events_router)


@app.get("/health", tags=["system"])
async def health() -> dict:
    """Liveness check. Phase 0 exit criterion."""
    return {"status": "ok", "version": settings.version}
