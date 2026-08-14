"""
ORM Database Models for Sentinel Layer Hot Storage (SQLite).
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, PrimaryKeyConstraint

from app.db.session import Base


class SessionCallCountDB(Base):
    """
    Hot storage table tracking session tool invocation counts.
    """
    __tablename__ = "session_call_counts"

    session_id = Column(String(128), nullable=False)
    tool_name = Column(String(128), nullable=False)
    call_count = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("session_id", "tool_name", name="pk_session_tool"),
    )


class ScreenEventDB(Base):
    """
    Hot storage table for screened events audit trail.
    Prepared for batch pushing to cold storage (Postgres).
    """
    __tablename__ = "screen_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    agent_id = Column(String(128), nullable=False)
    session_id = Column(String(128), nullable=False, index=True)
    tool_name = Column(String(128), nullable=False)
    incoming_source = Column(String(64), nullable=False)
    risk_score = Column(Float, nullable=False)
    verdict = Column(String(32), nullable=False)
    explanation = Column(Text, nullable=False)
    matched_signals_json = Column(Text, nullable=False)
    policy_allowed = Column(Boolean, nullable=False)
    policy_reason = Column(Text, nullable=False)
