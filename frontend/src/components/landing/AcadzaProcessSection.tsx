import React from "react"
import { Sparkles } from "lucide-react"

interface ProcessStep {
  step: string
  title: string
  subtitle: string
  desc: string
}

export const AcadzaProcessSection: React.FC = () => {
  const steps: ProcessStep[] = [
    {
      step: "01",
      title: "Report Ingestion",
      subtitle: "Dispute capture",
      desc: "Captures student dispute tickets with timestamps, student comments, and question identifiers.",
    },
    {
      step: "02",
      title: "Consensus Clustering",
      subtitle: "Quorum grouping",
      desc: "Aggregates dispute tickets around identical question stems to isolate genuine defect claims.",
    },
    {
      step: "03",
      title: "Scope & Field Lock",
      subtitle: "Taxonomy guard",
      desc: "Normalizes question stems and constrains triage strictly to active closed-taxonomy fields.",
    },
    {
      step: "04",
      title: "Mathematical Proof",
      subtitle: "SymPy verification",
      desc: "Executes deterministic symbolic CAS computation to evaluate derivations from first principles.",
    },
    {
      step: "05",
      title: "Verified Resolution",
      subtitle: "Faculty sign-off",
      desc: "Applies non-destructive surgical patches with faculty consensus and append-only audit logging.",
    },
  ]

  return (
    <section
      id="workflow-section"
      className="w-full bg-[#F9F8F3] pt-8 sm:pt-10 lg:pt-12 pb-12 sm:pb-14 lg:pb-18 border-b border-[#E2DFD6] select-none font-sans"
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-[74px] w-full">
        {/* =========================================================================
            HEADER: CENTERED & SIMPLE LIKE THIRD SECTION (BENTO GRID HEADER)
        ========================================================================= */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-7 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#EFECE6] border border-[#E2DFD6] text-[11px] font-medium text-[#222222]">
            <Sparkles className="w-3 h-3 text-[#1E2024]" />
            <span>Process Flow</span>
          </div>

          <h2 className="font-display text-[26px] sm:text-[32px] lg:text-[36px] font-[425] text-[#111111] leading-[1.15] tracking-tight">
            How QVERA works.
          </h2>

          <p className="text-[13px] sm:text-[13.5px] leading-relaxed text-[#666666] font-sans max-w-[460px] mx-auto">
            From student dispute to verified mathematical proof in five deterministic steps.
          </p>
        </div>

        {/* =========================================================================
            CARDS: NO BG (BG-TRANSPARENT), SAME TYPOGRAPHY AS BENTO 4TH CARD,
            NO UNNECESSARY CLUTTER OR EXTRA BADGES
        ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-4.5">
          {steps.map((item) => (
            <div
              key={item.step}
              className="bg-transparent rounded-[16px] p-5 sm:p-6 border-[1.5px] border-[#C5C1B4] shadow-xs flex flex-col justify-between min-h-[220px] sm:min-h-[235px] text-left"
            >
              {/* Top Subhead Formatted Exactly Like Bento 4th Card */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-semibold text-[15.5px] sm:text-[16.5px] text-[#111111] tracking-tight">
                    {item.title}
                  </h3>
                  <span className="text-[11px] font-mono text-[#777777]">
                    {item.step}
                  </span>
                </div>
                <p className="text-[11.5px] font-sans text-[#777777]">
                  {item.subtitle}
                </p>
              </div>

              {/* Simple Written Paragraph Text Matching Bento 4th Card Exactly */}
              <p className="text-[13.5px] sm:text-[14.5px] text-[#333333] leading-[1.65] font-sans pt-2">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
