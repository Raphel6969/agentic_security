# 🛡️ Sentinel Layer — Agentic AI Security Gateway & SOC Dashboard

> **A real-time, low-latency runtime threat firewall and authorization gateway protecting autonomous AI agents from prompt injection, data poisoning, and over-scope tool execution.**

[![CI Workflow](https://github.com/Raphel6969/agentic_security/actions/workflows/ci.yml/badge.svg)](https://github.com/Raphel6969/agentic_security/actions/workflows/ci.yml)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=flat&logo=React&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?style=flat&logo=Vite&logoColor=white)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Key Features

- ⚡ **3-Stage Detection Cascade:**
  - **Stage 1 (Regex Rule Engine):** Zero-latency heuristic signature checks (`< 1ms`).
  - **Stage 2 (TurboQuant ML Vector Index):** `all-MiniLM-L6-v2` embedding classifier with 8-bit scalar quantization (`< 5ms`).
  - **Stage 3 (Groq LLM-Judge):** Selective cloud escalation (`llama-3.1-8b-instant`) for ambiguous intent evaluation (`~150ms`).
- 🔒 **Declarative Policy Engine (`policy.yaml`):** Enforces path wildcards (`allowed_paths`), domain whitelists (`allowed_domains`), and session call limits with hard override authority.
- 🗄️ **Hot & Cold Storage Architecture:**
  - **Hot Storage:** SQLite (`sentinel.db`) tracking real-time session call counts and screen event audit logs.
  - **Cold Storage:** Data model ready for batch push export to PostgreSQL.
- 🤖 **Enterprise Toy Agent Laboratory:** 7 real-world tools (`read_email`, `write_file`, `call_http`, `send_email`, `execute_sql`, `bash_execute`, `search_web`) and 3 staged attack scenarios.
- 🎨 **Security Operations Center (SOC) Control Room:** Awwwards-tier React/Vite dashboard featuring Double-Bezel glass architecture, interactive canvas background particle matrix, SVG radial risk radar gauge, 1-click attack simulator, live SSE telemetry stream, and live policy editor.

---

## 🏗️ System Architecture

```
                                  +---------------------------------------+
                                  |     REACT 18 / VITE SOC DASHBOARD     |
                                  |  (Double-Bezel Glass & Particle Net)  |
                                  +-------------------+-------------------+
                                                      | SSE Telemetry Stream
                                                      v
+---------------------------------------------------------------------------------------------------+
|                                      FASTAPI RUNTIME FIREWALL                                     |
|                                                                                                   |
|   [Incoming Content]  ──►  [Stage 1: Regex Engine]  ──►  [Stage 2: ML Vector]                     |
|                                                                   │                               |
|                                                                   ▼ (Selective Escalation)        |
|   [Screening Verdict] ◄──  [Policy Engine Gate]   ◄──  [Stage 3: Groq LLM-Judge]                  |
|                                  │                                                                |
+----------------------------------|----------------------------------------------------------------+
                                   v
                   +---------------+---------------+
                   | SQLITE HOT STORAGE            |
                   | (sentinel.db Audit Logs)      |
                   +-------------------------------+
```

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Clone Repository & Setup Backend
```bash
git clone https://github.com/Raphel6969/agentic_security.git
cd agentic_security/backend

# Create virtual environment & install dependencies
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start FastAPI server (runs on http://localhost:8000)
uvicorn app.main:app --reload
```

### 2. Setup & Start Frontend SOC Dashboard
```bash
cd ../frontend

# Install dependencies & start Vite dev server (runs on http://localhost:5173)
npm install
npm run dev
```

Open your browser to `http://localhost:5173` to launch the **Security Operations Center Control Room**!

---

## 🧪 Testing & Verification

### Run Backend Pytest Suite (40 Tests)
```bash
cd backend
pytest
```

### Run Automated End-to-End Demo Suite
```bash
cd backend
python -m scripts.run_demo_suite
```

### Build Frontend Production Bundle
```bash
cd frontend
npm run build
```

---

## 📄 Project Documentation

- [`ARCHITECTURE.md`](file:///c:/Users/raphe/Webdev/Projects/agentic_security/ARCHITECTURE.md) — Detailed 3-stage cascade & policy engine design.
- [`API.md`](file:///c:/Users/raphe/Webdev/Projects/agentic_security/API.md) — REST & SSE contract reference (`/screen`, `/demo`, `/events`).
- [`docs/PITCH_DECK.md`](file:///c:/Users/raphe/Webdev/Projects/agentic_security/docs/PITCH_DECK.md) — Executive technical pitch deck & presentation slides.
- [`docs/decisions.md`](file:///c:/Users/raphe/Webdev/Projects/agentic_security/docs/decisions.md) — Technical decision log across all 8 phases.
- [`docs/status.md`](file:///c:/Users/raphe/Webdev/Projects/agentic_security/docs/status.md) — Single source of truth project snapshot.

---

## 📜 License

MIT License — see [`LICENSE`](file:///c:/Users/raphe/Webdev/Projects/agentic_security/LICENSE) for details.
