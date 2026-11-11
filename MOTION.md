# ACADZA — MOTION & INTERACTION SPECIFICATION (MOTION.md)
## Micro-Interactions, Spring Physics & Choreography Framework
**Version:** 1.0.0-preproduction  
**Author:** Senior Design Engineering & Motion Architecture  
**Core Reference:** Emil Kowalski Motion Principles (`emil-design-eng`, `animate`, `choreograph`)

---

## 1. Operating Motion Axioms

In accordance with Emil Kowalski's design engineering philosophy:
1. **Never animate keyboard-initiated actions.**
2. **Never animate from `scale(0)`.** Real physical objects do not materialize from a singular point. Entrances start from `scale(0.95)` to `scale(0.98)` combined with opacity.
3. **Never use `ease-in` for UI animations.** It starts slow and makes the application feel sluggish and unresponsive. Entrances use strong `ease-out` so the interface responds instantaneously.
4. **Transform and Opacity only.** Skip layout and paint pipelines. All animations execute on the GPU compositor thread.
5. **Always provide instant press feedback.** Buttons and pressable elements scale down to `scale(0.97)` on `:active` with `160ms` duration.
6. **Respect `prefers-reduced-motion`.** All spring and translation effects degrade gracefully to simple opacity fades or static states for accessibility.

---

## 2. Easing Curves & Timing Tokens

| Token Name | Cubic-Bezier / Spring Config | Duration | Intended Purpose |
| :--- | :--- | :--- | :--- |
| `--ease-out-strong` | `cubic-bezier(0.23, 1, 0.32, 1)` | `220ms` | Default UI entrances, popover reveals, dropdown panels |
| `--ease-in-out-smooth` | `cubic-bezier(0.77, 0, 0.175, 1)` | `350ms` | On-screen element position morphs, before/after view swaps |
| `--spring-snappy` | `{ type: "spring", stiffness: 450, damping: 35 }` | Physics-based | Tab sliding pills (`layoutId`), interactive switches |
| `--spring-gentle` | `{ type: "spring", stiffness: 280, damping: 26 }` | Physics-based | Floating layer elevations, modal card appearances |
| `--press-feedback` | `cubic-bezier(0.23, 1, 0.32, 1)` | `160ms` | `:active` button scales, option selector clicks |
| `--laser-sweep` | `linear` | `8000ms` (infinite)| Radar beam rotations, background coordinate passes |

---

## 3. Section-by-Section Motion Specifications

### Chapter 1: The Anatomy of a Question (Hero)
- **Initial Load Sequence (Page Mount):**
  - Stagger delay: `0.08s` between elements.
  - Step 1 (`t = 0.00s`): Status pill reveals from `y: 8px, opacity: 0` to `y: 0, opacity: 1` in `350ms`.
  - Step 2 (`t = 0.08s`): Space Grotesk headline enters with `y: 12px, opacity: 0` in `400ms`.
  - Step 3 (`t = 0.16s`): Supporting lead paragraph enters in `400ms`.
  - Step 4 (`t = 0.24s`): Action button cluster enters with interactive focus rings ready.
  - Step 5 (`t = 0.32s`): The 3D Layered Anatomy visual on the right elevates into position with subtle spring `{ type: "spring", stiffness: 220, damping: 24 }`.
- **Anatomy Layer Hover & Separation:**
  - On mouse hover over the layered question visual, layers gently separate along the Z-axis:
    - Layer 1 (Question Stem): `translateY(0px)`
    - Layer 2 (Student Report): `translateY(-8px)`
    - Layer 3 (SymPy CAS): `translateY(-16px)`
    - Layer 4 (Surgical Diff): `translateY(-24px)`
    - Layer 5 (Faculty Seal): `translateY(-32px)`
  - Transition: `transform 280ms cubic-bezier(0.23, 1, 0.32, 1)`.
- **Interactive Option Selection:**
  - Clicking option (A, B, C, D) triggers instant `scale(0.98)` feedback with emerald/rose border tint in `120ms`.
- **"Re-Run Proof" Execution Sequence:**
  - Button text changes from "Re-Run Proof" to "Evaluating AST...".
  - Steps 1 through 4 fade in sequentially at `320ms` intervals with a subtle cyan laser flash.
  - Confidence meter ticks from `0.00` to `1.00`.
- **"Authorize Surgical Patch" Action:**
  - Button press compresses to `scale(0.96)` for `140ms`.
  - Morphing checkmark expands with spring bounce (`bounce: 0.18`), revealing reviewer identity and WAL transaction checksum.

### Chapter 2: Inside the Investigation (Product Showcase)
- **Tab Switching:**
  - Sliding pill indicator uses Motion `layoutId="showcase-pill-indicator"` with `--spring-snappy`.
  - Content panels crossfade with `AnimatePresence mode="wait"`, entering from `y: 6px, opacity: 0` to `y: 0, opacity: 1` in `200ms`.
- **Review Queue Filter Pills:**
  - Instant DOM table update (<16ms, 1 frame) to preserve perceptual speed. No lagging transitions on repeated list filtering.

### Chapter 3: Where Accuracy Breaks Down (Light Editorial Contrast)
- **Viewport Entrance:**
  - As the user scrolls into the Warm Paper section, the background transitions smoothly from deep Midnight (`#080D19`) to Warm Paper (`#F2F1EB`) using CSS `transition: background-color 400ms ease`.
  - Editorial cards lift by `2px` on hover with a crisp graphite shadow (`rgba(21, 29, 44, 0.08)`).

### Chapter 4: Follow the Evidence (Tracing Workflow)
- **Scroll-Linked Tracing Beam:**
  - Vertical SVG line fills proportionally to scroll position using `useScroll` and `useTransform`.
  - Step milestones pulse with cyan illumination as the beam crosses their threshold.

### Chapter 5: Proof, Not Assumption (SymPy Derivation)
- **Terminal AST Syntax Highlighting:**
  - Monospace lines render with slight character reveal or instantaneous block stagger (`50ms` per line).
  - Mathematical KaTeX equations highlight variable substations upon click.

### Chapter 6: Patterns Become Visible (Analytics)
- **Chart Bar Growths:**
  - Recharts bars grow smoothly from bottom to top on viewport entry (`duration: 600ms, ease: ease-out`).
  - Radar sweep rotates continuously at `8s` per revolution (`animate-radar`).

### Chapter 7: Every Answer Deserves Confidence (Closing CTA)
- **Restrained Focus:**
  - Minimalist ambient glow with subtle breathe cycle (`4s` period, opacity `0.06` to `0.10`).

---

## 4. Accessibility & Reduced Motion Contract

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .animate-radar, .animate-pulse-subtle {
    animation: none !important;
  }
}
```
All interactive buttons retain immediate state changes (color and border highlights) without requiring physical spatial displacement when reduced motion is preferred.
