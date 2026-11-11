import React, { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  ShieldCheck,
  CheckCircle2,
  Users2,
  Calculator,
  Play,
  Copy,
  Check,
  Terminal,
  Layers,
  ArrowRight,
  Lock,
  GitBranch,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { MathContent } from "@/components/MathContent"
import { PhasorDiagramSvg } from "@/components/math/PhasorDiagramSvg"

export interface CaseStudy {
  id: string
  title: string
  questionId: string
  tag: string
  subject: string
  stem: string
  options: { key: string; label: string; isCorrect: boolean; isOriginalKey?: boolean }[]
  storedAnswer: string
  correctAnswer: string
  reportsCount: number
  sympySteps: { step: string; expr: string; status: "ok" | "defect" }[]
  confidence: string
  taxonomyScope: string
  repairCategory: string
  hasPhasorDiagram?: boolean
}

interface AnatomyHeroVisualProps {
  cases: CaseStudy[]
  selectedCaseIndex: number
  onSelectCase: (index: number) => void
  userSelectedOption: string | null
  onSelectOption: (key: string) => void
  isSolving: boolean
  solverStepIndex: number
  onRunSolver: () => void
  isCommitted: boolean
  onCommitPatch: () => void
  onCopyId: (id: string) => void
  copiedId: boolean
}

export const AnatomyHeroVisual: React.FC<AnatomyHeroVisualProps> = ({
  cases,
  selectedCaseIndex,
  onSelectCase,
  userSelectedOption,
  onSelectOption,
  isSolving,
  solverStepIndex,
  onRunSolver,
  isCommitted,
  onCommitPatch,
  onCopyId,
  copiedId,
}) => {
  const currentCase = cases[selectedCaseIndex]
  const [activeLayer, setActiveLayer] = useState<"all" | "question" | "report" | "sympy" | "diff" | "faculty">("all")

  return (
    <div className="relative rounded-2xl bg-[#101C32] border border-[#8EB5FF]/20 shadow-[0_25px_60px_-15px_rgba(8,13,25,0.9)] overflow-hidden">
      {/* Top Window Chrome */}
      <div className="bg-[#080D19] border-b border-[#8EB5FF]/15 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Terminal Title & Traffic Lights */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F87171] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#34D399] inline-block" />
          </div>
          <span className="font-mono text-[11px] text-[#AAB6CC] ml-2 hidden sm:inline">
            qvera://anatomy/{currentCase.questionId.slice(0, 12)}...
          </span>
        </div>

        {/* Case Study Switcher Pills */}
        <div className="flex items-center gap-1 bg-[#182C4D]/80 p-1 rounded-lg border border-[#8EB5FF]/20">
          {cases.map((c, idx) => (
            <button
              key={c.id}
              onClick={() => onSelectCase(idx)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
                selectedCaseIndex === idx
                  ? "bg-[#527CFF] text-[#FFFFFF] shadow-xs"
                  : "text-[#AAB6CC] hover:text-[#F4F6FC]"
              }`}
            >
              {c.id === "case-physics" ? "Physics" : c.id === "case-math" ? "Math" : "Chemistry"}
            </button>
          ))}
        </div>

        {/* Actions & Live Telemetry */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCopyId(currentCase.questionId)}
            className="craft-button inline-flex items-center gap-1 text-[11px] font-mono text-[#AAB6CC] hover:text-[#F4F6FC] bg-[#182C4D] border border-[#8EB5FF]/20 px-2.5 py-1 rounded cursor-pointer"
            title="Copy Question ID"
          >
            {copiedId ? <Check className="w-3 h-3 text-[#34D399]" /> : <Copy className="w-3 h-3" />}
            <span>{copiedId ? "Copied" : "Copy ID"}</span>
          </button>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-[#34D399] bg-[#34D399]/10 px-2.5 py-1 rounded border border-[#34D399]/25">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>CAS Verified</span>
          </span>
        </div>
      </div>

      {/* Anatomy Navigation Layer Selector */}
      <div className="bg-[#101C32]/95 border-b border-[#8EB5FF]/10 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-[#AAB6CC] overflow-x-auto">
        <span className="flex items-center gap-1.5 shrink-0 text-[#8EB5FF] font-bold">
          <Layers className="w-3.5 h-3.5" />
          <span>The Anatomy of a Question:</span>
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {[
            { id: "all", label: "00 Unified" },
            { id: "question", label: "01 Stem" },
            { id: "report", label: "02 Report" },
            { id: "sympy", label: "03 Proof" },
            { id: "diff", label: "04 Patch" },
            { id: "faculty", label: "05 WAL" },
          ].map((lyr) => (
            <button
              key={lyr.id}
              onClick={() => setActiveLayer(lyr.id as any)}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                activeLayer === lyr.id
                  ? "bg-[#527CFF]/20 text-[#58D6E8] border border-[#58D6E8]/30 font-bold"
                  : "text-[#AAB6CC] hover:text-[#F4F6FC]"
              }`}
            >
              {lyr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layered Specimen Canvas */}
      <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 text-left">
        {/* Left Sub-Column (Col 7): Question Stem, Interactive Choices & Phasor SVG */}
        <div className="lg:col-span-7 space-y-4">
          {/* Header Metadata */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#8EB5FF]/15">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#F4F6FC] bg-[#182C4D] px-2 py-0.5 rounded border border-[#8EB5FF]/20">
                {currentCase.tag}
              </span>
              <span className="text-xs font-medium text-[#AAB6CC]">
                {currentCase.title}
              </span>
            </div>
            <span className="text-[11px] font-mono font-semibold text-[#F87171] bg-[#F87171]/10 px-2 py-0.5 rounded border border-[#F87171]/25 flex items-center gap-1">
              <Users2 className="w-3 h-3" />
              <span>{currentCase.reportsCount} Student Reports</span>
            </span>
          </div>

          {/* Layer 1: Question Stem Card */}
          <div className="p-4 rounded-xl bg-[#080D19]/90 border border-[#8EB5FF]/20 space-y-3">
            <div className="text-xs text-[#F4F6FC] font-sans leading-relaxed">
              <MathContent content={currentCase.stem} />
            </div>

            {/* Interactive Choices Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-xs">
              {currentCase.options.map((opt) => {
                const isChosen = userSelectedOption === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => onSelectOption(opt.key)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                      opt.isCorrect
                        ? "bg-[#34D399]/10 border-[#34D399]/40 text-[#34D399] font-bold"
                        : opt.isOriginalKey
                        ? "bg-[#F87171]/10 border-[#F87171]/40 text-[#F87171]"
                        : "bg-[#182C4D]/60 border-[#8EB5FF]/15 text-[#AAB6CC] hover:border-[#8EB5FF]/40 hover:text-[#F4F6FC]"
                    } ${isChosen ? "ring-2 ring-[#527CFF]" : ""}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-bold">({opt.key})</span>
                      <MathContent content={opt.label} />
                    </span>
                    {opt.isCorrect ? (
                      <span className="text-[10px] font-bold bg-[#34D399]/20 px-1.5 py-0.5 rounded text-[#34D399]">
                        Verified
                      </span>
                    ) : opt.isOriginalKey ? (
                      <span className="text-[10px] font-bold bg-[#F87171]/20 px-1.5 py-0.5 rounded text-[#F87171] line-through">
                        Flawed Key
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Layer 2: Phasor Vector Geometry (Physics Case) */}
          {currentCase.hasPhasorDiagram && (
            <PhasorDiagramSvg vr={40} vl={60} vc={30} vNet={50} />
          )}

          {/* Layer 3: Surgical Mutation Diff Strip */}
          <div className="p-3.5 rounded-xl bg-[#080D19]/80 border border-[#8EB5FF]/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#AAB6CC]">
                Layer 04 · Surgical Mutation Preview
              </span>
              <span className="text-[10px] font-mono text-[#58D6E8] bg-[#58D6E8]/10 px-2 py-0.5 rounded border border-[#58D6E8]/20">
                scope: {currentCase.taxonomyScope} (stem locked)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-[#F87171] bg-[#F87171]/10 px-2.5 py-1 rounded line-through border border-[#F87171]/20">
                - answer: "{currentCase.storedAnswer}"
              </span>
              <span className="text-[#AAB6CC]">→</span>
              <span className="text-[#34D399] bg-[#34D399]/10 px-2.5 py-1 rounded font-bold border border-[#34D399]/25">
                + answer: "{currentCase.correctAnswer}"
              </span>
            </div>
          </div>
        </div>

        {/* Right Sub-Column (Col 5): SymPy CAS Proof Terminal & Governance Seal */}
        <div className="lg:col-span-5 space-y-4 bg-[#080D19]/90 p-4 sm:p-5 rounded-xl border border-[#8EB5FF]/20 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#8EB5FF]/15">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#F4F6FC] flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-[#58D6E8]" />
                <span>SymPy CAS Derivation</span>
              </span>
              <button
                onClick={onRunSolver}
                disabled={isSolving}
                className="craft-button inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#58D6E8] bg-[#182C4D] border border-[#8EB5FF]/20 px-2 py-1 rounded hover:bg-[#182C4D]/80 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3 h-3 text-[#58D6E8]" />
                <span>{isSolving ? "Evaluating..." : "Re-Run Proof"}</span>
              </button>
            </div>

            {/* Terminal Monospace Trace */}
            <div className="p-3 rounded-lg bg-[#101C32] border border-[#8EB5FF]/15 text-[11px] font-mono text-[#F4F6FC] space-y-2 min-h-[170px]">
              {currentCase.sympySteps.slice(0, solverStepIndex).map((st, i) => (
                <div
                  key={i}
                  className={`p-1.5 rounded ${
                    st.status === "defect"
                      ? "bg-[#F87171]/10 text-[#F87171] font-bold border border-[#F87171]/25"
                      : "text-[#AAB6CC]"
                  }`}
                >
                  <div className="text-[10px] text-[#58D6E8] uppercase tracking-wider">
                    Step 0{i + 1} · {st.step}
                  </div>
                  <div className="mt-0.5 text-[#F4F6FC] font-medium">{st.expr}</div>
                </div>
              ))}
            </div>

            {/* Diagnostic Metrics Matrix */}
            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#AAB6CC]">Taxonomy Verdict</span>
                <span className="font-semibold text-[#F4F6FC]">defect / {currentCase.repairCategory}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#AAB6CC]">SymPy Confidence</span>
                <span className="text-[#34D399] font-bold">{currentCase.confidence}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#AAB6CC]">Ledger Destination</span>
                <span className="text-[#8EB5FF]">SQLite WAL #L041</span>
              </div>
            </div>
          </div>

          {/* Layer 5: Faculty Signature & Commit Button */}
          <div className="pt-3 border-t border-[#8EB5FF]/15">
            {isCommitted ? (
              <div className="p-3 rounded-lg bg-[#34D399]/10 border border-[#34D399]/30 text-center space-y-1">
                <div className="text-xs font-mono font-bold text-[#34D399] flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                  <span>Committed to SQLite Write-Ahead Log</span>
                </div>
                <div className="text-[10px] font-mono text-[#AAB6CC]">
                  Signer: Dr. A. Sharma (Faculty) · SHA-256 Validated
                </div>
              </div>
            ) : (
              <Button
                onClick={onCommitPatch}
                className="craft-button w-full bg-[#527CFF] hover:bg-[#4169E1] text-[#FFFFFF] text-xs font-mono font-semibold py-2.5 rounded-lg shadow-xs flex items-center justify-center gap-2 border border-[#8EB5FF]/30 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#FFFFFF]" />
                <span>Authorize & Commit Surgical Patch</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
