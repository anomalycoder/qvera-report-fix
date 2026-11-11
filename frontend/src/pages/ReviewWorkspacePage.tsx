import React, { useState, useEffect, useMemo, useCallback } from "react"
import confetti from "canvas-confetti"
import {
  ArrowLeft,
  Check,
  X,
  Edit3,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  MessageSquare,
  FileCheck2,
  Sparkles,
  History as HistoryIcon,
  RotateCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MinusCircle,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MathContent } from "@/components/MathContent"
import { toast } from "sonner"
import type { ProposedEdit } from "@/types/triage"

interface ReviewWorkspacePageProps {
  reportId: string
  onBackToQueue: () => void
  onSelectReport?: (reportId: string) => void
  facultyName?: string
}

function formatDateTime(ts?: string | null): string {
  if (!ts) return "—"
  const d = new Date(ts.includes("T") ? ts : `${ts.replace(" ", "T")}Z`)
  if (Number.isNaN(d.getTime())) return ts
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const ReviewWorkspacePage: React.FC<ReviewWorkspacePageProps> = ({
  reportId,
  onBackToQueue,
  onSelectReport,
  facultyName = "Dr. A. Sharma",
}) => {
  const [data, setData] = useState<any>(null)
  const [queueList, setQueueList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [staleConflictBanner, setStaleConflictBanner] = useState(false)
  const [sseLive, setSseLive] = useState(false)

  // Progressive disclosure toggles
  const [reportsExpanded, setReportsExpanded] = useState(true)
  const [mathDetailsExpanded, setMathDetailsExpanded] = useState(false)
  const [rawMetaExpanded, setRawMetaExpanded] = useState(false)
  const [auditExpanded, setAuditExpanded] = useState(false)
  const [showOriginalVersion, setShowOriginalVersion] = useState(false)

  // Inline surgical edit & decision controls
  const [isEditing, setIsEditing] = useState(false)
  const [editField, setEditField] = useState<string>("answer")
  const [editFind, setEditFind] = useState<string>("")
  const [editReplace, setEditReplace] = useState<string>("")
  const [facultyNotes, setFacultyNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState(false)

  const fetchWorkspace = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true)
      setError(null)
      try {
        const [reviewRes, queueRes] = await Promise.all([
          fetch(`/api/v1/faculty/review/${reportId}`),
          fetch("/api/v1/faculty/queue/grouped?limit=100"),
        ])

        if (!reviewRes.ok) throw new Error(`Investigation case '${reportId}' could not be loaded`)
        const reviewJson = await reviewRes.json()
        setData(reviewJson)
        setStaleConflictBanner(false)

        const tEdit = reviewJson.triage_recommendation?.edit
        const permitted = reviewJson.taxonomy_rules?.fields || []
        setEditField(tEdit?.field && permitted.includes(tEdit.field) ? tEdit.field : permitted[0] || "answer")
        setEditFind(tEdit?.find || tEdit?.old_value || "")
        setEditReplace(tEdit?.replace || tEdit?.new_value || "")

        if (queueRes.ok) {
          const qJson = await queueRes.json()
          setQueueList(qJson.items || [])
        }
      } catch (err: any) {
        if (!silent) setError(err.message || "Failed to load investigation workspace")
      } finally {
        if (!silent) setIsLoading(false)
      }
    },
    [reportId]
  )

  useEffect(() => {
    setIsEditing(false)
    setShowOriginalVersion(false)
    setFacultyNotes("")
    fetchWorkspace(false)
  }, [fetchWorkspace])

  // Real-time synchronization via SSE: detects concurrent edits & incoming reports!
  useEffect(() => {
    let es: EventSource | null = null
    if (typeof EventSource !== "undefined") {
      es = new EventSource("/api/v1/faculty/notifications/stream")
      es.onopen = () => setSseLive(true)
      es.onerror = () => setSseLive(false)
      es.addEventListener("queue_update", () => {
        if (isEditing) {
          setStaleConflictBanner(true)
        } else {
          fetchWorkspace(true)
        }
      })
      es.addEventListener("taxonomy_update", () => {
        if (isEditing) {
          setStaleConflictBanner(true)
        } else {
          fetchWorkspace(true)
        }
      })
    }
    const onLocal = () => fetchWorkspace(true)
    window.addEventListener("qvera:faculty-action", onLocal)
    return () => {
      if (es) es.close()
      window.removeEventListener("qvera:faculty-action", onLocal)
    }
  }, [fetchWorkspace, isEditing])

  const report = data?.report || {}
  const qData = data?.question || {}
  const normQ = showOriginalVersion ? (qData.original_normalized || qData.normalized || {}) : (qData.normalized || {})
  const rawQ = showOriginalVersion ? (qData.original || qData.raw || {}) : (qData.raw || {})
  const qid: string = report.questionId || rawQ._id || normQ.question_id || ""
  const questionVersion: number = qData.version ?? 1
  const subject: string = normQ.subject || rawQ.subject || "General"
  const chapter: string = normQ.chapter || rawQ.chapter || ""
  const questionType: string = normQ.question_type || rawQ.questionType || "scq"
  const storedAnswer: string = normQ.stored_answer || String(rawQ.answer || "")
  const stemHtml: string = normQ.raw_stem_html || rawQ.question || ""
  const solutionHtml: string = normQ.raw_solution_html || rawQ.solution || ""
  const declaredImages: string[] = normQ.declared_question_images || []
  const solver = data?.solver_verification || {}
  const triage = data?.triage_recommendation || {}
  const peerReports: any[] = data?.peer_reports || []
  const reviewStatus: string = data?.review_status || "pending"
  const auditHistory: any[] = data?.audit_history || []
  const taxonomyRules = data?.taxonomy_rules || null
  const provenance: string = data?.analysis_provenance || "Deterministic SymPy CAS + closed taxonomy"

  const permittedFields: string[] = taxonomyRules?.fields || []
  const canEditFields = permittedFields.length > 0

  // Queue navigation (strictly aligned with Question-Grouped Queue ordering!)
  const currentIndex = queueList.findIndex(
    (c) =>
      c.question_id === qid ||
      c.primary_report_id === reportId ||
      c.associated_reports?.some((r: any) => r.report_id === reportId)
  )
  const prevCase = currentIndex > 0 ? queueList[currentIndex - 1] : null
  const nextCase = currentIndex >= 0 && currentIndex < queueList.length - 1 ? queueList[currentIndex + 1] : null

  const optionsList = useMemo(() => {
    const opts = normQ.options || {}
    return ["A", "B", "C", "D"].map((key) => {
      const opt = opts[key]
      return {
        key,
        html: opt?.raw_html || "",
        text: opt?.text || "",
        isMissing: normQ.missing_options?.includes(key) ?? false,
      }
    })
  }, [normQ])

  const activeProposal: ProposedEdit | null = isEditing
    ? {
        field: editField as any,
        operation: "replace",
        find: editFind,
        replace: editReplace,
        old_value: editFind,
        new_value: editReplace,
      }
    : triage.edit || null

  const handleCopyId = () => {
    navigator.clipboard.writeText(qid)
    setCopiedId(true)
    toast.success(`Copied Question ID: ${qid}`)
    setTimeout(() => setCopiedId(false), 1800)
  }

  // Unified Action Dispatcher with Backend Validation, Conflict Detection (409) & Sync
  const commitAction = async (
    actionType: "approve" | "edit" | "reject" | "no_change" | "defer"
  ) => {
    if (isSubmitting) return
    setIsSubmitting(true)

    let endpoint = `/api/v1/faculty/${actionType}/${reportId}`
    if (actionType === "edit") endpoint = `/api/v1/faculty/approve/${reportId}`
    if (actionType === "no_change") endpoint = `/api/v1/faculty/no-change/${reportId}`

    const bodyPayload: any = {
      faculty_name: facultyName,
      notes: facultyNotes.trim() || undefined,
      apply_to_question: true,
      expected_version: questionVersion,
    }

    if (actionType === "edit") {
      if (!editReplace.trim()) {
        toast.error("Provide the replacement value before saving.")
        setIsSubmitting(false)
        return
      }
      bodyPayload.custom_edit = {
        field: editField,
        operation: "replace",
        find: editFind,
        replace: editReplace,
        old_value: editFind,
        new_value: editReplace,
        reason: facultyNotes.trim() || "Manual faculty surgical correction",
      }
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      })
      const result = await res.json()

      if (res.status === 409) {
        setStaleConflictBanner(true)
        throw new Error(result.detail || "Concurrent modification detected. Refresh latest before saving.")
      }
      if (!res.ok) {
        throw new Error(result.detail || `Operation failed (${res.status})`)
      }

      if (actionType === "approve" || actionType === "edit") {
        confetti({ particleCount: 40, spread: 55, origin: { y: 0.8 } })
      }
      toast.success(result.message || `Recorded decision (#${result.log_id})`)
      setIsEditing(false)
      setFacultyNotes("")
      setStaleConflictBanner(false)
      window.dispatchEvent(new CustomEvent("qvera:faculty-action"))
      await fetchWorkspace(true)
    } catch (err: any) {
      toast.error(err.message || "Operation could not be completed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStatusBadge = (st: string) => {
    switch (st) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#15803D] bg-[#ECFDF3] px-2.5 py-0.5 rounded-full border border-[#D1FADF]">
            <CheckCircle2 className="w-3 h-3" />
            Approved & Applied
          </span>
        )
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B91C1C] bg-[#FEF2F2] px-2.5 py-0.5 rounded-full border border-[#FECACA]">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        )
      case "no_change":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#444444] bg-[#EFECE6] px-2.5 py-0.5 rounded-full border border-[#DFDBD0]">
            <MinusCircle className="w-3 h-3" />
            No Change
          </span>
        )
      case "deferred":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B45309] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
            <Clock className="w-3 h-3" />
            Escalated
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#111111] bg-[#EFECE6] px-2.5 py-0.5 rounded-full border border-[#DFDBD0]">
            <AlertCircle className="w-3 h-3" />
            Pending Review
          </span>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-[1360px] mx-auto">
        <Skeleton className="h-14 w-full bg-[#EAE7DC] rounded-[14px]" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-[460px] bg-[#EFECE6] rounded-[16px]" />
          <Skeleton className="h-[460px] bg-[#EFECE6] rounded-[16px]" />
        </div>
        <Skeleton className="h-36 w-full bg-[#EFECE6] rounded-[16px]" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-[18px] border-[1.5px] border-[#C5C1B4] shadow-xs max-w-lg mx-auto my-12 space-y-4 font-sans">
        <AlertCircle className="w-10 h-10 text-[#B91C1C] mx-auto" />
        <h3 className="font-display text-base font-semibold text-[#111111]">Investigation Case Unavailable</h3>
        <p className="text-xs text-[#666666]">{error || "Missing question or report record."}</p>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={onBackToQueue}>
            Back to Review Queue
          </Button>
          <Button size="sm" onClick={() => fetchWorkspace(false)}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const solverVerified = solver?.verification_status === "verified_match" || solver?.verification_status === "mismatch"

  return (
    <div className="space-y-4 max-w-[1360px] mx-auto font-sans">
      {/* =====================================================================
          CONFLICT DETECTION BANNER (SIMULTANEOUS FACULTY EDIT WARNING)
      ===================================================================== */}
      {staleConflictBanner && (
        <div className="bg-[#FFFBEB] border-[1.5px] border-[#FDE68A] rounded-[12px] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#92400E]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="font-medium">
              Another session updated this investigation or submitted a new report. Refresh latest before saving to avoid overwriting changes.
            </span>
          </div>
          <button
            type="button"
            onClick={() => fetchWorkspace(false)}
            className="h-7 px-3 rounded-[6px] bg-[#0B0F12] text-white font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh Latest</span>
          </button>
        </div>
      )}

      {/* =====================================================================
          AREA A: COMPACT INVESTIGATION HEADER
      ===================================================================== */}
      <header className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] px-4 sm:px-5 py-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToQueue}
            className="h-8 px-3 rounded-[8px] bg-[#F9F8F3] hover:bg-[#EFECE6] border border-[#DFDBD0] text-xs font-medium text-[#111111] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Review Queue</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[13px] font-semibold text-[#111111]">{qid}</span>
            <button
              type="button"
              onClick={handleCopyId}
              className="text-[#777777] hover:text-[#111111] p-1 rounded cursor-pointer"
              title="Copy full Question ID"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <span className="text-[12px] text-[#666666]">
              {subject} {chapter ? `· ${chapter}` : ""}
            </span>
            {renderStatusBadge(reviewStatus)}
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[#EFECE6] border border-[#DFDBD0] text-[#111111]">
              {peerReports.length} {peerReports.length === 1 ? "report" : "reports"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-[11.5px]">
          <span className="hidden xl:inline font-mono text-[#666666]">
            v{questionVersion} · Tax v{data?.taxonomy_version ?? data?.active_taxonomy_version ?? 1} · Updated{" "}
            {formatDateTime(qData.updated_at || report.reportedAt)}
          </span>
          <span
            className={`inline-flex items-center gap-1 font-mono text-[10.5px] px-2 py-0.5 rounded-full border ${
              sseLive ? "bg-[#ECFDF3] text-[#15803D] border-[#D1FADF]" : "bg-[#F9F8F3] text-[#666666] border-[#DFDBD0]"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${sseLive ? "bg-[#16A34A] animate-pulse" : "bg-[#888888]"}`} />
            Live
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!prevCase}
              onClick={() => prevCase && onSelectReport?.(prevCase.primary_report_id)}
              className="h-8 px-2.5 rounded-[8px] bg-white hover:bg-[#FAF9F5] border border-[#DFDBD0] text-xs font-medium text-[#111111] disabled:opacity-40 cursor-pointer inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <button
              type="button"
              disabled={!nextCase}
              onClick={() => nextCase && onSelectReport?.(nextCase.primary_report_id)}
              className="h-8 px-2.5 rounded-[8px] bg-white hover:bg-[#FAF9F5] border border-[#DFDBD0] text-xs font-medium text-[#111111] disabled:opacity-40 cursor-pointer inline-flex items-center gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          AREA B: 2-COLUMN WORKSPACE (LEFT: ORIGINAL QUESTION | RIGHT: AI INVESTIGATION)
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* LEFT COLUMN: ORIGINAL QUESTION + COLLAPSIBLE STUDENT REPORTS */}
        <div className="space-y-4">
          <section className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E2D9]">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-[17px] font-[425] text-[#111111]">
                  Original Question
                </h2>
                <span className="font-mono text-[10.5px] uppercase px-2 py-0.5 rounded bg-[#EFECE6] border border-[#DFDBD0] text-[#111111]">
                  {questionType}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {questionVersion > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowOriginalVersion((v) => !v)}
                    className="text-[11px] font-mono px-2 py-0.5 rounded border border-[#DFDBD0] bg-[#F9F8F3] hover:bg-[#EFECE6] text-[#111111] cursor-pointer"
                  >
                    {showOriginalVersion ? "Viewing Unmodified Seed" : `Viewing v${questionVersion} · Compare Original`}
                  </button>
                )}
                <span className="font-mono text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F9F8F3] border border-[#DFDBD0] text-[#111111]">
                  Key: {storedAnswer || "—"}
                </span>
              </div>
            </div>

            {/* Question Stem & Images (HTML + Inline MathML Preserved!) */}
            <div className="text-[14px] text-[#111111] leading-relaxed">
              <MathContent content={stemHtml || "No question text available."} />
            </div>

            {declaredImages.length > 0 && (
              <div className="space-y-2 pt-1">
                {declaredImages.map((imgUrl, idx) => (
                  <img
                    key={idx}
                    src={imgUrl}
                    alt={`Question figure ${idx + 1}`}
                    className="max-h-56 rounded-[10px] border border-[#E5E2D9] object-contain bg-[#F9F8F3] p-2"
                  />
                ))}
              </div>
            )}

            {/* Options (SCQ / MCQ) or Numerical Key Box */}
            {questionType === "integer" ? (
              <div className="p-3 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6] text-[12.5px] flex items-center justify-between">
                <span className="text-[#666666] font-medium">Integer Answer Schema</span>
                <span className="font-mono font-semibold text-[#111111]">{storedAnswer || "—"}</span>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {optionsList.map((opt) => {
                  const isCorrectKey = String(storedAnswer).toUpperCase().includes(opt.key)
                  return (
                    <div
                      key={opt.key}
                      className={`p-3 rounded-[10px] border text-[13px] flex items-start gap-2.5 ${
                        opt.isMissing
                          ? "bg-[#FEF2F2]/60 border-[#FECACA]"
                          : isCorrectKey
                          ? "bg-[#ECFDF3]/70 border-[#BBF7D0]"
                          : "bg-[#F9F8F3] border-[#E5E2D9]"
                      }`}
                    >
                      <span className="font-mono font-semibold text-[#111111] shrink-0">({opt.key})</span>
                      {opt.isMissing ? (
                        <span className="text-[12px] text-[#B91C1C] font-medium">
                          Missing option detected in HTML structure
                        </span>
                      ) : (
                        <div className="min-w-0 flex-1">
                          <MathContent content={opt.html || opt.text || ""} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Stored Solution Preview */}
            {solutionHtml && (
              <details className="pt-2 border-t border-[#F0EEE6] text-[12.5px]">
                <summary className="cursor-pointer font-medium text-[#555555] hover:text-[#111111]">
                  Stored Official Solution
                </summary>
                <div className="mt-2 p-3 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6] leading-relaxed">
                  <MathContent content={solutionHtml} />
                </div>
              </details>
            )}
          </section>

          {/* COLLAPSIBLE STUDENT REPORTS SECTION */}
          <section className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setReportsExpanded((v) => !v)}
              className="w-full px-5 py-3.5 bg-[#FAF9F5] hover:bg-[#EFECE6]/70 flex items-center justify-between text-left cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#555555]" />
                <span className="font-display text-[15px] font-[425] text-[#111111]">
                  Student Reports ({peerReports.length})
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#666666] transition-transform ${reportsExpanded ? "rotate-180" : ""}`}
              />
            </button>

            {reportsExpanded && (
              <div className="p-4 space-y-2.5 border-t border-[#E5E2D9]">
                {peerReports.map((pr: any) => (
                  <div
                    key={pr.reportId}
                    onClick={() => pr.reportId !== reportId && onSelectReport?.(pr.reportId)}
                    className={`p-3 rounded-[10px] border text-[12.5px] space-y-1 ${
                      pr.reportId === reportId
                        ? "bg-[#EAE7DC]/55 border-[#C5C1B4]"
                        : "bg-[#F9F8F3] border-[#E2DFD6] cursor-pointer hover:bg-[#EFECE6]/70"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#666666]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#111111]">{pr.reportId}</span>
                        <span className="px-1.5 py-0.5 rounded bg-white border border-[#DFDBD0] uppercase">
                          {pr.source || "web"}
                        </span>
                      </div>
                      <span>{formatDateTime(pr.reportedAt)}</span>
                    </div>
                    <p className="text-[#111111]">"{pr.comment || "No comment provided"}"</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: AI INVESTIGATION & MATHEMATICAL VERIFICATION */}
        <div className="space-y-4">
          <section className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E2D9]">
              <h2 className="font-display text-[17px] font-[425] text-[#111111]">
                AI Investigation
              </h2>
              <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-[#EFECE6] border border-[#DFDBD0] text-[#111111]">
                Confidence: {triage.confidence ? `${Math.round(triage.confidence * 100)}%` : "Pending"}
              </span>
            </div>

            {!triage.verdict ? (
              <div className="p-6 text-center rounded-[12px] bg-[#F9F8F3] border border-[#E5E2D9] space-y-1.5">
                <Clock className="w-5 h-5 mx-auto text-[#777777]" />
                <p className="text-[13px] font-medium text-[#111111]">AI investigation pending</p>
                <p className="text-[12px] text-[#666666]">No automated classification generated yet for this report.</p>
              </div>
            ) : (
              <>
                {/* 3 Independent Decisions */}
                <div className="grid grid-cols-3 gap-2.5 text-[12px]">
                  <div className="p-3 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6] space-y-1">
                    <span className="font-mono text-[10px] uppercase text-[#666666] block">1. Verdict</span>
                    <span className="font-mono font-semibold text-[#111111]">{triage.verdict}</span>
                  </div>
                  <div className="p-3 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6] space-y-1">
                    <span className="font-mono text-[10px] uppercase text-[#666666] block">2. Repair</span>
                    <span className="font-mono font-semibold text-[#111111]">{triage.repair || "none"}</span>
                  </div>
                  <div className="p-3 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6] space-y-1">
                    <span className="font-mono text-[10px] uppercase text-[#666666] block">3. Route</span>
                    <span className="font-mono font-semibold text-[#111111]">{triage.route}</span>
                  </div>
                </div>

                {/* Explanation & Supporting Evidence */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#666666]">
                    Supporting Evidence
                  </div>
                  <div className="p-3.5 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6] text-[13px] text-[#222222] leading-relaxed">
                    {triage.evidence}
                  </div>
                </div>

                {/* Safety & Taxonomy Permission Scope */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                  {triage.safety_checks?.prompt_injection_detected && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
                      Prompt Injection Neutralized
                    </span>
                  )}
                  {taxonomyRules && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full border ${
                        taxonomyRules.auto
                          ? "bg-[#ECFDF3] text-[#15803D] border-[#D1FADF]"
                          : "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]"
                      }`}
                    >
                      {taxonomyRules.auto
                        ? `auto: true · fields: [${taxonomyRules.fields.join(", ")}]`
                        : "auto: false · Faculty Approval Required"}
                    </span>
                  )}
                </div>

                {/* Mathematical Verification (Expandable, Honest Provenance Only!) */}
                <div className="border border-[#E5E2D9] rounded-[10px] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMathDetailsExpanded((v) => !v)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF9F5] flex items-center justify-between text-[12px] font-medium text-[#111111] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#555555]" />
                      <span>
                        Mathematical Verification:{" "}
                        <strong className="font-mono">
                          {solverVerified ? solver.verification_status : "Requires Faculty Validation"}
                        </strong>
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#666666] transition-transform ${
                        mathDetailsExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {mathDetailsExpanded && (
                    <div className="p-3.5 bg-white border-t border-[#E5E2D9] text-[12px] text-[#444444] space-y-1.5">
                      <div>
                        <span className="font-semibold text-[#111111]">Provenance: </span>
                        {provenance}
                      </div>
                      {solver.computed_answer && (
                        <div>
                          <span className="font-semibold text-[#111111]">Solver Computed Answer: </span>
                          <span className="font-mono">{String(solver.computed_answer)}</span>
                        </div>
                      )}
                      {solver.notes && <p>{solver.notes}</p>}
                    </div>
                  )}
                </div>

                {/* Collapsible Raw Metadata */}
                <div className="border border-[#E5E2D9] rounded-[10px] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setRawMetaExpanded((v) => !v)}
                    className="w-full px-3.5 py-2 bg-[#FAF9F5] flex items-center justify-between text-[11.5px] font-mono text-[#666666] cursor-pointer"
                  >
                    <span>Student Reply Draft & Raw Metadata</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${rawMetaExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                  {rawMetaExpanded && (
                    <div className="p-3 bg-white border-t border-[#E5E2D9] text-[12px] text-[#555555] space-y-1.5">
                      <p>
                        <strong className="text-[#111111]">Draft Reply:</strong> {triage.student_reply}
                      </p>
                      <p className="font-mono text-[11px]">
                        Report: {report.reportId} · Student: {report.studentId} · Taxonomy Label: {taxonomyRules?.label || "N/A"}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {/* =====================================================================
          AREA C: PROPOSED CORRECTION BEFORE/AFTER DIFF + SIMPLE ACTION BAR
      ===================================================================== */}
      <section className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E2D9]">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4.5 h-4.5 text-[#111111]" />
            <h2 className="font-display text-[17px] font-[425] text-[#111111]">
              Correction & Decision
            </h2>
          </div>
          {activeProposal && (
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-[#EFECE6] border border-[#DFDBD0] text-[#111111]">
              Target Field: {activeProposal.field}
            </span>
          )}
        </div>

        {/* Before / After Diff */}
        {activeProposal ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12.5px]">
            <div className="p-3.5 rounded-[12px] bg-[#FEF2F2]/60 border border-[#FECACA] space-y-1">
              <span className="font-mono text-[10.5px] uppercase text-[#B91C1C]">Before (Stored Content)</span>
              <div className="font-mono text-[#111111] break-words">
                {activeProposal.old_value || activeProposal.find || "—"}
              </div>
            </div>
            <div className="p-3.5 rounded-[12px] bg-[#ECFDF3]/70 border border-[#BBF7D0] space-y-1">
              <span className="font-mono text-[10.5px] uppercase text-[#15803D]">After (Proposed Change)</span>
              <div className="font-mono font-semibold text-[#111111] break-words">
                {activeProposal.new_value || activeProposal.replace || "—"}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-[12px] bg-[#F9F8F3] border border-[#E2DFD6] text-[12.5px] text-[#555555]">
            No automated field patch proposed for this investigation. Record a faculty decision below.
          </div>
        )}

        {/* Progressive-Disclosure Surgical Editor (Shown ONLY after clicking Edit Correction) */}
        {isEditing && (
          <div className="p-4 rounded-[12px] bg-[#F9F8F3] border border-[#C5C1B4] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-[#111111]">
                Surgical Field Editor (Restricted to Permitted Taxonomy Fields)
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-[#666666] hover:text-[#111111] cursor-pointer"
              >
                Cancel Edit
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
              <div>
                <label className="block text-[11px] text-[#666666] mb-1">Permitted Field</label>
                <select
                  value={editField}
                  onChange={(e) => setEditField(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-[8px] bg-white border border-[#C5C1B4] font-mono"
                >
                  {permittedFields.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[#666666] mb-1">Find / Original</label>
                <input
                  type="text"
                  value={editFind}
                  onChange={(e) => setEditFind(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-[8px] bg-white border border-[#C5C1B4] font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#666666] mb-1">Corrected Value</label>
                <input
                  type="text"
                  value={editReplace}
                  onChange={(e) => setEditReplace(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-[8px] bg-white border border-[#111111] font-mono"
                  placeholder={questionType === "scq" ? "e.g. A" : "Replacement text..."}
                />
              </div>
            </div>
          </div>
        )}

        {/* Rationale Note + Compact Action Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <input
            type="text"
            value={facultyNotes}
            onChange={(e) => setFacultyNotes(e.target.value)}
            placeholder="Optional review note (recorded in append-only Audit Ledger)..."
            className="flex-1 h-9 px-3 rounded-[8px] bg-[#F9F8F3] border border-[#DFDBD0] text-[12.5px] text-[#111111] placeholder:text-[#888888] focus:outline-none focus:ring-1 focus:ring-[#111111]"
          />

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isEditing ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => commitAction("edit")}
                className="h-9 px-4 rounded-[8px] bg-[#0B0F12] hover:bg-[#1f2328] text-white text-[12.5px] font-medium cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save & Approve Edit</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isSubmitting || reviewStatus === "approved" || reviewStatus === "rejected"}
                  onClick={() => commitAction("approve")}
                  title={reviewStatus === "rejected" ? "Rejected proposals cannot be approved" : "Approve proposed correction"}
                  className="h-9 px-4 rounded-[8px] bg-[#0B0F12] hover:bg-[#1f2328] text-white text-[12.5px] font-medium cursor-pointer disabled:opacity-45 inline-flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Approve</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || !canEditFields}
                  onClick={() => setIsEditing(true)}
                  title={!canEditFields ? "This repair type has no permitted automated edit fields (human authoring only)" : "Edit permitted field"}
                  className="h-9 px-3.5 rounded-[8px] bg-white hover:bg-[#FAF9F5] border border-[#C5C1B4] text-[#111111] text-[12.5px] font-medium cursor-pointer disabled:opacity-45 inline-flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Correction</span>
                </button>
              </>
            )}

            <button
              type="button"
              disabled={isSubmitting || reviewStatus === "rejected"}
              onClick={() => commitAction("reject")}
              className="h-9 px-3.5 rounded-[8px] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-[12.5px] font-medium cursor-pointer disabled:opacity-45 inline-flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || reviewStatus === "no_change"}
              onClick={() => commitAction("no_change")}
              className="h-9 px-3.5 rounded-[8px] bg-[#F9F8F3] hover:bg-[#EFECE6] border border-[#DFDBD0] text-[#111111] text-[12.5px] font-medium cursor-pointer disabled:opacity-45 inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>No Change</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || reviewStatus === "deferred"}
              onClick={() => commitAction("defer")}
              className="h-9 px-3.5 rounded-[8px] bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] text-[12.5px] font-medium cursor-pointer disabled:opacity-45 inline-flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Escalate</span>
            </button>
          </div>
        </div>

        {/* Collapsible Case Audit Trail */}
        <div className="pt-2 border-t border-[#F0EEE6]">
          <button
            type="button"
            onClick={() => setAuditExpanded((v) => !v)}
            className="text-[11.5px] font-mono text-[#666666] hover:text-[#111111] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <HistoryIcon className="w-3.5 h-3.5" />
            <span>Audit History for Question ({auditHistory.length})</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${auditExpanded ? "rotate-180" : ""}`} />
          </button>

          {auditExpanded && (
            <div className="mt-2.5 space-y-1.5">
              {auditHistory.length === 0 ? (
                <p className="text-[12px] text-[#777777]">No audit actions recorded for this question yet.</p>
              ) : (
                auditHistory.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-[8px] bg-[#F9F8F3] border border-[#E5E2D9] text-[12px] flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-mono font-semibold text-[#111111] uppercase">{log.action}</span>
                      <span className="text-[#555555]"> by {log.faculty_name} — {log.notes}</span>
                    </div>
                    <span className="font-mono text-[11px] text-[#777777]">{formatDateTime(log.created_at)}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
