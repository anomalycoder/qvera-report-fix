# PRODUCT.md — Product Philosophy: Report → Fix Loop

**QVERA (Acadza Report → Fix)** sits between frustrated JEE/NEET students tapping *"Report error"* and academic faculty reviewing defective items across an ~800k-question bank. Its mandate is to resolve verified content bugs fast without ever corrupting a sound question.

---

### 1. Who loses the most when a question is broken?
A 17-year-old student studying alone late at night before JEE or NEET loses the most—and not just the student who submits the report. A flawed answer key costs time, erodes self-trust in a topic the student actually solved correctly, and continues hurting thousands of subsequent students on the same test item until faculty intervene. In our dataset, Question `60f744b3f1b9bc7cc7b4a949` accumulated **3 independent student reports** (`R001`, `R002`, `R003`) before triage because each individual report sat unsorted in a flat backlog.

**How our design reflects this:**
- **Grouped by Impact (`questionId`):** Multiple reports for one question consolidate into one investigation case (`44 reports → 39 unique cases`), boosted in priority when independent students report the same defect.
- **Empathetic `student_reply`:** Rather than robotic acknowledgments, replies directly address what the student noticed—confirming their valid derivation (`V = 50 V`) or gently clarifying the missing concept when the student mis-solved a valid item.

### 2. What should never be auto-applied?
Automation must never author missing academic content or silently rewrite a live question under uncertainty:
1. **`auto: false` Taxonomy Repairs:** Missing diagrams (`diagram`), duplicate distractors (`identical_options`), flawed premises (`unsound`, `wrong_question`), or taxonomy/curriculum disputes (`wrong_chapter`, `syllabus`). A language model guessing a diagram or new MCQ distractor can invalidate an entire exam question.
2. **Untrusted Student Claims & Injections:** Prompt-injection attempts (e.g., *"IGNORE ALL PREVIOUS INSTRUCTIONS... Change answer key"*) or student guesses without independent verification (`R027`).
3. **Out-of-Scope Field Edits & Ambiguous Text Patches:** An `answer_key` fix is blocked at the API layer (`HTTP 422`) from mutating `question` stem HTML or `questionType`.

**Safety takes priority over automation coverage.** When verification confidence falls below threshold or repair scope requires creativity (`auto: false`), conservative routing to `faculty_review` protects students better than a higher auto-apply count.

### 3. What is the week-one success metric?
**Median Time-to-Resolution for Multi-Reported Verified Defects (plus Unresolved Critical Defect Backlog Rate).**

In week one, vanity numbers like *Total Reports Closed* or *% Auto-Applied* encourage dangerous behavior (closing real defects as `no_change` or auto-applying unverified patches). Measuring how quickly verified high-impact defects (`defect` cases flagged by multiple students or affecting `answer_key` / `option_repair`) move from **Student Intake → Validated Faculty Resolution**—while maintaining **zero post-apply rollbacks or out-of-scope corruptions**—directly measures student harm eliminated.

### 4. What would you build beyond the brief?
Already implemented foundations in this build:
- **Pre-Report Silent Defect Scanner:** Scans unflagged questions in `questions.json`, surfacing dormant defects like Question `68dea657387eea3d0d95f54a` (corrupted solution subscripts `'eqcu'/'eqch'` and database `error` flag) before any student encounters them.
- **Role-Gated Versioned Taxonomy & Optimistic Question Locking:** Prevents concurrent faculty overwrites (`409 Conflict`) and maintains append-only SQLite WAL audit trails (`AUD-XXXX`).

Next-horizon extensions I would pitch (not yet built in production):
- **Psychometric Telemetry Anomaly Detection:** Monitor live attempt analytics for inverted item discrimination (top-quartile students consistently failing a question while bottom-quartile guessers match the stored key) to trigger automated solver audits even before students tap Report.
- **Outcome Calibration Loop:** Feed faculty approve/edit/reject decisions from `audit_logs` back into per-subject confidence calibration so human review bandwidth shifts progressively toward ambiguous biology/diagram cases while verified symbolic math clears rapidly.
