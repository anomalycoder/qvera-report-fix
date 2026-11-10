# Acadza Report → Fix: 3-Minute Video Walkthrough Script

This script provides an exact, timed narration and screen action guide for a 3-minute demonstration of the **Acadza Report → Fix** platform.

---

### Timing & Sequence Overview

| Timestamp | Phase | Screen Action | Key Talking Points |
|---|---|---|---|
| **0:00–0:20** | **Problem & Introduction** | Start on Title Screen / Browser landing on `http://localhost:5173`. | In high-stakes exams like JEE and NEET, a wrong answer key breaks student trust and alters rank trajectories. Acadza Report → Fix closes the loop between student error reports and surgical repairs using SymPy first-principles proofs and human governance. |
| **0:20–0:45** | **Dashboard & Dataset Overview** | Navigate to **Overview Dashboard**. Hover over the 6 KPI cards and distributions. | Point out live ingested metrics: **44 reports** across **43 production questions**, 27 confirmed defects, 17 auto-applied fixes, 10 faculty gates, and 4 multi-student consensus clusters. Explain that zero questions were modified directly. |
| **0:45–1:15** | **Review Queue & Duplicate Reports** | Click **Review Queue** in sidebar. Filter by Urgency `L1 - Critical` and Subject `Physics`. | Show the queue sorted by severity. Highlight Question `60f744b3f1b9bc7cc7b4a949`, which was independently reported by 3 different students (R001, R002, R003). Explain that the system clusters duplicates and elevates multi-student defects to Critical urgency. |
| **1:15–1:50** | **Question Inspection & SymPy Verification** | Click **Inspect** on Report `R001` to open the **2-Column Review Workspace**. | **Left Column:** Native MathML rendering of the AC circuit equation, options A–D, and attached student comments. <br>**Right Column:** Show the **Independent SymPy Solver Trace**. Explain why the stored answer key `C` ($130\text{ V}$) is wrong: the original author scalar-added voltages ($40+60+30$), whereas SymPy applied phasor orthogonal summation $\sqrt{V_R^2 + (V_L - V_C)^2}$ to derive $50\text{ V}$ (**Option A**). |
| **1:50–2:20** | **Surgical Diff & Human Approval Workflow** | Scroll to **Diff Viewer**, click **Approve Correction**, open confirmation modal, confirm. | Show the surgical patch: targeting only `field: "answer"` with `find: "C"` and `replace: "A"` without corrupting the question stem. Show the auto-drafted empathetic student reply. Click **Approve Correction** — show the confirmation dialog verifying taxonomy scope, then commit. Demonstrate duplicate prevention by showing status updates to Approved. |
| **2:20–2:40** | **Audit History & Safety Restrictions** | Click **Audit History** in the sidebar, then click **Settings**. | Show the persistent SQLite WAL audit entry containing the reviewer name, timestamp, and exact before/after diff. In **Settings**, highlight the closed taxonomy from `data/taxonomy.json` and explain why repairs like missing diagrams or distractor authoring (`auto: false`) can never bypass human faculty review. |
| **2:40–3:00** | **Benchmark Results & Conclusion** | Switch to **Analytics** tab; reference `results.json` and conclude. | Highlight the 100% referential integrity, the detection of silent unreported defects (Question `68dea657387eea3d0d95f54a`), and the 55 passing automated tests. Conclude with how Acadza restores mathematical rigor and student confidence at scale. |

---

## Detailed Word-for-Word Narration Script

### [0:00–0:20] Problem & Introduction
> *"Hello! In high-stakes competitive examinations like JEE Advanced and NEET-UG, single marks decide college admissions and life trajectories. When an answer key in a question bank is wrong, the students who suffer most are the ones who studied hardest. Today, I'm presenting **Acadza Report → Fix** — an AI-powered quality assurance system that independently verifies student error reports from first principles using SymPy, suggests surgical fixes, and puts faculty in complete control."*

### [0:20–0:45] Dashboard & Dataset Overview
> *"Starting on our Operations Dashboard, we have ingested 44 real student reports spanning 43 production questions with complex MathML. The AI triage engine has already analyzed every report against our closed taxonomy: finding 27 genuine defects, 17 safe automated repairs, and 10 cases strictly gated for faculty review. Relational integrity is 100%, and the original data files remain completely immutable."*

### [0:45–1:15] Review Queue & Multi-Student Reports
> *"Navigating into the **Review Queue**, issues are prioritized by four urgency tiers: from L1 Critical answer-key defects down to L4 Low. Notice our multi-student consensus engine: Question `60f744b3f1b9bc7cc7b4a949` received three independent reports from Android and iOS students. Rather than reviewing three separate tickets, our engine groups them into a single high-priority item."*

### [1:15–1:50] Question Inspection & SymPy Derivation
> *"Let's inspect this question. In our two-column review workspace, the left side displays the question stem with native MathML rendering and options A through D. The stored platform answer is marked as Option C, 130 Volts.*  
> *Now look at the right column: our independent SymPy solver did not trust the student or the answer key. It formulated the AC circuit problem symbolically. The author scalar-added forty, sixty, and thirty to get one-thirty. But SymPy computed the true orthogonal phasor sum: square root of forty squared plus thirty squared equals fifty Volts — **Option A**! The stored answer key is definitively wrong."*

### [1:50–2:20] Surgical Diff & Human Approval
> *"Below the proof, our Diff Viewer displays the exact surgical replacement: targeting the answer field from C to A without altering the stem or corrupting MathML. We also generate an empathetic, pedagogically sound reply to the student.*  
> *When I click 'Approve Correction', an authorization modal verifies the taxonomy scope. Once approved, the patch is committed, and attempting to re-approve immediately triggers duplicate protection."*

### [2:20–2:40] Audit History & Safety Restrictions
> *"In our **Audit History**, every faculty decision is immutably logged with timestamp, reviewer ID, and diff parameters in SQLite WAL mode. In **Settings**, our closed taxonomy ensures that high-risk repairs — such as missing diagrams or authoring new options — can never be auto-applied by AI, protecting academic integrity."*

### [2:40–3:00] Benchmark Results & Conclusion
> *"Our benchmark evaluates all 44 reports in `results.json` with zero taxonomy violations, accompanied by 55 passing automated pytest tests. Acadza Report → Fix proves that by combining symbolic computation with thoughtful human-in-the-loop governance, we can eliminate question defects and restore student trust across 800,000 questions. Thank you!"*
