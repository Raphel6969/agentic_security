"""
Settings/config loading for Sentinel Layer.

Phase 0: just enough to prove the pattern (env-driven config, no secrets
committed). Real settings (Groq API key, policy file path, DB path) get
added in the phases that need them (4, 5, 6) — do not pre-add unused
settings ahead of their phase (RULE.md Section A.2).
"""
import os
from functools import lru_cache


class Settings:
    app_name: str = "Sentinel Layer"
    version: str = "0.1.0"
    environment: str = os.getenv("ENVIRONMENT", "development")

    # Phase 4 — Groq LLM-Judge settings
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_model: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    groq_timeout_seconds: float = float(os.getenv("GROQ_TIMEOUT_SECONDS", "3.0"))


@lru_cache
def get_settings() -> Settings:
    return Settings()

