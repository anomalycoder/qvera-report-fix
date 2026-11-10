import React, { useState, useEffect, useMemo } from "react"
import {
  ArrowLeft,
  Check,
  X,
  Edit3,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  MessageSquare,
  FileCheck2,
  HelpCircle,
  Sparkles,
  Layers,
  History as HistoryIcon,
  RotateCw
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import type { ProposedEdit } from "@/types/triage"

interface ReviewWorkspacePageProps {
  reportId: string
  onBackToQueue: () => void
}

export const ReviewWorkspacePage: React.FC<ReviewWorkspacePageProps> = ({
  reportId,
  onBackToQueue,
}) => {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals & Collapsibles
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  const [showOriginalSolution, setShowOriginalSolution] = useState(false)

  // Custom Edit & Action inputs
  const [customEdit, setCustomEdit] = useState<ProposedEdit | null>(null)
  const [actionNotes, setActionNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState(false)

  const fetchWorkspace = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/faculty/review/${reportId}`)
      if (!res.ok) throw new Error(`Report ${reportId} not found`)
      const json = await res.json()
      setData(json)
      setCustomEdit(json.triage_recommendation?.edit || null)
    } catch (err: any) {
      setError(err.message || "Failed to load review workspace")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkspace()
  }, [reportId])

  // Safe data accessors
  const report = data?.report || {}
  const rawQ = data?.question?.raw || {}
  const normQ = data?.question?.normalized || {}
  const qid: string = report.questionId || rawQ._id || normQ.question_id || ""
  const stemHtml: string = normQ.raw_question_html || rawQ.question || ""
  const solutionHtml: string = normQ.raw_solution_html || rawQ.solution || ""
  const storedAnswer: string = normQ.stored_answer || rawQ.answer || ""
  const subject: string = normQ.subject || rawQ.subject || "Physics"
  const chapter: string = normQ.chapter || rawQ.chapter || ""
  const questionType: string = normQ.question_type || rawQ.questionType || "scq"
  const solver = data?.solver_verification || {}
  const triage = data?.triage_recommendation || {}
  const peerReports = data?.peer_reports || []
  const reviewStatus: string = data?.review_status || "pending"
  const auditHistory = data?.audit_history || []

  // Safe options array derivation
  const optionsList = useMemo(() => {
    const rawOpts = normQ.options
    if (!rawOpts) return []
    if (Array.isArray(rawOpts)) return rawOpts
    return Object.entries(rawOpts).map(([k, v]: [string, any]) => ({
      key: k,
      label: v?.label || k,
      text: v?.text || v?.raw_html || "",
      is_blank: Boolean(v?.is_blank),
    }))
  }, [normQ])

  const activeEdit = customEdit || triage?.edit

  const copyQid = () => {
    if (qid) {
      navigator.clipboard.writeText(qid)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/v1/faculty/approve/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faculty_id: "faculty_dr_a_sharma",
          faculty_name: "Dr. A. Sharma",
          notes: actionNotes || "Correction verified from first principles and authorized by faculty.",
          custom_edit: customEdit,
        }),
      })

      if (res.ok) {
        setIsConfirmOpen(false)
        toast.success("Correction approved and committed to SQLite audit ledger.")
        fetchWorkspace()
      } else {
        const err = await res.json()
        toast.error(err.detail || "Approval failed")
      }
    } catch (err: any) {
      toast.error(err.message || "Network error submitting approval")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    const reason = prompt(
      "Enter rationale for rejecting student report:",
      "Student derivation is mathematically flawed; stored answer verified correct."
    )
    if (reason === null) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/v1/faculty/reject/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faculty_id: "faculty_dr_a_sharma",
          faculty_name: "Dr. A. Sharma",
          notes: reason,
        }),
      })

      if (res.ok) {
        toast.success("Report rejected. Question integrity preserved.")
        fetchWorkspace()
      } else {
        const err = await res.json()
        toast.error(err.detail || "Rejection failed")
      }
    } catch (err: any) {
      toast.error(err.message || "Error rejecting report")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDefer = async () => {
    const notes = prompt(
      "Notes for specialist escalation:",
      "Escalating to subject matter lead for curriculum ambiguity review."
    )
    if (notes === null) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/v1/faculty/defer/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faculty_id: "faculty_dr_a_sharma",
          faculty_name: "Dr. A. Sharma",
          notes: notes,
        }),
      })

      if (res.ok) {
        toast.info("Report deferred for specialist review.")
        fetchWorkspace()
      } else {
        const err = await res.json()
        toast.error(err.detail || "Deferral failed")
      }
    } catch (err: any) {
      toast.error(err.message || "Error deferring report")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 bg-white" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-7 h-[650px] bg-white rounded-lg border border-[#E5E7EB]" />
          <Skeleton className="lg:col-span-5 h-[650px] bg-white rounded-lg border border-[#E5E7EB]" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-[#E5E7EB] shadow-xs">
        <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h3 className="font-bold text-base text-[#111827]">Could Not Load Question Workspace</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">{error || "Report details unavailable."}</p>
        <Button size="sm" variant="outline" onClick={onBackToQueue}>
          Return to Queue
        </Button>
      </div>
    )
  }

  const formatIssueName = (repair?: string, verdict?: string) => {
    if (repair === "answer_key") return "Answer Key Mismatch"
    if (repair === "stem_data") return "Missing Numerical Stem Data"
    if (repair === "option_repair") return "Option Defect / Missing Distractor"
    if (repair === "solution_fix") return "Solution Calculation Defect"
    if (repair === "diagram") return "Missing Diagram Reference"
    if (repair === "identical_options") return "Duplicate Options"
    if (repair === "type_mismatch") return "Question Type Mismatch"
    if (repair === "markup_leak") return "Unrendered LaTeX Markup"
    if (repair === "spelling") return "Typographical Error"
    if (repair === "wrong_chapter") return "Wrong Chapter Tag"
    if (repair === "syllabus") return "Syllabus Boundary Issue"
    if (verdict === "no_error") return "No Defect (Student Misconception)"
    return repair ? repair.replace(/_/g, " ") : verdict || "Reported Issue"
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Status Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-[#E5E7EB] rounded-lg px-5 py-3 shadow-2xs">
        <div className="flex items-center gap-3 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToQueue}
            className="h-8 px-2.5 text-sm text-slate-700 hover:text-slate-900 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Queue
          </Button>
          <span className="text-slate-300">/</span>
          <span className="font-mono font-bold text-[#111827] text-sm">
            {report.reportId}
          </span>
          <span className="text-slate-300">/</span>
          <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded border ${
            reviewStatus === "approved"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : reviewStatus === "rejected"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : reviewStatus === "deferred"
              ? "bg-purple-50 text-purple-800 border-purple-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }`}>
            {reviewStatus}
          </span>
        </div>

        {/* Question ID indicator with Copy button */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-mono">
          <span>Question ID:</span>
          <span className="font-bold text-[#111827]">
            {qid ? `${qid.slice(0, 12)}...` : "N/A"}
          </span>
          <button
            onClick={copyQid}
            className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
            title="Copy Question ID"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {copiedId && <span className="text-xs text-emerald-600 font-sans font-semibold">Copied!</span>}
        </div>
      </div>

      {/* 2-Column Investigation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* LEFT PANEL: ACADEMIC CONTENT (7 cols)                     */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-2xs space-y-5">
            {/* Subject, Chapter & Metadata Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs uppercase tracking-wide">
                  {subject}
                </span>
                {chapter && (
                  <span className="text-sm font-bold text-slate-900">
                    {chapter}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Type: <strong className="text-slate-800">{questionType}</strong> &bull; Difficulty: <strong className="text-slate-800">{rawQ.difficulty ?? 2}/3</strong>
              </div>
            </div>

            {/* Question Stem (Native MathML Rendering) */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Question Stem
              </span>
              <div
                className="text-sm sm:text-base text-slate-900 leading-relaxed font-sans select-text"
                dangerouslySetInnerHTML={{ __html: stemHtml }}
              />
            </div>

            {/* Options List for SCQ / MCQ */}
            {optionsList.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Options
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                  {optionsList.map((opt) => {
                    const isStored = String(storedAnswer || "").trim() === opt.key
                    const isProposed =
                      activeEdit?.field === "answer" &&
                      String(activeEdit.replace || "").trim() === opt.key

                    let borderStyle = "border-[#E5E7EB] bg-white"
                    let badgeColor = "bg-slate-100 text-slate-800 border border-slate-200"

                    if (isStored && isProposed) {
                      borderStyle = "border-emerald-300 bg-emerald-50/40"
                      badgeColor = "bg-emerald-600 text-white"
                    } else if (isProposed) {
                      borderStyle = "border-blue-400 bg-blue-50/50 ring-2 ring-blue-500/20"
                      badgeColor = "bg-blue-600 text-white"
                    } else if (isStored) {
                      borderStyle = "border-rose-200 bg-rose-50/20"
                      badgeColor = "bg-slate-800 text-white"
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`p-3.5 rounded-lg border text-sm flex items-start gap-3.5 transition-colors ${borderStyle}`}
                      >
                        <span
                          className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 ${badgeColor}`}
                        >
                          {opt.key}
                        </span>

                        <div className="flex-1 min-w-0">
                          {opt.text ? (
                            <div
                              className="text-sm text-slate-900"
                              dangerouslySetInnerHTML={{ __html: opt.text }}
                            />
                          ) : (
                            <span className="text-slate-400 italic text-sm">
                              [Option text blank or missing in source dataset]
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isStored && (
                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              Stored Key
                            </span>
                          )}
                          {isProposed && (
                            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                              Proposed Answer
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Integer Question Answer Display */}
            {questionType === "integerQuestion" && (
              <div className="p-4 bg-slate-50 rounded-lg border border-[#E5E7EB] text-sm flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-xs">Stored Numerical Key:</span>
                  <span className="text-xl font-mono font-extrabold text-[#111827]">
                    {storedAnswer || "N/A"}
                  </span>
                </div>
                {activeEdit?.field === "answer" && (
                  <div className="text-right">
                    <span className="text-blue-600 block text-xs font-bold">Proposed Correction:</span>
                    <span className="text-xl font-mono font-extrabold text-blue-700">
                      {activeEdit.replace}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Collapsible Original Solution */}
            {solutionHtml && (
              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowOriginalSolution(!showOriginalSolution)}
                  className="flex items-center justify-between w-full text-left text-sm font-bold text-slate-800 hover:text-slate-900 py-1"
                >
                  <span>Original Solution & Explanation</span>
                  {showOriginalSolution ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showOriginalSolution && (
                  <div
                    className="mt-3 p-4 bg-slate-50 rounded-lg border border-[#E5E7EB] text-sm text-slate-800 leading-relaxed max-h-52 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: solutionHtml }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Student Report History */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#111827]">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <span>Student Report History ({peerReports.length})</span>
              </div>
              {peerReports.length > 1 && (
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
                  Multiple Student Consensus ({peerReports.length} reports)
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {peerReports.map((p: any) => (
                <div
                  key={p.reportId}
                  className={`p-3.5 rounded-lg border text-sm ${
                    p.reportId === report.reportId ? "bg-blue-50/40 border-blue-200" : "bg-slate-50/60 border-[#E5E7EB]"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span className="font-mono font-bold text-slate-800">
                      Report {p.reportId} &bull; {p.source?.toUpperCase() || "WEB"}
                    </span>
                    <span className="font-mono">{p.reportedAt ? new Date(p.reportedAt).toLocaleDateString() : "Recent"}</span>
                  </div>
                  <p className="text-slate-900 text-sm italic">
                    "{p.comment || "No written comment provided."}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANEL: REVIEW DECISION & ACTIONS (5 cols)           */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-2xs space-y-5">
            {/* 1. Issue Summary & Classification */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Issue Classification
              </span>
              <div className="flex items-center gap-2.5">
                <span className="text-base font-extrabold text-[#111827]">
                  {formatIssueName(triage?.repair, triage?.verdict)}
                </span>
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${
                  triage?.verdict === "defect"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}>
                  {triage?.verdict || "defect"}
                </span>
              </div>
            </div>

            {/* 2. Independent Verification Result */}
            <div className="p-4 rounded-lg bg-slate-50 border border-[#E5E7EB] space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-800">Verification Result</span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {solver?.verification_status === "verified" || solver?.verification_status === "mismatch"
                    ? "Confirmed"
                    : "Review Needed"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {solver?.reasoning_steps?.[0] ||
                  triage?.evidence ||
                  "Independent verification derived from question stem formulas and physical laws."}
              </p>
              {solver?.derived_answer && (
                <div className="text-xs pt-2 border-t border-slate-200 font-mono text-slate-700">
                  Independently derived answer: <strong className="text-[#111827] font-extrabold">{solver.derived_answer}</strong>
                </div>
              )}
            </div>

            {/* 3. Proposed Correction (Clean Before/After Diff) */}
            {activeEdit ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Proposed Correction
                  </span>
                  <button
                    onClick={() => setIsAdjustOpen(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-bold"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Adjust patch
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/40">
                    <span className="text-xs font-bold text-rose-700 block mb-1">
                      Original ({activeEdit.field})
                    </span>
                    <div className="font-mono text-sm text-rose-950 font-bold break-all">
                      {String(activeEdit.find ?? activeEdit.old_value ?? "Current")}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/40">
                    <span className="text-xs font-bold text-emerald-700 block mb-1">
                      Proposed ({activeEdit.field})
                    </span>
                    <div className="font-mono text-sm text-emerald-950 font-bold break-all">
                      {String(activeEdit.replace ?? activeEdit.new_value ?? "Corrected")}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-[#E5E7EB] rounded-lg text-sm text-slate-600">
                No content mutation proposed (report classified as {triage?.verdict || "no_error"}).
              </div>
            )}

            {/* 4. Student Reply Draft Preview */}
            {triage?.student_reply && (
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Student Reply Draft
                </span>
                <div className="p-3.5 bg-slate-50 rounded-lg border border-[#E5E7EB] text-sm text-slate-800 leading-relaxed italic">
                  "{triage.student_reply}"
                </div>
              </div>
            )}

            {/* 5. Collapsible Technical Details */}
            <div className="border-t border-slate-100 pt-3">
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-900 py-1 font-medium"
              >
                <span>Technical details & solver diagnostics</span>
                {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showTechnicalDetails && (
                <div className="mt-2.5 p-3.5 bg-slate-50 rounded-lg border border-[#E5E7EB] text-xs space-y-2 font-mono text-slate-700 overflow-x-auto">
                  <div>Routing Gate: <strong className="text-slate-900">{triage?.route || "faculty_review"}</strong></div>
                  <div>Taxonomy Repair: <strong className="text-slate-900">{triage?.repair || "N/A"}</strong></div>
                  <div>SymPy Engine Status: <strong className="text-slate-900">{solver?.verification_status || "mismatch"}</strong></div>
                  {solver?.reasoning_steps && solver.reasoning_steps.length > 1 && (
                    <div className="pt-2 text-xs text-slate-600 border-t border-slate-200 space-y-1">
                      <span className="font-sans font-bold text-slate-700 block text-[11px] uppercase">Reasoning Steps:</span>
                      {solver.reasoning_steps.map((st: string, idx: number) => (
                        <div key={idx} className="font-sans">&bull; {st}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 6. Faculty Action Controls */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <Button
                variant="primary"
                onClick={() => setIsConfirmOpen(true)}
                disabled={isSubmitting || reviewStatus === "approved"}
                className="w-full text-sm font-bold h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              >
                <Check className="w-4 h-4 mr-2" />
                {reviewStatus === "approved" ? "Correction Already Approved" : "Approve Correction"}
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={isSubmitting}
                  className="text-xs sm:text-sm text-rose-700 hover:bg-rose-50 hover:text-rose-800 h-9 border-[#E5E7EB] font-semibold"
                >
                  <X className="w-4 h-4 mr-1.5" />
                  Reject
                </Button>

                <Button
                  variant="outline"
                  onClick={handleDefer}
                  disabled={isSubmitting}
                  className="text-xs sm:text-sm text-slate-700 hover:bg-slate-50 h-9 border-[#E5E7EB] font-semibold"
                >
                  <Clock className="w-4 h-4 mr-1.5" />
                  Defer / Escalate
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog on Approval */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent onClose={() => setIsConfirmOpen(false)}>
          <DialogHeader>
            <DialogTitle>Confirm Question Correction</DialogTitle>
            <DialogDescription>
              Authorizing this correction will update the stored record and append an immutable entry to the SQLite audit ledger.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm my-3">
            <div className="p-4 bg-slate-50 rounded-lg border border-[#E5E7EB] space-y-2.5">
              <div className="flex justify-between text-slate-700">
                <span className="font-medium">Target Field:</span>
                <span className="font-mono font-bold text-slate-900">{activeEdit?.field || "answer"}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="font-medium">Original Value:</span>
                <span className="font-mono text-rose-700 font-bold">{String(activeEdit?.find ?? storedAnswer ?? "N/A")}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="font-medium">Corrected Value:</span>
                <span className="font-mono text-emerald-700 font-bold">{String(activeEdit?.replace ?? "N/A")}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Reviewer Notes (Optional):</label>
              <input
                type="text"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="e.g. Verified SymPy phasor proof, approved."
                className="w-full text-sm bg-slate-50 border border-[#E5E7EB] rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {isSubmitting ? "Committing..." : "Authorize Correction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Patch Dialog */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent onClose={() => setIsAdjustOpen(false)}>
          <DialogHeader>
            <DialogTitle>Adjust Surgical Patch</DialogTitle>
            <DialogDescription>
              Fine-tune the proposed replacement token before committing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm my-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Target Field:</label>
              <select
                value={customEdit?.field || "answer"}
                onChange={(e) =>
                  setCustomEdit((prev) => ({
                    field: e.target.value,
                    find: prev?.find ?? "",
                    replace: prev?.replace ?? "",
                  }))
                }
                className="w-full text-sm bg-slate-50 border border-[#E5E7EB] rounded-md px-3 py-2 text-slate-900 font-medium"
              >
                <option value="answer">answer (Answer Key)</option>
                <option value="solution">solution (Explanation Text)</option>
                <option value="question">question (Stem Text)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Target to Find:</label>
              <input
                type="text"
                value={String(customEdit?.find ?? "")}
                onChange={(e) =>
                  setCustomEdit((prev) => ({
                    field: prev?.field || "answer",
                    find: e.target.value,
                    replace: prev?.replace ?? "",
                  }))
                }
                className="w-full text-sm bg-slate-50 border border-[#E5E7EB] rounded-md px-3 py-2 text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Replacement Value:</label>
              <input
                type="text"
                value={String(customEdit?.replace ?? "")}
                onChange={(e) =>
                  setCustomEdit((prev) => ({
                    field: prev?.field || "answer",
                    find: prev?.find ?? "",
                    replace: e.target.value,
                  }))
                }
                className="w-full text-sm bg-slate-50 border border-[#E5E7EB] rounded-md px-3 py-2 text-slate-900"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAdjustOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsAdjustOpen(false)
                toast.success("Custom patch updated.")
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              Save Patch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
