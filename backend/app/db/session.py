"""
Hot Storage Database Session Engine for Sentinel Layer.

Supports both SQLite (local/dev hot storage) and Neon / PostgreSQL (cloud production).
Automatically handles connection pooling, URL dialect normalization, and table initialization.
"""
import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Normalize database URL (SQLAlchemy 2.0 expects 'postgresql://' instead of legacy 'postgres://')
db_url = settings.database_url
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

connect_args = {}
engine_kwargs = {"echo": False}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine_kwargs["connect_args"] = connect_args
else:
    # PostgreSQL / Neon settings: auto reconnect + recycle stale connections
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(
    db_url,
    **engine_kwargs,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db() -> None:
    """Initializes database tables and performs migrations across SQLite and PostgreSQL."""
    Base.metadata.create_all(bind=engine)

    # Auto-migrate nullable columns if upgrading an existing SQLite database
    if db_url.startswith("sqlite"):
        with engine.connect() as conn:
            try:
                result = conn.execute(text("PRAGMA table_info(screen_events);")).fetchall()
                existing_cols = {row[1] for row in result}
                if existing_cols:
                    if "user_id" not in existing_cols:
                        conn.execute(text("ALTER TABLE screen_events ADD COLUMN user_id VARCHAR(128);"))
                    if "user_email" not in existing_cols:
                        conn.execute(text("ALTER TABLE screen_events ADD COLUMN user_email VARCHAR(256);"))
                    if "user_role" not in existing_cols:
                        conn.execute(text("ALTER TABLE screen_events ADD COLUMN user_role VARCHAR(32);"))
                    conn.commit()
            except Exception as e:
                logger.debug("SQLite schema check: %s", e)


def get_db() -> Generator[Session, None, None]:
    """Yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
