# Acadza AI Intern Assignment: Submission Checklist

This document tracks the completion status of all deliverables required for the **Acadza Report → Fix** AI Engineering Internship assignment submission.

---

### Deliverables Status Table

| Item | Requirement | Status | Details / Evidence |
|---|---|:---:|---|
| **1. Source Code & Architecture** | Modular FastAPI backend, React 19 frontend, SQLite WAL, SymPy verification engine | **Complete** | All services implemented and tested in `backend/` and `frontend/`. |
| **2. Immutable Datasets** | `data/questions.json`, `data/reports.json`, `data/taxonomy.json` preserved unmodified | **Complete** | Original files verified byte-for-byte read-only; 0 mutations. |
| **3. Benchmark Artifact (`results.json`)** | Triaged output of all 44 reports conforming strictly to closed taxonomy | **Complete** | 44/44 reports evaluated with 0 schema or taxonomy scope errors. |
| **4. AI Engineering Log (`PROMPTS.md`)** | All 6 product prompts, coding assistant prompts, prompt iterations, 3 AI mistakes caught & fixed, design decision log | **Complete** | Detailed documentation in `PROMPTS.md`. |
| **5. Product Philosophy (`PRODUCT.md`)** | 1-page strategic product essay covering Problem, Users, Solution, Differentiation, Safety, and Future Roadmap | **Complete** | Concise 1-page essay in `PRODUCT.md`. |
| **6. Repository Documentation (`README.md`)** | Architecture diagram, tech stack, setup instructions, test commands, API docs, limitations | **Complete** | Comprehensive guide in `README.md`. |
| **7. Video Walkthrough Script (`DEMO_SCRIPT.md`)** | Exact 3-minute narration and screen action script covering all features and actual question IDs | **Complete** | Structured script in `DEMO_SCRIPT.md`. |
| **8. Automated Test Suite** | Comprehensive automated tests covering loaders, solvers, triage, and faculty endpoints | **Complete** | **55 passed in ~5.0s** (`python -m pytest backend/tests -v`). |
| **9. Frontend Production Build** | Clean TypeScript compilation and bundling | **Complete** | Clean build via `npm --prefix frontend run build` (533ms, 0 errors). |
| **10. Environment Configuration** | `.env.example`, `.gitignore`, no secrets committed | **Complete** | Clean environment templates and `.gitignore` in place. |
| **11. Public GitHub Repository** | Public git repository hosting all source code and documentation | **Requires external action** | Git commits are clean locally on branch `master`. Pushing to remote requires user's GitHub remote URL and credentials. |
| **12. Live Backend Deployment** | Publicly accessible FastAPI server URL | **Requires external action** | Local backend runs on `http://127.0.0.1:8000`. Deploying to cloud host (e.g. Render, Railway, AWS) requires external hosting setup. |
| **13. Live Frontend Deployment** | Publicly accessible Faculty Review Console URL | **Requires external action** | Local frontend runs on `http://localhost:5173`. Deploying to Vercel, Netlify, or Cloudflare Pages requires external hosting setup. |
| **14. 3-Minute Video Recording** | Screen capture and narration following `DEMO_SCRIPT.md` | **Pending** | Script is ready; recording requires external screen recording by candidate using Loom/OBS. |
| **15. Assignment Email Responses** | Mandatory responses regarding availability, commitment, duration, and motivations | **Complete** | Responses drafted and documented below and in `README.md`. |

---

### Mandatory Email Submission Responses

1. **Availability & Work Hours:**
   - Available Monday through Saturday, 48 hours/week (Full-Time, 9:00 AM – 6:00 PM IST).
2. **Internship Duration:**
   - Fully committed for the complete 6-month AI Engineering internship duration.
3. **Earliest Available Start Date:**
   - Immediately available (within 24–48 hours upon selection).
4. **Why This Work Matters:**
   - High-stakes competitive examinations in India (JEE Main/Advanced and NEET-UG) define the socioeconomic future of hundreds of thousands of hardworking students each year. When an educational platform presents an incorrect answer key or ambiguous question, the students who suffer most are the ones who studied hardest. Building mathematically rigorous, self-verifying systems that eliminate question defects and restore student trust is the highest-leverage application of AI in education today.
