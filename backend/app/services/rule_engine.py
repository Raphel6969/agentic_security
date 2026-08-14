"""
Stage 1 Rule Engine for Sentinel Layer.

Fast (<5ms), stateless regex and keyword signature detection for prompt
injection, jailbreak attempts, system prompt extraction, and delimiter injection.
"""
import re
from dataclasses import dataclass

from app.models import MatchedSignal


@dataclass
class RulePattern:
    name: str
    pattern: re.Pattern
    weight: float
    description: str


# ── Signature Library ─────────────────────────────────────────────────────────

RULE_DEFINITIONS: list[RulePattern] = [
    # 1. Instruction Overrides
    RulePattern(
        name="instruction_override_ignore",
        pattern=re.compile(
            r"(?i)\bignore\s+(all\s+)?(previous|prior|above|system)\s+(instructions|prompts|rules|context)\b"
        ),
        weight=0.95,
        description="Direct instruction override phrase ('ignore previous instructions')",
    ),
    RulePattern(
        name="instruction_override_disregard",
        pattern=re.compile(
            r"(?i)\b(disregard|forget)\s+(everything|all\s+prior\s+instructions|system\s+prompt)\b"
        ),
        weight=0.90,
        description="Direct instruction override phrase ('disregard prior instructions')",
    ),
    RulePattern(
        name="instruction_override_important_update",
        pattern=re.compile(
            r"(?i)\bIMPORTANT\s+UPDATE:?\s*(ignore|disregard|new\s+rule)\b"
        ),
        weight=0.90,
        description="Indirect instruction override attempt via deceptive header",
    ),

    # 2. Persona Hijacking / Jailbreak Modes
    RulePattern(
        name="persona_jailbreak_dan",
        pattern=re.compile(r"(?i)\b(you\s+are\s+now|act\s+as)\s+DAN\b"),
        weight=0.95,
        description="DAN (Do Anything Now) jailbreak mode prompt",
    ),
    RulePattern(
        name="persona_jailbreak_developer_mode",
        pattern=re.compile(r"(?i)\bdeveloper\s+mode\s+(enabled|on|activate)\b"),
        weight=0.90,
        description="Developer mode jailbreak activation attempt",
    ),
    RulePattern(
        name="persona_jailbreak_unrestricted",
        pattern=re.compile(
            r"(?i)\b(simulate|enter|enable)\s+(jailbreak|unrestricted|god)\s+mode\b"
        ),
        weight=0.90,
        description="Unrestricted / jailbreak mode simulation request",
    ),

    # 3. System Prompt Extraction
    RulePattern(
        name="system_prompt_leak_repeat",
        pattern=re.compile(
            r"(?i)\brepeat\s+(your\s+)?(system\s+prompt|initial\s+instructions)\b"
        ),
        weight=0.85,
        description="Attempt to extract system prompt ('repeat initial instructions')",
    ),
    RulePattern(
        name="system_prompt_leak_reveal",
        pattern=re.compile(
            r"(?i)\b(print|show|output|reveal)\s+(your\s+)?(system\s+prompt|instructions|rules)\b"
        ),
        weight=0.85,
        description="Attempt to reveal system rules or system prompt",
    ),

    # 4. Delimiter & Tag Injection
    RulePattern(
        name="delimiter_injection_xml_system",
        pattern=re.compile(r"(?i)</?system>"),
        weight=0.80,
        description="Injection of system XML tags (</system>)",
    ),
    RulePattern(
        name="delimiter_injection_header_system",
        pattern=re.compile(r"(?i)\[SYSTEM\s*PROMPT\]"),
        weight=0.80,
        description="Injection of system prompt bracket headers",
    ),
    RulePattern(
        name="delimiter_injection_markdown_system",
        pattern=re.compile(r"(?i)```\s*system"),
        weight=0.80,
        description="Injection of markdown system codeblocks",
    ),
    RulePattern(
        name="delimiter_injection_inst_tags",
        pattern=re.compile(r"(?i)\[/?INST\]"),
        weight=0.85,
        description="Injection of Llama/Mistral instruction boundary tags",
    ),

    # 5. Evasion & Encoding Tricks
    RulePattern(
        name="evasion_base64_decode",
        pattern=re.compile(r"(?i)\bbase64\s+(decode|encoded?)\b"),
        weight=0.75,
        description="Base64 encoding/decoding instruction trick",
    ),
    RulePattern(
        name="evasion_rot13",
        pattern=re.compile(r"(?i)\brot13\b"),
        weight=0.70,
        description="ROT13 obfuscation instruction trick",
    ),

    # 6. Data Exfiltration & Security Override
    RulePattern(
        name="exfiltration_send_data",
        pattern=re.compile(
            r"(?i)\b(send|transmit|exfiltrate|post)\s+.*?\b(to\s+http|email|webhook|attacker)\b"
        ),
        weight=0.85,
        description="Data exfiltration request to external URL or endpoint",
    ),
    RulePattern(
        name="exfiltration_fetch_url",
        pattern=re.compile(
            r"(?i)\bfetch\s+url\s+and\s+(send|forward|post)\b"
        ),
        weight=0.85,
        description="URL fetch and payload forwarding request",
    ),
    RulePattern(
        name="security_bypass_guardrails",
        pattern=re.compile(
            r"(?i)\b(bypass|override|disable)\s+(security|safety|filtering|guardrails)\b"
        ),
        weight=0.85,
        description="Explicit request to bypass safety guardrails",
    ),
    RulePattern(
        name="prompt_injection_new_instruction",
        pattern=re.compile(r"(?i)\bnew\s+instruction:?\s*"),
        weight=0.70,
        description="Deceptive 'new instruction' injection prefix",
    ),
]


# ── Engine Core ───────────────────────────────────────────────────────────────

def evaluate_rules(text: str) -> tuple[float, list[MatchedSignal]]:
    """
    Evaluates incoming text against all known signatures in RULE_DEFINITIONS.

    Returns:
        (risk_score, matched_signals)
        - risk_score: float in range [0.0, 1.0]
        - matched_signals: list of MatchedSignal instances (stage="rule")
    """
    if not text:
        return 0.0, []

    matched_signals: list[MatchedSignal] = []
    accumulated_weights: list[float] = []

    for rule in RULE_DEFINITIONS:
        match = rule.pattern.search(text)
        if match:
            matched_text = match.group(0)
            matched_signals.append(
                MatchedSignal(
                    stage="rule",
                    signal=rule.name,
                    detail=f"Matched '{matched_text}' ({rule.description})",
                    score=rule.weight,
                )
            )
            accumulated_weights.append(rule.weight)

    if not accumulated_weights:
        return 0.0, []

    # Probabilistic OR combination: 1 - prod(1 - w_i)
    prob_clean = 1.0
    for w in accumulated_weights:
        prob_clean *= (1.0 - w)

    raw_risk_score = 1.0 - prob_clean

    # Round to 2 decimal places and bound to [0.0, 1.0]
    risk_score = min(1.0, max(0.0, round(raw_risk_score, 2)))

    return risk_score, matched_signals
