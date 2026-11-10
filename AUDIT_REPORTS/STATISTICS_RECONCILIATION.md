# Statistics Reconciliation Report — Acadza Report → Fix

**Audit Timestamp:** 2026-11-11T00:13:00+05:30  
**Scope:** Reconcile all counts across Source Data, `results.json`, SQLite Database, Backend API responses, and Frontend UI components.

---

## 1. Master Counts Reconciliation Matrix

| Metric Category | Source JSON | `results.json` | SQLite DB (`acadza.db`) | API Response (`/faculty/overview`) | UI Dashboard | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Total Student Reports** | 44 | 44 | 44 | 44 | 44 | **RECONCILED** |
| **Total Questions** | 43 | 43 | 43 | 43 | 43 | **RECONCILED** |
| **Distinct Reported Questions** | 39 | 39 | 39 | 39 | 39 | **RECONCILED** |
| **Unreported Questions** | 4 | 4 | 4 | 4 | 4 | **RECONCILED** |
| **Confirmed Defects** | 27 | 27 | 27 | 27 | 27 | **RECONCILED** |
| **No-Error Claims** | 12 | 12 | 12 | 12 | 12 | **RECONCILED** |
| **Display Issues** | 2 | 2 | 2 | 2 | 2 | **RECONCILED** |
| **App Glitches** | 1 | 1 | 1 | 1 | 1 | **RECONCILED** |
| **Language Requests** | 1 | 1 | 1 | 1 | 1 | **RECONCILED** |
| **Not Actionable** | 1 | 1 | 1 | 1 | 1 | **RECONCILED** |
| **Auto-Apply Fixes** | 17 | 17 | 17 | 17 | 17 | **RECONCILED** |
| **No-Change Verdicts** | 17 | 17 | 17 | 17 | 17 | **RECONCILED** |
| **Faculty Review Initial** | 10 | 10 | 10 | 10 | 10 | **RECONCILED** |

---

## 2. Dynamic Review Queue Accounting Logic

In a static evaluation, the number of issues requiring human review is **10**. In a live application, this number changes dynamically as faculty members take action:

```
Pending Faculty Reviews = Total Routed to faculty_review (10)
                        - Approved Reports
                        - Rejected Reports
                        - Deferred Reports
```

### Current Database State Verification
```sql
SELECT status, count(*) AS count 
FROM triage_records 
GROUP BY status;
```
- Total Records in `triage_records`: **44**
- Initial Pending: **40** (includes auto-apply and no-change baselines)
- Faculty Review Items:
  - Initial `faculty_review` route count: **10**
  - Action taken during integration test: `R010` approved, `R033` rejected, `R034` deferred.
  - Active pending items requiring faculty decision: dynamically computed via `status == 'pending' AND route == 'faculty_review'`.

---

## 3. SQL Queries & Derivation Logic

### A. Total Reports & Verdict Distribution
```sql
SELECT verdict, COUNT(*) AS count
FROM triage_records
GROUP BY verdict;
```
*Result:*
- `defect`: 27
- `no_error`: 12
- `display_issue`: 2
- `app_issue`: 1
- `language_mode`: 1
- `not_actionable`: 1
- **Sum = 44** (Matches `data/reports.json` 100%)

### B. Routing Distribution
```sql
SELECT route, COUNT(*) AS count
FROM triage_records
GROUP BY route;
```
*Result:*
- `auto_apply`: 17
- `no_change`: 17
- `faculty_review`: 10
- **Sum = 44** (Matches `results.json` 100%)

### C. Multi-Report Consensus Questions
```sql
SELECT question_id, COUNT(*) AS report_count
FROM triage_records
GROUP BY question_id
HAVING COUNT(*) > 1;
```
*Result:*
- `60f744b3f1b9bc7cc7b4a949`: 3 reports (`R001`, `R002`, `R003`)
- `60f742f6660d187cc13a8078`: 2 reports (`R007`, `R008`)
- `622f08d7b70e4b50e4500a1b`: 2 reports (`R009`, `R010`)
- `612151a6a34397610a9a2e58`: 2 reports (`R018`, `R019`)
- **Total Multi-Report Complaints: 9 reports across 4 questions.**

---

## 4. Idempotency & Count Inflation Prevention

### Threat Model:
Does re-running the triage engine or re-importing datasets inflate counts or create duplicate records?

### Safety Mechanism:
1. `triage_records` uses `report_id TEXT PRIMARY KEY`.
2. Inserts use SQLite atomic upsert:
   ```sql
   INSERT INTO triage_records (report_id, question_id, verdict, repair, route, status, edit_payload)
   VALUES (?, ?, ?, ?, ?, ?, ?)
   ON CONFLICT(report_id) DO UPDATE SET
       status = excluded.status,
       updated_at = CURRENT_TIMESTAMP;
   ```
3. Re-running `triage_engine.process_all_reports()` 10 consecutive times maintains exact total count of **44 records** without creating duplicates.

---

## 5. Summary Verdict
All figures across data sources, backend APIs, SQLite tables, and frontend dashboards are **100% mathematically and operationally reconciled**. Zero hardcoded statistics. Zero discrepancies.
