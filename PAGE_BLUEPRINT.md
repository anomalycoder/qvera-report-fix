# ACADZA — VISUAL ARCHITECTURE & PAGE BLUEPRINT (PAGE_BLUEPRINT.md)
## Section-by-Section Structural Wireframes, Layout Hierarchy & Chapter Blueprint
**Version:** 1.0.0-preproduction  
**Author:** Creative Director & Technical Art Architecture  
**Creative Direction:** Scientific Cinematic — "The Anatomy of a Question"

---

## 1. Global Page Layout Rhythm

To prevent monotony, the landing page is architected into **seven distinct visual chapters**, each utilizing an entirely unique layout geometry, background atmosphere, and information density:

```
[Chapter 1: Deep Midnight #080D19] Asymmetric 42% / 58% Cinematic Hero (The Anatomy of a Question)
         │
[Chapter 2: Structured Navy #101C32] Wide Monolithic Product Showcase (5 Interactive Tabs)
         │
[Chapter 3: Warm Paper #F2F1EB] Tactile Light Editorial Monograph (Where Accuracy Breaks Down)
         │
[Chapter 4: Deep Midnight #080D19] Vertical Tracing Beam Workflow (Follow the Evidence)
         │
[Chapter 5: Technical Navy #101C32] Split Scientific Laboratory & SymPy CAS Proofs (Proof, Not Assumption)
         │
[Chapter 6: Deep Midnight #080D19] Asymmetric Bento Grid Telemetry (Patterns Become Visible)
         │
[Chapter 7: Focused Midnight #080D19] Minimalist Cinematic Closing & Institutional Footer
```

---

## 2. Chapter Specifications

### Chapter 1: The Anatomy of a Question (Asymmetric Cinematic Hero)
- **Background:** Deep Midnight (`#080D19`) with laser coordinate grid (`radial-gradient`) and electric blue radial glow (`#527CFF` at 12% opacity).
- **Layout:** Strictly asymmetric 2-column layout (Left 42% / Right 58% on desktop; stacked on mobile).
- **ASCII Wireframe (Desktop 1440 × 900):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ NAVBAR: [ACADZA Report → Fix]        Live Engine   Showcase   Workflow   Docs  [Login] │
├──────────────────────────────────────────────────────┬─────────────────────────────────┤
│ LEFT COLUMN (42% Width)                              │ RIGHT COLUMN (58% Width)        │
│                                                      │                                 │
│ [● Status Pill: JEE & NEET QA Engine]                │ ┌─────────────────────────────┐ │
│                                                      │ │ WINDOW CHROME: acadza://q49 │ │
│ ACADEMIC QUALITY,                                    │ │ [Physics] [Math] [Chemistry]│ │
│ UNDER CONTROL.                                       │ ├─────────────────────────────┤ │
│                                                      │ │ [STEM]: In an AC series...  │ │
│ Turn reported academic errors into verified          │ │ (A) 40V  (B) 100V           │ │
│ corrections. Investigate questions, validate         │ │ (C) 50V [✓]  (D) 130V [✗]   │ │
│ mathematical accuracy with SymPy and resolve defects.│ ├─────────────────────────────┤ │
│                                                      │ │ [PHASOR SVG DIAGRAM]:       │ │
│ [ Explore Platform -> ]   [ Faculty Portal ]         │ │   V_net = √(40² + 30²) = 50V│ │
│                                                      │ ├─────────────────────────────┤ │
│ ───────────────────────────────────────────────────  │ │ [SYMPY CAS PROOF STEPS]:    │ │
│ 800,000+      100%         42ms         0            │ │ > V = sqrt(VR² + (VL-VC)²)  │ │
│ Bank Scale    SymPy Rigor  Latency      Breaches     │ │ [✓ Patch Committed WAL #L41]│ │
│                                                      │ └─────────────────────────────┘ │
└──────────────────────────────────────────────────────┴─────────────────────────────────┘
```

---

### Chapter 2: Inside the Investigation (Wide Monolithic Showcase)
- **Background:** Navy (`#101C32`) surface with subtle elevated frame.
- **Layout:** Full-width centered container (`max-w-6xl`) with spring sliding tab bar (`layoutId="showcase-pill"`).
- **ASCII Wireframe:**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              INSIDE THE INVESTIGATION                                  │
│             Experience how Acadza bridges student bug reports with symbolic proof      │
│                                                                                        │
│   [ (1) Investigation Workspace ] [ (2) Review Queue ] [ (3) SymPy CAS ] [ (4) Diff ]  │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ TAB 1 VIEW: 3-Panel Academic Workbench                                             │ │
│ │ ┌───────────────────┬─────────────────────────────────┬──────────────────────────┐ │ │
│ │ │ Panel 1: Context  │ Panel 2: Rendered MathML Stem   │ Panel 3: SymPy & Actions │ │ │
│ │ │ R001 · 3 Reports  │ V_net = √(V_R² + (V_L - V_C)²)  │ Confidence: 1.00         │ │ │
│ │ │ Consensus: L1     │ Choices: A, B, C, D rendered    │ [Approve] [Reject] [Def] │ │ │
│ │ └───────────────────┴─────────────────────────────────┴──────────────────────────┘ │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Chapter 3: Where Accuracy Breaks Down (Light Editorial Contrast)
- **Background:** Tactile Warm Paper (`#F2F1EB`), text in Deep Ink (`#151D2C`).
- **Layout:** 3-column monograph paper layout. Replicates an academic peer-reviewed paper documenting actual question bank failure modes.
- **ASCII Wireframe:**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [EDITORIAL PAPER METAPHOR: WARM PAPER #F2F1EB / DEEP INK #151D2C]                      │
│                                                                                        │
│ ACADEMIC ANOMALY REPORT                                 VOL. IV · 2026                 │
│ Dissecting Three Real Examination Flaws in High-Stakes Testing                         │
│                                                                                        │
│ ┌──────────────────────────┬──────────────────────────┬──────────────────────────────┐ │
│ │ CASE STUDY 01: PHYSICS   │ CASE STUDY 02: CHEMISTRY │ CASE STUDY 03: MATHEMATICS   │ │
│ │ Scalar Voltage Fallacy   │ Valency Factor Omission  │ Odd Function Parity Error    │ │
│ │                          │                          │                              │ │
│ │ Question: AC Series LCR  │ Question: CuSO₄ Electro  │ Question: Definite Integral  │ │
│ │ Stored Key: 130 V (D)    │ Stored Key: 6.35 g (B)   │ Stored Key: 1 (B)            │ │
│ │ Physical Truth: 50 V (C) │ Physical Truth: 3.175g(A)│ Physical Truth: 0 (A)        │ │
│ │                          │                          │                              │ │
│ │ "Content author added    │ "Ignored Cu²⁺ 2-electron │ "Failed to recognize odd     │ │
│ │ scalar values, ignoring  │ transfer requirement;    │ function symmetry on         │ │
│ │ orthogonal phase angle." │ calculated mass was 2x." │ symmetric interval."         │ │
│ └──────────────────────────┴──────────────────────────┴──────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Chapter 4: Follow the Evidence (Animated Tracing Workflow)
- **Background:** Deep Midnight (`#080D19`).
- **Layout:** Vertical timeline with an interactive laser tracing beam down the center, flanked by alternating cards (Left $\to$ Right).
- **ASCII Wireframe:**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              FOLLOW THE EVIDENCE                                       │
│                       A Deterministic Three-Stage Pipeline                             │
│                                                                                        │
│  [STEP 01: REPORT]  ────○────  (Ingestion stream: Android, iOS, Web cluster to L1)     │
│                         │                                                              │
│                         │  <-- [Animated Tracing Beam traces scroll progress]          │
│                         │                                                              │
│  (SymPy CAS Proof)  ────○────  [STEP 02: INVESTIGATE] (First-principles proof AST)     │
│                         │                                                              │
│  [STEP 03: RESOLVE] ────○────  (Faculty signoff committed to SQLite Write-Ahead Log)   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Chapter 5: Proof, Not Assumption (Mathematical Verification)
- **Background:** Technical Navy (`#101C32`) with ambient cyan coordinates.
- **Layout:** Split layout: Left column features Gauss's Law Electric Flux Proof with isometric cube diagram; Right column features Significant Figures Precision Checker.
- **ASCII Wireframe:**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             PROOF, NOT ASSUMPTION                                      │
│               Independent Symbolic Derivation via SymPy Computer Algebra               │
│                                                                                        │
│ ┌───────────────────────────────────────┬────────────────────────────────────────────┐ │
│ │ GAUSS'S LAW ELECTRIC FLUX (SecBQ22)   │ SIGNIFICANT FIGURES CHECKER (SecAQ15)      │ │
│ │ ┌───────────────────┐                 │ Total surface area of cube: a = 1.2 × 10⁻²m│ │
│ │ │  ISOMETRIC CUBE   │  q/2 face flux  │                                            │ │
│ │ │  WIRE FRAME SVG   │  2q corner flux │ Raw: A = 6 × (1.2×10⁻²)² = 8.64 × 10⁻⁴ m²  │ │
│ │ └───────────────────┘                 │                                            │ │
│ │ Sum: Φ = q/(2ε₀) => Derived n = 1     │ Sig Figs: Operand 1.2 has 2 sig figs.      │ │
│ │ Stored Answer: 2 is DEFECT.           │ Correct: 8.6 × 10⁻⁴ m² (Option C)          │ │
│ └───────────────────────────────────────┴────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Chapter 6: Patterns Become Visible (Real Analytics Bento Grid)
- **Background:** Deep Midnight (`#080D19`).
- **Layout:** Asymmetric 4-card Bento grid (Span 7, Span 5, Span 5, Span 7).
- **Content:**
  - Card 1 (Span 7): Subject defect distribution (Physics 46.5%, Botany 30.2%, Zoology 23.3%).
  - Card 2 (Span 5): Multi-client platform breakdown (Android 59.1%, Web 20.5%, iOS 20.5%).
  - Card 3 (Span 5): Silent pre-report radar scanner with rotating beam.
  - Card 4 (Span 7): Mutation boundaries matrix (stem locked, options locked, diagrams locked, answer mutable).

---

### Chapter 7: Every Answer Deserves Confidence (Cinematic Closing & Footer)
- **Background:** Midnight (`#080D19`) with gentle radial vignette.
- **Layout:** High-impact editorial closing: "Make every question count." Primary action button with electric glow and direct faculty portal access. Comprehensive institutional footer with live database status.
