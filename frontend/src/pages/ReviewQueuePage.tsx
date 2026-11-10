import React, { useState, useEffect } from "react"
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  X
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

  const fetchQueue = async () => {
    setIsLoading(true)
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
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [search, subject, priority, status, routeFilter, sortBy, page])

  const getPriorityBadge = (urgency: string, label?: string) => {
    switch (urgency) {
      case "L1":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Critical
          </span>
        )
      case "L2":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            High
          </span>
        )
      case "L3":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Medium
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
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
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            Approved
          </span>
        )
      case "rejected":
        return (
          <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
            Rejected
          </span>
        )
      case "deferred":
        return (
          <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
            Deferred
          </span>
        )
      default:
        return (
          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            Pending
          </span>
        )
    }
  }

  const formatIssueName = (repair: string, verdict: string) => {
    if (repair === "answer_key") return "Answer Key"
    if (repair === "stem_data") return "Missing Data"
    if (repair === "option_repair") return "Option Defect"
    if (repair === "solution_fix") return "Solution Fix"
    if (repair === "diagram") return "Missing Diagram"
    if (repair === "identical_options") return "Duplicate Options"
    if (repair === "type_mismatch") return "Type Mismatch"
    if (repair === "markup_leak") return "Markup Leak"
    if (repair === "spelling") return "Typo / Spelling"
    if (repair === "wrong_chapter") return "Wrong Chapter"
    if (repair === "syllabus") return "Syllabus Flag"
    if (verdict === "no_error") return "No Defect"
    if (verdict === "app_issue") return "App Glitch"
    if (verdict === "display_issue") return "Display Issue"
    return repair ? repair.replace(/_/g, " ") : verdict
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">Review Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active reports awaiting evaluation, sorted by academic urgency.
          </p>
        </div>
        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800">{items.length}</span> of{" "}
          <span className="font-semibold text-slate-800">{total}</span> reports
        </div>
      </div>

      {/* Compact Filter Bar (Linear/Stripe Style) */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-2.5 shadow-2xs space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search question, report ID, student comment..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md pl-8 pr-2.5 py-1 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 font-medium focus:outline-none"
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
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 font-medium focus:outline-none"
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
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 font-medium focus:outline-none"
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
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 font-medium focus:outline-none ml-auto"
          >
            <option value="urgency">Sort by Urgency</option>
            <option value="date">Sort by Date</option>
            <option value="confidence">Sort by Confidence</option>
          </select>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-1.5 rounded border text-xs flex items-center gap-1 transition ${
              showAdvanced ? "bg-slate-100 border-slate-300 text-slate-800" : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
            title="Advanced Filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Collapsible Advanced Filters */}
        {showAdvanced && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-600 animate-in fade-in">
            <span className="text-[11px] font-medium text-slate-500">Route:</span>
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-0.5"
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
                className="text-xs text-blue-600 hover:underline ml-auto"
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Data Table */}
      <div className="bg-white border border-slate-200/90 rounded-lg shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[38%]">Question</TableHead>
              <TableHead className="w-[12%]">Subject</TableHead>
              <TableHead className="w-[14%]">Issue</TableHead>
              <TableHead className="w-[12%]">Priority</TableHead>
              <TableHead className="w-[10%]">Reports</TableHead>
              <TableHead className="w-[10%]">Status</TableHead>
              <TableHead className="w-[4%] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-7 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-xs text-slate-400">
                  No reports matching current filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow
                  key={row.report_id}
                  onClick={() => onSelectReport(row.report_id)}
                  className="cursor-pointer group hover:bg-slate-50/80 transition-colors"
                >
                  {/* Column 1: Question (Clean text + subtle secondary ID) */}
                  <TableCell>
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate text-xs">
                        {row.topic || row.question_stem?.replace(/<[^>]+>/g, "").slice(0, 60) || "Question stem"}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <span>{row.report_id}</span>
                        <span>&bull;</span>
                        <span>#{row.question_id.slice(-6)}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Column 2: Subject */}
                  <TableCell className="text-slate-600 text-xs">
                    {row.subject}
                  </TableCell>

                  {/* Column 3: Issue */}
                  <TableCell>
                    <span className="text-slate-800 font-medium text-xs">
                      {formatIssueName(row.repair, row.verdict)}
                    </span>
                  </TableCell>

                  {/* Column 4: Priority */}
                  <TableCell>
                    {getPriorityBadge(row.urgency, row.urgency_label)}
                  </TableCell>

                  {/* Column 5: Reports */}
                  <TableCell className="text-slate-600 text-xs">
                    <span className="font-semibold text-slate-800">{row.report_count}</span>
                    <span className="text-slate-400 ml-1">{row.report_count === 1 ? "report" : "reports"}</span>
                  </TableCell>

                  {/* Column 6: Status */}
                  <TableCell>
                    {getStatusBadge(row.status || "pending")}
                  </TableCell>

                  {/* Column 7: Action */}
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectReport(row.report_id)
                      }}
                      className="h-7 px-2 text-xs text-slate-500 hover:text-slate-900 group-hover:bg-slate-100"
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
          <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Page {page + 1} of {Math.ceil(total / limit)}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="h-7 px-2"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(page + 1) * limit >= total}
                onClick={() => setPage(page + 1)}
                className="h-7 px-2"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
