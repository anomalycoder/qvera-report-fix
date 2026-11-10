import React from 'react'
import type { ProposedEdit } from '@/types/triage'
import { ShieldCheck, AlertTriangle, Check, X, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ApprovalConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  questionId: string
  reportId: string
  repairType?: string | null
  edit?: ProposedEdit | null
  confidence: number
  isSubmitting?: boolean
}

export const ApprovalConfirmModal: React.FC<ApprovalConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  questionId,
  reportId,
  repairType,
  edit,
  confidence,
  isSubmitting = false,
}) => {
  if (!isOpen) return null

  const findText = edit?.find !== undefined && edit?.find !== null ? String(edit.find) : String(edit?.old_value ?? 'N/A')
  const replaceText = edit?.replace !== undefined && edit?.replace !== null ? String(edit.replace) : String(edit?.new_value ?? 'N/A')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Confirm Surgical Correction</h3>
              <p className="text-xs text-slate-500">Human faculty authorization gate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Report Target</span>
              <span className="font-mono font-bold text-slate-800 text-xs">{reportId}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Question ID</span>
              <span className="font-mono text-slate-800 text-xs truncate block">{questionId.substring(0, 12)}...</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Taxonomy Repair</span>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px]">
                {repairType || 'answer_key'}
              </Badge>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Target Field</span>
              <span className="font-mono font-bold text-slate-800 text-xs">{edit?.field || 'answer'}</span>
            </div>
          </div>

          {/* Modification Preview */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Surgical Patch Parameters
            </span>
            <div className="grid grid-cols-1 gap-2">
              <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/50">
                <span className="text-[10px] font-bold text-rose-700 block mb-1">Old Value (Target)</span>
                <pre className="font-mono text-xs text-rose-900 whitespace-pre-wrap break-all">{findText}</pre>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50">
                <span className="text-[10px] font-bold text-emerald-700 block mb-1">New Value (Replacement)</span>
                <pre className="font-mono text-xs text-emerald-950 font-bold whitespace-pre-wrap break-all">{replaceText}</pre>
              </div>
            </div>
          </div>

          {/* Safety Verification Alert */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2.5 text-emerald-900">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Taxonomy Scope Verified:</strong> Field <code className="font-mono">{edit?.field}</code> is permitted under closed taxonomy rules.
              Applying this patch creates an immutable audit log entry in SQLite.
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Committing...' : 'Confirm & Commit Correction'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
