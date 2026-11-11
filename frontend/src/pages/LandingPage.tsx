import React, { useState } from "react"
import {
  ArrowRight,
  Menu,
  X,
  FileCode,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { WorklyOverlappingHero } from "@/components/hero/WorklyOverlappingHero"
import { CompleteWorkspaceSection } from "@/components/landing/CompleteWorkspaceSection"
import { AcadzaProcessSection } from "@/components/landing/AcadzaProcessSection"
import { AcadzaProblemSection } from "@/components/landing/AcadzaProblemSection"
import { AcadzaSmallCTASection } from "@/components/landing/AcadzaSmallCTASection"

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
  const [docsModalOpen, setDocsModalOpen] = useState(false)

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F8F3] text-[#111111] selection:bg-[#30343B]/15 selection:text-[#111111] font-sans antialiased overflow-x-hidden">
      {/* =========================================================================
          SECTION 01: NAVBAR (#F9F8F3 Background, Logo Shifted Right, Spaced Nav)
      ========================================================================= */}
      <header className="sticky top-0 left-0 right-0 z-50 bg-[#F9F8F3] h-[72px] sm:h-[76px] flex items-center">
        <div className="max-w-[1440px] mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-[74px] flex items-center justify-between">
          {/* Left Group: Logo + Product, Features, Workflow, Documentation on LEFT ONLY */}
          <div className="flex items-center">
            {/* Logo */}
            <div
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="cursor-pointer mr-12 lg:mr-14"
            >
              <span className="font-display font-semibold text-[23px] sm:text-[25px] tracking-tight text-[#111111]">
                QVERA
              </span>
            </div>

            {/* Navigation Links: ON LEFT SIDE with comfortable spacing between each */}
            <nav className="hidden md:flex items-center gap-10 lg:gap-12 text-[14px] font-medium text-[#555555]">
              <button
                onClick={() => scrollToSection("problem-section")}
                className="hover:text-[#111111] transition-colors cursor-pointer"
              >
                Product
              </button>
              <button
                onClick={() => scrollToSection("proof-engine-section")}
                className="hover:text-[#111111] transition-colors cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("workflow-section")}
                className="hover:text-[#111111] transition-colors cursor-pointer"
              >
                Workflow
              </button>
              <button
                onClick={() => setDocsModalOpen(true)}
                className="hover:text-[#111111] transition-colors cursor-pointer"
              >
                Documentation
              </button>
            </nav>
          </div>

          {/* Right Action Cluster: Log in and Sign up with comfortable spacing between */}
          <div className="hidden md:flex items-center gap-10 lg:gap-12">
            <button
              onClick={onNavigateToLogin}
              className="text-[14px] font-medium text-[#555555] hover:text-[#111111] transition-colors cursor-pointer"
            >
              Log in
            </button>
            <button
              onClick={isAuthenticated ? onNavigateToDashboard : onNavigateToLogin}
              className="h-[42px] px-5 rounded-[8px] bg-[#090B0E] hover:bg-[#1f2227] text-white text-[14px] font-medium flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
            >
              <span>Sign up</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#666666] hover:text-[#111111] rounded-lg border border-[#DDDDDD] bg-[#FFFFFF] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-[72px] left-0 right-0 bg-[#F9F8F3] border-b border-[#DDDDDD] px-6 pt-3 pb-6 space-y-3 shadow-lg z-50">
            <button
              onClick={() => scrollToSection("problem-section")}
              className="block w-full text-left text-sm text-[#666666] py-2"
            >
              Product
            </button>
            <button
              onClick={() => scrollToSection("proof-engine-section")}
              className="block w-full text-left text-sm text-[#666666] py-2"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("workflow-section")}
              className="block w-full text-left text-sm text-[#666666] py-2"
            >
              Workflow
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                setDocsModalOpen(true)
              }}
              className="block w-full text-left text-sm text-[#666666] py-2"
            >
              Documentation
            </button>
            <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-between">
              <button
                onClick={onNavigateToLogin}
                className="text-sm text-[#666666]"
              >
                Log in
              </button>
              <button
                onClick={onNavigateToLogin}
                className="h-[40px] px-5 rounded-[8px] bg-[#090B0E] text-white text-sm font-medium"
              >
                Sign up
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          SECTION 01: HERO — FLOATING PRODUCT SHOWCASE (WORKLY-STYLE COMPOSITION)
      ========================================================================= */}
      <WorklyOverlappingHero
        onNavigateToLogin={onNavigateToLogin}
        onNavigateToDashboard={onNavigateToDashboard}
        isAuthenticated={isAuthenticated}
      />

      {/* =========================================================================
          SECTION 01.25: THE PROCESS — HOW ACADZA WORKS (COOL CONNECTED PIPELINE)
      ========================================================================= */}
      <AcadzaProcessSection />

      {/* =========================================================================
          SECTION 03: A COMPLETE REVIEW WORKSPACE (BENTO GRID REFERENCE MATCH)
      ========================================================================= */}
      <CompleteWorkspaceSection
        onExploreFeatures={() => scrollToSection("problem-section")}
      />

      {/* =========================================================================
          SECTION 04: SHIP WITH CONFIDENCE (SIDE-BY-SIDE RECTANGULAR BOXES)
      ========================================================================= */}
      <AcadzaProblemSection />

      {/* =========================================================================
          SECTION 04.5: SMALL CTA SECTION (WITH THE GREY THING)
      ========================================================================= */}
      <AcadzaSmallCTASection
        onNavigateToLogin={onNavigateToLogin}
        onNavigateToDashboard={onNavigateToDashboard}
        isAuthenticated={isAuthenticated}
      />

      {/* =========================================================================
          SECTION 05: INSTITUTIONAL FOOTER (MATCHING SEAMLESS CANVAS)
      ========================================================================= */}
      <footer className="w-full bg-[#F9F8F3] border-t border-[#E2DFD6] pt-14 pb-12 select-none">
        <div className="max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#EAE6DD]">
            {/* Column 1: Brand & Description (5 cols) */}
            <div className="md:col-span-5 space-y-4 text-left">
              <div
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="cursor-pointer inline-block"
              >
                <span className="font-display font-semibold text-[24px] tracking-tight text-[#111111]">
                  QVERA
                </span>
              </div>
              <p className="text-[13.5px] text-[#666666] leading-[1.65] font-sans max-w-[360px]">
                Deterministic mathematical examination verification platform. Auditing, verifying, and resolving contested question stems for JEE, NEET, and academic councils.
              </p>
              <div className="flex items-center gap-2 pt-2 text-[11px] font-mono text-[#555555]">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                <span>SymPy CAS Engine v1.12 Active · SQLite WAL Verified</span>
              </div>
            </div>

            {/* Column 2: Platform Links (2 cols) */}
            <div className="md:col-span-2 space-y-3 text-left">
              <h4 className="text-[12px] font-semibold text-[#111111] uppercase tracking-wider font-mono">
                Platform
              </h4>
              <ul className="space-y-2.5 text-[13.5px] text-[#666666]">
                <li>
                  <button onClick={() => scrollToSection("workflow-section")} className="hover:text-[#111111] transition-colors cursor-pointer">
                    Process Flow
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("workspace-features-section")} className="hover:text-[#111111] transition-colors cursor-pointer">
                    Review Suite
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("problem-section")} className="hover:text-[#111111] transition-colors cursor-pointer">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={onNavigateToLogin} className="hover:text-[#111111] transition-colors cursor-pointer">
                    Faculty Portal
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Verification (2 cols) */}
            <div className="md:col-span-2 space-y-3 text-left">
              <h4 className="text-[12px] font-semibold text-[#111111] uppercase tracking-wider font-mono">
                Verification
              </h4>
              <ul className="space-y-2.5 text-[13.5px] text-[#666666]">
                <li>
                  <button onClick={() => setDocsModalOpen(true)} className="hover:text-[#111111] transition-colors cursor-pointer">
                    Architecture &amp; API
                  </button>
                </li>
                <li>
                  <button onClick={() => setDocsModalOpen(true)} className="hover:text-[#111111] transition-colors cursor-pointer">
                    Closed Taxonomy
                  </button>
                </li>
                <li>
                  <button onClick={() => setDocsModalOpen(true)} className="hover:text-[#111111] transition-colors cursor-pointer">
                    SymPy Rules
                  </button>
                </li>
                <li>
                  <button onClick={() => setDocsModalOpen(true)} className="hover:text-[#111111] transition-colors cursor-pointer">
                    WAL Ledger
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Quick Action (3 cols) */}
            <div className="md:col-span-3 space-y-3.5 text-left">
              <h4 className="text-[12px] font-semibold text-[#111111] uppercase tracking-wider font-mono">
                Faculty Access
              </h4>
              <p className="text-[12.5px] text-[#666666] leading-relaxed">
                Log in to the institutional console to review contested questions and approve verified surgical patches.
              </p>
            </div>
          </div>

          {/* Bottom Copyright & Legal Row */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[#777777]">
            <p>© 2026 QVERA Systems. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-[#111111] transition-colors cursor-pointer">Security Policy</span>
              <span className="hover:text-[#111111] transition-colors cursor-pointer">Taxonomy Governance</span>
              <span className="hover:text-[#111111] transition-colors cursor-pointer">Referential Integrity</span>
            </div>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          DOCUMENTATION MODAL (Radix Dialog in Clean Light Styling)
      ========================================================================= */}
      <Dialog open={docsModalOpen} onOpenChange={setDocsModalOpen}>
        <DialogContent className="max-w-3xl bg-[#FFFFFF] border border-[#E6E8EC] rounded-2xl p-6 sm:p-8 max-h-[85vh] overflow-y-auto text-[#17243A] shadow-2xl">
          <DialogHeader className="pb-4 border-b border-[#F0F2F5]">
            <DialogTitle className="font-display text-xl font-bold text-[#17243A] flex items-center gap-2">
              <FileCode className="w-5 h-5 text-[#4169E1]" />
              <span>QVERA Architecture & API Reference</span>
            </DialogTitle>
            <DialogDescription className="text-xs font-mono text-[#687386]">
              System specifications, mathematical derivation pipeline, and API endpoints.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4 text-xs leading-relaxed">
            <div>
              <h4 className="font-display font-bold text-sm text-[#17243A] mb-1">
                1. System Architecture & Dataset Integrity
              </h4>
              <p className="text-[#687386]">
                QVERA operates on 43 production questions and 44 student error reports. 100% referential integrity is verified with 0 orphaned records. Reports originate from Android (59.1%), iOS (20.5%), and Web (20.5%).
              </p>
            </div>

            <div>
              <h4 className="font-display font-bold text-sm text-[#17243A] mb-1">
                2. Closed Taxonomy Governance
              </h4>
              <p className="text-[#687386] mb-2">
                All triage results conform strictly to the 7 verdicts and 18 surgical repair types defined in <code className="font-mono bg-[#F7F7F5] px-1 py-0.5 rounded border border-[#E6E8EC] text-[#4169E1]">data/taxonomy.json</code>.
              </p>
              <div className="p-3 bg-[#F7F7F5] rounded-xl border border-[#E6E8EC] font-mono text-[11px] space-y-1 text-[#687386]">
                <div>• Verdicts: defect, no_error, display_issue, app_issue, language_mode, already_fixed, not_actionable</div>
                <div>• Allowed Field Guards: answer_key mutates only [answer, solution], never [questionType]</div>
              </div>
            </div>

            <div>
              <h4 className="font-display font-bold text-sm text-[#17243A] mb-1">
                3. Mathematical Verification Engine
              </h4>
              <p className="text-[#687386]">
                The SymPy integration verifies phasor additions, Gauss's law flux summations, optics formulas, and significant figures. Automated patches are gated at ≥ 0.80 confidence with <code className="font-mono bg-[#F7F7F5] px-1 py-0.5 rounded border border-[#E6E8EC] text-[#22A47A]">repair.auto == true</code>.
              </p>
            </div>

            <div>
              <h4 className="font-display font-bold text-sm text-[#17243A] mb-1">
                4. Production REST API Endpoints
              </h4>
              <div className="p-3 bg-[#F7F7F5] rounded-xl border border-[#E6E8EC] font-mono text-[11px] space-y-1.5 text-[#687386]">
                <div><span className="text-[#22A47A] font-bold">GET</span> /api/v1/faculty/overview — Real dashboard statistics</div>
                <div><span className="text-[#22A47A] font-bold">GET</span> /api/v1/faculty/queue — Filtered and sorted review queue</div>
                <div><span className="text-[#22A47A] font-bold">GET</span> /api/v1/faculty/review/{'{report_id}'} — Detailed workspace payload</div>
                <div><span className="text-[#4169E1] font-bold">POST</span> /api/v1/faculty/approve/{'{report_id}'} — Commit approved surgical patch</div>
                <div><span className="text-[#DB6464] font-bold">POST</span> /api/v1/faculty/reject/{'{report_id}'} — Reject proposed change</div>
                <div><span className="text-[#D69A3C] font-bold">POST</span> /api/v1/faculty/defer/{'{report_id}'} — Defer for specialist review</div>
                <div><span className="text-[#22A47A] font-bold">GET</span> /api/v1/faculty/audit — Chronological SQLite WAL audit ledger</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
