import React, { useState, useEffect, useCallback } from "react"
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Inbox,
  RotateCw,
  Copy,
  Check,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Edit3,
  ExternalLink,
  MinusCircle,
  AlertTriangle,
  Loader2,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MathContent } from "@/components/MathContent"
import { toast } from "sonner"
import type { QueueNavigationPreset } from "@/pages/OverviewPage"
import type { ProposedEdit } from "@/types/triage"

interface ReviewQueuePageProps {
  onSelectReport: (reportId: string) => void
  initialSearch?: string
  initialPreset?: QueueNavigationPreset | null
  facultyName?: string
}

function formatUpdatedDate(ts?: string | null): string {
  if (!ts) return "—"
  const d = new Date(ts.includes("T") ? ts : `${ts.replace(" ", "T")}Z`)
  if (Number.isNaN(d.getTime())) return ts.slice(0, 10)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export const ReviewQueuePage: React.FC<ReviewQueuePageProps> = ({
  onSelectReport,
  initialSearch = "",
  initialPreset = null,
  facultyName = "Dr. A. Sharma",
}) => {
  const [items, setItems] = useState<any[]>([])
  const [facets, setFacets] = useState<any>(null)
  const [taxonomy, setTaxonomy] = useState<any>(null)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sseLive, setSseLive] = useState(false)

  // Real Filters
  const [search, setSearch] = useState(initialSearch)
  const [viewFilter, setViewFilter] = useState(initialPreset?.view || "all")
  const [subject, setSubject] = useState("all")
  const [verdict, setVerdict] = useState(initialPreset?.verdict || "all")
  const [repairType, setRepairType] = useState("all")
  const [dateRange, setDateRange] = useState("all")
  const [sortBy, setSortBy] = useState("priority")
  const [page, setPage] = useState(0)
  const limit = 15

  // Inline Question Review Slide-Over Drawer State
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)
  const [caseDetail, setCaseDetail] = useState<any>(null)
  const [caseLoading, setCaseLoading] = useState(false)
  const [expandedReportIds, setExpandedReportIds] = useState<Record<string, boolean>>({})
  const [isEditMode, setIsEditMode] = useState(false)
  const [editField, setEditField] = useState<string>("answer")
  const [editFind, setEditFind] = useState<string>("")
  const [editReplace, setEditReplace] = useState<string>("")
  const [facultyNote, setFacultyNote] = useState<string>("")
  const [confirmApprove, setConfirmApprove] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync preset/search props from Overview or Global Search
  useEffect(() => {
    setSearch(initialSearch)
    setPage(0)
  }, [initialSearch])

  useEffect(() => {
    if (!initialPreset) return
    if (initialPreset.view !== undefined) setViewFilter(initialPreset.view)
    if (initialPreset.verdict !== undefined) setVerdict(initialPreset.verdict)
    if (initialPreset.search !== undefined) setSearch(initialPreset.search)
    setPage(0)
  }, [initialPreset])

  // Load closed taxonomy from backend once
  useEffect(() => {
    fetch("/api/v1/taxonomy")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json) setTaxonomy(json)
      })
      .catch(() => {})
  }, [])

  const fetchGroupedQueue = useCallback(
    async (silent = false) => {
      if (silent) setIsRefreshing(true)
      else setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set("skip", String(page * limit))
        params.set("limit", String(limit))
        params.set("view", viewFilter)
        params.set("sort_by", sortBy)
        params.set("date_range", dateRange)
        if (search.trim()) params.set("search", search.trim())
        if (subject !== "all") params.set("subject", subject)
        if (verdict !== "all") params.set("verdict", verdict)
        if (repairType !== "all") params.set("repair_type", repairType)

        const res = await fetch(`/api/v1/faculty/queue/grouped?${params.toString()}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setItems(json.items || [])
        setTotal(json.total || 0)
        if (json.facets) setFacets(json.facets)
      } catch (err: any) {
        setError(err.message || "Unable to fetch grouped review queue")
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [page, viewFilter, sortBy, dateRange, search, subject, verdict, repairType]
  )

  const loadQuestionCase = useCallback(async (qid: string) => {
    setActiveQuestionId(qid)
    setCaseLoading(true)
    setConfirmApprove(false)
    setIsEditMode(false)
    setFacultyNote("")
    try {
      const res = await fetch(`/api/v1/faculty/question-case/${qid}`)
      if (!res.ok) throw new Error(`Case ${qid} unavailable`)
      const json = await res.json()
      setCaseDetail(json)
      const c = json.case
      const pEdit = c?.proposed_edit
      const permitted = c?.permitted_fields || []
      setEditField(pEdit?.field && permitted.includes(pEdit.field) ? pEdit.field : permitted[0] || "answer")
      setEditFind(pEdit?.find || pEdit?.old_value || "")
      setEditReplace(pEdit?.replace || pEdit?.new_value || "")
    } catch (err: any) {
      toast.error(err.message || "Failed to load question review details")
    } finally {
      setCaseLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGroupedQueue(false)
  }, [fetchGroupedQueue])

  // Real-time SSE listener: auto-refresh queue & active case when reports arrive or another reviewer acts
  useEffect(() => {
    let es: EventSource | null = null
    if (typeof EventSource !== "undefined") {
      es = new EventSource("/api/v1/faculty/notifications/stream")
      es.onopen = () => setSseLive(true)
      es.onerror = () => setSseLive(false)
      es.addEventListener("queue_update", () => {
        fetchGroupedQueue(true)
        if (activeQuestionId) loadQuestionCase(activeQuestionId)
      })
    }
    const onLocal = () => {
      fetchGroupedQueue(true)
      if (activeQuestionId) loadQuestionCase(activeQuestionId)
    }
    window.addEventListener("qvera:faculty-action", onLocal)
    return () => {
      if (es) es.close()
      window.removeEventListener("qvera:faculty-action", onLocal)
    }
  }, [fetchGroupedQueue, activeQuestionId, loadQuestionCase])

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    toast.success(`Copied Question ID: ${id}`)
    setTimeout(() => setCopiedId(null), 1800)
  }

  // Faculty Decisions (Backend-enforced, Wait for server confirmation, Question-grouped!)
  const executeDecision = async (
    actionType: "approve" | "edit" | "reject" | "no_change" | "defer"
  ) => {
    if (!caseDetail?.case || isSubmitting) return
    const qCase = caseDetail.case
    const primaryRid = qCase.primary_report_id

    let endpoint = `/api/v1/faculty/${actionType}/${primaryRid}`
    if (actionType === "edit") endpoint = `/api/v1/faculty/approve/${primaryRid}`
    if (actionType === "no_change") endpoint = `/api/v1/faculty/no-change/${primaryRid}`

    const bodyPayload: any = {
      faculty_name: facultyName,
      notes: facultyNote.trim() || undefined,
      apply_to_question: true,
    }

    if (actionType === "edit") {
      if (!editReplace.trim()) {
        toast.error("Please provide the corrected replacement text.")
        return
      }
      const custom: ProposedEdit = {
        field: editField as any,
        operation: "replace",
        find: editFind,
        replace: editReplace,
        old_value: editFind,
        new_value: editReplace,
        reason: facultyNote.trim() || "Manual faculty surgical correction",
      }
      bodyPayload.custom_edit = custom
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.detail || `Action failed (${res.status})`)
      }

      toast.success(result.message || "Decision persisted to SQLite WAL audit ledger.")
      setConfirmApprove(false)
      setIsEditMode(false)
      setFacultyNote("")
      window.dispatchEvent(new CustomEvent("qvera:faculty-action"))
      await Promise.all([fetchGroupedQueue(true), loadQuestionCase(qCase.question_id)])
    } catch (err: any) {
      toast.error(err.message || "Action blocked or failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetFilters = () => {
    setSearch("")
    setViewFilter("all")
    setSubject("all")
    setVerdict("all")
    setRepairType("all")
    setDateRange("all")
    setSortBy("priority")
    setPage(0)
  }

  const renderPriorityBadge = (urgency: string) => {
    switch (urgency) {
      case "L1":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#B91C1C] bg-[#FEF2F2] px-2.5 py-0.5 rounded-full border border-[#FECACA]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            Critical
          </span>
        )
      case "L2":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#B45309] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            High
          </span>
        )
      case "L3":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#222222] bg-[#EFECE6] px-2.5 py-0.5 rounded-full border border-[#DFDBD0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30343B]" />
            Medium
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#666666] bg-[#F9F8F3] px-2.5 py-0.5 rounded-full border border-[#E2DFD6]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#888888]" />
            Low
          </span>
        )
    }
  }

  const renderWorkflowStatus = (statusStr: string) => {
    switch (statusStr) {
      case "Approved":
      case "Applied":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#15803D] bg-[#ECFDF3] px-2.5 py-0.5 rounded-full border border-[#D1FADF]">
            <CheckCircle2 className="w-3 h-3" />
            {statusStr}
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
      case "Needs Faculty Review":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B45309] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
            <ShieldAlert className="w-3 h-3" />
            Needs Faculty Review
          </span>
        )
      case "Auto-Fix Eligible":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#15803D] bg-[#F0FDF4] px-2.5 py-0.5 rounded-full border border-[#BBF7D0]">
            <Sparkles className="w-3 h-3" />
            Auto-Fix Eligible
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#555555] bg-[#F9F8F3] px-2.5 py-0.5 rounded-full border border-[#DFDBD0]">
            <MinusCircle className="w-3 h-3" />
            {statusStr}
          </span>
        )
    }
  }

  const totalPages = Math.ceil(total / limit)
  const verdictsKeys: string[] = taxonomy?.verdicts ? Object.keys(taxonomy.verdicts) : ["defect", "no_error", "display_issue", "app_issue", "language_mode", "already_fixed", "not_actionable"]
  const repairsKeys: string[] = taxonomy?.repairs ? Object.keys(taxonomy.repairs) : []

  const activeCase = caseDetail?.case
  const activeQ = caseDetail?.question
  const activeNorm = activeQ?.normalized

  return (
    <div className="space-y-5 max-w-[1360px] mx-auto font-sans">
      {/* =========================================================================
          SIMPLE HEADER CONTEXT BAR
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-[13.5px] text-[#555555]">
            Review reported questions and resolve verified issues.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11.5px] font-semibold text-[#111111] bg-[#EFECE6] px-3 py-1 rounded-full border border-[#DFDBD0]">
            {facets?.needs_review ?? 0} awaiting faculty review
          </span>
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border ${
              sseLive
                ? "bg-[#ECFDF3] text-[#15803D] border-[#D1FADF]"
                : "bg-[#F9F8F3] text-[#666666] border-[#DFDBD0]"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${sseLive ? "bg-[#16A34A] animate-pulse" : "bg-[#888888]"}`} />
            Live
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchGroupedQueue(true)}
            className="border-[#DFDBD0] bg-white hover:bg-[#FAF9F5] text-xs font-medium h-8 rounded-[8px] text-[#111111]"
          >
            <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </Button>
        </div>
      </div>

      {/* =========================================================================
          SIMPLE FILTERS + SEARCH TOOLBAR (100% FUNCTIONAL AGAINST BACKEND)
      ========================================================================= */}
      <div className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] p-4 shadow-xs space-y-3">
        {/* Top Row: Clean Essential View Tabs + Quick Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 bg-[#F9F8F3] p-1 rounded-[10px] border border-[#DFDBD0] text-[12px]">
            {[
              { id: "all", label: `All (${facets?.all ?? total})` },
              { id: "needs_review", label: `Needs Review (${facets?.needs_review ?? 0})` },
              { id: "high_priority", label: `High Priority (${facets?.high_priority ?? 0})` },
              { id: "recently_updated", label: `Recently Updated (${facets?.recently_updated ?? 0})` },
              { id: "resolved", label: `Resolved (${facets?.resolved ?? 0})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setViewFilter(tab.id)
                  setPage(0)
                }}
                className={`px-3 py-1.5 rounded-[7px] font-medium transition-colors cursor-pointer ${
                  viewFilter === tab.id
                    ? "bg-[#EAE7DC] text-[#111111] font-semibold shadow-2xs"
                    : "text-[#555555] hover:text-[#111111]"
                }`}
              >
                {tab.label}
              </button>
            ))}

            {["faculty_review", "auto_fix", "no_change", "rejected_or_suspicious"].includes(viewFilter) && (
              <span className="px-2.5 py-1 rounded-[7px] bg-[#0B0F12] text-white text-[11px] font-mono inline-flex items-center gap-1.5">
                {viewFilter.replace("_", " ")}
                <button
                  type="button"
                  onClick={() => setViewFilter("all")}
                  className="hover:opacity-75 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          <div className="relative w-full lg:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              placeholder="Search question, ID, comment..."
              className="w-full pl-8 pr-7 h-9 text-xs bg-[#F9F8F3] border border-[#DFDBD0] rounded-[8px] text-[#111111] placeholder:text-[#888888] focus:outline-none focus:ring-1 focus:ring-[#111111]"
            />
            <Search className="w-3.5 h-3.5 text-[#777777] absolute left-2.5 top-2.5 pointer-events-none" />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-2.5 text-[#777777] hover:text-[#111111] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Compact Filter Dropdown Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1 text-[12px]">
          <select
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value)
              setPage(0)
            }}
            aria-label="Filter by Subject"
            className="bg-[#F9F8F3] border border-[#DFDBD0] rounded-[8px] px-2.5 h-8 text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
          >
            <option value="all">All Subjects</option>
            {(facets?.subjects || ["Physics", "Botany", "Zoology"]).map((s: string) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={verdict}
            onChange={(e) => {
              setVerdict(e.target.value)
              setPage(0)
            }}
            aria-label="Filter by Verdict"
            className="bg-[#F9F8F3] border border-[#DFDBD0] rounded-[8px] px-2.5 h-8 text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
          >
            <option value="all">All Verdicts</option>
            {verdictsKeys.map((vk) => (
              <option key={vk} value={vk}>
                {vk}
              </option>
            ))}
            <option value="suspicious">suspicious / prompt injection</option>
          </select>

          <select
            value={repairType}
            onChange={(e) => {
              setRepairType(e.target.value)
              setPage(0)
            }}
            aria-label="Filter by Repair Type"
            className="bg-[#F9F8F3] border border-[#DFDBD0] rounded-[8px] px-2.5 h-8 text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
          >
            <option value="all">All Repair Types</option>
            {repairsKeys.map((rk) => (
              <option key={rk} value={rk}>
                {rk}
              </option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value)
              setPage(0)
            }}
            aria-label="Filter by Report Date"
            className="bg-[#F9F8F3] border border-[#DFDBD0] rounded-[8px] px-2.5 h-8 text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
          >
            <option value="all">All Report Dates</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#777777] shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort queue"
              className="flex-1 bg-[#F9F8F3] border border-[#DFDBD0] rounded-[8px] px-2.5 h-8 text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
            >
              <option value="priority">Sort: Multi-Signal Priority</option>
              <option value="reports">Sort: Most Reports</option>
              <option value="confidence">Sort: AI Confidence</option>
              <option value="updated">Sort: Recently Updated</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] px-4 py-3 rounded-[12px] text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchGroupedQueue(false)} className="underline font-semibold cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* =========================================================================
          MAIN GROUPED REVIEW LIST (1 ROW PER UNIQUE QUESTION ID)
      ========================================================================= */}
      <div className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] shadow-xs overflow-hidden">
        {isLoading && items.length === 0 ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-full bg-[#EFECE6] rounded-[8px]" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Inbox className="w-10 h-10 text-[#C5C1B4] mx-auto" />
            <h3 className="font-display text-sm font-semibold text-[#111111]">No Matching Questions</h3>
            <p className="text-xs text-[#666666] max-w-sm mx-auto">
              No grouped question cases match the selected filters.
            </p>
            <Button size="sm" variant="outline" onClick={resetFilters} className="text-xs rounded-[8px] border-[#DFDBD0]">
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead className="bg-[#FAF9F5] border-b border-[#E5E2D9] text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                <tr>
                  <th className="py-3 px-4">Question</th>
                  <th className="py-3 px-3">Reports</th>
                  <th className="py-3 px-3">AI Verdict</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Updated</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EEE6]">
                {items.map((item) => (
                  <tr
                    key={item.question_id}
                    onClick={() => loadQuestionCase(item.question_id)}
                    className={`cursor-pointer transition-colors ${
                      activeQuestionId === item.question_id ? "bg-[#EAE7DC]/55" : "hover:bg-[#FAF9F5]"
                    }`}
                  >
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-[12px] text-[#111111]">
                          {item.question_id.slice(-8)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyId(e, item.question_id)}
                          className="text-[#777777] hover:text-[#111111] p-0.5 rounded cursor-pointer"
                          title={`Copy full Question ID (${item.question_id})`}
                        >
                          {copiedId === item.question_id ? (
                            <Check className="w-3 h-3 text-[#16A34A]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <span className="text-[11px] text-[#666666]">
                          {item.subject} · {item.chapter}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#444444] line-clamp-1 mt-0.5">
                        {item.stem_preview || item.associated_reports?.[0]?.comment || "Reported question"}
                      </p>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${
                          item.report_count > 1
                            ? "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA] font-semibold"
                            : "bg-[#F9F8F3] text-[#444444] border-[#DFDBD0]"
                        }`}
                      >
                        {item.report_count > 1 && <Users className="w-3 h-3" />}
                        <span>
                          {item.report_count} {item.report_count === 1 ? "report" : "reports"}
                        </span>
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[11.5px] font-semibold text-[#111111]">
                          {item.ai_verdict}
                        </span>
                        {item.repair_type && (
                          <span className="font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-[#EFECE6] border border-[#DFDBD0] text-[#333333]">
                            {item.repair_type}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3" title={item.priority_signals?.join(" · ")}>
                      {renderPriorityBadge(item.urgency_level)}
                    </td>

                    <td className="py-3.5 px-3">
                      {renderWorkflowStatus(item.workflow_status)}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-[11.5px] text-[#666666]">
                      {formatUpdatedDate(item.updated_at)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          loadQuestionCase(item.question_id)
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[7px] bg-[#0B0F12] hover:bg-[#1f2328] text-white text-[11.5px] font-medium cursor-pointer transition-colors"
                      >
                        <span>Review</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-3.5 bg-[#FAF9F5] border-t border-[#E5E2D9] flex items-center justify-between text-xs text-[#666666]">
          <div>
            Showing <span className="font-semibold text-[#111111]">{items.length}</span> of{" "}
            <span className="font-semibold text-[#111111]">{total}</span> grouped question cases
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="border-[#DFDBD0] bg-white hover:bg-[#F9F8F3] h-8 px-2.5 text-xs rounded-[8px] text-[#111111]"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Previous
            </Button>

            <span className="font-mono text-xs text-[#111111] font-medium px-2">
              Page {page + 1} of {Math.max(1, totalPages)}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="border-[#DFDBD0] bg-white hover:bg-[#F9F8F3] h-8 px-2.5 text-xs rounded-[8px] text-[#111111]"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          QUESTION REVIEW SLIDE-OVER PANEL (ALL-IN-ONE REPORT -> FIX WORKFLOW)
      ========================================================================= */}
      {activeQuestionId && (
        <div
          className="fixed inset-0 z-50 bg-[#0B0F12]/25 backdrop-blur-[2px] flex justify-end"
          onClick={() => setActiveQuestionId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-[#F9F8F3] h-full border-l-[1.5px] border-[#C5C1B4] shadow-2xl flex flex-col"
          >
            {/* Slide-Over Header */}
            <div className="px-6 py-4 bg-white border-b border-[#E5E2D9] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[13px] font-semibold text-[#111111]">
                    {activeQuestionId}
                  </span>
                  {activeCase && renderPriorityBadge(activeCase.urgency_level)}
                  {activeCase && renderWorkflowStatus(activeCase.workflow_status)}
                </div>
                {activeCase && (
                  <p className="text-[12px] text-[#666666] mt-0.5 truncate">
                    {activeCase.subject} · {activeCase.chapter} · {activeCase.question_type.toUpperCase()}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeCase && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveQuestionId(null)
                      onSelectReport(activeCase.primary_report_id)
                    }}
                    className="h-8 px-3 rounded-[8px] bg-[#EFECE6] hover:bg-[#EAE7DC] border border-[#DFDBD0] text-[11.5px] font-medium text-[#111111] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Full Workspace</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveQuestionId(null)}
                  className="p-1.5 rounded-[8px] text-[#666666] hover:text-[#111111] hover:bg-[#EFECE6] cursor-pointer"
                  aria-label="Close review panel"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {caseLoading || !activeCase ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 bg-[#EAE7DC] rounded-[14px]" />
                  <Skeleton className="h-28 bg-[#EAE7DC] rounded-[14px]" />
                  <Skeleton className="h-36 bg-[#EAE7DC] rounded-[14px]" />
                </div>
              ) : (
                <>
                  {/* A. ORIGINAL QUESTION (HTML + MATHML + OPTIONS + OFFICIAL KEY) */}
                  <section className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[14px] p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#F0EEE6] pb-2.5">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#555555]">
                        A. Question ({activeCase.question_type.toUpperCase()})
                      </span>
                      <span className="font-mono text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EFECE6] border border-[#DFDBD0] text-[#111111]">
                        Official Answer Key: {activeNorm?.stored_answer || "N/A"}
                      </span>
                    </div>

                    <div className="text-[13.5px] text-[#111111] leading-relaxed">
                      <MathContent content={activeNorm?.raw_stem_html || activeNorm?.stem_text || ""} />
                    </div>

                    {Array.isArray(activeNorm?.options) && activeNorm.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {activeNorm.options.map((opt: any) => {
                          const optKey = String(opt.label || opt.key || "")
                          const isKeyed =
                            String(activeNorm?.stored_answer || "")
                              .toUpperCase()
                              .includes(optKey.toUpperCase())
                          return (
                            <div
                              key={optKey}
                              className={`p-2.5 rounded-[8px] border text-[12.5px] flex items-start gap-2 ${
                                isKeyed
                                  ? "bg-[#ECFDF3] border-[#BBF7D0]"
                                  : "bg-[#F9F8F3] border-[#E5E2D9]"
                              }`}
                            >
                              <span className="font-mono font-semibold text-[#111111] shrink-0">
                                ({optKey})
                              </span>
                              <div className="min-w-0 flex-1">
                                <MathContent content={opt.raw_html || opt.text || ""} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </section>

                  {/* B. STUDENT REPORTS GROUPED UNDER THIS QUESTION */}
                  <section className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[14px] p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#F0EEE6] pb-2.5">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#555555]">
                        B. Student Reports ({activeCase.report_count} grouped · {activeCase.unique_students} unique students)
                      </span>
                      {activeCase.prompt_injection_detected && (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
                          <AlertTriangle className="w-3 h-3" />
                          Prompt Injection Neutralized
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {activeCase.associated_reports.map((rep: any) => {
                        const isRepOpen = !!expandedReportIds[rep.report_id]
                        return (
                          <div
                            key={rep.report_id}
                            className="rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6] p-3 space-y-2"
                          >
                            <div
                              onClick={() =>
                                setExpandedReportIds((p) => ({
                                  ...p,
                                  [rep.report_id]: !p[rep.report_id],
                                }))
                              }
                              className="flex items-start justify-between gap-2 cursor-pointer"
                            >
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
                                  <span className="font-semibold text-[#111111]">{rep.report_id}</span>
                                  <span className="px-1.5 py-0.5 rounded bg-white border border-[#DFDBD0] uppercase">
                                    {rep.source}
                                  </span>
                                  <span className="text-[#666666]">{formatUpdatedDate(rep.reported_at)}</span>
                                  {rep.is_duplicate_comment && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EAE7DC] text-[#555555]">
                                      similar text
                                    </span>
                                  )}
                                </div>
                                <p className="text-[12.5px] text-[#111111]">"{rep.comment}"</p>
                              </div>
                              <ChevronDown
                                className={`w-4 h-4 text-[#666666] shrink-0 transition-transform ${
                                  isRepOpen ? "rotate-180" : ""
                                }`}
                              />
                            </div>

                            {isRepOpen && (
                              <div className="pt-2 border-t border-[#E5E2D9] text-[11.5px] text-[#444444] space-y-1">
                                <div>
                                  <span className="font-semibold text-[#111111]">Report Assessment: </span>
                                  {rep.evidence}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </section>

                  {/* C. AI INVESTIGATION */}
                  <section className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[14px] p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#F0EEE6] pb-2.5">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#555555]">
                        C. AI Investigation
                      </span>
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-[#EFECE6] border border-[#DFDBD0] text-[#111111]">
                          verdict: {activeCase.ai_verdict}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#EFECE6] border border-[#DFDBD0] text-[#111111]">
                          confidence: {Math.round((activeCase.confidence || 0) * 100)}%
                        </span>
                      </div>
                    </div>

                    <p className="text-[12.5px] text-[#222222] leading-relaxed">{activeCase.evidence}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                      <div className="p-3 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6] space-y-1">
                        <span className="font-mono text-[10.5px] uppercase text-[#666666]">Repair Scope</span>
                        <div className="font-mono font-semibold text-[#111111]">
                          {activeCase.repair_type || "No repair required"}
                        </div>
                        <div className="text-[11px] text-[#555555]">
                          {activeCase.repair_type
                            ? activeCase.repair_auto_allowed
                              ? `auto: true · permitted fields: [${activeCase.permitted_fields.join(", ")}]`
                              : "auto: false · strictly requires human faculty decision"
                            : "route: no_change"}
                        </div>
                      </div>

                      <div className="p-3 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6] space-y-1">
                        <span className="font-mono text-[10.5px] uppercase text-[#666666]">Student Reply Preview</span>
                        <p className="text-[11.5px] text-[#444444] line-clamp-3">
                          {activeCase.student_reply}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* D. PROPOSED CORRECTION (SIDE BY SIDE + SURGICAL FIELD EDITOR) */}
                  <section className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[14px] p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#F0EEE6] pb-2.5">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#555555]">
                        D. Proposed Correction
                      </span>
                      {activeCase.proposed_edit && (
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#EFECE6] border border-[#DFDBD0] text-[#111111]">
                          Target field: {activeCase.proposed_edit.field}
                        </span>
                      )}
                    </div>

                    {isEditMode ? (
                      <div className="space-y-3 p-3.5 rounded-[10px] bg-[#F9F8F3] border border-[#DFDBD0]">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-semibold text-[#111111]">
                            Surgical Field Editor (Taxonomy Scope Locked)
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsEditMode(false)}
                            className="text-[11.5px] text-[#666666] hover:text-[#111111] cursor-pointer"
                          >
                            Cancel Edit
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[12px]">
                          <div>
                            <label className="block text-[11px] text-[#666666] mb-1">Permitted Field</label>
                            <select
                              value={editField}
                              onChange={(e) => setEditField(e.target.value)}
                              className="w-full h-9 px-2.5 rounded-[8px] bg-white border border-[#C5C1B4] font-mono"
                            >
                              {(activeCase.permitted_fields?.length ? activeCase.permitted_fields : ["answer"]).map(
                                (f: string) => (
                                  <option key={f} value={f}>
                                    {f}
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] text-[#666666] mb-1">Original Snippet</label>
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
                              placeholder="Verified replacement..."
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] text-[#666666] mb-1">Faculty Audit Note</label>
                          <input
                            type="text"
                            value={facultyNote}
                            onChange={(e) => setFacultyNote(e.target.value)}
                            className="w-full h-9 px-3 rounded-[8px] bg-white border border-[#C5C1B4] text-[12px]"
                            placeholder="Rationale recorded in SQLite WAL ledger..."
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => executeDecision("edit")}
                            className="h-9 px-4 rounded-[8px] bg-[#0B0F12] hover:bg-[#1f2328] text-white text-[12px] font-medium cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5"
                          >
                            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>Validate & Save Surgical Edit</span>
                          </button>
                        </div>
                      </div>
                    ) : activeCase.proposed_edit ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                        <div className="p-3 rounded-[10px] bg-[#FEF2F2]/60 border border-[#FECACA] space-y-1">
                          <span className="font-mono text-[10.5px] uppercase text-[#B91C1C]">Original Content</span>
                          <div className="font-mono text-[#111111] break-words">
                            {activeCase.proposed_edit.old_value || activeCase.proposed_edit.find || "—"}
                          </div>
                        </div>
                        <div className="p-3 rounded-[10px] bg-[#ECFDF3]/70 border border-[#BBF7D0] space-y-1">
                          <span className="font-mono text-[10.5px] uppercase text-[#15803D]">Proposed Correction</span>
                          <div className="font-mono text-[#111111] font-semibold break-words">
                            {activeCase.proposed_edit.new_value || activeCase.proposed_edit.replace || "—"}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6] text-[12px] text-[#555555]">
                        No automated field patch generated (either valid as written or requires manual human authoring outside automated scope).
                      </div>
                    )}

                    {/* Audit History for this Question */}
                    {Array.isArray(caseDetail.audit_history) && caseDetail.audit_history.length > 0 && (
                      <div className="pt-2 border-t border-[#F0EEE6] space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#666666]">
                          <History className="w-3.5 h-3.5" />
                          <span>Recorded WAL Audit History</span>
                        </div>
                        {caseDetail.audit_history.slice(0, 3).map((a: any) => (
                          <div
                            key={a.id}
                            className="text-[11.5px] px-2.5 py-1.5 rounded bg-[#F9F8F3] border border-[#E5E2D9] flex items-center justify-between gap-2"
                          >
                            <span>
                              <strong className="font-mono uppercase">{a.action}</strong> by {a.faculty_name} — {a.notes}
                            </span>
                            <span className="font-mono text-[#777777]">{formatUpdatedDate(a.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>

            {/* Sticky Footer: 5 Essential Faculty Actions */}
            {activeCase && (
              <div className="px-6 py-4 bg-white border-t border-[#E5E2D9] space-y-2.5">
                {confirmApprove ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F9F8F3] p-3 rounded-[10px] border border-[#C5C1B4]">
                    <span className="text-[12px] font-medium text-[#111111]">
                      Confirm applying surgical correction across all {activeCase.report_count} grouped report(s)?
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmApprove(false)}
                        className="h-8 px-3 rounded-[7px] bg-white border border-[#DFDBD0] text-[12px] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => executeDecision("approve")}
                        className="h-8 px-3.5 rounded-[7px] bg-[#0B0F12] text-white text-[12px] font-medium cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5"
                      >
                        {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                        <span>Confirm Approve</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={
                          isSubmitting ||
                          activeCase.raw_status === "approved" ||
                          activeCase.raw_status === "rejected"
                        }
                        onClick={() => setConfirmApprove(true)}
                        title={
                          activeCase.raw_status === "rejected"
                            ? "Rejected proposals cannot be accidentally approved"
                            : "Approve proposed correction"
                        }
                        className="h-9 px-3.5 rounded-[8px] bg-[#0B0F12] hover:bg-[#1f2328] text-white text-[12px] font-medium cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        type="button"
                        disabled={
                          isSubmitting ||
                          !activeCase.permitted_fields ||
                          activeCase.permitted_fields.length === 0
                        }
                        onClick={() => setIsEditMode((v) => !v)}
                        title={
                          !activeCase.permitted_fields?.length
                            ? "Human-only taxonomy repair: direct field edit not permitted"
                            : "Modify permitted repair fields"
                        }
                        className="h-9 px-3.5 rounded-[8px] bg-white hover:bg-[#FAF9F5] border border-[#C5C1B4] text-[#111111] text-[12px] font-medium cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting || activeCase.raw_status === "rejected"}
                        onClick={() => executeDecision("reject")}
                        className="h-9 px-3.5 rounded-[8px] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-[12px] font-medium cursor-pointer disabled:opacity-45 inline-flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting || activeCase.raw_status === "no_change"}
                        onClick={() => executeDecision("no_change")}
                        className="h-9 px-3.5 rounded-[8px] bg-[#F9F8F3] hover:bg-[#EFECE6] border border-[#DFDBD0] text-[#111111] text-[12px] font-medium cursor-pointer disabled:opacity-45 inline-flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>No Change</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting || activeCase.raw_status === "deferred"}
                        onClick={() => executeDecision("defer")}
                        className="h-9 px-3.5 rounded-[8px] bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] text-[12px] font-medium cursor-pointer disabled:opacity-45 inline-flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Escalate</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
