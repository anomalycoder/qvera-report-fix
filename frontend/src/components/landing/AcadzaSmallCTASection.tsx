import React from "react"

interface AcadzaSmallCTASectionProps {
  onNavigateToLogin: () => void
  onNavigateToDashboard: () => void
  isAuthenticated: boolean
}

export const AcadzaSmallCTASection: React.FC<AcadzaSmallCTASectionProps> = ({
  onNavigateToLogin,
  onNavigateToDashboard,
  isAuthenticated,
}) => {
  return (
    <section className="w-full bg-[#F9F8F3] min-h-[35vh] py-8 sm:py-10 lg:py-12 flex items-center justify-center select-none">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-[74px] w-full">
        {/* =========================================================================
            CTA CARD: TEXTURED BACKGROUND WITH LUMINOUS ARCS & HERO-STYLE BUTTON
        ========================================================================= */}
        <div className="w-full rounded-[20px] sm:rounded-[24px] border border-[#2B3544] p-7 sm:p-10 lg:p-12 shadow-sm relative overflow-hidden">
          {/* Background Texture Image */}
          <img
            src="/cta-texture-bg.jpg"
            alt="CTA Texture"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {/* Subtle Contrast Overlay */}
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8 w-full">
            {/* Left Column: Heading and Subtext */}
            <div className="space-y-2 text-left max-w-xl">
              <h2 className="font-display text-[24px] sm:text-[28px] lg:text-[32px] font-[425] text-white tracking-tight leading-[1.2]">
                Better questions. Better decisions.
              </h2>
              <p className="text-[13.5px] sm:text-[14.5px] text-[#C2C9D6] font-sans leading-relaxed">
                Equip your academic examination council with deterministic question verification. Resolve disputes with SymPy mathematical proof.
              </p>
            </div>

            {/* Right Column: Hero Section Button Shape/Typography with Warm Non-Black Background Color */}
            <div className="shrink-0 pt-2 md:pt-0">
              <button
                type="button"
                onClick={isAuthenticated ? onNavigateToDashboard : onNavigateToLogin}
                className="h-[44px] px-6 rounded-[8px] bg-[#EAE7DC] hover:bg-[#DFDBD0] text-[#111111] border border-[#D5D0C5] text-[14px] font-medium flex items-center justify-center transition-all cursor-pointer active:scale-[0.98]"
              >
                <span>{isAuthenticated ? "Launch Faculty Console" : "Get started"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
