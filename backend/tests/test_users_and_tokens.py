"""
Integration tests for User Management and Agent Session Tokens.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.models import UserDB
from app.db.session import SessionLocal, init_db
from app.services.auth import create_access_token

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    init_db()
    with SessionLocal() as db:
        # Create test admin
        admin = db.query(UserDB).filter(UserDB.email == "test_admin@company.com").first()
        if not admin:
            admin = UserDB(
                id="admin_uuid_1",
                email="test_admin@company.com",
                name="Test Admin",
                role="admin",
                is_active=True,
            )
            db.add(admin)

        # Create test developer
        dev = db.query(UserDB).filter(UserDB.email == "test_dev@company.com").first()
        if not dev:
            dev = UserDB(
                id="dev_uuid_2",
                email="test_dev@company.com",
                name="Test Dev",
                role="developer",
                is_active=True,
            )
            db.add(dev)

        # Clean up any previously invited test user for idempotent runs
        existing_intern = db.query(UserDB).filter(UserDB.email == "new_intern@company.com").first()
        if existing_intern:
            db.delete(existing_intern)

        db.commit()


def test_admin_list_users():
    admin_token = create_access_token("admin_uuid_1", "test_admin@company.com", "admin")
    resp = client.get("/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "users" in data
    assert len(data["users"]) >= 2


def test_forbidden_for_non_admin():
    dev_token = create_access_token("dev_uuid_2", "test_dev@company.com", "developer")
    resp = client.get("/users", headers={"Authorization": f"Bearer {dev_token}"})
    assert resp.status_code == 403


def test_admin_invite_and_update_permissions():
    admin_token = create_access_token("admin_uuid_1", "test_admin@company.com", "admin")
    
    # Invite new user
    invite_resp = client.post(
        "/users",
        json={"email": "new_intern@company.com", "name": "New Intern", "role": "intern"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert invite_resp.status_code == 201
    user_id = invite_resp.json()["user"]["id"]

    # Toggle permission for this user
    perm_resp = client.patch(
        f"/users/{user_id}/permissions",
        json={"permissions": {"search_web": True, "execute_sql": True}},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert perm_resp.status_code == 200
    assert perm_resp.json()["updated"]["execute_sql"] is True


def test_agent_session_token_generation_and_revocation():
    dev_token = create_access_token("dev_uuid_2", "test_dev@company.com", "developer")

    # Generate agent session token
    gen_resp = client.post(
        "/tokens/agent",
        headers={"Authorization": f"Bearer {dev_token}"},
    )
    assert gen_resp.status_code == 200
    data = gen_resp.json()
    assert "token" in data
    assert "jti" in data
    jti = data["jti"]

    # List tokens
    list_resp = client.get(
        "/tokens/agent",
        headers={"Authorization": f"Bearer {dev_token}"},
    )
    assert list_resp.status_code == 200
    assert any(t["jti"] == jti for t in list_resp.json()["tokens"])

    # Revoke token
    del_resp = client.delete(
        f"/tokens/agent/{jti}",
        headers={"Authorization": f"Bearer {dev_token}"},
    )
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "revoked"
