import React, { useState, useEffect, useCallback } from "react"
import {
  RotateCw,
  Download,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Clock,
  FileText,
  Layers,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import type { QueueNavigationPreset } from "@/pages/OverviewPage"

interface FacultyAnalyticsPageProps {
  onNavigateToQueue?: (preset?: QueueNavigationPreset) => void
  onNavigateToWorkspace?: (reportId: string) => void
}

export const FacultyAnalyticsPage: React.FC<FacultyAnalyticsPageProps> = ({
  onNavigateToQueue,
  onNavigateToWorkspace,
}) => {
  const [data, setData] = useState<any>(null)
  const [taxonomy, setTaxonomy] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sseLive, setSseLive] = useState(false)

  // Real interactive filters
  const [dateRange, setDateRange] = useState<string>("all")
  const [verdict, setVerdict] = useState<string>("all")
  const [repairType, setRepairType] = useState<string>("all")
  const [questionType, setQuestionType] = useState<string>("all")

  useEffect(() => {
    fetch("/api/v1/taxonomy")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => json && setTaxonomy(json))
      .catch(() => {})
  }, [])

  const fetchLiveAnalytics = useCallback(
    async (silent = false) => {
      if (silent) setIsRefreshing(true)
      else setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set("date_range", dateRange)
        if (verdict !== "all") params.set("verdict", verdict)
        if (repairType !== "all") params.set("repair_type", repairType)
        if (questionType !== "all") params.set("question_type", questionType)

        const res = await fetch(`/api/v1/faculty/analytics-live?${params.toString()}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        setData(await res.json())
      } catch (err: any) {
        setError(err.message || "Failed to load analytics")
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [dateRange, verdict, repairType, questionType]
  )

  useEffect(() => {
    fetchLiveAnalytics(false)
  }, [fetchLiveAnalytics])

  useEffect(() => {
    let es: EventSource | null = null
    if (typeof EventSource !== "undefined") {
      es = new EventSource("/api/v1/faculty/notifications/stream")
      es.onopen = () => setSseLive(true)
      es.onerror = () => setSseLive(false)
      es.addEventListener("queue_update", () => fetchLiveAnalytics(true))
    }
    const onLocal = () => fetchLiveAnalytics(true)
    window.addEventListener("qvera:faculty-action", onLocal)
    return () => {
      if (es) es.close()
      window.removeEventListener("qvera:faculty-action", onLocal)
    }
  }, [fetchLiveAnalytics])

  const exportCsv = () => {
    const rows: any[] = data?.matching_cases || []
    if (!rows.length) return
    const header = ["question_id", "primary_report_id", "subject", "question_type", "report_count", "ai_verdict", "repair_type", "route", "workflow_status", "confidence"]
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        header
          .map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ]
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `qvera-analytics-${dateRange}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const metrics = data?.metrics || {}
  const pipeline = data?.pipeline || {}
  const verdicts: any[] = data?.verdict_distribution || []
  const repairRes = data?.repair_and_resolution || {}
  const platforms: any[] = data?.platform_distribution || []
  const perf = data?.resolution_performance || {}
  const safety = data?.ai_quality_and_safety || {}
  const matchingCases: any[] = data?.matching_cases || []

  if (isLoading && !data) {
    return (
      <div className="space-y-5 max-w-[1360px] mx-auto">
        <Skeleton className="h-14 w-full bg-[#EAE7DC] rounded-[14px]" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 bg-[#EFECE6] rounded-[14px]" />
          ))}
        </div>
        <Skeleton className="h-64 bg-[#EFECE6] rounded-[16px]" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="p-8 text-center bg-white border-[1.5px] border-[#C5C1B4] rounded-[18px] max-w-md mx-auto my-12 space-y-3 font-sans">
        <AlertTriangle className="w-8 h-8 text-[#B91C1C] mx-auto" />
        <h3 className="font-display text-base font-semibold text-[#111111]">Analytics Unavailable</h3>
        <p className="text-xs text-[#666666]">{error}</p>
        <Button size="sm" onClick={() => fetchLiveAnalytics(false)}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-[1360px] mx-auto font-sans">
      {/* =====================================================================
          HEADER & REAL DATE / DIMENSION CONTROLS
      ===================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <p className="text-[13.5px] text-[#555555]">
            Understand reported errors, investigation outcomes and correction performance.
          </p>
          <span className="text-[11px] font-mono text-[#777777]">
            Last updated: {data?.generated_at ? new Date(data.generated_at).toLocaleTimeString() : "—"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border ${
              sseLive ? "bg-[#ECFDF3] text-[#15803D] border-[#D1FADF]" : "bg-[#F9F8F3] text-[#666666] border-[#DFDBD0]"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${sseLive ? "bg-[#16A34A] animate-pulse" : "bg-[#888888]"}`} />
            Live
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLiveAnalytics(true)}
            className="h-8 text-xs border-[#DFDBD0] bg-white rounded-[8px] text-[#111111]"
          >
            <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={matchingCases.length === 0}
            onClick={exportCsv}
            className="h-8 text-xs border-[#DFDBD0] bg-white rounded-[8px] text-[#111111]"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[14px] p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 bg-[#F9F8F3] p-1 rounded-[10px] border border-[#DFDBD0] text-[12px]">
          {[
            { id: "today", label: "Today" },
            { id: "7d", label: "Last 7 days" },
            { id: "30d", label: "Last 30 days" },
            { id: "all", label: "All time" },
          ].map((dr) => (
            <button
              key={dr.id}
              type="button"
              onClick={() => setDateRange(dr.id)}
              className={`px-3 py-1 rounded-[7px] font-medium cursor-pointer transition-colors ${
                dateRange === dr.id ? "bg-[#EAE7DC] text-[#111111] font-semibold" : "text-[#555555] hover:text-[#111111]"
              }`}
            >
              {dr.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <select
            value={verdict}
            onChange={(e) => setVerdict(e.target.value)}
            aria-label="Filter by verdict"
            className="bg-[#F9F8F3] border border-[#DFDBD0] rounded-[8px] px-2.5 h-8 text-[#111111]"
          >
            <option value="all">All Verdicts</option>
            {taxonomy?.verdicts &&
              Object.keys(taxonomy.verdicts).map((vk) => (
                <option key={vk} value={vk}>
                  {vk}
                </option>
              ))}
            <option value="suspicious">suspicious / injection</option>
          </select>

          <select
            value={repairType}
            onChange={(e) => setRepairType(e.target.value)}
            aria-label="Filter by repair type"
            className="bg-[#F9F8F3] border border-[#DFDBD0] rounded-[8px] px-2.5 h-8 text-[#111111]"
          >
            <option value="all">All Repair Types</option>
            {taxonomy?.repairs &&
              Object.keys(taxonomy.repairs).map((rk) => (
                <option key={rk} value={rk}>
                  {rk}
                </option>
              ))}
          </select>

          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value)}
            aria-label="Filter by question type"
            className="bg-[#F9F8F3] border border-[#DFDBD0] rounded-[8px] px-2.5 h-8 text-[#111111]"
          >
            <option value="all">All Types</option>
            <option value="scq">SCQ</option>
            <option value="mcq">MCQ</option>
            <option value="integer">Integer</option>
          </select>
        </div>
      </div>

      {/* =====================================================================
          A. 5 KEY WORKFLOW METRICS (REPORTS VS UNIQUE QUESTIONS STRICTLY SEPARATE)
      ===================================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <button
          type="button"
          onClick={() => onNavigateToQueue?.({ view: "all", verdict: verdict !== "all" ? verdict : undefined })}
          className="text-left bg-white hover:bg-[#FAF9F5] border-[1.5px] border-[#C5C1B4] rounded-[14px] p-4 shadow-xs cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-[11.5px] text-[#666666]">
            <span>Total Reports</span>
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1.5 font-display text-[26px] font-[425] text-[#111111]">
            {metrics.total_reports ?? 0}
          </div>
          <div className="text-[11px] text-[#777777] mt-1">Individual submissions</div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToQueue?.({ view: "all" })}
          className="text-left bg-white hover:bg-[#FAF9F5] border-[1.5px] border-[#C5C1B4] rounded-[14px] p-4 shadow-xs cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-[11.5px] text-[#666666]">
            <span>Questions Reported</span>
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1.5 font-display text-[26px] font-[425] text-[#111111]">
            {metrics.questions_reported ?? 0}
          </div>
          <div className="text-[11px] text-[#777777] mt-1">Distinct questionIds</div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToQueue?.({ view: "all", verdict: "defect" })}
          className="text-left bg-white hover:bg-[#FAF9F5] border-[1.5px] border-[#C5C1B4] rounded-[14px] p-4 shadow-xs cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-[11.5px] text-[#666666]">
            <span>Verified Defects</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[#B91C1C]" />
          </div>
          <div className="mt-1.5 font-display text-[26px] font-[425] text-[#111111]">
            {metrics.verified_defects_questions ?? 0}
          </div>
          <div className="text-[11px] text-[#777777] mt-1">
            Unique defect Qs ({metrics.verified_defects_reports ?? 0} reports)
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToQueue?.({ view: "resolved" })}
          className="text-left bg-white hover:bg-[#FAF9F5] border-[1.5px] border-[#C5C1B4] rounded-[14px] p-4 shadow-xs cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-[11.5px] text-[#666666]">
            <span>Resolved Questions</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
          </div>
          <div className="mt-1.5 font-display text-[26px] font-[425] text-[#111111]">
            {metrics.resolved_questions ?? 0}
          </div>
          <div className="text-[11px] text-[#777777] mt-1">Approved / Rejected / No-Change</div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToQueue?.({ view: "needs_review" })}
          className="text-left bg-white hover:bg-[#FAF9F5] border-[1.5px] border-[#C5C1B4] rounded-[14px] p-4 shadow-xs cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-[11.5px] text-[#666666]">
            <span>Awaiting Review</span>
            <ShieldAlert className="w-3.5 h-3.5 text-[#B45309]" />
          </div>
          <div className="mt-1.5 font-display text-[26px] font-[425] text-[#111111]">
            {metrics.awaiting_faculty_review ?? 0}
          </div>
          <div className="text-[11px] text-[#777777] mt-1">Open human-signoff cases</div>
        </button>
      </section>

      {/* =====================================================================
          B. COMPACT PIPELINE RECONCILIATION
      ===================================================================== */}
      <section className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] p-5 shadow-xs">
        <div className="text-[12px] font-mono uppercase tracking-wider text-[#666666] mb-3">
          Pipeline Reconciliation (Unique Question Cases)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6]">
            <div className="text-[11px] text-[#666666]">Student Reports → Unique Qs</div>
            <div className="font-mono text-[17px] font-semibold text-[#111111] mt-1">
              {pipeline.student_reports ?? 0} → {pipeline.unique_questions ?? 0}
            </div>
          </div>
          <div className="p-3 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6]">
            <div className="text-[11px] text-[#666666]">AI Triaged Questions</div>
            <div className="font-mono text-[17px] font-semibold text-[#111111] mt-1">
              {pipeline.ai_triaged_questions ?? 0}
            </div>
          </div>
          <div className="p-3 rounded-[10px] bg-[#FFFBEB] border border-[#FDE68A]">
            <div className="text-[11px] text-[#B45309]">Routed to Faculty Review</div>
            <div className="font-mono text-[17px] font-semibold text-[#111111] mt-1">
              {pipeline.faculty_review_required ?? 0}
            </div>
          </div>
          <div className="p-3 rounded-[10px] bg-[#ECFDF3] border border-[#D1FADF]">
            <div className="text-[11px] text-[#15803D]">Resolved Questions</div>
            <div className="font-mono text-[17px] font-semibold text-[#111111] mt-1">
              {pipeline.resolved_questions ?? 0}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          C & D: VERDICT CHART + REPAIR / PLATFORM DISTRIBUTION
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-[17px] font-[425] text-[#111111]">
                Taxonomy Verdict Distribution
              </h2>
              <p className="text-[11.5px] text-[#666666]">
                Click any bar to filter matching cases below.
              </p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={verdicts}>
                <XAxis dataKey="key" tick={{ fontSize: 11, fill: "#555555" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#555555" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#C5C1B4",
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="question_count"
                  name="Questions"
                  radius={[6, 6, 0, 0]}
                  onClick={(barData: any) => {
                    if (barData?.key) setVerdict(barData.key)
                  }}
                  className="cursor-pointer"
                >
                  {verdicts.map((entry: any) => (
                    <Cell
                      key={entry.key}
                      fill={entry.key === "defect" ? "#0B0F12" : "#6F6A5E"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] p-5 shadow-xs space-y-4">
          <h2 className="font-display text-[17px] font-[425] text-[#111111]">
            Repair Outcomes & Reporting Sources
          </h2>

          <div className="grid grid-cols-5 gap-2 text-center text-[11px]">
            <div className="p-2 rounded-[8px] bg-[#ECFDF3] border border-[#D1FADF]">
              <div className="font-mono text-[15px] font-semibold text-[#15803D]">{repairRes.auto_applied_or_eligible ?? 0}</div>
              <div>Auto-Eligible</div>
            </div>
            <div className="p-2 rounded-[8px] bg-[#F9F8F3] border border-[#E2DFD6]">
              <div className="font-mono text-[15px] font-semibold text-[#111111]">{repairRes.faculty_approved ?? 0}</div>
              <div>Approved</div>
            </div>
            <div className="p-2 rounded-[8px] bg-[#FFFBEB] border border-[#FDE68A]">
              <div className="font-mono text-[15px] font-semibold text-[#B45309]">{repairRes.awaiting_approval ?? 0}</div>
              <div>Awaiting</div>
            </div>
            <div className="p-2 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA]">
              <div className="font-mono text-[15px] font-semibold text-[#B91C1C]">{repairRes.rejected_corrections ?? 0}</div>
              <div>Rejected</div>
            </div>
            <div className="p-2 rounded-[8px] bg-[#F9F8F3] border border-[#E2DFD6]">
              <div className="font-mono text-[15px] font-semibold text-[#111111]">{repairRes.no_change_decisions ?? 0}</div>
              <div>No Change</div>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-mono uppercase text-[#666666]">Reports by Client Platform (Live)</div>
            <div className="grid grid-cols-3 gap-2">
              {platforms.length === 0 ? (
                <span className="col-span-3 text-xs text-[#777777]">No reports in selected range</span>
              ) : (
                platforms.map((p: any) => (
                  <div
                    key={p.source}
                    className="p-2.5 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6] flex items-center justify-between text-[12px]"
                  >
                    <span className="capitalize font-medium text-[#111111]">{p.source}</span>
                    <span className="font-mono font-semibold text-[#111111]">
                      {p.count} ({p.percentage}%)
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================================
          E & F: RESOLUTION PERFORMANCE + AI QUALITY & SAFETY
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#111111]" />
            <h2 className="font-display text-[17px] font-[425] text-[#111111]">Resolution Performance</h2>
          </div>
          <p className="text-[11.5px] text-[#666666]">{perf.definition}</p>

          <div className="grid grid-cols-3 gap-3 text-[12px]">
            <div className="p-3 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6]">
              <span className="text-[#666666] block text-[11px]">Avg Resolution Time</span>
              <span className="font-mono text-[17px] font-semibold text-[#111111]">
                {perf.avg_resolution_hours !== null && perf.avg_resolution_hours !== undefined
                  ? `${perf.avg_resolution_hours}h`
                  : "No timestamps"}
              </span>
            </div>
            <div className="p-3 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6]">
              <span className="text-[#666666] block text-[11px]">Pending Backlog Age</span>
              <span className="font-mono text-[17px] font-semibold text-[#111111]">
                {perf.avg_pending_age_days ?? 0}d
              </span>
            </div>
            <div className="p-3 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6]">
              <span className="text-[#666666] block text-[11px]">Unresolved Backlog</span>
              <span className="font-mono text-[17px] font-semibold text-[#111111]">
                {perf.unresolved_backlog ?? 0}
              </span>
            </div>
          </div>
        </section>

        <section className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#111111]" />
            <h2 className="font-display text-[17px] font-[425] text-[#111111]">AI Quality & Safety</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <div className="p-3 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6]">
              <span className="text-[11px] font-mono text-[#666666]">AI Ground-Truth Accuracy</span>
              <div className="font-semibold text-[#111111] mt-0.5">Not Supplied in Dataset</div>
              <span className="text-[11px] text-[#666666]">
                Mean model confidence: {safety.mean_model_confidence ? `${Math.round(safety.mean_model_confidence * 100)}%` : "—"}
              </span>
            </div>
            <div className="p-3 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6] space-y-0.5">
              <div>Out-of-scope rejected: <strong className="font-mono">{safety.out_of_scope_modifications_rejected ?? 0}</strong></div>
              <div>Human-only gated: <strong className="font-mono">{safety.human_only_repairs_gated ?? 0}</strong></div>
              <div>Override rate: <strong className="font-mono">{safety.faculty_override_rate !== null && safety.faculty_override_rate !== undefined ? `${safety.faculty_override_rate}%` : "Insufficient decisions"}</strong></div>
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================================
          DRILL-DOWN MATCHING RECORDS TABLE
      ===================================================================== */}
      <section className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[16px] font-[425] text-[#111111]">
            Drill-Down Cases ({matchingCases.length})
          </h2>
          {onNavigateToQueue && (
            <button
              type="button"
              onClick={() => onNavigateToQueue({ view: "all", verdict: verdict !== "all" ? verdict : undefined })}
              className="text-xs font-medium text-[#111111] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Open in Review Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto max-h-72 border border-[#E5E2D9] rounded-[10px]">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead className="bg-[#FAF9F5] border-b border-[#E5E2D9] text-[11px] uppercase text-[#666666]">
              <tr>
                <th className="py-2 px-3">Question ID</th>
                <th className="py-2 px-3">Subject</th>
                <th className="py-2 px-3">Reports</th>
                <th className="py-2 px-3">Verdict</th>
                <th className="py-2 px-3">Repair</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEE6]">
              {matchingCases.slice(0, 12).map((c) => (
                <tr
                  key={c.question_id}
                  onClick={() => onNavigateToWorkspace?.(c.primary_report_id)}
                  className="hover:bg-[#FAF9F5] cursor-pointer"
                >
                  <td className="py-2 px-3 font-mono font-semibold text-[#111111]">{c.question_id.slice(-8)}</td>
                  <td className="py-2 px-3">{c.subject} · {c.question_type}</td>
                  <td className="py-2 px-3 font-mono">{c.report_count}</td>
                  <td className="py-2 px-3 font-mono">{c.ai_verdict}</td>
                  <td className="py-2 px-3 font-mono">{c.repair_type || "—"}</td>
                  <td className="py-2 px-3">{c.workflow_status}</td>
                  <td className="py-2 px-3 text-right font-medium underline">Open</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
