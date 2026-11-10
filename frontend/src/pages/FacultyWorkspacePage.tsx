import React, { useState, useEffect } from 'react'
import type { ProposedEdit } from '@/types/triage'
import { QuestionViewer } from '@/components/FacultyConsole/QuestionViewer'
import { SolverTraceCard } from '@/components/FacultyConsole/SolverTraceCard'
import { DiffViewer } from '@/components/FacultyConsole/DiffViewer'
import { StudentReplyCard } from '@/components/FacultyConsole/StudentReplyCard'
import { PatchEditModal } from '@/components/FacultyConsole/PatchEditModal'
import { ApprovalConfirmModal } from '@/components/FacultyConsole/ApprovalConfirmModal'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  X,
  Edit3,
  Clock,
  ShieldCheck,
  AlertTriangle,
  History,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  UserCheck
} from 'lucide-react'

interface FacultyWorkspacePageProps {
  reportId: string
  onBackToQueue: () => void
}

export const FacultyWorkspacePage: React.FC<FacultyWorkspacePageProps> = ({
  reportId,
  onBackToQueue,
}) => {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Custom edit state if faculty modifies patch
  const [customEdit, setCustomEdit] = useState<ProposedEdit | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)

  // Faculty inputs
  const [facultyName, setFacultyName] = useState('Dr. A. Sharma (Senior Physics Faculty)')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchWorkspaceData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/faculty/review/${reportId}`)
      if (!res.ok) throw new Error(`Failed to load review data for report ${reportId}`)
      const json = await res.json()
      setData(json)
      setCustomEdit(json.triage_recommendation.edit || null)
    } catch (err: any) {
      setError(err.message || 'Error communicating with backend')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkspaceData()
    setActionFeedback(null)
    setNotes('')
  }, [reportId])

  const handleApprove = async () => {
    setIsSubmitting(true)
    setActionFeedback(null)
    try {
      const res = await fetch(`/api/v1/faculty/approve/${reportId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faculty_id: 'faculty_' + facultyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
          faculty_name: facultyName,
          notes: notes || 'Correction verified and approved by faculty.',
          custom_edit: customEdit,
        }),
      })

      if (res.ok) {
        setIsConfirmModalOpen(false)
        setActionFeedback({
          type: 'success',
          message: 'Correction successfully approved and committed to persistent SQLite audit ledger!',
        })
        fetchWorkspaceData()
      } else {
        const err = await res.json()
        setActionFeedback({ type: 'error', message: err.detail || 'Failed to approve correction' })
        setIsConfirmModalOpen(false)
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Network error approving correction' })
      setIsConfirmModalOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    setIsSubmitting(true)
    setActionFeedback(null)
    try {
      const res = await fetch(`/api/v1/faculty/reject/${reportId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faculty_id: 'faculty_' + facultyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
          faculty_name: facultyName,
          notes: notes || 'Proposal rejected after review.',
        }),
      })

      if (res.ok) {
        setActionFeedback({
          type: 'success',
          message: 'Correction proposal rejected. Question preserved unchanged.',
        })
        fetchWorkspaceData()
      } else {
        const err = await res.json()
        setActionFeedback({ type: 'error', message: err.detail || 'Failed to reject correction' })
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Network error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDefer = async () => {
    setIsSubmitting(true)
    setActionFeedback(null)
    try {
      const res = await fetch(`/api/v1/faculty/defer/${reportId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faculty_id: 'faculty_' + facultyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
          faculty_name: facultyName,
          notes: notes || 'Deferred for specialist faculty review.',
        }),
      })

      if (res.ok) {
        setActionFeedback({
          type: 'success',
          message: 'Review deferred. Item retained in queue for specialist review.',
        })
        fetchWorkspaceData()
      } else {
        const err = await res.json()
        setActionFeedback({ type: 'error', message: err.detail || 'Failed to defer review' })
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Network error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-300" />
        <p className="text-xs">Loading complete review workspace and SymPy proofs...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="font-bold text-rose-900 text-sm">Failed to Load Question Workspace</h3>
        <p className="text-xs text-rose-700">{error || 'Unknown error'}</p>
        <button
          onClick={onBackToQueue}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
        >
          Back to Queue
        </button>
      </div>
    )
  }

  const isApproved = data.review_status === 'approved'
  const isRejected = data.review_status === 'rejected'
  const isDeferred = data.review_status === 'deferred'

  return (
    <div className="space-y-5">
      {/* Top Breadcrumb & Status Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToQueue}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Back to Review Queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-900 text-sm">
                Target: Report {data.report.reportId}
              </span>
              <span className="text-slate-400">&bull;</span>
              <span className="font-mono text-xs text-slate-500">
                QID: {data.report.questionId}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Reported via {data.report.source} on {data.report.reportedAt ? data.report.reportedAt.substring(0, 10) : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isApproved ? (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs flex items-center gap-1 font-bold">
              <Check className="w-3.5 h-3.5" /> Approved by Faculty
            </Badge>
          ) : isRejected ? (
            <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-xs flex items-center gap-1 font-bold">
              <X className="w-3.5 h-3.5" /> Rejected by Faculty
            </Badge>
          ) : isDeferred ? (
            <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs flex items-center gap-1 font-bold">
              <Clock className="w-3.5 h-3.5" /> Deferred for Specialist
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs flex items-center gap-1 font-bold">
              <Clock className="w-3.5 h-3.5" /> Pending Faculty Decision
            </Badge>
          )}
        </div>
      </div>

      {/* Action feedback banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {actionFeedback.message}
        </div>
      )}

      {/* 2-Column Faculty Workbench Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Question and Student Evidence (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <QuestionViewer
            question={data.question.normalized}
            reports={data.peer_reports}
            proposedAnswer={customEdit?.field === 'answer' ? customEdit.replace : undefined}
            currentAnswer={data.question.normalized.stored_answer}
          />
        </div>

        {/* RIGHT COLUMN: AI Analysis & Faculty Decision (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* SymPy Proof & Independent Solver Card */}
          <SolverTraceCard solverData={data.solver_verification} />

          {/* Surgical Diff Viewer */}
          <DiffViewer
            edit={customEdit}
            repair={data.triage_recommendation.repair}
            route={data.triage_recommendation.route}
            verdict={data.triage_recommendation.verdict}
            onEditClick={() => setIsEditModalOpen(true)}
          />

          {/* Student Response Preview Card */}
          <StudentReplyCard
            reply={data.triage_recommendation.student_reply}
            reportId={data.report.reportId}
          />

          {/* Faculty Decision & Action Panel */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Faculty Action Controls
                </span>
              </div>
              <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] font-mono">
                Atomic SQLite WAL
              </Badge>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Reviewing Faculty Signature
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={facultyName}
                    onChange={(e) => setFacultyName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <UserCheck className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Verification Rationale / Decision Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Verified SymPy derivation and distractor set; approved."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsConfirmModalOpen(true)}
                  disabled={isSubmitting || isApproved}
                  className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-40"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isApproved ? 'Approved' : 'Approve Patch'}</span>
                </button>

                <button
                  onClick={() => setIsEditModalOpen(true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs shadow-xs transition disabled:opacity-40"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Adjust Patch</span>
                </button>

                <button
                  onClick={handleReject}
                  disabled={isSubmitting || isRejected}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs shadow-xs transition disabled:opacity-40"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>

                <button
                  onClick={handleDefer}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold text-xs shadow-xs transition disabled:opacity-40"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Defer</span>
                </button>
              </div>

              {/* Question Audit History */}
              {data.audit_history && data.audit_history.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <History className="w-3 h-3" /> Past Decisions for this Question ({data.audit_history.length})
                  </span>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {data.audit_history.map((log: any) => (
                      <div
                        key={log.id}
                        className="p-1.5 rounded bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1 py-0.2 rounded text-[9px] font-bold uppercase font-mono ${
                            log.action === 'approve'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.action === 'reject'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {log.action}
                          </span>
                          <span className="font-semibold text-slate-800">{log.faculty_name}</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {log.created_at ? log.created_at.substring(0, 10) : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ApprovalConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleApprove}
        questionId={data.report.questionId}
        reportId={data.report.reportId}
        repairType={data.triage_recommendation.repair}
        edit={customEdit}
        confidence={data.triage_recommendation.confidence}
        isSubmitting={isSubmitting}
      />

      {/* Patch Edit Modal */}
      <PatchEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={(newEdit) => setCustomEdit(newEdit)}
        initialEdit={customEdit}
        repair={data.triage_recommendation.repair}
      />
    </div>
  )
}
