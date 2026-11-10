import React, { useState, useEffect } from "react"
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  X,
  Inbox,
  RotateCw
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

interface ReviewQueuePageProps {
  onSelectReport: (reportId: string) => void
  initialSearch?: string
}

export const ReviewQueuePage: React.FC<ReviewQueuePageProps> = ({
  onSelectReport,
  initialSearch = "",
}) => {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filters
  const [search, setSearch] = useState(initialSearch)
  const [subject, setSubject] = useState("all")
  const [priority, setPriority] = useState("all")
  const [status, setStatus] = useState("all")
  const [sortBy, setSortBy] = useState("urgency")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [routeFilter, setRouteFilter] = useState("all")
  const [page, setPage] = useState(0)
  const limit = 20

  const fetchQueue = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    else setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("skip", String(page * limit))
      params.set("limit", String(limit))
      if (search) params.set("search", search)
      if (subject !== "all") params.set("subject", subject)
      if (priority !== "all") params.set("urgency", priority)
      if (status !== "all") params.set("status", status)
      if (routeFilter !== "all") params.set("route", routeFilter)
      params.set("sort_by", sortBy)

      const res = await fetch(`/api/v1/faculty/queue?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setItems(json.items || [])
        setTotal(json.total || 0)
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [search, subject, priority, status, routeFilter, sortBy, page])

  const getPriorityBadge = (urgency: string) => {
    switch (urgency) {
      case "L1":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Critical
          </span>
        )
      case "L2":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            High
          </span>
        )
      case "L3":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Medium
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Low
          </span>
        )
    }
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "approved":
        return (
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
            Approved
          </span>
        )
      case "rejected":
        return (
          <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
            Rejected
          </span>
        )
      case "deferred":
        return (
          <span className="text-xs font-bold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
            Deferred
          </span>
        )
      default:
        return (
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
            Pending
          </span>
        )
    }
  }

  const formatIssueName = (repair: string, verdict: string) => {
    if (repair === "answer_key") return "Answer Key Mismatch"
    if (repair === "stem_data") return "Missing Stem Data"
    if (repair === "option_repair") return "Option Defect"
    if (repair === "solution_fix") return "Solution Calculation Fix"
    if (repair === "diagram") return "Missing Diagram Reference"
    if (repair === "identical_options") return "Duplicate Options"
    if (repair === "type_mismatch") return "Type Mismatch"
    if (repair === "markup_leak") return "LaTeX Markup Leak"
    if (repair === "spelling") return "Typo / Spelling"
    if (repair === "wrong_chapter") return "Wrong Chapter"
    if (repair === "syllabus") return "Syllabus Boundary"
    if (verdict === "no_error") return "No Defect (Valid)"
    if (verdict === "app_issue") return "App Glitch"
    if (verdict === "display_issue") return "Display Issue"
    return repair ? repair.replace(/_/g, " ") : verdict
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
              Review Queue
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              {total} Reports
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Active question defect reports awaiting faculty inspection, prioritized by academic severity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchQueue(true)}
            disabled={isRefreshing}
            className="text-xs h-9 border-[#E5E7EB] text-slate-700 font-medium"
          >
            <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Filter Toolbar (Vercel Style) */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search question stem, report ID, student comment..."
              className="w-full text-sm bg-slate-50 border border-[#E5E7EB] rounded-md pl-9 pr-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-blue-600 transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Subject Filter */}
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="text-sm bg-slate-50 border border-[#E5E7EB] rounded-md px-3 py-1.5 text-slate-800 font-medium focus:outline-none focus:border-blue-600"
          >
            <option value="all">All Subjects</option>
            <option value="Physics">Physics</option>
            <option value="Zoology">Zoology</option>
            <option value="Botany">Botany</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="text-sm bg-slate-50 border border-[#E5E7EB] rounded-md px-3 py-1.5 text-slate-800 font-medium focus:outline-none focus:border-blue-600"
          >
            <option value="all">All Priorities</option>
            <option value="L1">L1 • Critical</option>
            <option value="L2">L2 • High</option>
            <option value="L3">L3 • Medium</option>
            <option value="L4">L4 • Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-sm bg-slate-50 border border-[#E5E7EB] rounded-md px-3 py-1.5 text-slate-800 font-medium focus:outline-none focus:border-blue-600"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="deferred">Deferred</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm bg-slate-50 border border-[#E5E7EB] rounded-md px-3 py-1.5 text-slate-800 font-medium focus:outline-none ml-auto"
          >
            <option value="urgency">Sort by Urgency</option>
            <option value="date">Sort by Date</option>
            <option value="confidence">Sort by Confidence</option>
          </select>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-2 rounded-md border text-sm flex items-center gap-1.5 transition ${
              showAdvanced ? "bg-slate-100 border-slate-300 text-slate-900" : "border-[#E5E7EB] text-slate-600 hover:bg-slate-50"
            }`}
            title="Advanced Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsible Advanced Filters */}
        {showAdvanced && (
          <div className="pt-3 border-t border-slate-100 flex items-center gap-3 text-sm text-slate-600 animate-in fade-in">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Route Filter:</span>
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="text-sm bg-slate-50 border border-[#E5E7EB] rounded px-3 py-1 text-slate-800 font-medium"
            >
              <option value="all">All Routes</option>
              <option value="faculty_review">Faculty Review</option>
              <option value="auto_apply">Auto Apply</option>
              <option value="no_change">No Change</option>
            </select>
            {(search || subject !== "all" || priority !== "all" || status !== "all" || routeFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("")
                  setSubject("all")
                  setPriority("all")
                  setStatus("all")
                  setRouteFilter("all")
                }}
                className="text-xs text-blue-600 font-bold hover:underline ml-auto"
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Issue Management Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#E5E7EB] bg-slate-50/70">
              <TableHead className="w-[34%]">Question Title & ID</TableHead>
              <TableHead className="w-[16%]">Subject & Chapter</TableHead>
              <TableHead className="w-[14%]">Reported Issue</TableHead>
              <TableHead className="w-[12%]">Priority</TableHead>
              <TableHead className="w-[10%]">Reports</TableHead>
              <TableHead className="w-[8%]">Status</TableHead>
              <TableHead className="w-[6%] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-36 text-center text-sm text-slate-400">
                  No questions match your filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow
                  key={row.report_id}
                  onClick={() => onSelectReport(row.report_id)}
                  className="cursor-pointer group hover:bg-slate-50 transition-colors border-b border-[#E5E7EB]"
                >
                  {/* Column 1: Title and ID */}
                  <TableCell>
                    <div className="min-w-0 pr-3">
                      <div className="font-semibold text-[#111827] truncate text-sm">
                        {row.topic || row.question_stem?.replace(/<[^>]+>/g, "").slice(0, 60) || "Question stem"}
                      </div>
                      <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span className="font-bold text-slate-600">{row.report_id}</span>
                        <span>&bull;</span>
                        <span>#{row.question_id.slice(-6)}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Column 2: Subject & Chapter */}
                  <TableCell>
                    <div className="text-sm font-semibold text-slate-900">{row.subject}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[150px]">
                      {row.chapter || "—"}
                    </div>
                  </TableCell>

                  {/* Column 3: Issue */}
                  <TableCell>
                    <span className="text-slate-900 font-medium text-sm">
                      {formatIssueName(row.repair, row.verdict)}
                    </span>
                  </TableCell>

                  {/* Column 4: Priority */}
                  <TableCell>
                    {getPriorityBadge(row.urgency)}
                  </TableCell>

                  {/* Column 5: Reports */}
                  <TableCell className="text-sm">
                    <span className="font-extrabold text-[#111827]">{row.report_count}</span>
                    <span className="text-slate-400 ml-1 text-xs">{row.report_count === 1 ? "report" : "reports"}</span>
                    {row.report_count > 1 && (
                      <span className="block text-[10px] font-bold text-rose-600 uppercase tracking-tight">Consensus</span>
                    )}
                  </TableCell>

                  {/* Column 6: Status */}
                  <TableCell>
                    {getStatusBadge(row.status || "pending")}
                  </TableCell>

                  {/* Column 7: Action */}
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectReport(row.report_id)
                      }}
                      className="h-8 px-3 text-xs text-blue-600 border-[#E5E7EB] group-hover:bg-blue-50 group-hover:border-blue-300 font-semibold shadow-2xs"
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {total > limit && (
          <div className="px-5 py-3.5 border-t border-[#E5E7EB] flex items-center justify-between text-sm text-slate-600 bg-slate-50/50">
            <div>
              Showing <span className="font-bold text-[#111827]">{items.length}</span> of{" "}
              <span className="font-bold text-[#111827]">{total}</span> reports &bull; Page{" "}
              <span className="font-bold text-[#111827]">{page + 1}</span> of{" "}
              <span className="font-bold text-[#111827]">{Math.ceil(total / limit)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="h-8 px-3 text-xs border-[#E5E7EB]"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(page + 1) * limit >= total}
                onClick={() => setPage(page + 1)}
                className="h-8 px-3 text-xs border-[#E5E7EB]"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
