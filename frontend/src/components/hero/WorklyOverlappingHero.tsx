import React, { useState } from "react"
import { motion } from "motion/react"
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Atom,
  Check,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  GraduationCap,
  Calculator,
  FlaskConical,
  BookOpen,
} from "lucide-react"

interface WorklyOverlappingHeroProps {
  onNavigateToLogin: () => void
  onNavigateToDashboard: () => void
  isAuthenticated: boolean
}

export const WorklyOverlappingHero: React.FC<WorklyOverlappingHeroProps> = ({
  onNavigateToLogin,
  onNavigateToDashboard,
  isAuthenticated,
}) => {
  return (
    <section className="relative w-full bg-[#F9F8F3] overflow-hidden pt-5 sm:pt-7 lg:pt-9 pb-8 lg:pb-10 select-none">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-[74px] relative">
        {/* =========================================================================
            TWO-ZONE HERO COMPOSITION WITH TRANSPARENT PRODUCT SHOWCASE PNG
            Left: Typography & Action Buttons (lg:col-span-6)
            Right: Seamless Floating 3D Device Showcase (lg:col-span-6)
        ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-10 items-center pt-3 sm:pt-5 lg:pt-5 pb-4 sm:pb-6">
          {/* Left Column: Typography & Buttons */}
          <div className="lg:col-span-6 text-left space-y-4 z-20 relative pt-6 sm:pt-8 lg:pt-10">
            {/* Main Headline: Plus Jakarta Sans, weight 440, desktop 62px, lh 1.0, ls 0.000em */}
            <h1
              className="font-display text-[36px] sm:text-[48px] lg:text-[54px] xl:text-[62px] font-[440] leading-[1.0] tracking-[0em] text-[#111111]"
            >
              <span className="block sm:whitespace-nowrap">Question everything</span>
              <span className="block sm:whitespace-nowrap">Verify every answer.</span>
            </h1>

            {/* Body Text: Darker grey matching header nav (#555555), uses active --font-sans */}
            <p className="text-[15px] sm:text-[16px] leading-[1.6] text-[#555555] font-sans">
              <span className="block">The academic QA platform for questions, exams,</span>
              <span className="block">and answer keys. From reported defect to</span>
              <span className="block">verified proof in minutes.</span>
            </p>

            {/* Button Style: Get started (Black) beside Book a demo (Transparent with border) */}
            <div className="flex flex-wrap items-center gap-3 pt-5 sm:pt-6">
              <button
                onClick={isAuthenticated ? onNavigateToDashboard : onNavigateToLogin}
                className="h-[44px] px-6 rounded-[8px] bg-[#0B0F12] hover:bg-[#1f2328] text-white text-[14px] font-medium font-sans flex items-center justify-center transition-all cursor-pointer active:scale-[0.98]"
              >
                <span>Get started</span>
              </button>
              <button
                onClick={onNavigateToLogin}
                className="h-[44px] px-6 rounded-[8px] bg-transparent hover:bg-black/[0.04] text-[#111111] border border-[#CECECE] hover:border-[#B5B5B5] text-[14px] font-medium font-sans flex items-center justify-center transition-all cursor-pointer active:scale-[0.98]"
              >
                Book a demo
              </button>
            </div>
          </div>

          {/* Right Column: Transparent PNG Showcase with tilt, vertical stretch, horizontal widen */}
          <div className="lg:col-span-6 flex items-center justify-center lg:justify-end relative z-10">
            <div className="relative w-full max-w-[580px] lg:max-w-[630px] xl:max-w-[660px] lg:translate-x-2 xl:translate-x-4 lg:translate-y-2 xl:translate-y-3 transition-transform duration-300">
              <img
                src="/hero-product-showcase.png"
                alt="QVERA Academic Question Review Faculty Workspace on Tablet"
                style={{
                  transform: "perspective(1200px) rotateY(-4deg) rotate(-1.5deg) scale(0.88, 1.25)",
                  transformOrigin: "center center",
                }}
                className="w-full h-auto max-h-[520px] object-contain block select-none pointer-events-none"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          HORIZONTAL PROJECT STRIP (Moved Up Slightly, Expanded Padding, Border-Y Above & Below, Extra Side Padding)
          Seamless #F9F8F3 Canvas, Project Domains: JEE Advanced, NEET-UG, Physics, Mathematics, Chemistry
      ========================================================================= */}
      <div className="w-full mt-10 lg:mt-14 xl:mt-16 py-6 sm:py-7 lg:py-8 border-y border-[#E2DFD6]">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-[74px] flex flex-wrap items-center justify-between gap-6 text-[#1E2024]">
          {/* JEE Advanced */}
          <div className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-default">
            <GraduationCap className="w-4 h-4 text-[#1E2024]" />
            <span className="font-semibold text-[15px] sm:text-[16px] text-[#1E2024] tracking-tight">JEE Advanced</span>
          </div>

          {/* NEET-UG */}
          <div className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-default">
            <Atom className="w-4 h-4 text-[#1E2024]" />
            <span className="font-semibold text-[15px] sm:text-[16px] text-[#1E2024] tracking-tight">NEET-UG</span>
          </div>

          {/* Physics */}
          <div className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-default">
            <Zap className="w-4 h-4 text-[#1E2024]" />
            <span className="font-semibold text-[15px] sm:text-[16px] text-[#1E2024] tracking-tight">Physics</span>
          </div>

          {/* Mathematics */}
          <div className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-default">
            <Calculator className="w-4 h-4 text-[#1E2024]" />
            <span className="font-semibold text-[15px] sm:text-[16px] text-[#1E2024] tracking-tight">Mathematics</span>
          </div>

          {/* Chemistry */}
          <div className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-default">
            <FlaskConical className="w-4 h-4 text-[#1E2024]" />
            <span className="font-semibold text-[15px] sm:text-[16px] text-[#1E2024] tracking-tight">Chemistry</span>
          </div>
        </div>
      </div>
    </section>
  )
}
