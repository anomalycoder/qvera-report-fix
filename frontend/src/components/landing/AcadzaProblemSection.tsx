import React from "react"
import {
  Sparkles,
  Calculator,
  Users2,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react"

export const AcadzaProblemSection: React.FC = () => {
  const featureList = [
    {
      icon: Calculator,
      title: "Symbolic CAS Verification",
      subtitle: "Deterministic proofs evaluated from mathematical first principles",
    },
    {
      icon: Users2,
      title: "Consensus Clustering",
      subtitle: "Aggregates multi-student dispute reports around identical question stems",
    },
    {
      icon: CheckCircle2,
      title: "Faculty Peer Review",
      subtitle: "Independent multi-reviewer consensus and quorum sign-off",
    },
    {
      icon: ShieldCheck,
      title: "Surgical Patch Resolution",
      subtitle: "Non-destructive corrections with immutable audit logging",
    },
  ]

  return (
    <section 
      id="problem-section"
      className="w-full bg-[#F9F8F3] pt-8 sm:pt-10 lg:pt-14 pb-14 sm:pb-16 lg:pb-18 border-b border-[#E2DFD6] select-none"
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-[74px] w-full">
        {/* =========================================================================
            SECTION HEADER: ACADZA SOLUTION CAPABILITIES
        ========================================================================= */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#EFECE6] border border-[#DFDBD0] text-[11px] font-medium text-[#222222]">
            <Sparkles className="w-3 h-3 text-[#1E2024]" />
            <span>Platform Capabilities</span>
          </div>

          <h2 className="font-display text-[26px] sm:text-[32px] lg:text-[36px] font-[425] text-[#111111] leading-[1.15] tracking-tight">
            Resolve exam disputes with mathematical certainty.
          </h2>

          <p className="text-[13px] sm:text-[14px] leading-relaxed text-[#666666] font-sans max-w-[500px] mx-auto">
            QVERA combines symbolic CAS computation with faculty consensus to verify, audit, and patch contested examination questions.
          </p>
        </div>

        {/* =========================================================================
            TWO-COLUMN LAYOUT:
            LEFT: Laptop Dashboard Showcase Image
            RIGHT: Transparent rectangular box with 4 QVERA solution feature rows
        ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 lg:gap-8 items-stretch max-w-[1080px] mx-auto">
          {/* LEFT: Just Image in Rectangular Box (Static) */}
          <div className="lg:col-span-6 w-full h-[320px] sm:h-[380px] lg:h-auto rounded-[20px] overflow-hidden border-[1.5px] border-[#C5C1B4] shadow-xs relative">
            <img
              src="/qvera-features-laptop.jpg"
              alt="QVERA Question Review Dashboard"
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = "none"
              }}
            />
          </div>

          {/* RIGHT: Transparent Rectangular Box with 4 Feature Rows */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="w-full bg-transparent rounded-[20px] p-5 sm:p-6.5 border-[1.5px] border-[#C5C1B4] shadow-xs text-left">
              <div className="divide-y divide-[#E5E2D9]">
                {featureList.map((item, idx) => {
                  const IconComponent = item.icon
                  return (
                    <div
                      key={item.title}
                      className={`flex items-center gap-4 ${
                        idx === 0
                          ? "pb-4.5 sm:pb-5"
                          : idx === featureList.length - 1
                          ? "pt-4.5 sm:pt-5"
                          : "py-4.5 sm:py-5"
                      }`}
                    >
                      {/* Squircle Icon Box */}
                      <div className="w-11 h-11 sm:w-11.5 sm:h-11.5 rounded-[12px] bg-[#EFECE6] border border-[#DFDBD0] flex items-center justify-center shrink-0 shadow-2xs">
                        <IconComponent className="w-5 h-5 text-[#222222]" />
                      </div>

                      {/* Text Details */}
                      <div className="space-y-0.5">
                        <h4 className="font-sans font-semibold text-[14.5px] sm:text-[15px] text-[#111111] tracking-tight leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-[12px] text-[#666666] font-sans leading-normal">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
