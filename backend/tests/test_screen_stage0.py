"""
Tests for Stage 0 Token Permission Enforcement on /screen endpoint.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.auth import create_agent_session_token

client = TestClient(app)


def test_stage_0_permission_blocked_for_intern_write_file():
    # Intern token without write_file permission
    token, _, _ = create_agent_session_token(
        user_id="intern_1",
        email="intern@company.com",
        role="intern",
        permissions={"search_web": True, "read_email": True, "write_file": False, "call_http": False},
        session_id="intern_sess_1",
    )

    req = {
        "incoming_content": {"source": "user_input", "text": "Please save this innocent text file."},
        "proposed_tool_call": {"tool_name": "write_file", "arguments": {"path": "/sandbox/innocent.txt", "content": "hello"}},
        "agent_context": {"agent_id": "intern_agent", "session_id": "intern_sess_1"},
    }

    resp = client.post("/screen", json=req, headers={"X-Sentinel-Token": token})
    assert resp.status_code == 200
    data = resp.json()

    assert data["verdict"] == "block"
    assert data["risk_score"] == 0.0
    assert "Stage 0 Permission Block" in data["explanation"]
    assert data["policy_check"]["allowed"] is False


def test_stage_0_permission_allowed_for_developer_write_file():
    # Developer token with write_file permission
    token, _, _ = create_agent_session_token(
        user_id="dev_1",
        email="dev@company.com",
        role="developer",
        permissions={"search_web": True, "write_file": True, "call_http": True},
        session_id="dev_sess_1",
    )

    req = {
        "incoming_content": {"source": "user_input", "text": "Save the clean report."},
        "proposed_tool_call": {"tool_name": "write_file", "arguments": {"path": "/sandbox/report.txt", "content": "all clean"}},
        "agent_context": {"agent_id": "dev_agent", "session_id": "dev_sess_1"},
    }

    resp = client.post("/screen", json=req, headers={"X-Sentinel-Token": token})
    assert resp.status_code == 200
    data = resp.json()

    assert data["verdict"] == "allow"
    assert data["risk_score"] < 0.4
    assert data["policy_check"]["allowed"] is True


def test_tokenless_backward_compatible():
    # Calling /screen without X-Sentinel-Token header
    req = {
        "incoming_content": {"source": "user_input", "text": "Search for Python documentation."},
        "proposed_tool_call": {"tool_name": "search_web", "arguments": {"query": "python docs"}},
        "agent_context": {"agent_id": "legacy_agent", "session_id": "legacy_sess_1"},
    }

    resp = client.post("/screen", json=req)
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "allow"
