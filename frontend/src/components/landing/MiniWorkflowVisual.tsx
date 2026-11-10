import React, { useState, useEffect } from "react"
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  FileCheck2,
  Atom,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface StepData {
  id: number
  title: string
  subtitle: string
  badge: string
  badgeVariant: "destructive" | "warning" | "primary" | "success"
  icon: React.ReactNode
}

const steps: StepData[] = [
  {
    id: 1,
    title: "Student Report",
    subtitle: "Untrusted feedback flagged on Android app",
    badge: "Report #R001",
    badgeVariant: "warning",
    icon: <AlertCircle className="w-4 h-4 text-amber-400" />,
  },
  {
    id: 2,
    title: "SymPy Solver",
    subtitle: "Independent symbolic physics calculation",
    badge: "Proof Derived",
    badgeVariant: "primary",
    icon: <Calculator className="w-4 h-4 text-blue-400" />,
  },
  {
    id: 3,
    title: "AI Triage",
    subtitle: "Closed taxonomy classification & surgical diff",
    badge: "L1 Critical Review",
    badgeVariant: "destructive",
    icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
  },
  {
    id: 4,
    title: "Verified Fix",
    subtitle: "Faculty approved and locked in audit ledger",
    badge: "Committed to WAL",
    badgeVariant: "success",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  },
]

export const MiniWorkflowVisual: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1)
  const [isPaused, setIsPaused] = useState<boolean>(false)

  // Auto-cycle through steps every 3.8s unless hovered
  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev % 4) + 1)
    }, 3800)
    return () => clearInterval(interval)
  }, [isPaused])

  return (
    <div
      className="relative rounded-2xl border border-slate-700/60 bg-[#111827]/90 p-5 sm:p-7 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-blue-500/40"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Top Bar with Window Controls */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          <span className="text-xs font-mono text-slate-400 ml-2">
            acadza-runtime-engine // pipeline-flow
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real Dataset Demonstration</span>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {steps.map((s) => {
          const isActive = activeStep === s.id
          const isPassed = activeStep > s.id
          return (
            <button
              key={s.id}
              onClick={() => setActiveStep(s.id)}
              className={`text-left p-2.5 rounded-lg border transition-all text-xs font-medium cursor-pointer ${
                isActive
                  ? "bg-blue-950/60 border-blue-500/70 text-white shadow-sm ring-1 ring-blue-500/50"
                  : isPassed
                  ? "bg-slate-900/50 border-slate-700/60 text-slate-300 hover:bg-slate-800/50"
                  : "bg-slate-900/30 border-slate-800/60 text-slate-500 hover:bg-slate-800/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] text-slate-400">0{s.id}</span>
                {s.icon}
              </div>
              <div className="font-semibold truncate">{s.title}</div>
            </button>
          )
        })}
      </div>

      {/* Active Step Dynamic Card Content */}
      <div className="min-h-[220px] bg-slate-950/70 rounded-xl border border-slate-800/80 p-4 sm:p-5 text-slate-200">
        {activeStep === 1 && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <Badge variant="warning" className="text-xs font-mono">
                Student Report #R001
              </Badge>
              <span className="text-xs text-slate-400">Source: Android App</span>
            </div>
            <div className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Atom className="w-4 h-4 text-blue-400" />
              <span>Question Q001 — JEE Main (LCR Series Circuit)</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-md p-3 text-xs text-slate-300 font-mono leading-relaxed">
              &quot;In resonance condition, impedance should be equal to resistance (R = 50Ω). Stored answer key says Option B (100Ω). Please re-verify!&quot;
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Security Check: No prompt injection detected</span>
              <span className="text-amber-400 font-semibold">Triage Status: Ingested</span>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <Badge variant="primary" className="text-xs font-mono">
                Independent SymPy Solver
              </Badge>
              <span className="text-xs text-blue-400 font-mono">Status: MISMATCH</span>
            </div>
            <div className="text-sm font-semibold text-white">
              Symbolic Impedance Derivation
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-md p-3 text-xs font-mono text-slate-300 space-y-1.5">
              <div className="text-slate-400">Equation: Z = sqrt(R^2 + (X_L - X_C)^2)</div>
              <div>Values: R = 50, X_L = 120, X_C = 120</div>
              <div className="text-emerald-400 font-bold">
                Derived Z = sqrt(2500 + 0) = 50 Ω (Option A)
              </div>
              <div className="text-rose-400">Stored Answer: Option B (100 Ω)</div>
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Solver Execution: 4ms</span>
              <span className="text-blue-300 font-semibold">Verification: Mathematical Proof</span>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <Badge variant="destructive" className="text-xs font-mono">
                AI Triage & Route
              </Badge>
              <span className="text-xs text-red-400 font-mono">Urgency: L1 Critical</span>
            </div>
            <div className="text-sm font-semibold text-white">
              Taxonomy Classification: answer_key defect
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-md p-3 text-xs font-mono space-y-1.5">
              <div className="flex items-center justify-between text-slate-400">
                <span>Proposed Surgical Patch:</span>
                <span className="text-amber-300">field: &apos;stored_answer&apos;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/60 line-through">
                  stored: &quot;B&quot;
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60 font-bold">
                  proposed: &quot;A&quot;
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Route: faculty_review</span>
              <span className="text-rose-400 font-semibold">Auto-apply blocked (Human in loop)</span>
            </div>
          </div>
        )}

        {activeStep === 4 && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <Badge variant="success" className="text-xs font-mono">
                Faculty Approval & Fix
              </Badge>
              <span className="text-xs text-emerald-400 font-mono">State: RESOLVED</span>
            </div>
            <div className="text-sm font-semibold text-white flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Reviewer: Dr. A. Sharma (Physics Faculty)</span>
            </div>
            <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-md p-3 text-xs font-mono text-emerald-200 space-y-1">
              <div>Action: APPROVE_CORRECTION</div>
              <div>Audit Log ID: #449 | SQLite WAL Committed</div>
              <div>Question Q001 Answer Updated: Option A (50Ω)</div>
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Impact: 142 affected student grades corrected</span>
              <span className="text-emerald-400 font-semibold">Zero Hallucinations</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Progress Bar */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>Click tabs above or pause on hover</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map((stepNum) => (
            <div
              key={stepNum}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeStep === stepNum ? "w-6 bg-blue-500" : "w-2 bg-slate-700"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
