"""
Unit tests for Phase 10 Auth & JWT logic.
"""
from datetime import datetime, timezone
import pytest
from app.services.auth import (
    create_access_token,
    create_agent_session_token,
    decode_token,
    decode_agent_token,
    get_role_permissions,
    resolve_permissions,
    ROLE_DEFAULTS,
)


def test_role_defaults():
    admin_perms = get_role_permissions("admin")
    intern_perms = get_role_permissions("intern")

    assert admin_perms["write_file"] is True
    assert admin_perms["call_http"] is True
    assert admin_perms["execute_sql"] is True

    assert intern_perms["search_web"] is True
    assert intern_perms["read_email"] is True
    assert intern_perms["write_file"] is False
    assert intern_perms["call_http"] is False
    assert intern_perms["execute_sql"] is False


def test_resolve_permissions_overrides():
    # Developer default has write_file=True
    # Override with write_file=False
    overrides = [("write_file", False), ("custom_tool", True)]
    resolved = resolve_permissions("developer", overrides)

    assert resolved["write_file"] is False
    assert resolved["search_web"] is True
    assert resolved["custom_tool"] is True


def test_create_and_decode_access_token():
    token = create_access_token(user_id="user_123", email="user@example.com", role="admin")
    payload = decode_token(token)

    assert payload["sub"] == "user_123"
    assert payload["email"] == "user@example.com"
    assert payload["role"] == "admin"
    assert payload["type"] == "dashboard"
    assert "exp" in payload


def test_create_and_decode_agent_session_token():
    perms = {"search_web": True, "write_file": False}
    token, jti, expires_at = create_agent_session_token(
        user_id="user_456",
        email="intern@example.com",
        role="intern",
        permissions=perms,
        session_id="sess_abc",
    )

    payload = decode_agent_token(token)
    assert payload["sub"] == "user_456"
    assert payload["email"] == "intern@example.com"
    assert payload["role"] == "intern"
    assert payload["permissions"] == perms
    assert payload["session_id"] == "sess_abc"
    assert payload["jti"] == jti
    assert payload["type"] == "agent_session"
