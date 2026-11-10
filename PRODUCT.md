# Product Philosophy: The "Report → Fix" Loop for High-Stakes Education

By Senior Full-Stack & AI Systems Architect

---

### 1. Who Loses the Most When a Question is Broken?

In consumer software, a broken button costs fifteen seconds of mild frustration. In JEE Advanced or NEET-UG preparation, a broken question costs a life trajectory.

The student who loses the most is not the struggling student who guesses, nor the topper who has seen every variant. **It is the borderline 98th-percentile aspirant.** 

Consider a 17-year-old student studying fourteen hours a day in a hostel room in Kota. They solve an AC LCR circuit question, apply phasor orthogonal summation, and arrive at $50\text{ V}$. They check the platform answer key: it says $130\text{ V}$ because an author scalar-added reactive voltages like DC batteries. 

The student does not immediately assume the platform is broken; they assume *they* are broken. They spend the next ninety minutes re-deriving formulas, doubting their conceptual foundation, and spiraling into self-blame. When this occurs three days before an exam where three marks separate admission to an Indian Institute of Technology (IIT) from missing the cutoff entirely, the loss is irreversible: loss of rank, loss of college seat, and loss of psychological trust in the learning system.

When an answer key is wrong, **the best, most conscientious students suffer the most**, because they are the ones who actually do the work.

---

### 2. What We Would NEVER Let AI Auto-Apply

Automating the trivial creates velocity; automating the ambiguous creates catastrophe. Under no circumstance should the AI system auto-apply patches for the following four categories:

1. **Authoring New Distractors (Missing Options):** When an SCQ question is missing Option D (e.g. Question `622f08d7b70e4b50e4500a1b`), generative AI must never invent a distractor and inject it live. An unreviewed LLM distractor can accidentally introduce a second mathematically correct answer, invalidating the test item entirely. Only faculty may author options.
2. **Reconstructing Missing Diagrams:** When a question references an illustration (*"as shown in the figure"*) but the image array is empty (e.g. Question `622df25ab70e4b50e44ff837`), AI must never hallucinate a diagram. Re-attaching technical schematic drawings requires human pedagogical sourcing.
3. **Syllabus & Curriculum Removals:** When a student reports *"this topic was removed from the 2024 NEET syllabus"*, AI must never unpublish or retire the question automatically. Students frequently misinterpret rationalized NCERT syllabi; retirement requires formal faculty review against the NTA Information Bulletin.
4. **Fundamentally Flawed or Unsound Questions:** When a question contains contradictory physical premises (e.g. non-zero divergence in source-free magnetic fields), AI must not "fix" it by patching numbers. Such items must be flagged for faculty retirement, not cosmetic alteration.

---

### 3. The One Metric to Watch in Week 1

**Faculty Override Rate on Auto-Applied Patches ($\text{FOR}_{\text{auto}}$)**

$$\text{FOR}_{\text{auto}} = \frac{\text{Auto-Applied Patches Reverted or Modified by Faculty within 7 Days}}{\text{Total Auto-Applied Patches}}$$

* **Why this metric matters above all else:** It is the ultimate measure of **automation precision**. If our system auto-applies 500 answer-key fixes across 800,000 questions, and faculty disagree with even 15 of them ($\text{FOR} = 3\%$), we have injected 15 new errors into production.
* **Operational Threshold:** In Week 1, the target is $\mathbf{< 1.0\%}$. If $\text{FOR}_{\text{auto}}$ exceeds $2.0\%$, the auto-apply gate is automatically throttled, and all candidate patches are routed back to the faculty review queue until verification models are re-calibrated.

---

### 4. One Idea Beyond This Brief: Passive Confusion Telemetry (Pre-Report Defect Heatmaps)

Today, the "Report → Fix" loop is purely **reactive**: an error is only investigated after an articulate student takes the effort to submit a complaint. But for every student who files a report, dozens simply suffer in silence or abandon the platform.

**The Proposal: Passive Behavioral Telemetry for Defect Detection**

Instead of waiting for a bug report, we deploy an anomaly-detection service that monitors live behavioral telemetry across all 800,000 questions:
1. **Cohort-Inverted Performance Spikes:** When students who score in the top 10% on overall physics consistently fail Question #4321 while bottom-quartile students guess randomly, the answer key is statistically inverted.
2. **Option Dwell & Toggle Rate:** If 85% of students select Option A, pause for 40 seconds, toggle to Option C, and revert to Option A before submitting, the distractors contain semantic ambiguity.
3. **Time-to-Solve Outliers:** If a standard 90-second SCQ kinematics question exhibits a median solve time of 6.8 minutes across 1,000 attempts, numerical stem data is likely missing.

By transforming passive student telemetry into an automated defect triage signal, Acadza can identify and repair broken questions **before a single student has to tap "Report an Error".**
