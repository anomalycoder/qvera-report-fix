import React from 'react'
import type { VerificationOutput } from '@/types/solver'
import { Badge } from '@/components/ui/badge'
import { Cpu, CheckCircle2, AlertTriangle, HelpCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface SolverTraceCardProps {
  solverData?: VerificationOutput | null
  isLoading?: boolean
}

export const SolverTraceCard: React.FC<SolverTraceCardProps> = ({ solverData, isLoading }) => {
  const [expanded, setExpanded] = React.useState(true)

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
        <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-2/3"></div>
      </div>
    )
  }

  if (!solverData) {
    return null
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center gap-1 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Sound
          </Badge>
        )
      case 'mismatch':
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-200 flex items-center gap-1 text-xs">
            <XCircle className="w-3.5 h-3.5" /> Mathematical Mismatch Detected
          </Badge>
        )
      case 'uncertain':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" /> Ambiguity / Uncertain
          </Badge>
        )
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-300 flex items-center gap-1 text-xs">
            <HelpCircle className="w-3.5 h-3.5" /> Unsupported Natural Language
          </Badge>
        )
    }
  }

  const confidencePercent = Math.round((solverData.confidence || 0) * 100)

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header bar */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-700">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
              Independent Mathematical & Domain Verifier
            </span>
            <span className="ml-2 text-[11px] text-slate-500 font-mono">
              Engine: {solverData.solver_method.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(solverData.verification_status)}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Answer Comparison Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-slate-200 bg-slate-50/50 rounded-lg p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Stored Answer Key
              </span>
              <div className="text-base font-bold text-slate-900 font-mono">
                {String(solverData.stored_answer ?? 'N/A')}
              </div>
            </div>

            <div className={`border rounded-lg p-3 ${
              solverData.verification_status === 'mismatch'
                ? 'border-emerald-300 bg-emerald-50/50'
                : 'border-slate-200 bg-slate-50/50'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                Independently Derived Answer
              </span>
              <div className="text-base font-bold text-emerald-900 font-mono">
                {String(solverData.independently_derived_answer ?? 'Could not derive')}
              </div>
            </div>

            <div className="border border-slate-200 bg-slate-50/50 rounded-lg p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Solution Text Answer
              </span>
              <div className="text-base font-bold text-slate-900 font-mono">
                {String(solverData.solution_answer ?? 'None')}
              </div>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">Verification Confidence (Conservative Metric):</span>
              <span className="font-bold text-slate-800 font-mono">{confidencePercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div
                className={`h-full transition-all duration-500 ${
                  confidencePercent >= 90
                    ? 'bg-emerald-500'
                    : confidencePercent >= 70
                    ? 'bg-blue-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
          </div>

          {/* Reasoning summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
              Automated Reasoning & Proof
            </span>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              {solverData.reasoning_summary}
            </p>
          </div>

          {/* Evidence bullets if available */}
          {solverData.evidence && solverData.evidence.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Supporting Evidence ({solverData.evidence.length}):
              </span>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
                {solverData.evidence.map((ev, idx) => (
                  <li key={idx} className="leading-snug">
                    {ev}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
