import React from "react"
import {
  Sparkles,
  TrendingUp,
} from "lucide-react"

interface CompleteWorkspaceSectionProps {
  onExploreFeatures?: () => void
}

export const CompleteWorkspaceSection: React.FC<CompleteWorkspaceSectionProps> = () => {
  return (
    <section 
      id="workspace-features-section" 
      className="w-full bg-[#F9F8F3] pt-6 sm:pt-8 lg:pt-10 pb-12 sm:pb-14 lg:pb-18 select-none border-b border-[#E2DFD6]"
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-[74px] w-full">
        {/* =========================================================================
            HEADER: CENTERED AT TOP, NO BUTTON, MINIMAL TEXT
        ========================================================================= */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-7 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#EFECE6] border border-[#E2DFD6] text-[11px] font-medium text-[#222222]">
            <Sparkles className="w-3 h-3 text-[#1E2024]" />
            <span>Deterministic Review Suite</span>
          </div>

          <h2 className="font-display text-[26px] sm:text-[32px] lg:text-[36px] font-[425] text-[#111111] leading-[1.15] tracking-tight">
            A complete review workspace.
          </h2>

          <p className="text-[13px] sm:text-[13.5px] leading-relaxed text-[#666666] font-sans max-w-[460px] mx-auto">
            Turn disputed exam questions into verified mathematical proofs in minutes.
          </p>
        </div>

        {/* =========================================================================
            BENTO GRID LAYOUT:
            ROW 1 (ACADZA PROJECT TAILORED):
              - Card 1 (8 cols): Overview Wavy Line Graph (Questions verified 24,560, +12.5%, Jan-May)
              - Card 2 (4 cols): Proof accuracy (99.8%), Faculty reviewers (1,245), Avatars (+12)
            ROW 2:
              - Card 3 (3 cols): White card (reversed from black) with Proof Engine & 3D AI layer stack
              - Card 4 (6 cols): Big & centered white card with top subhead & written paragraph text
              - Card 5 (3 cols): Clean image card with Surgical Precision (zero overwrite removed)
        ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4 lg:gap-4.5">
          {/* =======================================================================
              ROW 1 — CARD 1 (8 COLS): Overview with Smooth Spline Area Chart (TRANSPARENT BG & GREY BORDER - STATIC)
          ======================================================================= */}
          <div className="md:col-span-12 lg:col-span-8 bg-transparent rounded-[16px] p-5 sm:p-6 border-[1.5px] border-[#C5C1B4] shadow-xs flex flex-col justify-between min-h-[250px] sm:min-h-[265px]">
            {/* Top Info */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-display font-semibold text-[15.5px] sm:text-[16.5px] text-[#111111] tracking-tight">
                  Overview
                </h3>
                <p className="text-[11.5px] font-sans text-[#777777]">
                  Questions verified
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="font-display font-bold text-[26px] sm:text-[30px] text-[#111111] tracking-tight">
                    24,560
                  </span>
                  <span className="text-[11px] font-medium text-[#16A34A] bg-[#ECFDF3] px-2 py-0.5 rounded-full border border-[#D1FADF]">
                    +12.5%
                  </span>
                </div>
              </div>

              <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F7F6F2] border border-[#E8E5DD] text-[10.5px] font-medium text-[#666666]">
                <TrendingUp className="w-3 h-3 text-[#16A34A]" />
                <span>Triage velocity</span>
              </div>
            </div>

            {/* Smooth Spline Wave Area Graph */}
            <div className="w-full pt-2">
              <div className="relative w-full h-[110px] sm:h-[125px]">
                <svg 
                  className="w-full h-full overflow-visible" 
                  viewBox="0 0 600 170" 
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="waveAreaGradSharp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#252F3D" stopOpacity="0.14" />
                      <stop offset="65%" stopColor="#252F3D" stopOpacity="0.03" />
                      <stop offset="100%" stopColor="#252F3D" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Gradient Area Fill */}
                  <path
                    d="M 0,135 C 30,135 45,148 70,142 C 95,136 120,98 145,98 C 170,98 190,130 215,130 C 240,130 260,95 285,95 C 310,95 330,122 355,122 C 385,122 405,68 435,68 C 460,68 480,110 505,105 C 535,100 555,28 575,28 C 585,28 595,42 600,40 L 600,170 L 0,170 Z"
                    fill="url(#waveAreaGradSharp)"
                  />

                  {/* Smooth Bezier Spline Stroke */}
                  <path
                    d="M 0,135 C 30,135 45,148 70,142 C 95,136 120,98 145,98 C 170,98 190,130 215,130 C 240,130 260,95 285,95 C 310,95 330,122 355,122 C 385,122 405,68 435,68 C 460,68 480,110 505,105 C 535,100 555,28 575,28 C 585,28 595,42 600,40"
                    fill="none"
                    stroke="#222B38"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* X-Axis Monthly Labels */}
              <div className="flex justify-between items-center text-[11px] text-[#888888] font-sans px-1 pt-2 border-t border-[#F2EFE8]">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
              </div>
            </div>
          </div>

          {/* =======================================================================
              ROW 1 — CARD 2 (4 COLS): PROOF ACCURACY & FACULTY REVIEWERS (TRANSPARENT BG & GREY BORDER - STATIC)
          ======================================================================= */}
          <div className="md:col-span-12 lg:col-span-4 bg-transparent rounded-[16px] p-5 sm:p-6 border-[1.5px] border-[#C5C1B4] shadow-xs flex flex-col justify-between min-h-[250px] sm:min-h-[265px]">
            {/* Top Metric: Proof Accuracy */}
            <div className="space-y-0.5">
              <p className="text-[11.5px] font-sans text-[#777777]">
                Proof accuracy
              </p>
              <div className="flex items-center gap-2.5">
                <span className="font-display font-bold text-[24px] sm:text-[27px] text-[#111111] tracking-tight">
                  99.8%
                </span>
                <span className="text-[11px] font-medium text-[#16A34A] bg-[#ECFDF3] px-2 py-0.5 rounded-full border border-[#D1FADF]">
                  +8.2%
                </span>
              </div>
            </div>

            {/* Hairline Divider */}
            <div className="w-full h-px bg-[#E5E2D9] my-1" />

            {/* Middle Metric: Faculty Reviewers */}
            <div className="space-y-0.5">
              <p className="text-[11.5px] font-sans text-[#777777]">
                Faculty reviewers
              </p>
              <div className="flex items-center gap-2.5">
                <span className="font-display font-bold text-[24px] sm:text-[27px] text-[#111111] tracking-tight">
                  1,245
                </span>
                <span className="text-[11px] font-medium text-[#16A34A] bg-[#ECFDF3] px-2 py-0.5 rounded-full border border-[#D1FADF]">
                  +18.7%
                </span>
              </div>
            </div>

            {/* Hairline Divider */}
            <div className="w-full h-px bg-[#E5E2D9] my-1" />

            {/* Bottom Element: 3 Avatars Stack + "+12" Pill */}
            <div className="pt-0.5">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="relative inline-block h-8 w-8 rounded-full ring-2 ring-[#F9F8F3] bg-[#303844] text-white text-[11px] font-semibold overflow-hidden shadow-xs">
                    <img
                      className="h-full w-full object-cover"
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
                      alt="Reviewer 1"
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center font-sans font-medium text-[10px] bg-[#3B4657]">DR</span>
                  </div>
                  <div className="relative inline-block h-8 w-8 rounded-full ring-2 ring-[#F9F8F3] bg-[#424D5D] text-white text-[11px] font-semibold overflow-hidden shadow-xs">
                    <img
                      className="h-full w-full object-cover"
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces"
                      alt="Reviewer 2"
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center font-sans font-medium text-[10px] bg-[#4C586B]">AS</span>
                  </div>
                  <div className="relative inline-block h-8 w-8 rounded-full ring-2 ring-[#F9F8F3] bg-[#556377] text-white text-[11px] font-semibold overflow-hidden shadow-xs">
                    <img
                      className="h-full w-full object-cover"
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces"
                      alt="Reviewer 3"
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center font-sans font-medium text-[10px] bg-[#5E6D82]">RK</span>
                  </div>
                </div>
                <div className="h-8 px-2.5 rounded-full bg-[#EFECE6] border border-[#DFDBD0] text-[11px] font-semibold text-[#555555] flex items-center justify-center shadow-2xs">
                  +12
                </div>
              </div>
            </div>
          </div>

          {/* =======================================================================
              ROW 2 — CARD 3 (3 COLS): TRANSPARENT CARD (CENTERED & BIG IMAGE/GRAPHIC)
          ======================================================================= */}
          <div className="md:col-span-12 lg:col-span-3 bg-transparent rounded-[16px] p-5 sm:p-5.5 border-[1.5px] border-[#C5C1B4] shadow-xs flex flex-col justify-between min-h-[250px] sm:min-h-[265px] relative overflow-hidden text-left">
            {/* Top Info: Proof Engine & Short Subtext */}
            <div className="space-y-1 z-10">
              <h3 className="font-display font-semibold text-[15.5px] sm:text-[16.5px] text-[#111111] tracking-tight">
                Proof Engine
              </h3>
              <p className="text-[11px] sm:text-[11.5px] text-[#666666] leading-[1.38] font-sans">
                Symbolic proofs from first principles.
              </p>
            </div>

            {/* 3D Isometric Floating Glass Cards Layer Stack (Centered & Big) */}
            <div className="flex-1 w-full flex items-center justify-center [perspective:1000px] z-10 py-3 sm:py-4">
              <div 
                className="relative w-36 h-24 sm:w-44 sm:h-28 flex items-center justify-center scale-120 sm:scale-135 translate-x-1"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'rotateX(54deg) rotateZ(-36deg)'
                }}
              >
                {/* Layer 3: Bottom Translucent Glass */}
                <div 
                  className="absolute inset-0 rounded-[14px] bg-[#1E2530]/[0.06] border border-[#1E2530]/[0.12] shadow-sm backdrop-blur-xs"
                  style={{ transform: 'translateZ(-18px)' }}
                />

                {/* Layer 2: Middle Frosted Glass */}
                <div 
                  className="absolute inset-0 rounded-[14px] bg-[#1E2530]/[0.12] border border-[#1E2530]/[0.18] shadow-md backdrop-blur-xs"
                  style={{ transform: 'translateZ(-9px)' }}
                />

                {/* Layer 1: Top Glowing Slate Tile with AI Sparkle */}
                <div 
                  className="absolute inset-0 rounded-[14px] bg-gradient-to-br from-[#2D3847] via-[#242D39] to-[#1C232D] border border-[#3A4657] shadow-[0_12px_26px_rgba(28,35,45,0.28)] flex items-center justify-center"
                  style={{ transform: 'translateZ(0px)' }}
                >
                  <div className="w-7 h-7 flex items-center justify-center text-white">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M12 2L14.3 9.7L22 12L14.3 14.3L12 22L9.7 14.3L2 12L9.7 9.7L12 2Z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =======================================================================
              ROW 2 — CARD 4 (6 COLS): BIG & CENTERED TRANSPARENT CARD (GREY BORDER + WRITTEN TEXT - STATIC)
          ======================================================================= */}
          <div className="md:col-span-12 lg:col-span-6 bg-transparent rounded-[16px] p-6 sm:p-7 border-[1.5px] border-[#C5C1B4] shadow-xs flex flex-col justify-between min-h-[250px] sm:min-h-[265px] text-left">
            {/* Top Subhead Formatted Like First Card */}
            <div className="space-y-1">
              <h3 className="font-display font-semibold text-[15.5px] sm:text-[16.5px] text-[#111111] tracking-tight">
                Peer Consensus
              </h3>
              <p className="text-[11.5px] font-sans text-[#777777]">
                Faculty review
              </p>
            </div>

            {/* Simple Written Paragraph Text (No Extra Badges) */}
            <p className="text-[13.5px] sm:text-[14.5px] text-[#333333] leading-[1.65] font-sans pt-2">
              Every contested exam question undergoes independent faculty review. Proposed corrections are verified with mathematical proof before any official answer key is updated.
            </p>
          </div>

          {/* =======================================================================
              ROW 2 — CARD 5 (3 COLS): LAST CARD REPLACED WITH USER'S MATHEMATICAL PROOF IMAGE
          ======================================================================= */}
          <div className="md:col-span-12 lg:col-span-3 rounded-[16px] border-[1.5px] border-[#C5C1B4] shadow-xs overflow-hidden relative min-h-[250px] sm:min-h-[265px] text-left flex flex-col justify-between">
            {/* Full-bleed Photo Background (User Mathematical Proof Notebook) */}
            <img
              src="/mathematical-proof-desk.jpg"
              alt="Scientific Mathematical Proof"
              className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.95]"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = "none"
              }}
            />

            {/* Soft, Transparent Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/35 pointer-events-none" />

            {/* Top Text Written Directly on Image (Crisp & Light) */}
            <div className="relative z-10 p-5 space-y-0.5">
              <h4 className="font-display font-semibold text-[15px] sm:text-[15.5px] text-white tracking-tight drop-shadow-xs">
                Surgical Precision
              </h4>
              <p className="text-[11px] text-white/80 font-sans">
                Locked stem boundaries
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
