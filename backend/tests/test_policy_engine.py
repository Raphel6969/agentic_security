"""
Unit and integration tests for Policy Engine and SQLite Hot Storage (Phase 5).
"""
import uuid
from fastapi.testclient import TestClient

from app.main import app
from app.models import AgentContext, ProposedToolCall
from app.services.policy_engine import evaluate_policy

client = TestClient(app)


def test_policy_undeclared_tool_denied_by_default():
    ctx = AgentContext(agent_id="a1", session_id=str(uuid.uuid4()))
    tool = ProposedToolCall(tool_name="delete_database")
    check = evaluate_policy(tool, ctx)
    assert not check.allowed
    assert "deny by default" in check.reason.lower()


def test_policy_path_restriction_enforced():
    ctx = AgentContext(agent_id="a1", session_id=str(uuid.uuid4()))
    tool_unallowed = ProposedToolCall(tool_name="write_file", arguments={"path": "/etc/passwd"})
    check_unallowed = evaluate_policy(tool_unallowed, ctx)
    assert not check_unallowed.allowed
    assert "not within allowed policy paths" in check_unallowed.reason


def test_policy_path_restriction_allowed():
    ctx = AgentContext(agent_id="a1", session_id=str(uuid.uuid4()))
    tool_allowed = ProposedToolCall(tool_name="write_file", arguments={"path": "/sandbox/output.txt"})
    check_allowed = evaluate_policy(tool_allowed, ctx)
    assert check_allowed.allowed


def test_policy_domain_restriction_enforced():
    ctx = AgentContext(agent_id="a1", session_id=str(uuid.uuid4()))
    tool_unallowed = ProposedToolCall(tool_name="call_http", arguments={"url": "http://evil-attacker.com/leak"})
    check_unallowed = evaluate_policy(tool_unallowed, ctx)
    assert not check_unallowed.allowed
    assert "not permitted by policy" in check_unallowed.reason



def test_policy_domain_restriction_allowed():
    ctx = AgentContext(agent_id="a1", session_id=str(uuid.uuid4()))
    tool_allowed = ProposedToolCall(tool_name="call_http", arguments={"url": "http://api.example-sandbox.com/data"})
    check_allowed = evaluate_policy(tool_allowed, ctx)
    assert check_allowed.allowed


def test_policy_session_call_limit_sqlite():
    session_id = f"test_session_{uuid.uuid4()}"
    ctx = AgentContext(agent_id="a1", session_id=session_id)
    tool = ProposedToolCall(tool_name="send_email")  # max_calls_per_session: 3

    # Calls 1, 2, 3 should pass
    for i in range(3):
        check = evaluate_policy(tool, ctx)
        assert check.allowed, f"Call {i+1} should be allowed"

    # Call 4 should be blocked by session limit
    check_blocked = evaluate_policy(tool, ctx)
    assert not check_blocked.allowed
    assert "Exceeded max session calls" in check_blocked.reason


def test_screen_endpoint_hard_policy_block_even_if_risk_zero():
    payload = {
        "agent_context": {"agent_id": "a1", "session_id": str(uuid.uuid4())},
        "incoming_content": {
            "source": "user_input",
            "text": "Hello, please save my document.",  # Completely clean text, risk_score == 0.0
        },
        "proposed_tool_call": {
            "tool_name": "write_file",
            "arguments": {"path": "/system/unauthorized.txt"},  # Policy path violation
        },
    }
    response = client.post("/screen", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "block"
    assert data["risk_score"] == 0.0
    assert not data["policy_check"]["allowed"]
    assert "Hard Policy Violation" in data["explanation"]
