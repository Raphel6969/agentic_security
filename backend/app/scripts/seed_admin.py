"""
Admin seed CLI — Phase 10.

Creates the first Admin user directly in SQLite (no OAuth required for admin).
All other users are invited via the dashboard.

Usage:
    cd backend
    python -m app.scripts.seed_admin --email you@gmail.com --name "Your Name"
"""
import argparse
import sys
import uuid
from datetime import datetime, timezone

# Ensure app package is importable
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from app.db.models import UserDB
from app.db.session import SessionLocal, init_db


def seed_admin(email: str, name: str) -> None:
    init_db()

    with SessionLocal() as db:
        existing = db.query(UserDB).filter(UserDB.email == email).first()
        if existing:
            if existing.role == "admin":
                print(f"[OK] Admin already exists: {email} (id={existing.id})")
            else:
                existing.role = "admin"
                existing.is_active = True
                db.commit()
                print(f"[UPDATED] Promoted existing user to admin: {email}")
            return

        admin = UserDB(
            id=str(uuid.uuid4()),
            email=email,
            name=name,
            role="admin",
            is_active=True,          # Admin is active without OAuth
            oauth_provider=None,      # Admin logs in via OAuth but is pre-seeded
            created_at=datetime.now(timezone.utc),
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        print(f"[CREATED] Admin user seeded successfully.")
        print(f"  ID    : {admin.id}")
        print(f"  Email : {admin.email}")
        print(f"  Name  : {admin.name}")
        print(f"  Role  : {admin.role}")
        print()
        print(f"Next step: Log in via Google/GitHub OAuth using {email}")
        print(f"  -> http://localhost:8000/auth/google")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the Sentinel admin user.")
    parser.add_argument("--email", required=True, help="Admin email address (must match OAuth provider)")
    parser.add_argument("--name",  required=True, help="Admin display name")
    args = parser.parse_args()

    seed_admin(args.email, args.name)
