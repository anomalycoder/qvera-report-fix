import React, { useState, useEffect, useCallback } from "react"
import {
  History,
  ShieldCheck,
  RotateCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronOpen,
  X,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

function formatAuditTime(ts?: string | null): string {
  if (!ts) return "—"
  const d = new Date(ts.includes("T") ? ts : `${ts.replace(" ", "T")}Z`)
  if (Number.isNaN(d.getTime())) return ts
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export const AuditLedgerPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [allTotal, setAllTotal] = useState(0)
  const [facets, setFacets] = useState<{ actors: string[]; actions: string[] }>({
    actors: [],
    actions: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sseLive, setSseLive] = useState(false)

  // Filters & Server-Side Pagination
  const [searchQuery, setSearchQuery] = useState("")
  const [filterActor, setFilterActor] = useState("all")
  const [filterAction, setFilterAction] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterDateRange, setFilterDateRange] = useState("all")
  const [page, setPage] = useState(0)
  const limit = 20

  // Selected Event Slide-Over Panel
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchLogs = useCallback(
    async (silent = false) => {
      if (silent) setIsRefreshing(true)
      else setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set("skip", String(page * limit))
        params.set("limit", String(limit))
        params.set("date_range", filterDateRange)
        if (filterAction !== "all") params.set("action", filterAction)
        if (filterActor !== "all") params.set("actor", filterActor)
        if (filterStatus !== "all") params.set("status", filterStatus)
        if (searchQuery.trim()) params.set("search", searchQuery.trim())

        const res = await fetch(`/api/v1/faculty/audit?${params.toString()}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setLogs(data.logs || [])
        setTotal(data.total || 0)
        setAllTotal(data.all_total ?? data.total ?? 0)
        if (data.facets) setFacets(data.facets)
      } catch (err: any) {
        setError(err.message || "Unable to fetch audit ledger")
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [page, filterDateRange, filterAction, filterActor, filterStatus, searchQuery]
  )

  useEffect(() => {
    fetchLogs(false)
  }, [fetchLogs])

  // Real-time SSE listener: updates ledger without full reload while keeping scroll position stable
  useEffect(() => {
    let es: EventSource | null = null
    if (typeof EventSource !== "undefined") {
      es = new EventSource("/api/v1/faculty/notifications/stream")
      es.onopen = () => setSseLive(true)
      es.onerror = () => setSseLive(false)
      es.addEventListener("queue_update", () => fetchLogs(true))
    }
    const onLocal = () => fetchLogs(true)
    window.addEventListener("qvera:faculty-action", onLocal)
    return () => {
      if (es) es.close()
      window.removeEventListener("qvera:faculty-action", onLocal)
    }
  }, [fetchLogs])

  const openEventDetail = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/faculty/audit/${id}`)
      if (res.ok) {
        setSelectedEvent(await res.json())
        return
      }
    } catch {
      // fallback to row item
    }
    const fallback = logs.find((l) => l.id === id)
    if (fallback) setSelectedEvent(fallback)
  }

  const resetFilters = () => {
    setSearchQuery("")
    setFilterActor("all")
    setFilterAction("all")
    setFilterStatus("all")
    setFilterDateRange("all")
    setPage(0)
  }

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    toast.success(`Copied: ${id}`)
    setTimeout(() => setCopiedId(null), 1600)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-5 max-w-[1360px] mx-auto font-sans">
      {/* =====================================================================
          CLEAN HEADER BAR
      ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-[13.5px] text-[#555555]">
            A transparent record of investigation decisions and question changes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-[11px] font-semibold text-[#111111] bg-[#EFECE6] border border-[#DFDBD0] px-2.5 py-1 rounded-full">
            {allTotal} Total Audit Events
          </span>
          <span className="font-mono text-[11px] font-medium text-[#15803D] bg-[#ECFDF3] border border-[#D1FADF] px-2.5 py-1 rounded-full inline-flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Append-Only WAL
          </span>
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
            onClick={() => fetchLogs(true)}
            className="border-[#DFDBD0] bg-white hover:bg-[#FAF9F5] text-xs font-medium h-8 rounded-[8px] text-[#111111]"
          >
            <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* =====================================================================
          COMPACT FILTER CONTROLS (QUERYING REAL DB)
      ===================================================================== */}
      <div className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[14px] p-3.5 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-[12px]">
        <div className="relative lg:col-span-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(0)
            }}
            placeholder="Search Question ID, Report ID, Event ID, or note..."
            className="w-full pl-8 pr-3 h-8.5 bg-[#F9F8F3] border border-[#DFDBD0] rounded-[8px] text-[#111111] placeholder:text-[#888888] focus:outline-none focus:ring-1 focus:ring-[#111111]"
          />
          <Search className="w-3.5 h-3.5 text-[#777777] absolute left-2.5 top-2.5 pointer-events-none" />
        </div>

        <select
          value={filterActor}
          onChange={(e) => {
            setFilterActor(e.target.value)
            setPage(0)
          }}
          aria-label="Filter by actor"
          className="bg-[#F9F8F3] border border-[#DFDBD0] rounded-[8px] px-2.5 h-8.5 text-[#111111]"
        >
          <option value="all">All Actors</option>
          {facets.actors.map((act) => (
            <option key={act} value={act}>
              {act}
            </option>
          ))}
        </select>

        <select
          value={filterAction}
          onChange={(e) => {
            setFilterAction(e.target.value)
            setPage(0)
          }}
          aria-label="Filter by action"
          className="bg-[#F9F8F3] border border-[#DFDBD0] rounded-[8px] px-2.5 h-8.5 text-[#111111]"
        >
          <option value="all">All Actions</option>
          {facets.actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value)
            setPage(0)
          }}
          aria-label="Filter by result status"
          className="bg-[#F9F8F3] border border-[#DFDBD0] rounded-[8px] px-2.5 h-8.5 text-[#111111]"
        >
          <option value="all">All Results</option>
          <option value="success">Success</option>
          <option value="blocked">Blocked / Failed</option>
        </select>

        <div className="flex items-center gap-1.5">
          <select
            value={filterDateRange}
            onChange={(e) => {
              setFilterDateRange(e.target.value)
              setPage(0)
            }}
            aria-label="Filter by date range"
            className="flex-1 bg-[#F9F8F3] border border-[#DFDBD0] rounded-[8px] px-2.5 h-8.5 text-[#111111]"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            type="button"
            onClick={resetFilters}
            className="h-8.5 px-2.5 rounded-[8px] border border-[#DFDBD0] bg-white hover:bg-[#F9F8F3] text-[11px] text-[#555555] cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] px-4 py-3 rounded-[12px] text-xs">
          {error}
        </div>
      )}

      {/* =====================================================================
          COMPACT CHRONOLOGICAL TABLE (SERVER-SIDE PAGINATED)
      ===================================================================== */}
      <div className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] shadow-xs overflow-hidden">
        {isLoading && logs.length === 0 ? (
          <div className="p-6 space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-11 bg-[#EFECE6] rounded-[8px]" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldCheck className="w-9 h-9 text-[#C5C1B4] mx-auto" />
            <h3 className="font-display text-sm font-semibold text-[#111111]">No Matching Audit Events</h3>
            <p className="text-xs text-[#666666]">Try clearing filters or perform an investigation action.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead className="bg-[#FAF9F5] border-b border-[#E5E2D9] text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-3">Actor</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Question</th>
                  <th className="py-3 px-3">Details</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EEE6]">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => openEventDetail(log.id)}
                    className="hover:bg-[#FAF9F5] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-[11.5px] text-[#555555] whitespace-nowrap">
                      {formatAuditTime(log.created_at)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#111111]">{log.faculty_name || "System"}</div>
                      <span className="text-[10px] font-mono text-[#777777] uppercase">{log.actor_type}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#EFECE6] border border-[#DFDBD0] text-[#111111]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11.5px] text-[#111111]">
                      {String(log.question_id || "").slice(-8)}
                      <span className="block text-[10px] text-[#777777]">{log.report_id}</span>
                    </td>
                    <td className="py-3 px-3 max-w-md">
                      <p className="text-[12px] text-[#333333] line-clamp-1">{log.notes || "—"}</p>
                    </td>
                    <td className="py-3 px-3">
                      {log.status === "blocked" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B91C1C] bg-[#FEF2F2] px-2 py-0.5 rounded-full border border-[#FECACA]">
                          <AlertTriangle className="w-3 h-3" />
                          Blocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#15803D] bg-[#ECFDF3] px-2 py-0.5 rounded-full border border-[#D1FADF]">
                          <CheckCircle2 className="w-3 h-3" />
                          Success
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#111111]">
                        Details
                        <ChevronOpen className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server Pagination Footer */}
        <div className="p-3.5 bg-[#FAF9F5] border-t border-[#E5E2D9] flex items-center justify-between text-xs text-[#666666]">
          <span>
            Showing {logs.length} of {total} matching events
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 px-2.5 text-xs border-[#DFDBD0] bg-white rounded-[8px] text-[#111111]"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Previous
            </Button>
            <span className="font-mono text-xs text-[#111111]">
              Page {page + 1} of {Math.max(1, totalPages)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 px-2.5 text-xs border-[#DFDBD0] bg-white rounded-[8px] text-[#111111]"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          COMPACT EVENT DETAIL SLIDE-OVER PANEL
      ===================================================================== */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 bg-[#0B0F12]/25 backdrop-blur-[2px] flex justify-end"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#F9F8F3] h-full border-l-[1.5px] border-[#C5C1B4] shadow-2xl flex flex-col"
          >
            <div className="px-6 py-4 bg-white border-b border-[#E5E2D9] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#111111]" />
                  <span className="font-mono text-[14px] font-semibold text-[#111111]">
                    {selectedEvent.event_ref || `AUD-${String(selectedEvent.id).padStart(4, "0")}`}
                  </span>
                </div>
                <p className="text-[11.5px] font-mono text-[#666666] mt-0.5">
                  {formatAuditTime(selectedEvent.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-[8px] text-[#666666] hover:text-[#111111] hover:bg-[#EFECE6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-[12.5px]">
              <div className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[14px] p-4 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10.5px] font-mono uppercase text-[#666666] block">Actor & Role</span>
                  <span className="font-semibold text-[#111111]">{selectedEvent.faculty_name}</span>
                  <span className="block font-mono text-[11px] text-[#666666]">{selectedEvent.actor_type}</span>
                </div>
                <div>
                  <span className="text-[10.5px] font-mono uppercase text-[#666666] block">Action & Result</span>
                  <span className="font-mono font-semibold text-[#111111]">{selectedEvent.action}</span>
                  <span className="block font-mono text-[11px] text-[#15803D]">{selectedEvent.status}</span>
                </div>
                <div>
                  <span className="text-[10.5px] font-mono uppercase text-[#666666] block">Question ID</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedEvent.question_id)}
                    className="font-mono text-[#111111] inline-flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>{selectedEvent.question_id}</span>
                    {copiedId === selectedEvent.question_id ? <Check className="w-3 h-3 text-[#16A34A]" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div>
                  <span className="text-[10.5px] font-mono uppercase text-[#666666] block">Report ID</span>
                  <span className="font-mono text-[#111111]">{selectedEvent.report_id}</span>
                </div>
              </div>

              <div className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[14px] p-4 space-y-1.5">
                <span className="text-[10.5px] font-mono uppercase text-[#666666]">Reason / Event Note</span>
                <p className="text-[#111111] leading-relaxed">{selectedEvent.notes || "No note recorded."}</p>
              </div>

              {(selectedEvent.previous_value || selectedEvent.new_value || selectedEvent.applied_edit) && (
                <div className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[14px] p-4 space-y-2.5">
                  <span className="text-[10.5px] font-mono uppercase text-[#666666]">
                    Before & After Diff
                  </span>
                  <div className="p-2.5 rounded-[8px] bg-[#FEF2F2]/60 border border-[#FECACA] font-mono text-[11.5px] break-words">
                    <strong className="text-[#B91C1C]">Previous: </strong>
                    {selectedEvent.previous_value || selectedEvent.applied_edit?.old_value || selectedEvent.applied_edit?.find || "—"}
                  </div>
                  <div className="p-2.5 rounded-[8px] bg-[#ECFDF3]/70 border border-[#BBF7D0] font-mono text-[11.5px] break-words">
                    <strong className="text-[#15803D]">New: </strong>
                    {selectedEvent.new_value || selectedEvent.applied_edit?.new_value || selectedEvent.applied_edit?.replace || "—"}
                  </div>
                </div>
              )}

              {Array.isArray(selectedEvent.related_events) && selectedEvent.related_events.length > 0 && (
                <div className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[14px] p-4 space-y-2">
                  <span className="text-[10.5px] font-mono uppercase text-[#666666]">Related Event References</span>
                  {selectedEvent.related_events.map((rel: any) => (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => openEventDetail(rel.id)}
                      className="w-full text-left px-3 py-2 rounded-[8px] bg-[#F9F8F3] hover:bg-[#EFECE6] border border-[#E2DFD6] flex items-center justify-between text-[11.5px] font-mono cursor-pointer"
                    >
                      <span>{rel.event_ref} · {rel.action}</span>
                      <span className="text-[#666666]">{formatAuditTime(rel.created_at)}</span>
                    </button>
                  ))}
                </div>
              )}

              <details className="bg-white border border-[#DFDBD0] rounded-[12px] p-3.5 text-[11.5px]">
                <summary className="cursor-pointer font-mono text-[#666666]">
                  Technical Metadata & Append-Only Guarantee
                </summary>
                <div className="mt-2.5 space-y-2 font-mono text-[11px] text-[#555555]">
                  <p>Storage: SQLite WAL (BEFORE UPDATE / BEFORE DELETE immutability triggers active)</p>
                  {selectedEvent.applied_edit && (
                    <pre className="p-2 rounded bg-[#F9F8F3] overflow-x-auto text-[#111111]">
                      {JSON.stringify(selectedEvent.applied_edit, null, 2)}
                    </pre>
                  )}
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
