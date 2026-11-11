import React from "react"
import {
  Sparkles,
  FileText,
  Users,
  Lock,
  Calculator,
  ShieldCheck,
} from "lucide-react"

interface ProcessStep {
  step: string
  title: string
  desc: string
  icon: React.ElementType
}

export const AcadzaProcessSection: React.FC = () => {
  // 5 verified stages strictly grounded in backend architecture
  const steps: ProcessStep[] = [
    {
      step: "01",
      title: "Report Ingestion",
      desc: "Captures student dispute tickets with timestamps, comments, and question identifiers.",
      icon: FileText,
    },
    {
      step: "02",
      title: "Consensus Clustering",
      desc: "Groups dispute reports by question ID to identify consensus-backed pedagogical defects.",
      icon: Users,
    },
    {
      step: "03",
      title: "Question & Scope Lock",
      desc: "Normalizes LaTeX question stems and locks triage to bounded answer-key and derivation scopes.",
      icon: Lock,
    },
    {
      step: "04",
      title: "Mathematical Proof",
      desc: "Executes deterministic SymPy CAS verification to evaluate derivations from first principles.",
      icon: Calculator,
    },
    {
      step: "05",
      title: "Verified Resolution",
      desc: "Generates non-destructive surgical patches with audit logging and faculty review signoff.",
      icon: ShieldCheck,
    },
  ]

  return (
    <section 
      id="workflow-section"
      className="w-full bg-[#F9F8F3] pt-8 sm:pt-10 lg:pt-12 pb-12 sm:pb-14 lg:pb-16 border-b border-[#EAE7DC] select-none font-sans"
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-[74px] w-full">
        {/* =========================================================================
            SECTION HEADER: EXACT REQUESTED HEADING & SUBTITLE
        ========================================================================= */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#EFECE6] border border-[#E2DFD6] text-[11px] font-medium text-[#222222]">
            <Sparkles className="w-3 h-3 text-[#1E2024]" />
            <span>Process Flow</span>
          </div>

          <h2 className="font-display text-[26px] sm:text-[32px] lg:text-[36px] font-[425] text-[#111111] leading-[1.15] tracking-tight">
            How QVERA works.
          </h2>

          <p className="text-[13px] sm:text-[14px] leading-relaxed text-[#666666] font-sans max-w-[480px] mx-auto">
            From reported student dispute to verified mathematical proof.
          </p>
        </div>

        {/* =========================================================================
            DESKTOP & TABLET: BALANCED SERPENTINE 5-STEP LAYOUT (~200px CIRCLES)
            Same background as Hero (#F9F8F3), completely static with NO hover animation
            Row 1 (Left to Right): [01] ──> [02] ──> [03]
            Vertical Connector:                     │
                                                    ▼
            Row 2 (Right to Left):         [05] <── [04]
        ========================================================================= */}
        <div className="hidden md:flex flex-col items-center max-w-[880px] mx-auto">
          {/* ROW 1: Circle 01 -> Circle 02 -> Circle 03 */}
          <div className="flex items-center justify-between w-full">
            {/* Step 01 */}
            <div className="w-[200px] h-[200px] rounded-full border-[1.5px] border-[#D3CFBF] bg-[#F9F8F3] flex flex-col items-center justify-center text-center p-4.5 shrink-0 select-none">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-6 h-6 rounded-full flex items-center justify-center bg-[#EFECE6] text-[#444444] border border-[#DFDBD0]">
                  <FileText className="w-3.5 h-3.5" />
                </span>
                <span className="text-[9.5px] font-mono font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border bg-[#EFECE6] text-[#666666] border-[#DFDBD0]">
                  {steps[0].step}
                </span>
              </div>
              <h3 className="font-display font-semibold text-[14px] text-[#111111] tracking-tight leading-snug mb-1">
                {steps[0].title}
              </h3>
              <p className="text-[11px] text-[#666666] leading-[1.38] max-w-[145px] font-sans">
                {steps[0].desc}
              </p>
            </div>

            {/* Horizontal Vector Connector Arrow 01 -> 02 */}
            <div className="flex-1 flex items-center justify-center px-2 lg:px-4">
              <svg className="w-full max-w-[80px] h-4" viewBox="0 0 80 16" fill="none">
                <line x1="0" y1="8" x2="70" y2="8" stroke="#BFBAB0" strokeWidth="1.5" strokeLinecap="round" />
                <polyline points="64,3 71,8 64,13" fill="none" stroke="#8C887B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Step 02 */}
            <div className="w-[200px] h-[200px] rounded-full border-[1.5px] border-[#D3CFBF] bg-[#F9F8F3] flex flex-col items-center justify-center text-center p-4.5 shrink-0 select-none">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-6 h-6 rounded-full flex items-center justify-center bg-[#EFECE6] text-[#444444] border border-[#DFDBD0]">
                  <Users className="w-3.5 h-3.5" />
                </span>
                <span className="text-[9.5px] font-mono font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border bg-[#EFECE6] text-[#666666] border-[#DFDBD0]">
                  {steps[1].step}
                </span>
              </div>
              <h3 className="font-display font-semibold text-[14px] text-[#111111] tracking-tight leading-snug mb-1">
                {steps[1].title}
              </h3>
              <p className="text-[11px] text-[#666666] leading-[1.38] max-w-[145px] font-sans">
                {steps[1].desc}
              </p>
            </div>

            {/* Horizontal Vector Connector Arrow 02 -> 03 */}
            <div className="flex-1 flex items-center justify-center px-2 lg:px-4">
              <svg className="w-full max-w-[80px] h-4" viewBox="0 0 80 16" fill="none">
                <line x1="0" y1="8" x2="70" y2="8" stroke="#BFBAB0" strokeWidth="1.5" strokeLinecap="round" />
                <polyline points="64,3 71,8 64,13" fill="none" stroke="#8C887B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Step 03 */}
            <div className="w-[200px] h-[200px] rounded-full border-[1.5px] border-[#D3CFBF] bg-[#F9F8F3] flex flex-col items-center justify-center text-center p-4.5 shrink-0 select-none">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-6 h-6 rounded-full flex items-center justify-center bg-[#EFECE6] text-[#444444] border border-[#DFDBD0]">
                  <Lock className="w-3.5 h-3.5" />
                </span>
                <span className="text-[9.5px] font-mono font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border bg-[#EFECE6] text-[#666666] border-[#DFDBD0]">
                  {steps[2].step}
                </span>
              </div>
              <h3 className="font-display font-semibold text-[14px] text-[#111111] tracking-tight leading-snug mb-1">
                {steps[2].title}
              </h3>
              <p className="text-[11px] text-[#666666] leading-[1.38] max-w-[145px] font-sans">
                {steps[2].desc}
              </p>
            </div>
          </div>

          {/* RIGHT VERTICAL CONNECTOR: Downward Arrow Aligned with Center of Circle 03 & 04 */}
          <div className="w-full flex justify-end pr-[92px] my-2 sm:my-2.5">
            <svg className="w-4 h-10" viewBox="0 0 16 40" fill="none">
              <line x1="8" y1="0" x2="8" y2="32" stroke="#BFBAB0" strokeWidth="1.5" strokeLinecap="round" />
              <polyline points="3,26 8,33 13,26" fill="none" stroke="#8C887B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* ROW 2: Serpentine Return (Circle 05 <── Circle 04) */}
          <div className="flex items-center justify-between w-full">
            {/* Left Column Spacer matching Step 01 width */}
            <div className="w-[200px] invisible shrink-0" />

            {/* Left Invisible Spacer matching Arrow width */}
            <div className="flex-1 invisible px-2 lg:px-4" />

            {/* Step 05: Final Verified Resolution (Aligned under Step 02) */}
            <div className="w-[200px] h-[200px] rounded-full border-[1.5px] border-[#D3CFBF] bg-[#F9F8F3] flex flex-col items-center justify-center text-center p-4.5 shrink-0 select-none">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-6 h-6 rounded-full flex items-center justify-center bg-[#EFECE6] text-[#444444] border border-[#DFDBD0]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
                <span className="text-[9.5px] font-mono font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border bg-[#EFECE6] text-[#666666] border-[#DFDBD0]">
                  {steps[4].step}
                </span>
              </div>
              <h3 className="font-display font-semibold text-[14px] text-[#111111] tracking-tight leading-snug mb-1">
                {steps[4].title}
              </h3>
              <p className="text-[11px] text-[#666666] leading-[1.38] max-w-[145px] font-sans">
                {steps[4].desc}
              </p>
            </div>

            {/* Horizontal Vector Connector Arrow 04 -> 05 (Pointing Left) */}
            <div className="flex-1 flex items-center justify-center px-2 lg:px-4">
              <svg className="w-full max-w-[80px] h-4" viewBox="0 0 80 16" fill="none">
                <line x1="80" y1="8" x2="10" y2="8" stroke="#BFBAB0" strokeWidth="1.5" strokeLinecap="round" />
                <polyline points="16,3 9,8 16,13" fill="none" stroke="#8C887B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Step 04: Mathematical Proof (Directly below Step 03) */}
            <div className="w-[200px] h-[200px] rounded-full border-[1.5px] border-[#D3CFBF] bg-[#F9F8F3] flex flex-col items-center justify-center text-center p-4.5 shrink-0 select-none">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-6 h-6 rounded-full flex items-center justify-center bg-[#EFECE6] text-[#444444] border border-[#DFDBD0]">
                  <Calculator className="w-3.5 h-3.5" />
                </span>
                <span className="text-[9.5px] font-mono font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border bg-[#EFECE6] text-[#666666] border-[#DFDBD0]">
                  {steps[3].step}
                </span>
              </div>
              <h3 className="font-display font-semibold text-[14px] text-[#111111] tracking-tight leading-snug mb-1">
                {steps[3].title}
              </h3>
              <p className="text-[11px] text-[#666666] leading-[1.38] max-w-[145px] font-sans">
                {steps[3].desc}
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            MOBILE LAYOUT (< 768px): REFINED VERTICAL TIMELINE WITH NODES & SPINES
            Same background as Hero (#F9F8F3), static cards without hover animations
        ========================================================================= */}
        <div className="md:hidden max-w-[440px] mx-auto relative pl-6 pr-2 py-2">
          {/* Continuous Vertical Timeline Spine */}
          <div className="absolute left-[29px] top-6 bottom-6 w-[1.5px] bg-[#DFDBD0]" />

          <div className="space-y-4">
            {steps.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="relative flex items-start gap-4">
                  {/* Timeline Node Badge */}
                  <div className="w-8 h-8 rounded-full border-[1.5px] border-[#D3CFBF] bg-[#F9F8F3] text-[#111111] flex items-center justify-center shrink-0 z-10 font-mono text-[11px] font-bold">
                    <Icon className="w-3.5 h-3.5 text-[#444444]" />
                  </div>

                  {/* Step Card Content */}
                  <div className="flex-1 bg-white rounded-[16px] p-4 border border-[#DFDBD0] shadow-2xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-display font-semibold text-[14.5px] text-[#111111] tracking-tight">
                        {item.title}
                      </h3>
                      <span className="text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded-full border bg-[#F9F8F3] text-[#666666] border-[#DFDBD0]">
                        STEP {item.step}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#666666] leading-relaxed font-sans">
                      {item.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
