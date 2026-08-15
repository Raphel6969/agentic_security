"""
SQLite to Neon / PostgreSQL Data Migration Script.

Migrates all data from local SQLite (sentinel.db) into Neon PostgreSQL:
  - users
  - user_permissions
  - agent_sessions
  - session_call_counts
  - screen_events

Usage:
  cd backend
  python -m app.scripts.migrate_sqlite_to_postgres --neon-url "postgresql://user:pass@ep-xyz.region.aws.neon.tech/neondb?sslmode=require"

Or set DATABASE_URL in .env to the Neon URL and run:
  python -m app.scripts.migrate_sqlite_to_postgres
"""
import argparse
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure app package is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from app.config import get_settings
from app.db.models import (
    Base,
    UserDB,
    UserPermissionDB,
    AgentSessionDB,
    SessionCallCountDB,
    ScreenEventDB,
)


def migrate(sqlite_url: str, neon_url: str):
    print("=" * 65)
    print("  SENTINEL LAYER -- SQLITE TO NEON POSTGRESQL MIGRATION")
    print("=" * 65)

    if not neon_url or "sqlite" in neon_url:
        print("\n[ERROR] Invalid Neon database URL.")
        print("Provide your Neon connection string via --neon-url or DATABASE_URL in .env")
        print('Example: postgresql://user:pass@ep-xyz.region.aws.neon.tech/neondb?sslmode=require')
        return False

    if neon_url.startswith("postgres://"):
        neon_url = neon_url.replace("postgres://", "postgresql://", 1)

    print(f"\n[Source] SQLite     : {sqlite_url}")
    print(f"[Target] Neon DB    : {neon_url[:35]}...{neon_url[-15:] if len(neon_url) > 50 else ''}")

    # 1. Connect to SQLite
    sqlite_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
    SqliteSession = sessionmaker(bind=sqlite_engine)

    # 2. Connect to Neon Postgres
    neon_engine = create_engine(
        neon_url,
        pool_pre_ping=True,
        pool_recycle=300,
    )
    NeonSession = sessionmaker(bind=neon_engine)

    # 3. Create all tables in Neon
    print("\n[1] Initializing tables in Neon PostgreSQL...")
    try:
        Base.metadata.create_all(bind=neon_engine)
        print("    [OK] All tables verified/created in Neon.")
    except Exception as e:
        print(f"    [FAIL] Failed to create tables in Neon: {e}")
        return False

    with SqliteSession() as src_db, NeonSession() as dst_db:
        # ── 4. Migrate Users ───────────────────────────────────────────────────
        users = src_db.query(UserDB).all()
        user_count = 0
        for u in users:
            existing = dst_db.query(UserDB).filter(UserDB.id == u.id).first()
            if not existing:
                dst_db.add(UserDB(
                    id=u.id,
                    email=u.email,
                    name=u.name,
                    avatar_url=u.avatar_url,
                    role=u.role,
                    oauth_provider=u.oauth_provider,
                    oauth_sub=u.oauth_sub,
                    is_active=u.is_active,
                    created_by=u.created_by,
                    created_at=u.created_at,
                ))
                user_count += 1
        dst_db.commit()
        print(f"[2] Users migrated: {user_count} new (out of {len(users)} in SQLite)")

        # ── 5. Migrate User Permissions ────────────────────────────────────────
        perms = src_db.query(UserPermissionDB).all()
        perm_count = 0
        for p in perms:
            existing = dst_db.query(UserPermissionDB).filter(
                UserPermissionDB.user_id == p.user_id,
                UserPermissionDB.action == p.action,
            ).first()
            if not existing:
                dst_db.add(UserPermissionDB(
                    user_id=p.user_id,
                    action=p.action,
                    allowed=p.allowed,
                ))
                perm_count += 1
        dst_db.commit()
        print(f"[3] User permissions migrated: {perm_count} new (out of {len(perms)} in SQLite)")

        # ── 6. Migrate Agent Sessions ──────────────────────────────────────────
        sessions = src_db.query(AgentSessionDB).all()
        sess_count = 0
        for s in sessions:
            existing = dst_db.query(AgentSessionDB).filter(AgentSessionDB.jti == s.jti).first()
            if not existing:
                dst_db.add(AgentSessionDB(
                    session_id=s.session_id,
                    user_id=s.user_id,
                    jti=s.jti,
                    role_at_issue=s.role_at_issue,
                    permissions_json=s.permissions_json,
                    issued_at=s.issued_at,
                    expires_at=s.expires_at,
                    is_revoked=s.is_revoked,
                ))
                sess_count += 1
        dst_db.commit()
        print(f"[4] Agent sessions migrated: {sess_count} new (out of {len(sessions)} in SQLite)")

        # ── 7. Migrate Session Call Counts ─────────────────────────────────────
        counts = src_db.query(SessionCallCountDB).all()
        count_migrated = 0
        for c in counts:
            existing = dst_db.query(SessionCallCountDB).filter(
                SessionCallCountDB.session_id == c.session_id,
                SessionCallCountDB.tool_name == c.tool_name,
            ).first()
            if not existing:
                dst_db.add(SessionCallCountDB(
                    session_id=c.session_id,
                    tool_name=c.tool_name,
                    call_count=c.call_count,
                    updated_at=c.updated_at,
                ))
                count_migrated += 1
        dst_db.commit()
        print(f"[5] Session call counts migrated: {count_migrated} new (out of {len(counts)} in SQLite)")

        # ── 8. Migrate Screen Events (Audit Trail) ────────────────────────────
        events = src_db.query(ScreenEventDB).all()
        event_count = 0
        for e in events:
            # Check by timestamp and session_id
            existing = dst_db.query(ScreenEventDB).filter(
                ScreenEventDB.session_id == e.session_id,
                ScreenEventDB.timestamp == e.timestamp,
                ScreenEventDB.tool_name == e.tool_name,
            ).first()
            if not existing:
                dst_db.add(ScreenEventDB(
                    timestamp=e.timestamp,
                    agent_id=e.agent_id,
                    session_id=e.session_id,
                    tool_name=e.tool_name,
                    incoming_source=e.incoming_source,
                    risk_score=e.risk_score,
                    verdict=e.verdict,
                    explanation=e.explanation,
                    matched_signals_json=e.matched_signals_json,
                    policy_allowed=e.policy_allowed,
                    policy_reason=e.policy_reason,
                    user_id=e.user_id,
                    user_email=e.user_email,
                    user_role=e.user_role,
                ))
                event_count += 1
        dst_db.commit()
        print(f"[6] Screen events (Audit Log) migrated: {event_count} new (out of {len(events)} in SQLite)")

    print("\n" + "=" * 65)
    print("  MIGRATION TO NEON POSTGRESQL COMPLETE")
    print("=" * 65)
    print("\nTo switch the entire application to Neon permanently, set in .env:")
    print(f"DATABASE_URL={neon_url}\n")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate Sentinel SQLite data to Neon PostgreSQL")
    parser.add_argument(
        "--neon-url",
        default=os.environ.get("NEON_DATABASE_URL") or os.environ.get("DATABASE_URL", ""),
        help="Neon PostgreSQL connection URL",
    )
    parser.add_argument(
        "--sqlite-url",
        default="sqlite:///./sentinel.db",
        help="SQLite source database URL (default: sqlite:///./sentinel.db)",
    )
    args = parser.parse_args()

    settings = get_settings()
    target_url = args.neon_url
    if not target_url or "sqlite" in target_url:
        # Check if settings has a postgres URL
        if "postgres" in settings.database_url:
            target_url = settings.database_url

    migrate(sqlite_url=args.sqlite_url, neon_url=target_url)
