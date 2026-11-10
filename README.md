# Acadza "Report → Fix" Quality Assurance Platform

An AI-powered quality assurance and triage system engineered for Acadza's JEE/NEET question bank (~800,000 questions). It ingests incoming student error reports, verifies mathematical derivations from first principles using SymPy, suggests surgical repairs within a closed taxonomy, and routes issues between automated patches and an interactive Faculty Review Console.

---

## Architecture & Tech Stack

```
acadza-report-fix/
├── backend/                  # Python 3.12 + FastAPI + SQLite WAL
│   ├── app/
│   │   ├── api/v1/          # RESTful endpoints (Health, Dataset, Questions, Reports, Taxonomy, Solver, Triage, Audit)
│   │   ├── core/            # Config, Settings, SQLite Connection Manager
│   │   ├── models/          # Database definitions & persistence
│   │   ├── schemas/         # Pydantic v2 data transfer schemas
│   │   └── services/        # Business logic services
│   │       ├── data_loader.py            # Relational integrity validator
│   │       ├── question_normalizer.py    # BeautifulSoup DOM + MathML parser
│   │       ├── report_grouper.py         # Multi-student consensus engine
│   │       ├── taxonomy_service.py       # Dynamic closed-taxonomy validator
│   │       ├── triage_engine.py          # Master report classification engine
│   │       └── solver/                   # Independent SymPy verification engine
│   ├── tests/               # 55 automated pytest integration tests
│   └── main.py              # Application entrypoint & CORS lifecycle
│
├── frontend/                 # React 19 + Vite 8 + TypeScript + Tailwind CSS v4
│   ├── src/
│   │   ├── components/
│   │   │   ├── FacultyConsole/ # ReviewQueue, QuestionViewer, SolverTraceCard, DiffViewer, StudentReplyCard, AuditActionPanel, ApprovalConfirmModal, PatchEditModal
│   │   │   ├── ui/             # Reusable UI primitives (Badge, Card)
│   │   │   ├── DatasetStatsCard.tsx
│   │   │   └── HealthStatusCard.tsx
│   │   ├── layouts/          # Collapsible FacultyLayout with sidebar & header
│   │   ├── pages/            # FacultyOverviewPage, FacultyQueuePage, FacultyWorkspacePage, FacultyAnalyticsPage, FacultySettingsPage, AuditLedgerPage, DashboardPage
│   │   └── types/            # TypeScript schemas & API types
│
├── data/                     # Read-only production datasets (Never mutated)
│   ├── questions.json        # 43 production questions (HTML + MathML)
│   ├── reports.json          # 44 student error reports (Android, iOS, Web)
│   └── taxonomy.json         # Closed list of verdicts, repairs, fields, and auto flags
│
├── results.json              # Benchmark triaged output conforming to assignment schema
├── PROMPTS.md                # System prompts, AI coding transcript, 3 bugs caught, design log
├── PRODUCT.md                # 1-page essay on product philosophy & high-stakes education
└── README.md                 # Complete documentation and execution guide
```

---

## Dataset Inspection & Intelligence Summary

Analysis performed against production datasets:

| Metric | Value | Details & Significance |
|---|---|---|
| **Total Questions** | 43 | Real production JEE/NEET questions containing HTML + inline MathML |
| **Total Reports** | 44 | Real student reports submitted across Android, iOS, and Web |
| **Distinct Reported Questions** | 39 | 39 unique questions received at least one error report |
| **Invalid Report References** | 0 | 100% of the 44 student reports point to valid questions in `questions.json` |
| **Multi-Report Questions** | 4 | Questions reported multiple times independently: <br>• `60f744b3f1b9bc7cc7b4a949` (3 reports)<br>• `60f742f6660d187cc13a8078` (2 reports)<br>• `622f08d7b70e4b50e4500a1b` (2 reports)<br>• `612151a6a34397610a9a2e58` (2 reports) |
| **Unreported Questions** | 4 | Pool of unflagged questions: <br>• `68dea6e6387eea3d0d95f6f8` (Physics, integerQuestion)<br>• `695ede2a88d7701e561aa9d9` (Zoology, scq)<br>• `68dea87d387eea3d0d95fbe3` (Physics, scq)<br>• `68dea657387eea3d0d95f54a` (Physics, integerQuestion - **silent defect found**) |
| **Question Types** | 31 SCQ, 10 Integer, 2 MCQ | Single Choice (72.1%), Integer type (23.3%), Multiple Choice (4.7%) |
| **Subject Breakdown** | 33 Physics, 6 Zoology, 4 Botany | Physics represents 76.7% of the dataset |
| **Reporting Platforms** | 26 Android, 9 Web, 9 iOS | Android is the primary student client (59.1%) |
| **Missing Options Detected** | 1 (`622f08d7b70e4b50e4500a1b`) | SCQ with only options A, B, and C. Option D is missing. Both R009 and R010 correctly flag this. |
| **Markup Leaks Detected** | 1 (`63765a28f1d8416ae0408d89`) | Raw LaTeX code `\frac{7}{8}` rendered in plain text outside MathML. Flagged by student report R014. |
| **Silent Unreported Defect** | 1 (`68dea657387eea3d0d95f54a`) | Lens optical power integer question with `"error": 1` in DB and garbled typos in solution MathML (`<msub><mi>P</mi><mtext>eqcu</mtext></msub>`). |

---

## Independent Question Solving & SymPy Verification

The verification engine derives solutions from first principles without trusting student comments or stored answer keys:

| Question ID | Topic | Stored Key | Independently Derived | Solution Conclusion | Status | Evidence Summary |
|---|---|:---:|:---:|:---:|:---:|---|
| `60f744b3f1b9bc7cc7b4a949` | AC LCR Circuit | **C** (130 V) | **A** (50 V) | **A** (50 V) | **`mismatch`** | $V = \sqrt{V_R^2 + (V_L - V_C)^2} = \sqrt{40^2 + (60 - 30)^2} = 50\text{ V}$. Key says scalar sum $130\text{ V}$. Defective answer key! |
| `68dea616d0cda73d07e93ae6` | Gauss Law / Cube Flux | **2** | **1** | **1** | **`mismatch`** | Face flux $\frac{q}{4\epsilon_0}$ + Corner flux $\frac{q}{4\epsilon_0} = \frac{q}{2\epsilon_0} = \frac{n q}{2\epsilon_0} \Rightarrow n = 1$. Key says 2. Solution and derivation agree on $n=1$. |
| `68dea715387eea3d0d95f790` | Significant Figures | **3113** | **3113** | **3113** | **`verified`** | Side $s = 7.203\text{ m}$ (4 sig figs) $\Rightarrow A = 6 s^2 = 311.3\text{ m}^2 \Rightarrow 10 A = 3113$. Student missed sig figs; key is correct. |
| `68c9ae5afb6b2f16e2d43b1c` | Photoelectric Effect | **D** (1.1 V) | **D** (1.1 V) | **D** (1.1 V) | **`verified`** | $\lambda = 4000\text{ \AA} \Rightarrow E = 3.1\text{ eV}, \Phi = 2.0\text{ eV} \Rightarrow K_{\max} = 1.1\text{ eV} \Rightarrow V_s = 1.1\text{ V}$. Matches Option D. |
| `68e872546e45ba37dcc16bc0` | Coulomb Force Ratio | **C** | **1:1** | None | **`mismatch`** | Mutual electrostatic forces form Newton's third law pair ($1:1$). **Option (C) is completely blank in HTML!** |

---

## Triage Engine & Benchmark `results.json`

The automated triage engine evaluated all 44 reports against the closed taxonomy:

### 1. Verdict Distribution
* **`defect`**: 27 reports (61.4%) — confirmed errors in answer keys, stem parameters, solution typos, or missing options.
* **`no_error`**: 12 reports (27.3%) — student errors, misconceptions, or adversarial prompt injection traps.
* **`display_issue`**: 2 reports (4.5%) — mobile font rendering or MathML alignment issues.
* **`app_issue`**: 1 report (2.3%) — client app submission freezing.
* **`language_mode`**: 1 report (2.3%) — request for Hindi medium translation.
* **`not_actionable`**: 1 report (2.3%) — vague exclamation ("wrong question") with no detail.

### 2. Route Distribution
* **`auto_apply`**: 17 reports (38.6%) — high confidence mathematical key corrections, stem data restorations, and spelling fixes.
* **`no_change`**: 17 reports (38.6%) — sound questions, app issues, or prompt injections.
* **`faculty_review`**: 10 reports (22.7%) — gated repairs where `auto: false` (diagrams, identical options, wrong chapters, syllabus removals, missing distractors).

### 3. Safety Guard Enforcement
* **Zero Policy Violations**: Exactly 0 repairs with `auto: false` in `taxonomy.json` were routed to `auto_apply`.
* **Field Scope Enforced**: 100% of proposed edits fall strictly within the permitted fields defined in `taxonomy.json`.

---

## Faculty Review Console UI/UX

The web console provides an enterprise workbench for subject matter faculty:

1. **Review & Triage Queue (`ReviewQueue.tsx`)**:
   - Filterable by Route (`faculty_review`, `auto_apply`, `no_change`), Urgency (Level 1 Critical to Level 4 Low), and Subject.
   - Live search across question IDs, report IDs, topics, and student comments.
   - Highlights multi-student reports with consensus badges.
2. **Question Inspection Workbench (`QuestionViewer.tsx`)**:
   - Native browser MathML rendering of mathematical equations.
   - Option cards (A, B, C, D) mapping stored answer keys vs proposed corrections.
   - Missing option and blank content alert banners.
   - Attached student reports cluster with timestamps and client platforms (Android/iOS/Web).
3. **Independent SymPy Proof Trace (`SolverTraceCard.tsx`)**:
   - Side-by-side comparison: Stored Key vs Independently Derived Answer vs Solution Conclusion.
   - Step-by-step mathematical reasoning and evidence breakdown.
   - Conservative confidence meter.
4. **Surgical Diff Viewer (`DiffViewer.tsx`)**:
   - Visual before/after comparison with red deletion (`find`) and green addition (`replace`).
   - Active taxonomy repair scope verification.
5. **Student Communication Dispatcher (`StudentReplyCard.tsx`)**:
   - Auto-generated empathetic, clear student response.
   - One-click clipboard copy and simulated mobile dispatch.
6. **Faculty Governance & Audit Ledger (`AuditActionPanel.tsx` & `AuditLedgerPage.tsx`)**:
   - Reviewer identity signature and notes input.
   - `Approve Patch`, `Adjust Patch`, and `Reject Proposal` controls.
   - Permanent audit log stored in SQLite Write-Ahead Logging (WAL) mode.

---

## Execution Guide

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.12)
- Node.js 18+ (tested on Node.js v22)
- npm 9+

### 2. Run Backend
```bash
# From workspace root
cd backend
python -m uvicorn main:app --reload --port 8000
```
* **Backend Health**: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)
* **Interactive Swagger Docs**: [http://127.0.0.1:8000/api/v1/docs](http://127.0.0.1:8000/api/v1/docs)

### 3. Run Frontend
```bash
# In a separate terminal
cd frontend
npm run dev
```
* **Faculty Review Console**: [http://localhost:5173](http://localhost:5173)

### 4. Run Automated Test Suite
```bash
# Run pytest from workspace root
python -m pytest backend/tests -v
```
**Results**: `55 passed in 4.96s` (100% passing across loading, normalization, grouping, SymPy solvers, taxonomy safety, triage classifications, faculty review workflows, duplicate approval prevention, and audit logs).

### 5. Build Frontend for Production
```bash
cd frontend
npm run build
```
**Results**: Production bundle built cleanly with zero TypeScript errors.

---

## Email Submission Answers

* **Availability & Commitment**: Available Monday through Saturday, full-time commitment (48 hours/week, 9:00 AM – 6:00 PM IST).
* **Duration**: Committed for the complete 6-month AI Engineering internship duration.
* **Earliest Start Date**: Immediately available (within 24–48 hours).
* **Why This Work**: High-stakes competitive examinations in India (JEE and NEET) define the socio-economic trajectory of hundreds of thousands of hardworking students each year. When an educational platform presents a wrong answer key, the students who suffer the most are the ones who studied the hardest. Building mathematically rigorous, self-verifying systems that eliminate defects and restore student confidence is the highest-leverage application of AI in education today.
