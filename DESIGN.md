# ACADZA — DESIGN SYSTEM SPECIFICATION
## Creative Direction: Scientific Cinematic — "The Anatomy of a Question"
**Version:** 1.0.0-preproduction  
**Author:** Creative Direction & Technical Art Architecture  
**Target Environment:** Web (Vite + React 19 + Tailwind CSS + Motion + KaTeX)

---

## 1. Creative Philosophy: The Scientific Cinematic Experience

High-stakes examination systems—specifically India's JEE (Joint Entrance Examination) and NEET (National Eligibility cum Entrance Test)—operate at an extreme standard of mathematical, physical, and chemical precision. Over **800,000+** questions are ingested, printed, and tested across millions of student sessions. When a flaw appears in a question stem, circuit diagram, or answer key, it is not merely a software bug; it is an academic anomaly that unfairly penalizes rigorous students.

**Scientific Cinematic** is an art direction built to reflect this reality:
- **Cinematic Atmosphere:** Deep midnight atmospheres (`#080D19`), laboratory navy tones (`#101C32`), and precision-lensed laser rays (`#527CFF`, `#58D6E8`) that evoke high-end physics instrumentation and optical research facilities.
- **The Anatomy of a Question:** Rather than treating an exam question as static flat text, we dissect it as a physical, multilayered specimen. It contains the **Original Stem & Choices**, the **Student Complaint Waveform**, the **Symbolic Proof Trace (SymPy)**, the **Surgical Mutation Diff**, and the **Cryptographic Faculty Verdict**.
- **Editorial Contrast (Warm Paper):** To prevent dark-mode sensory fatigue and emphasize academic scholarship, Chapter 3 transitions intentionally to a tactile **Warm Paper (`#F2F1EB`)** and **Deep Ink (`#151D2C`)** editorial palette reminiscent of physical examination papers and Cambridge university press monographs.

---

## 2. Core Palette Token Matrix

| Token Name | Hex Code | RGB | HSL | Semantic Role | WCAG Contrast (on `#080D19`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `midnight` | `#080D19` | `8, 13, 25` | `222°, 52%, 6%` | Deep background canvas, infinite viewport base | Canvas baseline |
| `navy` | `#101C32` | `16, 28, 50` | `219°, 52%, 13%` | Structural cards, navigation shell, window chrome | 1.3:1 (structural boundary) |
| `surface-elevated` | `#182C4D` | `24, 44, 77` | `217°, 52%, 20%` | Elevated cards, active pills, modal surfaces | 2.1:1 (tier-2 elevation) |
| `electric` | `#527CFF` | `82, 124, 255` | `225°, 100%, 66%` | Primary action accent, key vectors, verified lines | **6.4:1 (PASS AAA Large, AA Normal)** |
| `ice` | `#8EB5FF` | `142, 181, 255` | `219°, 100%, 78%` | Secondary accent, subtle glows, hairline borders | **9.2:1 (PASS AAA)** |
| `cyan` | `#58D6E8` | `88, 214, 232` | `188°, 78%, 63%` | SymPy CAS derivation highlights, proof signals | **10.5:1 (PASS AAA)** |
| `primary-white` | `#F4F6FC` | `244, 246, 252` | `225°, 50%, 97%` | Display headlines, primary titles, critical values | **17.8:1 (PASS AAA)** |
| `muted-text` | `#AAB6CC` | `170, 182, 204` | `219°, 24%, 73%` | Body descriptions, metadata, formula annotations | **9.8:1 (PASS AAA)** |
| `warm-paper` | `#F2F1EB` | `242, 241, 235` | `51°, 22%, 94%` | Editorial chapter canvas, physical paper metaphor | 16.5:1 (inverse ground) |
| `ink` | `#151D2C` | `21, 29, 44` | `219°, 35%, 13%` | Editorial chapter typography, high-contrast text | **14.2:1 (on `#F2F1EB` PASS AAA)** |
| `defect-rose` | `#F87171` | `248, 113, 113` | `0°, 91%, 71%` | Flawed key indicators, student complaints, bug alerts | **8.1:1 (PASS AAA)** |
| `verified-emerald`| `#34D399` | `52, 211, 153` | `158°, 64%, 52%` | Verified proof indicators, authorized WAL patches | **9.9:1 (PASS AAA)** |

---

## 3. Typography Hierarchy

### 3.1 Typeface Allocation
1. **Display & Headings:** `Space Grotesk` (Google Fonts, geometric sans with distinctive mechanical terminals).
2. **Body & Interface:** `Inter` (neutral, legible, optimized for optical sizing across screens).
3. **Data, Code & Metadata:** `IBM Plex Mono` (monospace engineered specifically for technical clarity and zero character confusion).
4. **Mathematical Expressions:** `KaTeX` / `STIX Two Math` (exact TeX typesetting for integrals, vectors, phasors, and matrices).

### 3.2 Responsive Type Scale Table

| Role | Font Family | Weight | Desktop (≥1024px) | Tablet (768–1023px) | Mobile (<768px) | Tracking | Leading |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | Space Grotesk | 700 Bold | 60px (`3.75rem`) | 48px (`3.0rem`) | 36px (`2.25rem`) | `-0.035em` | `1.08` |
| **Section Title** | Space Grotesk | 700 Bold | 40px (`2.5rem`) | 32px (`2.0rem`) | 26px (`1.625rem`) | `-0.03em` | `1.15` |
| **Card Header** | Space Grotesk | 600 Semi | 20px (`1.25rem`) | 18px (`1.125rem`) | 16px (`1.0rem`) | `-0.02em` | `1.25` |
| **Subhead / Lead**| Inter | 400 Reg | 18px (`1.125rem`) | 16px (`1.0rem`) | 15px (`0.938rem`) | `-0.01em` | `1.55` |
| **Body Standard** | Inter | 400 Reg | 14px (`0.875rem`) | 14px (`0.875rem`) | 13px (`0.813rem`) | `0` | `1.6` |
| **Micro Caption** | Inter | 500 Med | 11px (`0.688rem`) | 11px (`0.688rem`) | 10px (`0.625rem`) | `+0.01em` | `1.4` |
| **Technical Code**| IBM Plex Mono| 500 Med | 12px (`0.75rem`) | 12px (`0.75rem`) | 11px (`0.688rem`) | `-0.01em` | `1.45` |
| **Math Formula** | KaTeX Main | 400 Reg | 16px (`1.0rem`) | 15px (`0.938rem`) | 14px (`0.875rem`) | `0` | `1.5` |

---

## 4. Grid, Spacing & Container Tokens

### 4.1 Responsive Grid Architecture
- **Desktop (1440 × 900+):** 12-column grid, max content width `1280px` (`max-w-7xl`), gutters `24px` (`gap-6`), page margin `32px` (`px-8`).
- **Tablet (768–1023px):** 8-column grid, gutters `16px` (`gap-4`), page margin `24px` (`px-6`).
- **Mobile (390 × 844):** 4-column grid, gutters `12px` (`gap-3`), page margin `16px` (`px-4`).

### 4.2 Spacing System (4px Base Unit)
- `space-1`: `4px`
- `space-2`: `8px`
- `space-3`: `12px`
- `space-4`: `16px`
- `space-6`: `24px`
- `space-8`: `32px`
- `space-12`: `48px`
- `space-16`: `64px`
- `space-24`: `96px` (Standard section padding)
- `space-32`: `128px` (Hero top clearance)

### 4.3 Corner Radii Scale
- `rounded-xs`: `4px` (Monospace pills, code badges)
- `rounded-sm`: `6px` (Inner buttons, options selector keys)
- `rounded-md`: `8px` (Interactive inputs, filter pills)
- `rounded-lg`: `12px` (Sub-cards, formula blocks)
- `rounded-xl`: `16px` (Bento modules, window panels)
- `rounded-2xl`: `24px` (Major chapter frames, hero simulator wrapper)
- `rounded-full`: `9999px` (Status indicators, pill badges)

---

## 5. Visual Component Specifications

### 5.1 Interactive Buttons
- **Primary Action (Electric Lensed):**
  - Background: `#527CFF` with subtle hover lift to `#4169E1`.
  - Border: `1px solid rgba(142, 181, 255, 0.3)`.
  - Text: `#FFFFFF`, Space Grotesk 600 Semi, `13px`.
  - Box Shadow: `0 0 16px -2px rgba(82, 124, 255, 0.4)`.
  - Active Press: `transform: scale(0.97)` (160ms cubic-bezier(0.23, 1, 0.32, 1)).
- **Secondary Ghost Action:**
  - Background: `rgba(16, 28, 50, 0.6)` with backdrop blur.
  - Border: `1px solid rgba(142, 181, 255, 0.2)`.
  - Text: `#F4F6FC`, `13px`.
  - Hover: `border-color: rgba(88, 214, 232, 0.5)`.

### 5.2 Window & Card Chrome
- **Header Bar:** Height `44px`, background `#101C32`, bottom border `1px solid rgba(142, 181, 255, 0.12)`.
- **Traffic Light Nodes:** 3 optical discs (Red `#F87171`, Amber `#FBBF24`, Green `#34D399`) at 10px diameter with 60% inner opacity.
- **Terminal Route Indicator:** IBM Plex Mono, `11px`, text `#AAB6CC`.

### 5.3 Luminous Laser Coordinate Grid
- Background matrix: SVG micro-cross pattern `rgba(142, 181, 255, 0.08)` spaced at `32px × 32px`.
- Focal beam wash: Radial gradient ellipse centered at `65% 20%` with `#527CFF` at 12% opacity fading to transparent at 70% radius.
