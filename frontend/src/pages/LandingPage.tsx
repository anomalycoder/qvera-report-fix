import React, { useState, useEffect } from "react"
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Calculator,
  Layers,
  Sparkles,
  Menu,
  X,
  FileSearch,
  Database,
  Users2,
  Wrench,
  AlertTriangle,
  History,
  Check,
  ChevronRight,
  HelpCircle,
  Atom,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Hero3DCanvas } from "@/components/landing/Hero3DCanvas"
import { MiniWorkflowVisual } from "@/components/landing/MiniWorkflowVisual"
import { ProductShowcase } from "@/components/landing/ProductShowcase"

interface LandingPageProps {
  onNavigateToLogin: () => void
  onNavigateToDashboard: () => void
  isAuthenticated: boolean
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToLogin,
  onNavigateToDashboard,
  isAuthenticated,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* 1. Header / Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 shadow-md py-3.5"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-extrabold text-white text-base shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
              A
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">
                Acadza
              </span>
              <span className="text-[11px] font-mono text-blue-400 font-semibold bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-full">
                Report → Fix
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <button
              onClick={() => scrollToSection("showcase")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Product
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              How it works
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("safety")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              For Faculty
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                onClick={onNavigateToDashboard}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm"
              >
                Go to Workspace →
              </Button>
            ) : (
              <>
                <button
                  onClick={onNavigateToLogin}
                  className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 cursor-pointer transition-colors"
                >
                  Sign in
                </button>
                <Button
                  onClick={onNavigateToLogin}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm cursor-pointer"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0F172A] border-b border-slate-800 px-4 pt-3 pb-6 space-y-3">
            <button
              onClick={() => scrollToSection("showcase")}
              className="block w-full text-left py-2 text-sm text-slate-300 hover:text-white"
            >
              Product
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="block w-full text-left py-2 text-sm text-slate-300 hover:text-white"
            >
              How it works
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="block w-full text-left py-2 text-sm text-slate-300 hover:text-white"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("safety")}
              className="block w-full text-left py-2 text-sm text-slate-300 hover:text-white"
            >
              For Faculty
            </button>
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <Button
                onClick={onNavigateToLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm"
              >
                {isAuthenticated ? "Enter Workspace" : "Faculty Sign in"}
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        {/* Subtle 3D background */}
        <Hero3DCanvas />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Copy */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/70 border border-blue-800/60 text-xs font-semibold text-blue-300 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Deterministic Academic QA for JEE & NEET</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
                Every question deserves to be correct.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
                From student reports to verified corrections. Acadza helps academic teams detect question defects, validate answers and improve learning quality.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Button
                  size="lg"
                  onClick={() => scrollToSection("showcase")}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-lg shadow-blue-600/25 transition-all hover:scale-102 cursor-pointer"
                >
                  Explore the platform
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onNavigateToLogin}
                  className="w-full sm:w-auto border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white font-semibold text-sm px-6 py-3 rounded-lg cursor-pointer"
                >
                  Faculty sign in
                </Button>
              </div>

              <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Closed 7-State Taxonomy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-blue-400" />
                  <span>SymPy Symbolic Math</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual: Miniature Workflow Panel */}
            <div className="lg:col-span-6">
              <MiniWorkflowVisual />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Product Trust & Benchmark Metrics */}
      <section className="border-y border-slate-800 bg-[#0F172A]/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold">
              Evaluation Dataset Results
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Rigorous Mathematical Verification on National Test Datasets
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl mx-auto">
              Empirical benchmark evaluated against real JEE Main, JEE Advanced, and NEET question defect reports under deterministic closed-taxonomy constraints.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="text-3xl sm:text-4xl font-extrabold text-white">43</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300 mt-1">
                Questions Evaluated
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Physics, Botany, Zoology</div>
            </div>
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-400">44</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300 mt-1">
                Student Reports Analyzed
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Mobile app & web complaints</div>
            </div>
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="text-3xl sm:text-4xl font-extrabold text-rose-400">27</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300 mt-1">
                Defects Identified
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Math & option discrepancies</div>
            </div>
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">17</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300 mt-1">
                Auto-Applied Corrections
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Safe, non-disruptive fixes</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Problem Section */}
      <section className="py-20 bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold">
              The Academic Bottleneck
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
              Student feedback should lead to meaningful improvements.
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-3 leading-relaxed">
              Every year, millions of high-stakes students report legitimate errors in mock tests and question banks. Most systems either ignore them or burden senior faculty with thousands of manual solves.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-lg bg-rose-950/70 border border-rose-800/60 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Hidden Question Defects</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Ambiguous circuit diagrams, missing values (like inductance L in AC circuits), or inverted answer keys silently damage students&apos; percentile scores and confidence.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-lg bg-amber-950/70 border border-amber-800/60 flex items-center justify-center text-amber-400">
                <History className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Time-Consuming Manual Verification</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Subject matter experts spend 40+ hours per exam session solving reports by hand, only to discover that 40% of reports are student calculation errors or duplicate complaints.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-lg bg-blue-950/70 border border-blue-800/60 flex items-center justify-center text-blue-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Unstructured Student Reports</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Complaints range from single-word frustration (&quot;wrong ans&quot;) to prompt injection traps. Without automated triage, legitimate issues are buried under noise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="py-20 bg-[#0F172A]/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold">
              Operational Pipeline
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
              From Report to Verified Fix in 4 Deterministic Steps
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-2">
              A closed-loop architecture where AI handles verification and human faculty retains ultimate decision authority.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-blue-400 font-bold">STEP 01</span>
                <span className="w-6 h-6 rounded-full bg-blue-950 border border-blue-800 flex items-center justify-center text-xs text-blue-300">1</span>
              </div>
              <h3 className="text-base font-bold text-white">Report Ingestion</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Students flag questions via Android or Web. The system extracts raw HTML, MathML, and groups duplicate reports for the same question.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-blue-400 font-bold">STEP 02</span>
                <span className="w-6 h-6 rounded-full bg-blue-950 border border-blue-800 flex items-center justify-center text-xs text-blue-300">2</span>
              </div>
              <h3 className="text-base font-bold text-white">Independent Verify</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                SymPy solves the question from scratch without looking at the stored answer key. Validates algebraic equivalences and significant figures.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-blue-400 font-bold">STEP 03</span>
                <span className="w-6 h-6 rounded-full bg-blue-950 border border-blue-800 flex items-center justify-center text-xs text-blue-300">3</span>
              </div>
              <h3 className="text-base font-bold text-white">AI Triage & Route</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Validates against 7 closed verdicts. Minor formatting issues are routed for auto-apply; key changes are escalated for Faculty Review.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-blue-400 font-bold">STEP 04</span>
                <span className="w-6 h-6 rounded-full bg-blue-950 border border-blue-800 flex items-center justify-center text-xs text-blue-300">4</span>
              </div>
              <h3 className="text-base font-bold text-white">Faculty Approval & Fix</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Faculty inspects mathematical proof trace, compares Before/After surgical diff, and approves patch into the SQLite WAL audit ledger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Product Showcase Section */}
      <section id="showcase" className="py-20 bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold">
              Product Walkthrough
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
              An Enterprise Console Designed for Academic Rigor
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-2">
              Explore the real application views: from high-level operational metrics to mathematical proof traces.
            </p>
          </div>

          <ProductShowcase onNavigateToLogin={onNavigateToLogin} />
        </div>
      </section>

      {/* 7. Features Grid Section */}
      <section id="features" className="py-20 bg-[#0F172A]/70 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
              Engineered Specifically for Science & Mathematics QA
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
                <Calculator className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Independent Answer Verification</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Evaluates circuit impedance, electric flux, significant figures, and radioactive decay using SymPy symbolic mathematics.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Intelligent Report Classification</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Enforces a strict 7-verdict taxonomy (defect, no_error, display_issue, app_issue, language_mode, already_fixed, not_actionable).
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <Users2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Multi-Student Consensus</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Groups duplicate complaints for the same question, correlating reports across Android and Web to identify widespread assessment issues.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
                <Wrench className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Surgical Question Corrections</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Generates atomic, scope-restricted JSON patches (`stored_answer`, `options`, `solution`) preventing unintended modifications.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400">
                <FileSearch className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Faculty Approval Workflow</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Full reviewer console with MathML question stem preview, step-by-step LaTeX solution, and one-click Approve / Reject / Defer actions.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Complete Audit History</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                All decisions recorded in SQLite WAL mode with exact timestamps, reviewer identity, and before/after state diffs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Safety & Trust Section */}
      <section id="safety" className="py-20 bg-[#0B0F19] border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-blue-900/40 bg-gradient-to-b from-blue-950/30 to-[#0F172A] p-8 sm:p-12">
            <div className="max-w-3xl">
              <Badge variant="primary" className="text-xs font-mono mb-4">
                Academic Governance Standard
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                AI suggests. Faculty decides.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
                Acadza enforces strict pedagogical guardrails. The AI engine is prohibited from making unverified modifications to answer keys or question stems without explicit human sign-off.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 text-xs sm:text-sm text-slate-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Zero Hallucinations:</strong> Closed taxonomy rejects free-form AI repairs.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Prompt Injection Shield:</strong> Student feedback is treated as untrusted text.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Original Data Preserved:</strong> Benchmark datasets remain read-only.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Immutable Audit Ledger:</strong> Every patch is cryptographically traceable.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Final CTA */}
      <section className="py-20 bg-[#0F172A] border-t border-slate-800 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Make academic quality a continuous process.
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Bring student feedback, academic verification and faculty decisions into one unified workspace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Button
              size="lg"
              onClick={onNavigateToLogin}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-7 py-3 rounded-lg shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              Open Faculty Workspace
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection("showcase")}
              className="w-full sm:w-auto border-slate-700 text-slate-200 hover:bg-slate-800 font-semibold text-sm px-6 py-3 rounded-lg cursor-pointer"
            >
              Explore the Platform
            </Button>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="border-t border-slate-800 bg-[#0B0F19] py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              A
            </div>
            <span className="font-bold text-slate-300">Acadza Report → Fix</span>
            <span className="text-slate-600">|</span>
            <span>Better questions. Better learning.</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              How it works
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={onNavigateToLogin}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Faculty Sign In
            </button>
          </div>

          <div>
            © 2026 Acadza Inc. Built for Academic Quality Assurance.
          </div>
        </div>
      </footer>
    </div>
  )
}
