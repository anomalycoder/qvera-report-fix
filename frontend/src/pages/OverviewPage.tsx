import React, { useState, useEffect, useCallback } from "react"
import {
  FileText,
  Layers,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  Activity,
  History,
  MinusCircle,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export interface QueueNavigationPreset {
  view?: string
  verdict?: string
  search?: string
}

interface OverviewPageProps {
  onNavigateToWorkspace: (reportId: string) => void
  onNavigateToQueue: (preset?: QueueNavigationPreset) => void
  onNavigateToAudit?: () => void
  onNavigateToSettings?: () => void
}

function formatDateCompact(ts?: string | null): string {
  if (!ts) return "—"
  const d = new Date(ts.includes("T") ? ts : `${ts.replace(" ", "T")}Z`)
  if (Number.isNaN(d.getTime())) return ts.slice(0, 10)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigateToWorkspace,
  onNavigateToQueue,
  onNavigateToAudit,
  onNavigateToSettings,
}) => {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queueFilter, setQueueFilter] = useState<string>("all")
  const [expandedPriorityQids, setExpandedPriorityQids] = useState<Record<string, boolean>>({})
  const [expandedRecentQids, setExpandedRecentQids] = useState<Record<string, boolean>>({})

  const fetchWorkflowOverview = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)
    setError(null)
    try {
      const res = await fetch("/api/v1/faculty/workflow-overview")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message || "Failed to load workflow overview")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkflowOverview(false)

    let es: EventSource | null = null
    if (typeof EventSource !== "undefined") {
      es = new EventSource("/api/v1/faculty/notifications/stream")
      es.addEventListener("queue_update", () => fetchWorkflowOverview(true))
    }
    const onLocalAction = () => fetchWorkflowOverview(true)
    window.addEventListener("qvera:faculty-action", onLocalAction)

    return () => {
      if (es) es.close()
      window.removeEventListener("qvera:faculty-action", onLocalAction)
    }
  }, [fetchWorkflowOverview])

  const kpis = data?.kpis
  const pipeline = data?.pipeline_stages
  const verdicts = data?.verdict_distribution || []
  const repairActivity = data?.repair_activity
  const safety = data?.ai_performance_and_safety
  const priorityCasesAll: any[] = data?.priority_cases || []
  const recentInvestigations: any[] = data?.recent_investigations || []
  const auditEvents: any[] = data?.audit_events || []

  const filteredPriorityCases = priorityCasesAll.filter((c) => {
    if (queueFilter === "faculty_review") return c.route === "faculty_review"
    if (queueFilter === "auto_fix") return c.route === "auto_apply" && c.repair_auto_allowed
    if (queueFilter === "no_change") return c.workflow_status === "No Change"
    if (queueFilter === "rejected_or_suspicious") {
      return c.raw_status === "rejected" || c.prompt_injection_detected
    }
    return true
  })

  const renderStatusPill = (status: string) => {
    switch (status) {
      case "Approved":
      case "Applied":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#15803D] bg-[#ECFDF3] px-2.5 py-0.5 rounded-full border border-[#D1FADF]">
            <CheckCircle2 className="w-3 h-3" />
            {status}
          </span>
        )
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B91C1C] bg-[#FEF2F2] px-2.5 py-0.5 rounded-full border border-[#FECACA]">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        )
      case "Escalated":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B45309] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
            <Clock className="w-3 h-3" />
            Escalated
          </span>
        )
      case "Auto-Fix Eligible":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#15803D] bg-[#F0FDF4] px-2.5 py-0.5 rounded-full border border-[#BBF7D0]">
            <Sparkles className="w-3 h-3" />
            Auto-Fix Eligible
          </span>
        )
      case "Needs Faculty Review":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B45309] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
            <ShieldAlert className="w-3 h-3" />
            Needs Faculty Review
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#555555] bg-[#F9F8F3] px-2.5 py-0.5 rounded-full border border-[#DFDBD0]">
            <MinusCircle className="w-3 h-3" />
            {status}
          </span>
        )
    }
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-6 max-w-[1360px] mx-auto">
        <Skeleton className="h-8 w-96 bg-[#EAE7DC] rounded-[10px]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 bg-[#EFECE6] rounded-[16px]" />
          ))}
        </div>
        <Skeleton className="h-44 bg-[#EFECE6] rounded-[16px]" />
        <Skeleton className="h-80 bg-[#EFECE6] rounded-[16px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto font-sans">
      {/* =====================================================================
          HEADER STRIP (COMPACT WORKFLOW SUBTITLE + REAL-TIME SYNC)
      ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[13.5px] text-[#555555]">
          Monitor reported questions, AI investigations and faculty resolutions.
        </p>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full bg-[#ECFDF3] text-[#15803D] border border-[#D1FADF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
            Live · {kpis?.unique_questions ?? 0} Question Cases
          </span>
          <button
            type="button"
            onClick={() => fetchWorkflowOverview(true)}
            className="h-8 px-3 rounded-[8px] bg-white hover:bg-[#FAF9F5] border border-[#DFDBD0] text-[12px] font-medium text-[#111111] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] px-4 py-3 rounded-[12px] text-xs flex items-center justify-between">
          <span>Unable to reach workflow telemetry: {error}</span>
          <button onClick={() => fetchWorkflowOverview(true)} className="underline font-semibold cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* =====================================================================
          SECTION 3: FOUR CLICKABLE KPI CARDS (100% REAL COUNTS)
      ===================================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigateToQueue({ view: "all" })}
          className="text-left bg-white hover:bg-[#FAF9F5] rounded-[16px] p-5 border-[1.5px] border-[#C5C1B4] shadow-xs transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[12px] font-medium text-[#666666]">
            <span>Total Reports</span>
            <FileText className="w-4 h-4 text-[#555555] group-hover:text-[#111111]" />
          </div>
          <div className="mt-2 font-display text-[30px] font-[425] text-[#111111] tracking-tight leading-none">
            {kpis?.total_reports ?? 0}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11.5px] text-[#666666]">
            <span>Student error submissions</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#888888] group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToQueue({ view: "all" })}
          className="text-left bg-white hover:bg-[#FAF9F5] rounded-[16px] p-5 border-[1.5px] border-[#C5C1B4] shadow-xs transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[12px] font-medium text-[#666666]">
            <span>Unique Questions</span>
            <Layers className="w-4 h-4 text-[#555555] group-hover:text-[#111111]" />
          </div>
          <div className="mt-2 font-display text-[30px] font-[425] text-[#111111] tracking-tight leading-none">
            {kpis?.unique_questions ?? 0}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11.5px] text-[#666666]">
            <span>{kpis?.multi_report_questions ?? 0} with grouped multi-reports</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#888888] group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToQueue({ view: "faculty_review" })}
          className="text-left bg-white hover:bg-[#FAF9F5] rounded-[16px] p-5 border-[1.5px] border-[#C5C1B4] shadow-xs transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[12px] font-medium text-[#666666]">
            <span>Faculty Review Required</span>
            <ShieldAlert className="w-4 h-4 text-[#B45309]" />
          </div>
          <div className="mt-2 font-display text-[30px] font-[425] text-[#111111] tracking-tight leading-none">
            {kpis?.faculty_review_required ?? 0}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11.5px] text-[#666666]">
            <span>{kpis?.pending_faculty_cases ?? 0} awaiting faculty decision</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#888888] group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToQueue({ view: "auto_fix" })}
          className="text-left bg-white hover:bg-[#FAF9F5] rounded-[16px] p-5 border-[1.5px] border-[#C5C1B4] shadow-xs transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[12px] font-medium text-[#666666]">
            <span>Auto-Fix Eligible</span>
            <Sparkles className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="mt-2 font-display text-[30px] font-[425] text-[#111111] tracking-tight leading-none">
            {kpis?.auto_fix_eligible ?? 0}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11.5px] text-[#666666]">
            <span>Taxonomy-permitted & safety verified</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#888888] group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </section>

      {/* =====================================================================
          SECTION 4: REPORT -> FIX 4-STAGE PIPELINE
      ===================================================================== */}
      <section className="bg-white rounded-[16px] sm:rounded-[20px] p-5 sm:p-6 border-[1.5px] border-[#C5C1B4] shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-[18px] font-[425] text-[#111111] tracking-tight">
              Report → Fix Pipeline
            </h2>
            <p className="text-[12px] text-[#666666]">
              End-to-end processing state across intake, CAS + AI triage, human signoff, and resolution.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#555555] bg-[#F9F8F3] border border-[#DFDBD0] px-2.5 py-1 rounded-full">
            {pipeline?.triage?.data_source || "Deterministic Triage Engine"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 01 REPORT INTAKE */}
          <button
            type="button"
            onClick={() => onNavigateToQueue({ view: "all" })}
            className="text-left p-4 rounded-[14px] bg-[#F9F8F3] hover:bg-[#EFECE6] border border-[#DFDBD0] transition-colors cursor-pointer space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold text-[#666666]">01 — REPORT INTAKE</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#666666]" />
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 text-[12px]">
              <span className="text-[#666666]">Total reports</span>
              <span className="font-mono font-semibold text-right text-[#111111]">{pipeline?.intake?.total_reports ?? 0}</span>
              <span className="text-[#666666]">Unique questions</span>
              <span className="font-mono font-semibold text-right text-[#111111]">{pipeline?.intake?.unique_questions ?? 0}</span>
              <span className="text-[#666666]">Grouped clusters</span>
              <span className="font-mono font-semibold text-right text-[#111111]">{pipeline?.intake?.multi_report_questions ?? 0}</span>
            </div>
          </button>

          {/* 02 AI TRIAGE */}
          <button
            type="button"
            onClick={() => onNavigateToQueue({ view: "all", verdict: "defect" })}
            className="text-left p-4 rounded-[14px] bg-[#F9F8F3] hover:bg-[#EFECE6] border border-[#DFDBD0] transition-colors cursor-pointer space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold text-[#666666]">02 — AI TRIAGE</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#666666]" />
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 text-[12px]">
              <span className="text-[#666666]">Evaluated reports</span>
              <span className="font-mono font-semibold text-right text-[#111111]">{pipeline?.triage?.evaluated_reports ?? 0}</span>
              <span className="text-[#666666]">Defect cases</span>
              <span className="font-mono font-semibold text-right text-[#111111]">{pipeline?.triage?.defects_detected ?? 0}</span>
              <span className="text-[#666666]">Mean confidence</span>
              <span className="font-mono font-semibold text-right text-[#111111]">
                {pipeline?.triage?.avg_confidence ? `${Math.round(pipeline.triage.avg_confidence * 100)}%` : "—"}
              </span>
            </div>
          </button>

          {/* 03 FACULTY REVIEW */}
          <button
            type="button"
            onClick={() => onNavigateToQueue({ view: "faculty_review" })}
            className="text-left p-4 rounded-[14px] bg-[#F9F8F3] hover:bg-[#EFECE6] border border-[#DFDBD0] transition-colors cursor-pointer space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold text-[#B45309]">03 — FACULTY REVIEW</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#B45309]" />
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 text-[12px]">
              <span className="text-[#666666]">Pending reviews</span>
              <span className="font-mono font-semibold text-right text-[#111111]">{pipeline?.faculty_review?.pending_reviews ?? 0}</span>
              <span className="text-[#666666]">With edit proposals</span>
              <span className="font-mono font-semibold text-right text-[#111111]">{pipeline?.faculty_review?.cases_requiring_edits ?? 0}</span>
              <span className="text-[#666666]">Awaiting decision</span>
              <span className="font-mono font-semibold text-right text-[#111111]">{pipeline?.faculty_review?.awaiting_decisions ?? 0}</span>
            </div>
          </button>

          {/* 04 RESOLUTION */}
          <button
            type="button"
            onClick={() => onNavigateToQueue({ view: "resolved" })}
            className="text-left p-4 rounded-[14px] bg-[#F9F8F3] hover:bg-[#EFECE6] border border-[#DFDBD0] transition-colors cursor-pointer space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold text-[#15803D]">04 — RESOLUTION</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#15803D]" />
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 text-[12px]">
              <span className="text-[#666666]">Auto-fix eligible</span>
              <span className="font-mono font-semibold text-right text-[#111111]">{pipeline?.resolution?.auto_applied_fixes ?? 0}</span>
              <span className="text-[#666666]">Faculty approved</span>
              <span className="font-mono font-semibold text-right text-[#111111]">{pipeline?.resolution?.faculty_approved_fixes ?? 0}</span>
              <span className="text-[#666666]">Rejected / No change</span>
              <span className="font-mono font-semibold text-right text-[#111111]">
                {(pipeline?.resolution?.rejected_proposals ?? 0)} / {(pipeline?.resolution?.no_change_decisions ?? 0)}
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* =====================================================================
          SECTION 5: PRIORITY REVIEW QUEUE (GROUPED BY QUESTION ID)
      ===================================================================== */}
      <section className="bg-white rounded-[16px] sm:rounded-[20px] p-5 sm:p-6 border-[1.5px] border-[#C5C1B4] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[19px] font-[425] text-[#111111] tracking-tight">
              Priority Review Queue (Grouped by Question)
            </h2>
            <p className="text-[12px] text-[#666666]">
              One investigation case per unique question, prioritized by multi-student consensus, defect impact, and review block.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-[#F9F8F3] p-1 rounded-[10px] border border-[#DFDBD0] text-[12px]">
            {[
              { id: "all", label: "All Cases" },
              { id: "faculty_review", label: "Faculty Review" },
              { id: "auto_fix", label: "Auto-Fix Eligible" },
              { id: "no_change", label: "No Change" },
              { id: "rejected_or_suspicious", label: "Rejected / Suspicious" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setQueueFilter(tab.id)}
                className={`px-3 py-1.5 rounded-[7px] font-medium transition-colors cursor-pointer ${
                  queueFilter === tab.id
                    ? "bg-[#EAE7DC] text-[#111111] font-semibold shadow-2xs"
                    : "text-[#555555] hover:text-[#111111]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto border border-[#E5E2D9] rounded-[12px]">
          <table className="w-full text-left border-collapse text-[12.5px]">
            <thead className="bg-[#FAF9F5] border-b border-[#E5E2D9] text-[11px] uppercase tracking-wider text-[#666666]">
              <tr>
                <th className="py-3 px-3.5">Question ID</th>
                <th className="py-3 px-3">Subject</th>
                <th className="py-3 px-3">Reports</th>
                <th className="py-3 px-3">Verdict</th>
                <th className="py-3 px-3">Repair</th>
                <th className="py-3 px-3">Conf.</th>
                <th className="py-3 px-3">Route</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Updated</th>
                <th className="py-3 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEE6]">
              {filteredPriorityCases.slice(0, 8).map((c) => {
                const isExpanded = !!expandedPriorityQids[c.question_id]
                return (
                  <React.Fragment key={c.question_id}>
                    <tr className="hover:bg-[#FAF9F5] transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedPriorityQids((p) => ({
                                ...p,
                                [c.question_id]: !p[c.question_id],
                              }))
                            }
                            className="p-1 rounded hover:bg-[#EFECE6] text-[#666666] cursor-pointer"
                            title="Expand associated student reports"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                          <div>
                            <div className="font-mono font-semibold text-[#111111] text-[12px]">
                              {c.question_id.slice(-8)}
                            </div>
                            <div className="text-[11px] text-[#666666] truncate max-w-[180px]">
                              {c.chapter || c.stem_preview}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-[#111111]">{c.subject}</span>
                        <span className="block text-[10px] font-mono text-[#777777] uppercase">
                          {c.sources?.join(", ")} · {c.question_type}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPriorityQids((p) => ({
                              ...p,
                              [c.question_id]: !p[c.question_id],
                            }))
                          }
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border cursor-pointer ${
                            c.report_count > 1
                              ? "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]"
                              : "bg-[#F9F8F3] text-[#444444] border-[#DFDBD0]"
                          }`}
                        >
                          {c.report_count} {c.report_count === 1 ? "report" : "reports"}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11.5px] text-[#111111]">
                        {c.ai_verdict}
                      </td>
                      <td className="py-3 px-3">
                        {c.repair_type ? (
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#EFECE6] border border-[#DFDBD0] text-[#111111]">
                            {c.repair_type}
                          </span>
                        ) : (
                          <span className="text-[#888888] font-mono text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[12px] text-[#111111]">
                        {Math.round((c.confidence || 0) * 100)}%
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[#555555]">
                        {c.route}
                      </td>
                      <td className="py-3 px-3">
                        {renderStatusPill(c.workflow_status)}
                      </td>
                      <td className="py-3 px-3 text-[11.5px] text-[#666666] font-mono">
                        {formatDateCompact(c.updated_at)}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => onNavigateToWorkspace(c.primary_report_id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[7px] bg-[#0B0F12] hover:bg-[#1f2328] text-white text-[11.5px] font-medium cursor-pointer transition-colors"
                        >
                          <span>Investigate</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-[#FAF9F5]">
                        <td colSpan={10} className="px-6 py-3.5 border-t border-[#E5E2D9]">
                          <div className="space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
                              <span className="font-semibold text-[#111111]">
                                Priority Score {c.priority_score} ({c.urgency_level} {c.urgency_label}):{" "}
                                <span className="font-normal text-[#555555]">
                                  {c.priority_signals?.join(" · ")}
                                </span>
                              </span>
                              <span className="font-mono text-[#666666]">Full ID: {c.question_id}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {c.associated_reports?.map((rep: any) => (
                                <div
                                  key={rep.report_id}
                                  className="p-2.5 rounded-[10px] bg-white border border-[#E2DFD6] flex items-start justify-between gap-2"
                                >
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2 text-[11px] font-mono">
                                      <span className="font-semibold text-[#111111]">{rep.report_id}</span>
                                      <span className="text-[#666666] uppercase">{rep.source}</span>
                                      <span className="text-[#888888]">{formatDateCompact(rep.reported_at)}</span>
                                    </div>
                                    <p className="text-[12px] text-[#333333]">{rep.comment}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => onNavigateToWorkspace(rep.report_id)}
                                    className="text-[11px] font-medium text-[#111111] underline shrink-0 cursor-pointer"
                                  >
                                    Open
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-1 text-[12px] text-[#666666]">
          <span>
            Showing {Math.min(8, filteredPriorityCases.length)} of {filteredPriorityCases.length} matching question cases
          </span>
          <button
            type="button"
            onClick={() => onNavigateToQueue({ view: queueFilter })}
            className="font-medium text-[#111111] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Open full Review Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* =====================================================================
          SECTIONS 6 & 7: AI VERDICT DISTRIBUTION + REPAIR ACTIVITY
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* SECTION 6: EXACT TAXONOMY VERDICT DISTRIBUTION */}
        <section className="bg-white rounded-[16px] sm:rounded-[20px] p-5 sm:p-6 border-[1.5px] border-[#C5C1B4] shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-[18px] font-[425] text-[#111111] tracking-tight">
                AI Verdict Distribution
              </h2>
              <p className="text-[12px] text-[#666666]">
                Exact categories from <code className="font-mono text-[#111111]">taxonomy.json</code>. Click a row to filter queue.
              </p>
            </div>
            {(data?.suspicious_reports_count ?? 0) > 0 && (
              <button
                type="button"
                onClick={() => onNavigateToQueue({ view: "rejected_or_suspicious", verdict: "suspicious" })}
                className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] cursor-pointer hover:bg-[#FEE2E2]"
              >
                {data.suspicious_reports_count} Suspicious / Injection Flagged
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {verdicts.map((v: any) => (
              <button
                key={v.key}
                type="button"
                onClick={() => onNavigateToQueue({ view: "all", verdict: v.key })}
                className="w-full text-left p-2.5 rounded-[10px] hover:bg-[#F9F8F3] border border-transparent hover:border-[#E2DFD6] transition-colors cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2 text-[12.5px]">
                  <div className="min-w-0">
                    <span className="font-mono font-semibold text-[#111111]">{v.key}</span>
                    <span className="text-[#666666] ml-2 text-[11.5px] truncate">{v.description}</span>
                  </div>
                  <span className="font-mono font-semibold text-[#111111] shrink-0">
                    {v.question_count} ({v.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#EFECE6] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${v.key === "defect" ? "bg-[#0B0F12]" : "bg-[#7A7569]"}`}
                    style={{ width: `${Math.max(v.percentage, v.question_count > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* SECTION 7: REPAIR ACTIVITY & TAXONOMY SAFETY */}
        <section className="bg-white rounded-[16px] sm:rounded-[20px] p-5 sm:p-6 border-[1.5px] border-[#C5C1B4] shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-[18px] font-[425] text-[#111111] tracking-tight">
                Repair Activity & Scope Rules
              </h2>
              <p className="text-[12px] text-[#666666]">
                Repairs with <code className="font-mono text-[#111111]">auto: false</code> always enforce faculty review.
              </p>
            </div>
            {onNavigateToSettings && (
              <button
                type="button"
                onClick={onNavigateToSettings}
                className="text-[11.5px] font-medium text-[#111111] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Taxonomy Rules</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-[10px] bg-[#F9F8F3] border border-[#E5E2D9]">
              <div className="font-mono text-[16px] font-semibold text-[#111111]">{repairActivity?.proposed_corrections ?? 0}</div>
              <div className="text-[11px] text-[#666666]">Proposed</div>
            </div>
            <div className="p-2.5 rounded-[10px] bg-[#ECFDF3] border border-[#D1FADF]">
              <div className="font-mono text-[16px] font-semibold text-[#15803D]">{repairActivity?.auto_applied_repairs ?? 0}</div>
              <div className="text-[11px] text-[#15803D]">Auto-Eligible</div>
            </div>
            <div className="p-2.5 rounded-[10px] bg-[#FFFBEB] border border-[#FDE68A]">
              <div className="font-mono text-[16px] font-semibold text-[#B45309]">{repairActivity?.awaiting_faculty_approval ?? 0}</div>
              <div className="text-[11px] text-[#B45309]">Awaiting Approval</div>
            </div>
            <div className="p-2.5 rounded-[10px] bg-[#F9F8F3] border border-[#E5E2D9]">
              <div className="font-mono text-[16px] font-semibold text-[#111111]">{repairActivity?.faculty_approved_repairs ?? 0}</div>
              <div className="text-[11px] text-[#666666]">Faculty Approved</div>
            </div>
            <div className="p-2.5 rounded-[10px] bg-[#FEF2F2] border border-[#FECACA]">
              <div className="font-mono text-[16px] font-semibold text-[#B91C1C]">{repairActivity?.rejected_repairs ?? 0}</div>
              <div className="text-[11px] text-[#B91C1C]">Rejected</div>
            </div>
            <div className="p-2.5 rounded-[10px] bg-[#F9F8F3] border border-[#E5E2D9]">
              <div className="font-mono text-[16px] font-semibold text-[#111111]">{repairActivity?.no_change_cases ?? 0}</div>
              <div className="text-[11px] text-[#666666]">No Change</div>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto border border-[#E5E2D9] rounded-[10px] divide-y divide-[#F0EEE6] text-[12px]">
            {(repairActivity?.breakdown || []).map((rep: any) => (
              <div key={rep.key} className="px-3 py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-[#111111]">{rep.key}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        rep.auto
                          ? "bg-[#F9F8F3] text-[#444444] border-[#DFDBD0]"
                          : "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]"
                      }`}
                    >
                      {rep.auto ? `scope: ${rep.fields.join(", ")}` : "auto: false · faculty only"}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[11.5px] font-semibold text-[#111111] shrink-0">
                  {rep.proposed_count} cases
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* =====================================================================
          SECTION 8: RECENT INVESTIGATIONS (EXPANDABLE EVIDENCE + STUDENT COMMENT)
      ===================================================================== */}
      <section className="bg-white rounded-[16px] sm:rounded-[20px] p-5 sm:p-6 border-[1.5px] border-[#C5C1B4] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-[18px] font-[425] text-[#111111] tracking-tight">
              Recent Investigations
            </h2>
            <p className="text-[12px] text-[#666666]">
              Inspect original student comments side-by-side with AI verification evidence.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-[#E5E2D9] rounded-[12px]">
          <table className="w-full text-left border-collapse text-[12.5px]">
            <thead className="bg-[#FAF9F5] border-b border-[#E5E2D9] text-[11px] uppercase tracking-wider text-[#666666]">
              <tr>
                <th className="py-2.5 px-3.5">Question ID</th>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Associated reports</th>
                <th className="py-2.5 px-3">AI verdict</th>
                <th className="py-2.5 px-3">Repair</th>
                <th className="py-2.5 px-3">Route</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3.5 text-right">Updated at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEE6]">
              {recentInvestigations.slice(0, 6).map((item) => {
                const exp = !!expandedRecentQids[item.question_id]
                return (
                  <React.Fragment key={`recent-${item.question_id}`}>
                    <tr
                      onClick={() => onNavigateToWorkspace(item.primary_report_id)}
                      className="hover:bg-[#FAF9F5] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3.5 font-mono font-semibold text-[#111111]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedRecentQids((p) => ({
                              ...p,
                              [item.question_id]: !p[item.question_id],
                            }))
                          }}
                          className="inline-flex items-center gap-1.5 hover:underline cursor-pointer"
                        >
                          {exp ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          <span>{item.question_id.slice(-8)}</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-[#111111]">{item.subject}</td>
                      <td className="py-2.5 px-3 font-mono text-[#555555]">
                        {item.associated_reports?.map((r: any) => r.report_id).join(", ")}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#111111]">{item.ai_verdict}</td>
                      <td className="py-2.5 px-3 font-mono text-[#555555]">{item.repair_type || "—"}</td>
                      <td className="py-2.5 px-3 font-mono text-[#555555]">{item.route}</td>
                      <td className="py-2.5 px-3">{renderStatusPill(item.workflow_status)}</td>
                      <td className="py-2.5 px-3.5 text-right font-mono text-[#666666]">
                        {formatDateCompact(item.updated_at)}
                      </td>
                    </tr>
                    {exp && (
                      <tr className="bg-[#FAF9F5]">
                        <td colSpan={8} className="px-6 py-3 border-t border-[#E5E2D9]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
                            <div className="p-3 rounded-[10px] bg-white border border-[#E2DFD6] space-y-1">
                              <span className="font-mono text-[10.5px] uppercase text-[#666666]">
                                Original Student Comment
                              </span>
                              <p className="text-[#111111]">
                                "{item.associated_reports?.[0]?.comment || "No comment provided"}"
                              </p>
                            </div>
                            <div className="p-3 rounded-[10px] bg-white border border-[#E2DFD6] space-y-1">
                              <span className="font-mono text-[10.5px] uppercase text-[#666666]">
                                AI Evidence & Verification
                              </span>
                              <p className="text-[#333333]">{item.evidence}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* =====================================================================
          SECTIONS 9 & 10: AI PERFORMANCE & SAFETY + REAL AUDIT ACTIVITY
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* SECTION 9: AI PERFORMANCE AND SAFETY */}
        <section className="bg-white rounded-[16px] sm:rounded-[20px] p-5 sm:p-6 border-[1.5px] border-[#C5C1B4] shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-[#111111]" />
            <h2 className="font-display text-[18px] font-[425] text-[#111111] tracking-tight">
              AI Performance & Safety Guardrails
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <div className="p-3.5 rounded-[12px] bg-[#F9F8F3] border border-[#E2DFD6] space-y-1">
              <span className="text-[11px] font-mono uppercase text-[#666666]">Model Confidence (≠ Accuracy)</span>
              <div className="font-display text-[22px] font-[425] text-[#111111]">
                {safety?.model_confidence?.average ? `${Math.round(safety.model_confidence.average * 100)}% mean` : "—"}
              </div>
              <div className="text-[11px] text-[#555555]">
                ≥90%: {safety?.model_confidence?.high_ge_90 ?? 0} · 80–89%: {safety?.model_confidence?.medium_80_89 ?? 0} · &lt;80%: {safety?.model_confidence?.low_lt_80 ?? 0}
              </div>
            </div>

            <div className="p-3.5 rounded-[12px] bg-[#F9F8F3] border border-[#E2DFD6] space-y-1">
              <span className="text-[11px] font-mono uppercase text-[#666666]">Ground-Truth Accuracy</span>
              <div className="font-display text-[17px] font-[425] text-[#111111]">
                {safety?.ground_truth_accuracy?.available ? `${safety.ground_truth_accuracy.value}%` : "Not Supplied"}
              </div>
              <div className="text-[11px] text-[#666666] leading-snug">
                {safety?.ground_truth_accuracy?.note}
              </div>
            </div>

            <div className="p-3.5 rounded-[12px] bg-[#F9F8F3] border border-[#E2DFD6] space-y-1">
              <span className="text-[11px] font-mono uppercase text-[#666666]">Repair Safety Enforced</span>
              <div className="space-y-0.5 text-[11.5px] text-[#111111]">
                <div>Out-of-scope edits blocked: <strong className="font-mono">{safety?.repair_safety?.out_of_scope_edits_rejected ?? 0}</strong></div>
                <div>Human-only (<code className="font-mono">auto:false</code>) gated: <strong className="font-mono">{safety?.repair_safety?.auto_false_gated_cases ?? 0}</strong></div>
                <div>Prompt injections neutralized: <strong className="font-mono">{safety?.repair_safety?.prompt_injections_neutralized ?? 0}</strong></div>
              </div>
            </div>

            <div className="p-3.5 rounded-[12px] bg-[#F9F8F3] border border-[#E2DFD6] space-y-1">
              <span className="text-[11px] font-mono uppercase text-[#666666]">Faculty Governance</span>
              <div className="space-y-0.5 text-[11.5px] text-[#111111]">
                <div>Recorded audit decisions: <strong className="font-mono">{safety?.faculty_governance?.total_recorded_decisions ?? 0}</strong></div>
                <div>Faculty override rate: <strong className="font-mono">{safety?.faculty_governance?.faculty_override_rate !== null && safety?.faculty_governance?.faculty_override_rate !== undefined ? `${safety.faculty_governance.faculty_override_rate}%` : "— (0 overrides yet)"}</strong></div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 10: REAL SQLITE ACTIVITY & AUDIT EVENTS */}
        <section className="bg-white rounded-[16px] sm:rounded-[20px] p-5 sm:p-6 border-[1.5px] border-[#C5C1B4] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4.5 h-4.5 text-[#111111]" />
              <h2 className="font-display text-[18px] font-[425] text-[#111111] tracking-tight">
                Activity & Immutable Audit Trail
              </h2>
            </div>
            {onNavigateToAudit && (
              <button
                type="button"
                onClick={onNavigateToAudit}
                className="text-[12px] font-medium text-[#111111] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Full Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {auditEvents.length === 0 ? (
            <div className="p-8 text-center rounded-[12px] bg-[#F9F8F3] border border-[#E5E2D9] space-y-1.5">
              <Activity className="w-5 h-5 mx-auto text-[#777777]" />
              <p className="text-[13px] font-medium text-[#111111]">No faculty audit events recorded yet</p>
              <p className="text-[11.5px] text-[#666666]">
                Every approval, edit, rejection, escalation, and no-change action creates a verifiable SQLite WAL audit log here.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {auditEvents.map((ev: any) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => ev.report_id && onNavigateToWorkspace(ev.report_id)}
                  className="w-full text-left p-3 rounded-[10px] bg-[#F9F8F3] hover:bg-[#EFECE6] border border-[#E5E2D9] flex items-start justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="font-mono font-semibold text-[#111111]">{ev.audit_ref}</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-[#DFDBD0] font-mono text-[10px] uppercase text-[#111111]">
                        {ev.action}
                      </span>
                      <span className="font-mono text-[11px] text-[#555555]">{ev.report_id}</span>
                    </div>
                    <p className="text-[11.5px] text-[#555555] truncate">
                      <span className="font-medium text-[#111111]">{ev.actor}</span> · {ev.notes}
                    </p>
                  </div>
                  <span className="text-[10.5px] font-mono text-[#777777] shrink-0">
                    {formatDateCompact(ev.created_at)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
