"""
Sentinel Layer — FastAPI application entrypoint. Phase 10.
"""
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db.session import init_db
from app.routers.auth import router as auth_router
from app.routers.demo import router as demo_router
from app.routers.events import router as events_router
from app.routers.screen import router as screen_router
from app.routers.tokens import router as tokens_router
from app.routers.users import router as users_router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description=(
        "A runtime firewall for prompt-injection and agentic-AI risk. "
        "Phase 10: Auth + RBAC + Agent Session Tokens. "
        "See /docs for the live API reference."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialise DB tables on startup (idempotent)
init_db()

app.include_router(screen_router)
app.include_router(demo_router)
app.include_router(events_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(tokens_router)


@app.get("/health", tags=["system"])
async def health() -> dict:
    """Liveness check."""
    return {"status": "ok", "version": settings.version}
