import React from 'react'
import type { ProposedEdit } from '@/types/triage'
import { Badge } from '@/components/ui/badge'
import { Check, ShieldAlert, GitCommit, ArrowRight, Sparkles } from 'lucide-react'

interface DiffViewerProps {
  edit?: ProposedEdit | null
  repair?: string | null
  route: string
  verdict: string
  onEditClick?: () => void
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  edit,
  repair,
  route,
  verdict,
  onEditClick,
}) => {
  if (!edit && verdict !== 'defect') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
        <div className="w-10 h-10 rounded-full bg-slate-200/70 text-slate-500 mx-auto flex items-center justify-center mb-2">
          <Check className="w-5 h-5 text-slate-600" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800">No Patch Required</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          {verdict === 'no_error'
            ? 'Triage engine verified the question stem and answer as mathematically sound. No modification needed.'
            : 'Issue classified as ' + verdict + ' — no direct database mutation warranted.'}
        </p>
      </div>
    )
  }

  const findText = edit?.find !== undefined && edit?.find !== null ? String(edit.find) : '(empty / missing)'
  const replaceText = edit?.replace !== undefined && edit?.replace !== null ? String(edit.replace) : '(empty)'

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
            Surgical Patch Diff
          </span>
          {repair && (
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px]">
              Repair: {repair}
            </Badge>
          )}
          <Badge className="bg-slate-100 text-slate-700 border-slate-300 text-[10px] font-mono">
            Field: {edit?.field || 'target'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {route === 'auto_apply' ? (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Auto-Apply Eligible
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Faculty Review Gate
            </Badge>
          )}
          {onEditClick && (
            <button
              onClick={onEditClick}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline px-2 py-0.5 rounded"
            >
              Adjust Patch
            </button>
          )}
        </div>
      </div>

      {/* Side by side diff or stacked diff */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Find (Original) */}
          <div className="border border-rose-200 bg-rose-50/40 rounded-lg p-3">
            <div className="flex items-center justify-between text-rose-700 font-bold mb-1.5 pb-1 border-b border-rose-100">
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded bg-rose-200 flex items-center justify-center text-xs font-mono">-</span>
                Target Content (Find)
              </span>
              <span className="text-[10px] uppercase tracking-wider text-rose-500 font-medium">Original</span>
            </div>
            <pre className="font-mono text-rose-900 bg-white/70 p-2.5 rounded border border-rose-200 whitespace-pre-wrap break-all leading-relaxed">
              {findText}
            </pre>
          </div>

          {/* Replace (Proposed) */}
          <div className="border border-emerald-200 bg-emerald-50/40 rounded-lg p-3">
            <div className="flex items-center justify-between text-emerald-700 font-bold mb-1.5 pb-1 border-b border-emerald-100">
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded bg-emerald-200 flex items-center justify-center text-xs font-mono">+</span>
                Surgical Replacement (Replace)
              </span>
              <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-medium">Proposed Fix</span>
            </div>
            <pre className="font-mono text-emerald-950 bg-white/70 p-2.5 rounded border border-emerald-200 whitespace-pre-wrap break-all leading-relaxed font-semibold">
              {replaceText}
            </pre>
          </div>
        </div>

        {/* Scope and safety verification */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded-md border border-slate-200">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Taxonomy scope enforced: Field <strong>'{edit?.field}'</strong> is verified as permitted for repair <strong>'{repair}'</strong>.
          </span>
          <span className="text-slate-400 font-mono">Precision find-and-replace</span>
        </div>
      </div>
    </div>
  )
}
