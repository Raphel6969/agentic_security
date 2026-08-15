"""
Hot Storage Database Session Engine for Sentinel Layer.

Uses SQLite as the hot storage layer for session call counting and real-time screen events.
Architecture is prepared for cold storage batch pushes (e.g. Postgres audit archiving).
"""
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from app.config import get_settings

settings = get_settings()

connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db() -> None:
    """Initializes hot storage tables and performs lightweight migrations."""
    Base.metadata.create_all(bind=engine)

    # Auto-migrate new nullable columns on existing tables in SQLite
    with engine.connect() as conn:
        try:
            # Check screen_events columns
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
        except Exception:
            pass


def get_db() -> Generator[Session, None, None]:
    """Yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
