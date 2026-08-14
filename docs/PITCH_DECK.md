# 🛡️ Sentinel Layer — Technical Pitch Deck & Presentation

> **Executive Summary:** A real-time, low-latency runtime threat firewall and authorization gateway protecting autonomous AI agents from prompt injection, data poisoning, and unauthorized tool calls.

---

## Slide 1: The Problem — Unchecked Autonomous Agent Execution

- **The Rise of Actionable AI:** LLMs are moving beyond chat interfaces to autonomous agents executing real-world code, shell commands, database queries, and API calls.
- **The Security Void:**
  - **Direct Prompt Injection:** Attackers override system prompts using jailbreak personas (e.g., DAN) to extract environment keys.
  - **Indirect Prompt Injection:** Poisoned content (emails, web scrapes, PDFs) tricks agents into exfiltrating private data.
  - **Over-Scope Execution:** Agents run high-risk file writes (`/etc/passwd`) or arbitrary SQL queries because no granular authorization gate exists.
- **Traditional WAF Failures:** Traditional Web Application Firewalls inspect HTTP static syntax, but cannot parse semantic LLM intent or tool parameters.

---

## Slide 2: The Solution — Sentinel Layer Security Gateway

```
[ Incoming Content / Prompt ] ──► [ SENTINEL RUNTIME FIREWALL ] ──► [ Enterprise Tool Execution ]
                                               │
                                               ├─► Stage 1: Fast Heuristic Rules (<1ms)
                                               ├─► Stage 2: TurboQuant ML Vector (<5ms)
                                               ├─► Stage 3: Groq LLM-Judge (<150ms)
                                               └─► Hard Policy Engine (Path/Domain/Calls)
```

- **Runtime Screening Gateway (`/screen`):** Intercepts every tool request before execution.
- **3-Stage Detection Cascade:** Combines zero-latency regex rules, 8-bit quantized ML vector similarity, and selective LLM-Judge evaluation.
- **Declarative Policy Engine:** Enforces path globbing (`allowed_paths`), domain whitelisting, and session call bounds independently of model score.
- **Hot & Cold Storage Audit Trail:** SQLite active tracking (`sentinel.db`) + batch PostgreSQL export.

---

## Slide 3: 3-Stage Detection Cascade & Benchmark Performance

| Stage | Mechanism | Latency | Target Detection | Memory Footprint |
|---|---|---|---|---|
| **Stage 1** | Heuristic Regex Signature Engine (18 signatures) | `< 1ms` | Known jailbreak tokens, system override keywords | Negligible (`< 1MB`) |
| **Stage 2** | `all-MiniLM-L6-v2` + TurboQuant Vector Index | `< 5ms` | Novel prompt injection & semantic similarity | `~90MB` (8-bit Quantized) |
| **Stage 3** | Groq API (`llama-3.1-8b-instant`) LLM-Judge | `~150ms` | Ambiguous semantic intent & multi-turn trickery | API Cloud Offload |

- **Selective Escalation:** Stage 3 is triggered ONLY when Stage 1 & 2 scores fall into the ambiguous range (`0.30 <= score < 0.70`), minimizing latency and API costs.

---

## Slide 4: Declarative Policy Engine & Hard Governance

```yaml
# policy/policy.example.yaml
tools:
  write_file:
    allowed_paths:
      - "/tmp/*"
      - "c:/Users/*/AppData/Local/Temp/*"
    max_calls_per_session: 10
  call_http:
    allowed_domains:
      - "api.github.com"
      - "api.stripe.com"
```

- **Hard Policy Overrides:** If a tool call violates path globbing or domain whitelist, Sentinel issues an immediate `BLOCK` verdict with `risk_score = 1.0`, regardless of LLM confidence.
- **Zero Undeclared Tool Execution:** Default-deny policy blocks any tool call not explicitly whitelisted.

---

## Slide 5: Real-World Enterprise Toolset & Staged Attack Scenarios

Sentinel Layer is tested against **7 realistic enterprise tools**:
`read_email`, `write_file`, `call_http`, `send_email`, `execute_sql`, `bash_execute`, `search_web`.

### Staged Attack Verification:
1. **Scenario 1: Direct Jailbreak & Token Leak**
   - *Unprotected:* Leaks `.env` API keys.
   - *Sentinel:* Stage 1 & 2 rule triggers `BLOCK`.
2. **Scenario 2: Indirect Data Exfiltration**
   - *Unprotected:* Reads poisoned email and sends API keys to attacker URL.
   - *Sentinel:* Policy Engine domain block + Stage 2 ML vector trigger `BLOCK`.
3. **Scenario 3: Over-Scope File Overwrite**
   - *Unprotected:* Overwrites `/etc/passwd`.
   - *Sentinel:* Policy Engine path wildcard check issues immediate `BLOCK`.

---

## Slide 6: Awwwards-Tier SOC Dashboard Control Room

- **React 18 + Vite SPA:** High-end cybersecurity visual interface adhering to `anti-ui-slop` and `high-end-visual-design` principles.
- **Double-Bezel Architecture (Doppelrand):** Concentric hardware outer shells with hairlines and inner glass cores (`backdrop-blur-2xl`).
- **Interactive Canvas Particle Matrix:** Ambient node network pulsing red/emerald on live screening events.
- **Animated SVG Risk Radar Gauge:** Real-time risk score gauge shifting colors dynamically.
- **Real-Time Telemetry:** Server-Sent Events (SSE) live feed (`GET /events/stream`).
- **1-Click Attack Simulator:** Interactive side-by-side comparative laboratory.

---

## Slide 7: Production Roadmap & Next Steps

- [x] Phase 0–3: Core Cascade Engine (Rules + ML Vector Index)
- [x] Phase 4: Groq LLM-Judge Layer
- [x] Phase 5: Policy Engine & SQLite Hot Storage
- [x] Phase 6: Toy Agent & Enterprise Attack Scenarios
- [x] Phase 7: React/Vite Security Operations Center Dashboard
- [x] Phase 8: Integration Polish, Demo Suite & Pitch Deck
- ⏩ **Future Milestones:** PostgreSQL Cold Storage Batch Push Exporter, Multi-Tenant Agent Authorization, eBPF Kernel Interception.
