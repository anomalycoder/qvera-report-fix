import React, { useState, useEffect } from "react"
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
  HelpCircle
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
  const [solverData, setSolverData] = useState<any>(null)
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

  const fetchWorkspace = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/faculty/review/${reportId}`)
      if (!res.ok) throw new Error(`Report ${reportId} not found`)
      const json = await res.json()
      setData(json)
      setCustomEdit(json.triage_recommendation?.edit || null)

      // Fetch solver trace
      const qid = json.question?._id
      if (qid) {
        const sRes = await fetch(`/api/v1/solver/verification/${qid}`)
        if (sRes.ok) {
          const sJson = await sRes.json()
          setSolverData(sJson)
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load review workspace")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkspace()
  }, [reportId])

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
        toast.success("Correction approved and recorded to audit ledger.")
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
    const reason = prompt("Enter rationale for rejecting student report:", "Student derivation is mathematically flawed; stored answer verified correct.")
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
    const notes = prompt("Notes for specialist escalation:", "Escalating to subject matter lead for curriculum ambiguity review.")
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
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-7 h-[600px]" />
          <Skeleton className="lg:col-span-5 h-[600px]" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
        <AlertTriangle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
        <p className="text-xs text-slate-600 mb-3">{error || "Could not load report details."}</p>
        <Button size="sm" variant="outline" onClick={onBackToQueue}>
          Return to Queue
        </Button>
      </div>
    )
  }

  const {
    report,
    question,
    options,
    triage_recommendation: triage,
    peer_reports: peerReports = [],
    review_status: reviewStatus = "pending",
  } = data

  const activeEdit = customEdit || triage?.edit

  const formatIssueName = (repair?: string, verdict?: string) => {
    if (repair === "answer_key") return "Answer Key Mismatch"
    if (repair === "stem_data") return "Missing Numerical Stem Data"
    if (repair === "option_repair") return "Option Defect / Missing Distractor"
    if (repair === "solution_fix") return "Solution Calculation Error"
    if (repair === "diagram") return "Missing Diagram"
    if (repair === "identical_options") return "Duplicate Options"
    if (repair === "type_mismatch") return "Question Type Mismatch"
    if (repair === "markup_leak") return "Unrendered LaTeX Markup"
    if (repair === "spelling") return "Typographical Error"
    if (verdict === "no_error") return "No Content Defect Found"
    return repair ? repair.replace(/_/g, " ") : verdict || "Reported Issue"
  }

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToQueue}
            className="h-7 px-2 text-xs text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Queue
          </Button>
          <span className="text-slate-300">/</span>
          <span className="font-mono text-xs font-semibold text-slate-800">
            {report.reportId}
          </span>
          <span className="text-slate-300">/</span>
          <Badge variant={reviewStatus === "approved" ? "success" : reviewStatus === "rejected" ? "destructive" : "warning"}>
            {reviewStatus.toUpperCase()}
          </Badge>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Question #{question._id.slice(-8)}
        </div>
      </div>

      {/* 2-Column Review Workspace (Stripe/Linear Inspired) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN: ACADEMIC CONTENT (Visual Focus) - 7 cols     */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-2xs space-y-4">
            {/* Subject, Chapter & Metadata Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{question.subject}</Badge>
                {question.chapter && (
                  <span className="text-xs font-medium text-slate-700">
                    {question.chapter}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Type: {question.questionType} &bull; Difficulty: {question.difficulty ?? 2}/3
              </div>
            </div>

            {/* Question Stem (MathML Rendered Cleanly) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                Question Stem
              </span>
              <div
                className="text-xs sm:text-[13px] text-slate-900 leading-relaxed font-sans"
                dangerouslySetInnerHTML={{ __html: question.question }}
              />
            </div>

            {/* Options List (For SCQ / MCQ) */}
            {options && options.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Options
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {options.map((opt: any) => {
                    const isStored = String(question.stored_answer || "").trim() === opt.key
                    const isProposed =
                      activeEdit?.field === "answer" &&
                      String(activeEdit.replace || "").trim() === opt.key

                    let borderStyle = "border-slate-200 bg-white"
                    let badgeColor = "bg-slate-100 text-slate-700"

                    if (isStored && isProposed) {
                      borderStyle = "border-emerald-300 bg-emerald-50/30"
                      badgeColor = "bg-emerald-600 text-white"
                    } else if (isProposed) {
                      borderStyle = "border-blue-400 bg-blue-50/40 ring-1 ring-blue-400"
                      badgeColor = "bg-blue-600 text-white"
                    } else if (isStored) {
                      borderStyle = "border-rose-200 bg-rose-50/20"
                      badgeColor = "bg-slate-700 text-white"
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`p-2.5 rounded-md border text-xs flex items-start gap-3 transition-colors ${borderStyle}`}
                      >
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5 ${badgeColor}`}
                        >
                          {opt.key}
                        </span>

                        <div className="flex-1 min-w-0">
                          {opt.text ? (
                            <div
                              className="text-xs text-slate-800"
                              dangerouslySetInnerHTML={{ __html: opt.text }}
                            />
                          ) : (
                            <span className="text-slate-400 italic text-xs">
                              [Option text blank or missing in source]
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {isStored && (
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              Stored Answer
                            </span>
                          )}
                          {isProposed && (
                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
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
            {question.questionType === "integerQuestion" && (
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Stored Numerical Value:</span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {question.stored_answer ?? "N/A"}
                  </span>
                </div>
                {activeEdit?.field === "answer" && (
                  <div className="text-right">
                    <span className="text-blue-600 block text-[11px] font-medium">Proposed Value:</span>
                    <span className="text-sm font-mono font-bold text-blue-700">
                      {activeEdit.replace}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Collapsible Original Solution */}
            {question.solution && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowOriginalSolution(!showOriginalSolution)}
                  className="flex items-center justify-between w-full text-left text-xs font-medium text-slate-600 hover:text-slate-900 py-1"
                >
                  <span>Original Solution & Explanation</span>
                  {showOriginalSolution ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showOriginalSolution && (
                  <div
                    className="mt-2 p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans max-h-48 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: question.solution }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Student Reports Summary Box */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>Student Reports ({peerReports.length})</span>
              </div>
              {peerReports.length > 1 && (
                <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                  Multiple Independent Reports
                </span>
              )}
            </div>

            <div className="space-y-2">
              {peerReports.map((p: any) => (
                <div
                  key={p.reportId}
                  className={`p-2.5 rounded border text-xs ${
                    p.reportId === report.reportId ? "bg-blue-50/30 border-blue-200" : "bg-slate-50/50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-mono font-medium text-slate-700">
                      {p.reportId} &bull; {p.source?.toUpperCase() || "WEB"}
                    </span>
                    <span>{new Date(p.reportedAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-800 text-xs italic">
                    "{p.comment || "No text comment provided."}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: REVIEW DECISION & ACTIONS - 5 cols          */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-2xs space-y-4">
            {/* 1. Issue Classification */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Issue Classification
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  {formatIssueName(triage?.repair, triage?.verdict)}
                </span>
                <Badge variant={triage?.verdict === "defect" ? "critical" : "outline"}>
                  {triage?.verdict || "defect"}
                </Badge>
              </div>
            </div>

            {/* 2. Independent Verification Result */}
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">Verification Result</span>
                <span className="text-[11px] font-semibold text-emerald-700">
                  {solverData?.verification_status === "verified" || solverData?.verification_status === "mismatch"
                    ? "Confirmed"
                    : "Partial / Manual"}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {solverData?.reasoning_steps?.[0] ||
                  triage?.evidence ||
                  "Independent verification derived from question stem formulas and physical laws."}
              </p>
            </div>

            {/* 3. Proposed Correction (Clean Before / After Diff) */}
            {activeEdit ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Suggested Correction
                  </span>
                  <button
                    onClick={() => setIsAdjustOpen(true)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                  >
                    <Edit3 className="w-3 h-3" />
                    Adjust patch
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded border border-rose-200 bg-rose-50/40">
                    <span className="text-[10px] font-semibold text-rose-700 block mb-1">
                      Original ({activeEdit.field})
                    </span>
                    <div className="font-mono text-xs text-rose-950 font-bold break-all">
                      {String(activeEdit.find ?? activeEdit.old_value ?? "Current")}
                    </div>
                  </div>

                  <div className="p-2.5 rounded border border-emerald-200 bg-emerald-50/40">
                    <span className="text-[10px] font-semibold text-emerald-700 block mb-1">
                      Proposed ({activeEdit.field})
                    </span>
                    <div className="font-mono text-xs text-emerald-950 font-bold break-all">
                      {String(activeEdit.replace ?? activeEdit.new_value ?? "Corrected")}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500">
                No content modification proposed (report classified as {triage?.verdict || "no_error"}).
              </div>
            )}

            {/* 4. Student Reply Draft Preview */}
            {triage?.student_reply && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Student Reply Draft
                </span>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
                  "{triage.student_reply}"
                </div>
              </div>
            )}

            {/* 5. Collapsible Technical Details (Hidden by Default) */}
            <div className="border-t border-slate-100 pt-2">
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-800 py-1"
              >
                <span>Technical details & solver diagnostics</span>
                {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showTechnicalDetails && (
                <div className="mt-2 p-3 bg-slate-50 rounded border border-slate-200 text-[11px] space-y-2 font-mono text-slate-600 overflow-x-auto">
                  <div>Route: {triage?.route || "faculty_review"}</div>
                  <div>Taxonomy Repair: {triage?.repair || "N/A"}</div>
                  <div>SymPy Status: {solverData?.verification_status || "mismatch"}</div>
                  {solverData?.derived_answer && (
                    <div>Independently Derived: {String(solverData.derived_answer)}</div>
                  )}
                  {solverData?.confidence !== undefined && (
                    <div>Verification Confidence: {(solverData.confidence * 100).toFixed(0)}%</div>
                  )}
                </div>
              )}
            </div>

            {/* 6. Faculty Action Controls */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Button
                variant="primary"
                onClick={() => setIsConfirmOpen(true)}
                disabled={isSubmitting || reviewStatus === "approved"}
                className="w-full text-xs font-semibold h-8"
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                {reviewStatus === "approved" ? "Correction Already Approved" : "Approve Correction"}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={isSubmitting}
                  className="text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800 h-8"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Reject
                </Button>

                <Button
                  variant="outline"
                  onClick={handleDefer}
                  disabled={isSubmitting}
                  className="text-xs text-slate-700 hover:bg-slate-50 h-8"
                >
                  <Clock className="w-3.5 h-3.5 mr-1" />
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

          <div className="space-y-3 text-xs my-2">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Target Field:</span>
                <span className="font-mono font-semibold text-slate-800">{activeEdit?.field || "answer"}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Original Value:</span>
                <span className="font-mono text-rose-700 font-semibold">{String(activeEdit?.find ?? question.stored_answer ?? "N/A")}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Corrected Value:</span>
                <span className="font-mono text-emerald-700 font-semibold">{String(activeEdit?.replace ?? "N/A")}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-700">Reviewer Notes (Optional):</label>
              <input
                type="text"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="e.g. Verified SymPy phasor proof, approved."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
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

          <div className="space-y-3 text-xs my-2">
            <div>
              <label className="text-[11px] font-medium text-slate-700 block mb-1">Target Field:</label>
              <select
                value={customEdit?.field || "answer"}
                onChange={(e) =>
                  setCustomEdit((prev) => ({
                    field: e.target.value,
                    find: prev?.find ?? "",
                    replace: prev?.replace ?? "",
                  }))
                }
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1"
              >
                <option value="answer">answer (Answer Key)</option>
                <option value="solution">solution (Explanation Text)</option>
                <option value="question">question (Stem Text)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-700 block mb-1">Target to Find:</label>
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
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-700 block mb-1">Replacement Value:</label>
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
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1"
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
            >
              Save Patch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
