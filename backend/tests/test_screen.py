"""
Unit tests for POST /screen (Phase 1 endpoint contract).
"""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

SAMPLE_VALID_PAYLOAD = {
    "agent_context": {
        "agent_id": "test_agent_1",
        "session_id": "session_123",
        "recent_tool_calls": ["read_email"],
    },
    "incoming_content": {
        "source": "user_input",
        "text": "Hello, please read my email.",
    },
    "proposed_tool_call": {
        "tool_name": "read_email",
        "arguments": {"count": 5},
    },
}


def test_screen_valid_request_returns_200():
    response = client.post("/screen", json=SAMPLE_VALID_PAYLOAD)
    assert response.status_code == 200


def test_screen_response_shape():
    response = client.post("/screen", json=SAMPLE_VALID_PAYLOAD)
    data = response.json()
    assert "risk_score" in data
    assert "matched_signals" in data
    assert "verdict" in data
    assert "explanation" in data
    assert "policy_check" in data
    assert data["policy_check"]["tool_name"] == "read_email"


def test_screen_risk_score_bounded():
    response = client.post("/screen", json=SAMPLE_VALID_PAYLOAD)
    data = response.json()
    assert isinstance(data["risk_score"], float)
    assert 0.0 <= data["risk_score"] <= 1.0


def test_screen_verdict_is_valid_enum():
    response = client.post("/screen", json=SAMPLE_VALID_PAYLOAD)
    data = response.json()
    assert data["verdict"] in ["allow", "block", "require_approval"]


def test_screen_missing_agent_id_returns_422():
    payload = {
        "agent_context": {"session_id": "session_123"},
        "incoming_content": {"source": "user_input", "text": "hello"},
        "proposed_tool_call": {"tool_name": "read_email"},
    }
    response = client.post("/screen", json=payload)
    assert response.status_code == 422


def test_screen_invalid_source_enum_returns_422():
    payload = {
        "agent_context": {"agent_id": "a1", "session_id": "s1"},
        "incoming_content": {"source": "untrusted_web", "text": "hello"},
        "proposed_tool_call": {"tool_name": "read_email"},
    }
    response = client.post("/screen", json=payload)
    assert response.status_code == 422


def test_screen_minimal_valid_request():
    payload = {
        "agent_context": {"agent_id": "a1", "session_id": "s1"},
        "incoming_content": {"source": "system", "text": "system init"},
        "proposed_tool_call": {"tool_name": "read_email"},
    }
    response = client.post("/screen", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "allow"

