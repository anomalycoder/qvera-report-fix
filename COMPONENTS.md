# ACADZA — COMPONENT ARCHITECTURE SPECIFICATION (COMPONENTS.md)
## Modular Component Hierarchy, State Management & Technical Contracts
**Version:** 1.0.0-preproduction  
**Author:** Senior Frontend Architect & Technical Art Director  
**Framework Stack:** React 19 + TypeScript + Vite + Tailwind CSS + Motion + KaTeX + Radix UI

---

## 1. Component Tree Architecture

```
LandingPage (Scientific Cinematic Container)
│
├── CinematicNavbar (Sticky navigation with frosted blur, brand logo, section anchors, auth CTA)
│
├── Chapter 1: AnatomyHeroSection (Asymmetric Hero: Left 42% Typography, Right 58% Visualization)
│   ├── HeroTypography (Display heading, status pulse, lead copy, action buttons, institutional stats)
│   └── AnatomyHeroVisual (Layered question anatomy workbench)
│       ├── CaseStudySelector (Physics AC Circuit, Math Integral, Chemistry Faraday)
│       ├── QuestionStemLayer (MathML / KaTeX stem, interactive option testing)
│       ├── PhasorDiagramSvg (Interactive AC voltage vector projection)
│       ├── SymPyDerivationLayer (Step-by-step AST proof generator)
│       ├── SurgicalDiffLayer (Token find/replace diff viewer within locked scope)
│       └── FacultyGovernanceSeal (Authorized SQLite WAL commit with reviewer signature)
│
├── Chapter 2: InsideInvestigationSection (Product Showcase)
│   ├── ShowcaseTabHeader (Spring sliding pill indicator)
│   ├── WorkspacePreviewModule (3-Panel layout mockup)
│   ├── QueueTableModule (Linear-style table with real-time L1-L3 urgency filtering)
│   ├── SymPyTerminalModule (Exact rational calculation engine)
│   ├── DiffTokenModule (Surgical field mutation comparison)
│   └── AuditLedgerModule (Immutable SQLite WAL viewer)
│
├── Chapter 3: WhereAccuracyBreaksDown (Editorial Warm Paper Chapter)
│   ├── EditorialHeader (Monograph typography, academic flaw analysis)
│   └── FlawCaseStudiesGrid (3 physical examination errors: AC voltage sum, valency omission, parity error)
│
├── Chapter 4: FollowTheEvidenceSection (Animated 3-Stage Workflow)
│   ├── TracingBeamTimeline (Scroll-linked laser coordinate beam)
│   └── SynchronizedStageViewer (Report ingestion → SymPy derivation → WAL patch)
│
├── Chapter 5: ProofNotAssumptionSection (Mathematical Verification)
│   ├── GaussCubeFluxModule (Solid-angle flux projection through cube)
│   └── SigFigPrecisionModule (Significant figures rounding proof)
│
├── Chapter 6: PatternsBecomeVisibleSection (Real Analytics Bento)
│   ├── DefectDistributionBento (Physics vs Botany vs Zoology)
│   ├── RadarScannerCard (Silent pre-report defect scanner across 800k items)
│   ├── PlatformTelemetryCard (Android 59.1%, iOS 20.5%, Web 20.5%)
│   └── ConsensusClusterCard (Multi-report clustering threshold)
│
├── Chapter 7: ClosingCtaSection ("Make every question count" & institutional readiness)
│
├── InstitutionalFooter (Brand mark, direct portal links, SQLite WAL database status)
│
└── ArchitectureDialog (Radix UI modal with full API and taxonomy reference)
```

---

## 2. Component Technical Contracts

### 2.1 `AnatomyHeroVisual`
- **Location:** `src/components/hero/AnatomyHeroVisual.tsx`
- **Role:** Centerpiece interactive visualization representing "The Anatomy of a Question".
- **Props Interface:**
  ```typescript
  interface AnatomyHeroVisualProps {
    currentCaseIndex: number
    onSelectCase: (index: number) => void
    isSolving: boolean
    solverStepIndex: number
    onRunSolver: () => void
    isCommitted: boolean
    onCommitPatch: () => void
  }
  ```
- **Internal State:**
  - `userSelectedOption`: `string | null` (stores which choice A/B/C/D is active).
  - `isHovered`: `boolean` (controls subtle 3D Z-axis layer separation).
- **Sub-components:**
  - `PhasorDiagramSvg`: Renders vector addition $V_R \hat{i} + (V_L - V_C)\hat{j}$ dynamically.
  - `MathContent`: Typesets mathematical formulas with KaTeX.

### 2.2 `PhasorDiagramSvg`
- **Location:** `src/components/math/PhasorDiagramSvg.tsx`
- **Role:** Renders a clean, scientific vector diagram of the AC series LCR circuit.
- **Props Interface:**
  ```typescript
  interface PhasorDiagramSvgProps {
    vr: number // e.g. 40 V
    vl: number // e.g. 60 V
    vc: number // e.g. 30 V
    vNet: number // e.g. 50 V
    showResultant?: boolean
    className?: string
  }
  ```
- **SVG Elements:**
  - Real axis line with arrow head at $(320, 200)$.
  - Imaginary axis line with arrow head at $(60, 40)$.
  - Horizontal vector line for $V_R$ in Ice Blue (`#8EB5FF`).
  - Vertical vector line for $V_L - V_C$ in Cyan (`#58D6E8`).
  - Hypotenuse vector line for $V_{\text{net}}$ in Electric Blue (`#527CFF`) with pulsing endpoint.
  - KaTeX label tags for magnitude and angle $\phi$.

### 2.3 `ShowcaseTabHeader`
- **Location:** `src/components/showcase/ShowcaseTabHeader.tsx`
- **Role:** Segmented sliding pill control using Motion spring physics.
- **Props Interface:**
  ```typescript
  interface ShowcaseTabHeaderProps {
    tabs: { id: string; label: string; icon?: React.ReactNode }[]
    activeTabId: string
    onTabChange: (id: string) => void
  }
  ```
- **Animation Contract:** Uses `motion.div` with `layoutId="showcase-pill-indicator"` and `--spring-snappy`.

### 2.4 `QueueTableModule`
- **Location:** `src/components/showcase/QueueTableModule.tsx`
- **Role:** Displays live review queue items with instant client-side urgency filtering.
- **Props Interface:**
  ```typescript
  interface QueueTableModuleProps {
    filter: "all" | "L1" | "L2" | "L3"
    onFilterChange: (filter: "all" | "L1" | "L2" | "L3") => void
  }
  ```
- **Data Source:** Grounded directly in `data/reports.json` (R001, R007, R009, R018).

### 2.5 `EditorialPaperCard`
- **Location:** `src/components/editorial/EditorialPaperCard.tsx`
- **Role:** Light-mode academic monograph card providing visual breathing room in Chapter 3.
- **Props Interface:**
  ```typescript
  interface EditorialPaperCardProps {
    referenceTag: string // e.g. "PHYSICS · JEE ADVANCED 2019"
    flawTitle: string
    academicAnalysis: string
    formulaSnippet: string
    institutionalRisk: string
  }
  ```

---

## 3. External Dependencies & Bundle Governance

| Package | Version | Bundle Impact (Gzip) | Justification |
| :--- | :--- | :--- | :--- |
| `react` & `react-dom` | `19.x` | `~45 KB` | Core framework runtime |
| `motion` (`motion/react`) | `12.x` | `~32 KB` | Hardware-accelerated springs, layout transitions, AnimatePresence |
| `katex` | `0.16.x` | `~85 KB` (CSS+JS) | Deterministic TeX formula rendering without network calls |
| `lucide-react` | `1.x` | Tree-shaken (~15 KB) | Consistent, clean iconography |
| `@radix-ui/react-dialog`| `1.x` | `~8 KB` | Accessible, focus-trapped documentation modal |
| `recharts` | `2.x` | `~90 KB` (Lazy loaded)| Academic defect analytics charts |

Total initial JS payload remains well under **380 KB gzipped**, guaranteeing Sub-Second First Contentful Paint (<800ms) on 4G networks.
