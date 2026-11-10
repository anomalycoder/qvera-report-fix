# Acadza "Report → Fix" Quality Assurance Platform

An AI-powered question quality assurance and triage system engineered for Acadza's high-stakes JEE/NEET question bank (~800,000 questions). It ingests incoming student error reports, verifies mathematical derivations from first principles using SymPy, suggests surgical repairs strictly within a closed taxonomy, and routes issues between automated patches and an interactive Faculty Review Console.

> [!NOTE]
> **Environment Note:** Development URLs (`http://127.0.0.1:8000`, `http://localhost:5173`) documented below are local development endpoints and are not public production deployment URLs.

---

## Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │    Incoming Student Error Reports    │
                      │       (Android / iOS / Web)          │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │      DataLoader & Relational Check   │
                      │    (43 Questions, 44 Reports)        │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │         QuestionNormalizer           │
                      │  (DOM MathML, Options A-D, Warnings) │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │         ReportGrouper Engine         │
                      │  (Multi-Student Consensus Detection) │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │     SymPy Independent Math Engine    │
                      │   (Phasors, Flux, Sig Figs, Optics)  │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │          AI Triage Engine            │
                      │  (Prompt Injection Trap Defense)     │
                      └──────────────────┬───────────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
      ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
      │     auto_apply      │ │   faculty_review    │ │      no_change      │
      │ (High-Confidence    │ │ (Gated Non-Auto     │ │ (Sound Questions,   │
      │  Keys & Stem Fixes) │ │  Repairs & Audits)  │ │  App / Injection)   │
      └──────────┬──────────┘ └──────────┬──────────┘ └──────────┬──────────┘
                 │                       │                       │
                 └───────────────────────┼───────────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │     Faculty Review Console (UI)      │
                      │ (Queue, 2-Col Workspace, Diff, Sync) │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │    Persistent SQLite WAL Audit Log   │
                      │ (Immutable Decision Records, Review) │
                      └──────────────────────────────────────┘
```

---

## Key Features

- **DOM MathML & Formula Preservation:** BeautifulSoup-driven normalizer extracts questions, options, and solutions while preserving nested MathML tags (`<math>`, `<mrow>`, `<mfrac>`, `<msub>`).
- **Independent First-Principles Verification:** SymPy-powered solvers derive mathematical conclusions without trusting student claims or stored answer keys. Catches classical authoring errors like scalar addition of AC reactive voltages.
- **Closed Taxonomy Enforcement:** Dynamically loaded from `data/taxonomy.json`. Validates 7 closed verdicts, 13 repair types, and enforces field mutation boundaries (e.g. `answer_key` cannot mutate question stem).
- **Adversarial Prompt-Injection Defense:** Treats all student comments as untrusted input. Automatically neutralizes prompt injections (`no_change`) and logs security events in evidence traces.
- **Surgical Diff Viewer:** Computes exact `find` and `replace` token pairs instead of destructive full-stem overwrites.
- **Empathetic Pedagogical Reply Dispatcher:** Generates supportive, academically rigorous explanations for students based on verification results.
- **Faculty Review Console:** Enterprise academic operations workbench featuring an Urgency-tiered Queue (L1–L4), 2-column inspection workspace, authorization confirmation modal, and persistent audit ledger.
- **Pre-Report Silent Defect Scanner:** Audits unflagged questions to identify dormant defects before students encounter them.

---

## Technology Stack

| Layer | Technology | Purpose & Rationale |
|---|---|---|
| **Backend Framework** | Python 3.12 + FastAPI | High-performance asynchronous REST API, OpenAPI/Swagger docs, native Python scientific library integration. |
| **Mathematical Engine** | SymPy 1.14 | Symbolic mathematics, exact rational arithmetic, phasor summations, solid-angle flux integrals, equation solving. |
| **Data Validation** | Pydantic v2 | Strict schema enforcement, runtime data validation, serialization. |
| **Database & Audit** | SQLite 3 with WAL Mode | Lightweight, embedded ACID persistence, Write-Ahead Logging for high concurrency, zero external daemon requirements. |
| **HTML / Markup Parser** | BeautifulSoup4 + lxml | DOM tree navigation, MathML token preservation, markup warning detection. |
| **Frontend Framework** | React 19 + TypeScript | Component modularity, strict compile-time type safety. |
| **Build Tool** | Vite 8 | Instant Hot Module Replacement (HMR), optimized Rollup production bundling (< 600ms build). |
| **Styling & Icons** | Tailwind CSS v4 + Lucide React | Minimal academic operations design system, neutral color palette, responsive layout. |

---

## Repository Structure

```
acadza/
├── backend/                       # FastAPI application & verification logic
│   ├── app/
│   │   ├── api/v1/                # Versioned REST endpoints
│   │   │   ├── endpoints/         # Faculty, Triage, Solver, Dataset, Questions, Reports, Audit
│   │   │   └── router.py          # Central API router
│   │   ├── core/                  # Settings, database connection manager, constants
│   │   ├── models/                # SQLite table schemas & models
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   └── services/              # Domain services
│   │       ├── data_loader.py     # Relational dataset integrity validator
│   │       ├── question_normalizer.py # DOM HTML/MathML parser
│   │       ├── report_grouper.py  # Consensus and grouping engine
│   │       ├── taxonomy_service.py # Closed taxonomy validator
│   │       ├── triage/            # Modular triage engine & safety gates
│   │       └── solver/            # SymPy subject solvers & answer extractors
│   ├── tests/                     # 55 automated pytest integration tests
│   ├── requirements.txt           # Python dependencies
│   └── main.py                    # Server entrypoint & CORS configuration
│
├── frontend/                      # React 19 SPA
│   ├── src/
│   │   ├── components/            # Reusable UI widgets & FacultyConsole modules
│   │   │   ├── FacultyConsole/    # Queue, Workspace, DiffViewer, SolverTrace, ReplyCard, Modals
│   │   │   └── ui/                # Base UI components (Badge, Card)
│   │   ├── layouts/               # FacultyLayout with collapsible navigation
│   │   ├── pages/                 # Overview, Queue, Workspace, Analytics, Settings, Audit
│   │   ├── types/                 # TypeScript interfaces (Question, Report, Triage, Audit)
│   │   └── App.tsx                # SPA state router
│   ├── package.json               # Node.js dependencies & scripts
│   ├── vite.config.ts             # Vite configuration & proxy
│   └── tsconfig.json              # TypeScript compilation rules
│
├── data/                          # Production datasets (Read-only, immutable)
│   ├── questions.json             # 43 production questions (HTML + MathML)
│   ├── reports.json               # 44 student error reports (Android/iOS/Web)
│   └── taxonomy.json              # Closed taxonomy of verdicts, repairs, fields & auto flags
│
├── results.json                   # Verified benchmark triage results (44 items)
├── PROMPTS.md                     # Engineering prompts, iterations, 3 AI bugs caught, design log
├── PRODUCT.md                     # One-page product philosophy & strategic vision
├── DEMO_SCRIPT.md                 # 3-minute video walkthrough recording script
├── SUBMISSION_CHECKLIST.md        # Comprehensive assignment submission checklist
└── README.md                      # This comprehensive documentation
```

---

## Dataset Description & Intelligence Summary

Analysis performed against the production files in `data/`:

| Dimension | Count | Details |
|---|---|---|
| **Total Questions** | 43 | Real JEE/NEET questions with HTML markup and inline MathML equations. |
| **Total Student Reports** | 44 | Ingested student reports from production clients. |
| **Referential Integrity** | 100% | 44/44 reports reference valid questions in `questions.json` (0 orphaned reports). |
| **Distinct Reported Questions** | 39 | Questions with at least one student bug report. |
| **Multi-Reported Questions** | 4 | Questions independently flagged by multiple students: <br>• `60f744b3f1b9bc7cc7b4a949` (3 reports — AC LCR circuit defect)<br>• `60f742f6660d187cc13a8078` (2 reports — missing option)<br>• `622f08d7b70e4b50e4500a1b` (2 reports — missing Option D)<br>• `612151a6a34397610a9a2e58` (2 reports — unrelated solution text) |
| **Unreported Questions** | 4 | Questions in dataset without incoming reports (includes 1 silent defect). |
| **Question Types** | 31 SCQ, 10 Integer, 2 MCQ | Single Choice (72.1%), Integer (23.3%), Multiple Choice (4.7%). |
| **Subject Distribution** | 33 Physics, 6 Zoology, 4 Botany | Physics represents 76.7% of the dataset. |
| **Client Platforms** | 26 Android, 9 Web, 9 iOS | Android is the dominant client reporting source (59.1%). |
| **Silent Pre-Report Defect** | 1 Question (`68dea657387eea3d0d95f54a`) | Lens optical power integer question with DB error flag and garbled solution MathML. |

---

## Installation & Setup Instructions

### 1. Prerequisites
- **Python**: Version 3.10+ (tested on Python 3.12.10)
- **Node.js**: Version 18+ (tested on Node.js v22.18.0)
- **Package Manager**: npm 9+

### 2. Environment Configuration
The repository includes pre-configured environment files. If running in a new environment:
```bash
# In backend/
copy .env.example .env     # Windows
cp .env.example .env       # Linux/macOS
```
Default `.env` settings:
```env
ENVIRONMENT=development
API_V1_PREFIX=/api/v1
DATABASE_URL=sqlite:///./acadza.db
CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
```

### 3. Backend Setup & Startup
```bash
# From workspace root
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
- **Backend Health Check:** [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)
- **Interactive Swagger Docs:** [http://127.0.0.1:8000/api/v1/docs](http://127.0.0.1:8000/api/v1/docs)
- **ReDoc Documentation:** [http://127.0.0.1:8000/api/v1/redoc](http://127.0.0.1:8000/api/v1/redoc)

### 4. Frontend Setup & Startup
```bash
# In a separate terminal, from workspace root
cd frontend
npm install
npm run dev
```
- **Faculty Review Console:** [http://localhost:5173](http://localhost:5173)

---

## Automated Test Suite

The project includes an end-to-end automated test suite built with `pytest`:

```bash
# Run all tests from workspace root
python -m pytest backend/tests -v
```

### Test Coverage Highlights (55 Passing Tests in ~5s):
1. **Dataset Integrity (`test_data_loader.py`):** Relational verification, health report generation, statistics.
2. **Normalization & DOM Parsing (`test_question_normalizer.py`):** SCQ/MCQ/Integer extraction, missing option flags, MathML warnings.
3. **Consensus Engine (`test_report_grouper.py`):** Multi-student grouping, duplicate detection, comment clustering.
4. **SymPy Verification Engine (`test_solver.py`):** AC circuit phasor proofs, Gauss's law flux derivations, sig-fig precision, photoelectric stopping potential, biology contradictions.
5. **Taxonomy Enforcement (`test_taxonomy_service.py`):** Closed verdict/repair validation, auto-apply flag compliance, allowed fields check.
6. **Triage & Prompt Injection (`test_triage.py`):** Closed taxonomy routing, adversarial trap neutralization, surgical edit validation, regression cases.
7. **Faculty Endpoints & Governance (`test_faculty_endpoints.py`):** Overview KPIs, queue multi-filtering, workspace payload, approval idempotency, duplicate rejection (`400`), taxonomy scope guard (`422`), reject/defer actions, SQLite audit ledger.

---

## Production Build & Benchmark Validation

### Frontend Production Build
```bash
npm --prefix frontend run build
```
Builds cleanly with zero TypeScript errors into optimized static bundles in `frontend/dist/`.

### Benchmark Results (`results.json`)
The benchmark file `results.json` contains classifications for all 44 student reports:
- **`defect`**: 27 reports (61.4%) — genuine answer key, stem data, or solution errors.
- **`no_error`**: 12 reports (27.3%) — student misconceptions or prompt injection traps.
- **`display_issue`**: 2 reports (4.5%) — mobile font/rendering issues.
- **`app_issue`**: 1 report (2.3%) — submission freezing.
- **`language_mode`**: 1 report (2.3%) — language translation request.
- **`not_actionable`**: 1 report (2.3%) — unspecific complaint.
- **Routing**: `auto_apply` (17), `no_change` (17), `faculty_review` (10).

To re-run benchmark evaluation and output validation:
```bash
python -c "from app.services.triage.benchmark_runner import run_benchmark; run_benchmark()"
```

---

## Security & Safety Design

1. **Untrusted Student Input:** Student comments are treated strictly as alert vectors, never ground truth. Adversarial prompt injections are detected and neutralized (`no_change`).
2. **Closed Taxonomy Invariance:** Permitted verdicts, repair categories, and allowed edit fields are loaded dynamically from `data/taxonomy.json`. Arbitrary modifications are rejected at the API layer.
3. **Auto-Apply Safety Gate:** Patches are only auto-applied if `repair.auto == true` AND verification confidence $\ge 0.80$. High-risk repairs (`diagram`, `identical_options`, `wrong_chapter`, `syllabus`, missing distractors) are strictly routed to `faculty_review`.
4. **Duplicate Application Prevention:** Re-submitting an approval for an already approved patch returns `400 Bad Request` to guarantee database idempotency.
5. **Immutable SQLite Audit Logging:** All reviewer actions record timestamp, reviewer identity, before/after values, and notes to SQLite in WAL mode.

---

## User Interface & Console Views

The Faculty Review Console provides six purpose-built operations views:
1. **Overview Dashboard:** High-level KPIs, urgency breakdown, high-priority issues list with 1-click inspection, and recent faculty decisions.
2. **Review Queue:** Full operational queue sorted by urgency (L1 Critical to L4 Low), with multi-criteria filters for Subject, Urgency, Verdict, and Status.
3. **Question Inspection Workspace:** 2-column workbench displaying native MathML equations, option cards (A–D), student comments, independent SymPy derivation proof, surgical before/after diff viewer, empathetic reply dispatcher, and approval controls.
4. **Approval Confirmation Modal:** Human authorization gate displaying target fields, before/after values, and taxonomy permission checks before committing.
5. **Dataset Analytics:** Subject defect rates, multi-reported clusters, and silent pre-report defect scan.
6. **System Settings:** Closed taxonomy viewer, runtime governance rules, and safety gate indicators.

---

## Deployment Instructions

To deploy to production (e.g. AWS, Render, Railway, DigitalOcean):
1. **Backend:**
   - Run via Gunicorn with Uvicorn workers: `gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000`.
   - Mount persistent volume for SQLite database (`acadza.db`) or configure production PostgreSQL database URL.
   - Set `ENVIRONMENT=production` and update `CORS_ORIGINS` to the production domain.
2. **Frontend:**
   - Build static assets: `npm run build`.
   - Serve `dist/` directory via Nginx, Cloudflare Pages, or AWS S3 + CloudFront.
   - Configure reverse proxy routing `/api/*` to the FastAPI backend service.

---

## Known Limitations

- **Complex Optical Diagrams:** Symbolic equation solvers can verify numerical parameters, but cannot synthesize technical circuit diagrams or optical ray traces from scratch. These cases are safely routed to faculty review (`auto: false`).
- **Natural Language Subjectivity:** Questions in advanced Botany and Zoology involving ambiguous colloquial terms require human pedagogical judgment. The system flags contradictory explanation texts for human confirmation.
- **Embedded Database Scale:** SQLite WAL handles concurrent reads and serial writes efficiently for single-instance operations. For multi-region distributed setups across 800,000 questions, migrating to PostgreSQL with connection pooling is recommended.
