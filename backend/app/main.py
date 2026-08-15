"""
Sentinel Layer — FastAPI application entrypoint with eager preloading.
"""
from contextlib import asynccontextmanager
import logging
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
from app.services.ml_classifier import get_ml_classifier
from app.services.policy_engine import get_policy_engine
from app.services.rule_engine import evaluate_rules

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Eagerly preloads database schema, rule tables, declarative policy,
    and SentenceTransformer ML embedding weights on server boot
    so that live requests execute in <15ms with 0 cold-start latency.
    """
    logger.info("Initializing database schema...")
    init_db()

    logger.info("Preloading Policy Engine & Declarative Rules...")
    try:
        get_policy_engine()
        _ = evaluate_rules("warmup text")
    except Exception as err:
        logger.warning("Policy/Rule engine preload warning: %s", err)

    logger.info("Preloading ML Classifier & TurboQuant Vector Index...")
    try:
        ml_service = get_ml_classifier()
        # Warmup probe to compile embeddings and warm cache
        _ = ml_service.evaluate("System startup warmup prompt")
        logger.info("✅ ML Classifier & Vector Index preloaded successfully!")
    except Exception as err:
        logger.warning("ML Classifier preload warning: %s", err)

    logger.info("🚀 Sentinel Protection Stack is hot and ready in memory!")
    yield
    logger.info("Shutting down Sentinel Layer...")


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description=(
        "A runtime firewall for prompt-injection and agentic-AI risk. "
        "Phase 10: Auth + RBAC + Agent Session Tokens. "
        "See /docs for the live API reference."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
