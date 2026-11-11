# QVERA — Acadza "Report → Fix" Quality Assurance Platform

An academic quality assurance, verification, and faculty governance platform for the **Acadza AI Intern Build Round ("Report → Fix" Loop)**. Built for messy JEE/NEET production questions (HTML + inline MathML across `scq`, `mcq`, and `integerQuestion`), it separates **Verdict**, **Repair**, and **Route**, verifies mathematical answers independently with SymPy, restricts automated edits to a versioned closed taxonomy, and streams real-time updates to faculty reviewers over Server-Sent Events (SSE).

---

## Live Links & Submission Status

| Artifact | Status / URL |
|---|---|
| **Public GitHub Repository** | Pending manual `git remote` push (see Section 15 / Submission checklist) |
| **Live Faculty Console** | Pending Vercel / Render user authentication & deployment (local servers verified at `http://localhost:5173/` & `http://127.0.0.1:8000`) |
| **Walkthrough Video (3 min)** | Pending screen recording (script available in [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md)) |
| **Benchmark Output** | [`results.json`](results.json) — **44 / 44 reports validated** (`0` schema or safety errors) |

---

## Architecture & Report → Fix Workflow

```text
Student Reports (reports.json / POST /api/v1/reports)
       │
       ▼
ReportGrouper (44 Reports ──▶ 39 Unique Question Cases by questionId)
       │
       ▼
QuestionNormalizer (BeautifulSoup DOM · Preserves <math> MathML & Options A-D)
       │
       ▼
Independent Verification Engine (SymPy CAS + Domain Solvers · Untrusted Comments Isolated)
       │
       ▼
Closed Taxonomy Safety Gate (7 Verdicts · 18 Repairs · auto:true vs auto:false · Field Scope)
       │
       ├──▶ auto_apply (17 reports)      — Safe scope + auto:true + confidence >= threshold
       ├──▶ faculty_review (10 reports)  — Mandatory human gate (diagram, unsound, syllabus, etc.)
       └──▶ no_change (17 reports)       — Student misconception, app/display bug, prompt injection
       │
       ▼
Faculty Review Console (Overview · Grouped Queue · 2-Col Investigation · Analytics · Append-Only Audit Ledger · Admin Taxonomy Settings)
       │
       ▼
SQLite WAL Storage (`question_versions` recoverable originals, `taxonomy_versions`, trigger-protected `audit_logs`, SSE live sync)
```

---

## Key Features Implemented

- **Landing Page & Unified Design System:** Editorial ivory canvas (`#F9F8F3`), obsidian controls (`#0B0F12`), stone borders (`#C5C1B4`), and `font-[425]` typography across Landing, Login, and all Console pages.
- **Role-Based Authentication & Topbar Workspace Controls:** Session-backed Faculty (`demo@qvera.local`) and Admin (`admin@qvera.local`) accounts, working editable Profile (`PATCH /api/v1/auth/me`), expandable Command Search (`⌘K` / `Ctrl+K` / `/`), and live SSE Notifications.
- **Problem-Driven Overview & `questionId`-Grouped Review Queue:** 1 investigation case per unique `questionId` (`39` cases), multi-signal priority scoring, expandable grouped reports, inline Question Review slide-over, and actions (`Approve`, `Edit`, `Reject`, `No Change`, `Escalate`).
- **2-Column Investigation Workspace:** Renders native MathML/HTML, SCQ/MCQ/Integer schemas, recoverable original vs edited `question_versions` (`HTTP 409 Conflict` concurrency protection), honest CAS verification provenance, and surgical diff comparison.
- **Live Analytics & Append-Only Audit Ledger:** Date/verdict/repair/type filtered analytics separating confidence from unavailable ground-truth accuracy; SQLite trigger-enforced append-only `audit_logs` (`BEFORE UPDATE` / `BEFORE DELETE` blocked).
- **Dynamic Versioned Taxonomy Settings (`Admin` Role Guarded):** Live editing of verdicts, repairs, permitted question fields, `auto` gates (with explicit promotion confirmation), AI confidence floor, safe restore-as-new-version rollback, and real-time SSE propagation.

---

## Tech Stack & Directory Structure

- **Backend:** Python 3.12, FastAPI, Pydantic v2, SymPy, BeautifulSoup4 (`lxml`), SQLite 3 (WAL mode + triggers), pytest
- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Recharts, KaTeX, Sonner

```text
acadza/
├── data/                         # Immutable assignment dataset (43 questions, 44 reports, 7 verdicts, 18 repairs)
├── backend/
│   ├── main.py                   # FastAPI entrypoint, CORS regex/origins, router mount
│   ├── Procfile                  # Process command for Render / Railway
│   ├── app/
│   │   ├── core/                 # Config, SQLite schema/triggers, PBKDF2 auth & demo/admin seeding
│   │   ├── schemas/              # Pydantic models (auth, faculty, taxonomy, triage, reports)
│   │   ├── services/             # DataLoader, QuestionNormalizer, ReportGrouper, TaxonomyService, SymPy Solvers & Triage
│   │   └── api/v1/endpoints/     # auth, faculty, reports, taxonomy, triage, solver, audit, dataset, health
│   └── tests/                    # 73 automated pytest unit & integration tests
├── frontend/
│   ├── vercel.json               # SPA rewrites for React client routing on Vercel
│   └── src/
│       ├── lib/apiBase.ts        # Runtime VITE_API_BASE_URL + Bearer interceptor for Vercel+API deployments
│       ├── context/AuthContext.tsx
│       ├── layouts/AppLayout.tsx # Sidebar, Cmd+K Search, Live SSE Notifications, Profile modal
│       └── pages/                # LandingPage, LoginPage, OverviewPage, ReviewQueuePage, ReviewWorkspacePage, FacultyAnalyticsPage, AuditLedgerPage, SettingsPage
├── scripts/validate_results.py   # Strict 15-rule validator for results.json
├── results.json                  # Validated output across all 44 supplied reports
├── PROMPTS.md                    # In-product prompts, dev prompts, 3 AI failures, design decision log
├── PRODUCT.md                    # 1-page product strategy answering the 4 assignment questions
├── render.yaml                   # Render FastAPI service deployment blueprint
├── vercel.json                   # Root Vercel deployment configuration for frontend/dist
└── .env.example                  # Safe environment variable template
```

---

## Local Installation & Running

### 1. Environment Configuration
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```
Key variables (see [`.env.example`](.env.example)): `PROJECT_NAME`, `DATABASE_URL`, `BACKEND_CORS_ORIGINS`, `CORS_ALLOW_ORIGIN_REGEX`, `ALLOW_DEMO_AUTH`, `LLM_PROVIDER`, `VITE_API_BASE_URL` (leave empty in local dev).

### 2. Backend Setup & Database Initialization
SQLite WAL tables (`users`, `user_sessions`, `audit_logs` + append-only triggers, `triage_records`, `question_versions`, `taxonomy_versions`, `notifications`, `submitted_reports`, `safety_events`) initialize automatically on server startup via `init_db()`.
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
Health check: `http://127.0.0.1:8000/api/v1/health` · Swagger docs: `http://127.0.0.1:8000/api/v1/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Console URL: `http://localhost:5173/`
- **Faculty Reviewer Account:** `demo@qvera.local` / `QveraDemo2026!`
- **Administrator Account (Taxonomy Write Access):** `admin@qvera.local` / `QveraAdmin2026!`

---

## AI Triage Execution, Validation & Testing

### Generate & Validate `results.json`
```bash
# Re-run deterministic benchmark engine across all 44 reports:
cd backend
python -c "from app.services.triage.triage_engine import triage_engine; triage_engine.benchmark_runner.run_full_benchmark()"

# Validate all 15 schema, taxonomy scope, and safety rules:
cd ..
python scripts/validate_results.py
```
**Latest Measured `results.json` Validation Summary:**
- **Total Records:** `44 / 44` (`0` errors, `0` warnings)
- **Verdicts:** `defect` (`27`), `no_error` (`12`), `display_issue` (`2`), `app_issue` (`1`), `language_mode` (`1`), `not_actionable` (`1`)
- **Routes:** `auto_apply` (`17`), `no_change` (`17`), `faculty_review` (`10`)
- **Safety Violations:** `0` (`auto: false` never auto-applied, zero edits on `no_change`, zero forbidden field mutations)

### Automated Tests & Production Build
```bash
# Backend unit + integration suite (73 tests)
cd backend && python -m pytest tests/

# Frontend TypeScript check + production build
npm --prefix frontend run build
```

---

## Security & Safety Rules

1. **Untrusted Input Isolation:** Student comments never execute instructions; prompt injections route deterministically to `no_error` / `no_change`.
2. **Closed Taxonomy Field Scope:** Every proposed and manual edit validates against active taxonomy fields (`HTTP 422` + `edit_blocked` audit event on violations).
3. **Human Gate for `auto: false`:** Diagram, identical option, syllabus, wrong-chapter, and unsound repairs cannot auto-apply; promoting `auto: false → true` requires Admin role + explicit confirmation.
4. **Role & Concurrency Guards:** Taxonomy writes require `admin` role (`HTTP 403` for faculty); concurrent edits trigger `HTTP 409 Conflict`.
5. **Append-Only Audit Trail:** SQLite triggers prevent `UPDATE` or `DELETE` on `audit_logs`.

---

## Production Deployment

Because the architecture pairs a static **React 19 / Vite SPA** (`frontend/`) with a **FastAPI + SymPy + SQLite WAL backend** (`backend/`):
1. **Deploy Backend (`backend/` → Render / Railway / Fly.io):**
   - Blueprint provided in [`render.yaml`](render.yaml) (`uvicorn main:app --host 0.0.0.0 --port $PORT`).
   - Set `ENV=production`, `CORS_ALLOW_ORIGIN_REGEX=^https://.*\.vercel\.app$` (or exact `BACKEND_CORS_ORIGINS`), and mount persistent disk storage if preserving SQLite across container restarts.
2. **Deploy Frontend (`frontend/` → Vercel):**
   - Root configuration [`vercel.json`](vercel.json) and [`frontend/vercel.json`](frontend/vercel.json) handle SPA routing rewrites and Vite bundling (`frontend/dist`).
   - Set Vercel Environment Variable `VITE_API_BASE_URL` to your deployed backend URL (e.g., `https://qvera-report-fix-api.onrender.com`, no trailing slash). [`installApiBaseInterceptor`](frontend/src/lib/apiBase.ts) automatically rewrites `/api/*` `fetch` and `EventSource` requests and attaches `Authorization: Bearer` tokens cleanly across origins.

---

## Build Round Questions

Preserving the exact four submission questions from the original Acadza assignment README:

1. **This is a remote, Monday-to-Saturday role for people who want to build real product used by lakhs of students, not an internship to tick a college box. Is that you?**
   > `[Provide your honest personal confirmation here before emailing submission]`

2. **How many months can you commit?**
   > `[State your exact internship availability duration in months here]`

3. **Earliest start date.**
   > `[State your exact earliest available start date here]`

4. **In 2-3 lines, in your own words: why this work, why now?**
   > High-stakes exam preparation affects lakhs of students where even a single broken answer key or ambiguous question stem creates disproportionate frustration and mistrust. Building deterministic verification rails around LLM triage turns AI from an unreliable demo into safe infrastructure that lets educators resolve genuine content defects immediately—and shipping production safety + UX on that loop right now is the kind of applied engineering challenge I want to own.
