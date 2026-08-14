"""
Automated End-to-End Demo Suite for Sentinel Layer (Phase 8).

Executes end-to-end verification across all 3 attack scenarios using Starlette TestClient,
validating 3-Stage Threat Cascade, Policy Engine overrides, and SQLite Hot Storage logging.
"""
import json
import logging
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("demo_suite")


def main():
    logger.info("==================================================================")
    logger.info("  SENTINEL LAYER — AUTOMATED END-TO-END DEMO SUITE (PHASE 8)")
    logger.info("==================================================================")

    client = TestClient(app)

    # 1. Health Check
    logger.info("[1/5] Testing GET /health...")
    resp = client.get("/health")
    assert resp.status_code == 200, f"Health check failed: {resp.text}"
    logger.info("      [OK] Health check passed: %s", resp.json())

    # 2. Fetch Staged Scenarios
    logger.info("[2/5] Fetching available attack scenarios via GET /demo/scenarios...")
    resp = client.get("/demo/scenarios")
    assert resp.status_code == 200, f"Failed to list scenarios: {resp.text}"
    scenarios = resp.json().get("scenarios", [])
    assert len(scenarios) == 3, f"Expected 3 scenarios, found {len(scenarios)}"
    logger.info("      [OK] Discovered 3 attack scenarios:")
    for sc in scenarios:
        logger.info("           - Scenario #%d: %s", sc["scenario_id"], sc["title"])


    # 3. Execute Scenario 1: Direct Injection & Persona Jailbreak
    logger.info("[3/5] Executing Scenario 1 (Direct Prompt Injection & Persona Jailbreak)...")
    resp = client.post("/demo/run-scenario", json={"scenario_id": 1})
    assert resp.status_code == 200, f"Scenario 1 failed: {resp.text}"
    data1 = resp.json()
    assert data1["unprotected_run"]["tool_executed"] is True
    assert data1["protected_run"]["screen_response"]["verdict"] == "block"
    logger.info("      [OK] Scenario 1 Verification Passed:")
    logger.info("           - Unprotected Outcome : EXPLOITED (Tool Ran)")
    logger.info("           - Sentinel Outcome    : BLOCKED (Risk Score: %.2f)", data1["protected_run"]["screen_response"]["risk_score"])

    # 4. Execute Scenario 2: Indirect Data Poisoning
    logger.info("[4/5] Executing Scenario 2 (Indirect Data Poisoning via Email)...")
    resp = client.post("/demo/run-scenario", json={"scenario_id": 2})
    assert resp.status_code == 200, f"Scenario 2 failed: {resp.text}"
    data2 = resp.json()
    assert data2["unprotected_run"]["tool_executed"] is True
    assert data2["protected_run"]["screen_response"]["verdict"] == "block"
    logger.info("      [OK] Scenario 2 Verification Passed:")
    logger.info("           - Unprotected Outcome : EXPLOITED (Data Exfiltrated)")
    logger.info("           - Sentinel Outcome    : BLOCKED (Risk Score: %.2f)", data2["protected_run"]["screen_response"]["risk_score"])

    # 5. Execute Scenario 3: Over-Scope Policy Violation
    logger.info("[5/5] Executing Scenario 3 (Over-Scope Call / Policy Engine Block)...")
    resp = client.post("/demo/run-scenario", json={"scenario_id": 3})
    assert resp.status_code == 200, f"Scenario 3 failed: {resp.text}"
    data3 = resp.json()
    assert data3["unprotected_run"]["tool_executed"] is True
    assert data3["protected_run"]["screen_response"]["verdict"] == "block"
    assert data3["protected_run"]["screen_response"]["policy_check"]["allowed"] is False
    logger.info("      [OK] Scenario 3 Verification Passed:")
    logger.info("           - Unprotected Outcome : EXPLOITED (/etc/passwd overwritten)")
    logger.info("           - Sentinel Outcome    : BLOCKED BY POLICY (Reason: %s)", data3["protected_run"]["screen_response"]["policy_check"]["reason"])

    # Verify Hot Storage Audit Logs
    logger.info("==================================================================")
    logger.info("  VERIFYING SQLITE HOT STORAGE AUDIT TRAIL...")
    resp = client.get("/events/history?limit=10")
    assert resp.status_code == 200
    events = resp.json().get("events", [])
    logger.info("  Total Logged Audit Events: %d", len(events))
    assert len(events) >= 3, "Expected at least 3 logged audit events"
    logger.info("==================================================================")
    logger.info("  [SUCCESS] DEMO SUITE PASSED 100% END-TO-END WITHOUT ERRORS!")
    logger.info("==================================================================")


if __name__ == "__main__":
    main()
