import React, { useState, useEffect } from 'react'
import type { ProposedEdit } from '@/types/triage'
import type { AuditLogEntry } from '@/types/audit'
import { Check, X, Edit3, ShieldCheck, History, Clock, UserCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AuditActionPanelProps {
  reportId: string
  questionId: string
  currentEdit?: ProposedEdit | null
  onOpenEditModal: () => void
  onActionComplete?: () => void
}

export const AuditActionPanel: React.FC<AuditActionPanelProps> = ({
  reportId,
  questionId,
  currentEdit,
  onOpenEditModal,
  onActionComplete,
}) => {
  const [facultyName, setFacultyName] = useState('Dr. A. Sharma (Senior Faculty)')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)

  const fetchLogs = async () => {
    setIsLoadingLogs(true)
    try {
      const res = await fetch(`/api/v1/audit/logs?question_id=${questionId}`)
      if (res.ok) {
        const data = await res.json()
        setAuditLogs(data)
      }
    } catch {
      // Ignore network errors in local dev
    } finally {
      setIsLoadingLogs(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    setFeedbackMsg(null)
    setNotes('')
  }, [questionId])

  const submitAction = async (actionType: 'approve' | 'reject') => {
    setIsSubmitting(true)
    setFeedbackMsg(null)

    try {
      const payload = {
        report_id: reportId,
        question_id: questionId,
        action: actionType,
        faculty_id: 'faculty_' + facultyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
        faculty_name: facultyName,
        notes: notes || (actionType === 'approve' ? 'Approved patch after verification' : 'Rejected proposal'),
        applied_edit: currentEdit || null,
      }

      const res = await fetch('/api/v1/audit/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setFeedbackMsg({
          type: 'success',
          text: `Action '${actionType.toUpperCase()}' successfully logged to SQLite audit ledger!`,
        })
        fetchLogs()
        if (onActionComplete) onActionComplete()
      } else {
        const err = await res.json()
        setFeedbackMsg({ type: 'error', text: err.detail || 'Failed to submit action' })
      }
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: e.message || 'Network error submitting action' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden space-y-0">
      {/* Header bar */}
      <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
            Faculty Governance & Audit Ledger
          </span>
        </div>
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-mono">
          Immutable SQLite WAL
        </Badge>
      </div>

      <div className="p-4 space-y-4">
        {/* Feedback message */}
        {feedbackMsg && (
          <div
            className={`p-3 rounded-lg text-xs font-medium ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedbackMsg.text}
          </div>
        )}

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Reviewing Faculty Name / Title
            </label>
            <div className="relative">
              <input
                type="text"
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <UserCheck className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Faculty Verification Rationale
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified SymPy derivation, distractor checked"
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Action Button Row */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={() => submitAction('approve')}
            disabled={isSubmitting}
            className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Approve & Commit Patch</span>
          </button>

          <button
            onClick={onOpenEditModal}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs shadow-xs transition disabled:opacity-50"
          >
            <Edit3 className="w-4 h-4" />
            <span>Adjust Patch</span>
          </button>

          <button
            onClick={() => submitAction('reject')}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs shadow-xs transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            <span>Reject Proposal</span>
          </button>
        </div>

        {/* Audit history list */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-500" />
              Question Audit Trail ({auditLogs.length})
            </span>
            <span className="text-[11px] text-slate-400 font-normal">Stored permanently in SQLite</span>
          </div>

          {isLoadingLogs ? (
            <div className="text-xs text-slate-400 py-2">Loading audit history...</div>
          ) : auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-1">
              No previous faculty actions recorded for this question yet.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-50 border border-slate-200 rounded-md p-2 text-xs flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        log.action === 'approve'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.action === 'reject'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="font-medium text-slate-800">{log.faculty_name}</span>
                    {log.notes && <span className="text-slate-500 truncate max-w-xs">&ldquo;{log.notes}&rdquo;</span>}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{log.created_at ? log.created_at.replace('T', ' ').substring(0, 16) : 'Just now'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
