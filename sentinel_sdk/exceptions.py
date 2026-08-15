"""Sentinel SDK custom exceptions."""


class SentinelBlocked(Exception):
    """Raised when Sentinel blocks a tool call."""
    def __init__(self, verdict: str, risk_score: float, explanation: str,
                 matched_signals: list = None, policy_check: dict = None):
        self.verdict = verdict
        self.risk_score = risk_score
        self.explanation = explanation
        self.matched_signals = matched_signals or []
        self.policy_check = policy_check or {}
        super().__init__(f"[{verdict.upper()}] risk={risk_score:.2f} — {explanation}")


class SentinelTokenExpired(Exception):
    """Raised when the agent session token is expired or revoked."""


class SentinelConnectionError(Exception):
    """Raised when the Sentinel endpoint cannot be reached."""
