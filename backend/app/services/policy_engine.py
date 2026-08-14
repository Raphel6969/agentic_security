"""
Policy Engine Service for Sentinel Layer (Phase 5).

Loads policy.yaml and enforces fine-grained authorization rules:
- Default deny for undeclared tools
- Path condition matching (allowed_paths with glob wildcards)
- Domain condition matching (allowed_domains)
- Session call limits via SQLite Hot Storage (SessionCallCountDB)
- Approval scopes (requires_approval)
"""
import fnmatch
import logging
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
import yaml

from app.config import get_settings
from app.db.models import SessionCallCountDB
from app.db.session import SessionLocal, init_db
from app.models import AgentContext, PolicyCheck, ProposedToolCall

logger = logging.getLogger(__name__)


class PolicyEngineService:
    """
    Service enforcing declarative policy rules from policy.yaml and tracking
    session invocation limits in SQLite hot storage.
    """

    def __init__(self):
        self._policy_data: dict[str, Any] = {}
        self._is_initialized: bool = False

    def _ensure_initialized(self) -> None:
        if self._is_initialized:
            return

        init_db()
        settings = get_settings()
        policy_path = Path(settings.policy_file_path)

        if not policy_path.exists():
            # Fallback to root policy.example.yaml if config path doesn't exist
            root_policy = Path(__file__).parent.parent.parent.parent / "policy" / "policy.example.yaml"
            if root_policy.exists():
                policy_path = root_policy

        if policy_path.exists():
            try:
                with open(policy_path, "r", encoding="utf-8") as f:
                    self._policy_data = yaml.safe_load(f) or {}
                logger.info("Loaded policy rules from %s", policy_path)
            except Exception as err:
                logger.error("Failed to parse policy file %s: %s", policy_path, err)
                self._policy_data = {}
        else:
            logger.warning("Policy file not found at %s. Using default deny policy.", policy_path)

        self._is_initialized = True

    def _get_current_session_calls(self, session_id: str, tool_name: str) -> int:
        """Queries SQLite hot storage for current call count in session."""
        with SessionLocal() as db:
            row = (
                db.query(SessionCallCountDB)
                .filter_by(session_id=session_id, tool_name=tool_name)
                .first()
            )
            return row.call_count if row else 0

    def _increment_session_calls(self, session_id: str, tool_name: str) -> int:
        """Increments SQLite hot storage session call count."""
        with SessionLocal() as db:
            row = (
                db.query(SessionCallCountDB)
                .filter_by(session_id=session_id, tool_name=tool_name)
                .first()
            )
            if row:
                row.call_count += 1
                new_count = row.call_count
            else:
                row = SessionCallCountDB(session_id=session_id, tool_name=tool_name, call_count=1)
                db.add(row)
                new_count = 1
            db.commit()
            return new_count

    def evaluate(self, proposed_tool_call: ProposedToolCall, agent_context: AgentContext) -> PolicyCheck:
        """
        Evaluates a proposed tool call against policy rules and session limits.
        """
        self._ensure_initialized()

        tool_name = proposed_tool_call.tool_name
        args = proposed_tool_call.arguments
        session_id = agent_context.session_id

        tools_policy = self._policy_data.get("tools", {})
        default_policy = self._policy_data.get(
            "default",
            {"allowed": False, "reason": "Tool not declared in policy — deny by default."},
        )

        # 1. Check if tool is declared
        if tool_name not in tools_policy:
            return PolicyCheck(
                tool_name=tool_name,
                allowed=False,
                reason=default_policy.get("reason", "Tool not declared in policy — deny by default."),
            )

        tool_rule = tools_policy[tool_name]

        # 2. Check explicit allowed boolean
        if not tool_rule.get("allowed", False):
            return PolicyCheck(
                tool_name=tool_name,
                allowed=False,
                reason=f"Tool '{tool_name}' is explicitly disabled in policy.",
            )

        conditions = tool_rule.get("conditions", {})

        # 3. Path condition check (allowed_paths)
        allowed_paths = conditions.get("allowed_paths", [])
        if allowed_paths:
            target_path = str(args.get("path") or args.get("filename") or args.get("filepath") or args.get("file") or "")
            if not target_path:
                return PolicyCheck(
                    tool_name=tool_name,
                    allowed=False,
                    reason=f"Tool '{tool_name}' requires path argument, but none was provided.",
                )

            # Normalize slash direction
            target_path_norm = target_path.replace("\\", "/")
            path_matched = any(
                fnmatch.fnmatch(target_path_norm, pattern.replace("\\", "/"))
                or fnmatch.fnmatch(target_path_norm, pattern.rstrip("/*") + "/*")
                for pattern in allowed_paths
            )

            if not path_matched:
                return PolicyCheck(
                    tool_name=tool_name,
                    allowed=False,
                    reason=f"Path '{target_path}' is not within allowed policy paths ({allowed_paths}).",
                )

        # 4. Domain condition check (allowed_domains)
        allowed_domains = conditions.get("allowed_domains", [])
        if allowed_domains:
            raw_target = str(args.get("url") or args.get("domain") or args.get("endpoint") or "")
            if not raw_target:
                return PolicyCheck(
                    tool_name=tool_name,
                    allowed=False,
                    reason=f"Tool '{tool_name}' requires URL/domain argument, but none was provided.",
                )

            if "://" in raw_target:
                domain_name = urlparse(raw_target).netloc
            else:
                domain_name = raw_target.split("/")[0]

            domain_matched = any(
                domain_name == allowed or fnmatch.fnmatch(domain_name, allowed)
                for allowed in allowed_domains
            )

            if not domain_matched:
                return PolicyCheck(
                    tool_name=tool_name,
                    allowed=False,
                    reason=f"Domain '{domain_name}' is not permitted by policy ({allowed_domains}).",
                )

        # 5. Session call limit check (SQLite Hot Storage)
        max_calls = conditions.get("max_calls_per_session")
        if max_calls is not None:
            current_calls = self._get_current_session_calls(session_id, tool_name)
            if current_calls >= max_calls:
                return PolicyCheck(
                    tool_name=tool_name,
                    allowed=False,
                    reason=f"Exceeded max session calls ({max_calls}) for tool '{tool_name}'.",
                )

        # All checks passed — increment SQLite session call counter
        self._increment_session_calls(session_id, tool_name)
        scope = tool_rule.get("scope", "restricted")

        if scope == "requires_approval":
            return PolicyCheck(
                tool_name=tool_name,
                allowed=True,
                reason=f"Tool '{tool_name}' permitted by policy but requires operator approval (scope: {scope}).",
            )

        return PolicyCheck(
            tool_name=tool_name,
            allowed=True,
            reason=f"Tool '{tool_name}' permitted by policy (scope: {scope}).",
        )


# Global singleton
_policy_engine_instance: PolicyEngineService | None = None


def get_policy_engine() -> PolicyEngineService:
    global _policy_engine_instance
    if _policy_engine_instance is None:
        _policy_engine_instance = PolicyEngineService()
    return _policy_engine_instance


def evaluate_policy(proposed_tool_call: ProposedToolCall, agent_context: AgentContext) -> PolicyCheck:
    """Convenience function for evaluating policy against proposed tool call."""
    service = get_policy_engine()
    return service.evaluate(proposed_tool_call, agent_context)
