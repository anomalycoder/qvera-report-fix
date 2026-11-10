import React, { useState, useEffect } from "react"
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

export const ActivityPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/v1/faculty/audit?limit=100")
      if (res.ok) {
        const json = await res.json()
        setLogs(json.logs || [])
        setTotal(json.total || 0)
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== "all" && log.action !== actionFilter) return false
    if (!search) return true
    const term = search.toLowerCase()
    const qid = (log.question_id || "").toLowerCase()
    const rid = (log.report_id || "").toLowerCase()
    const rev = (log.reviewer_name || "").toLowerCase()
    const notes = (log.notes || "").toLowerCase()
    return qid.includes(term) || rid.includes(term) || rev.includes(term) || notes.includes(term)
  })

  const getActionBadge = (action: string) => {
    switch (action) {
      case "approved":
      case "approve":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        )
      case "rejected":
      case "reject":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
        )
      case "deferred":
      case "defer":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
            <Clock className="w-3 h-3 text-purple-600" />
            Deferred
          </span>
        )
      case "auto_applied":
      case "auto_apply":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
            <Sparkles className="w-3 h-3 text-blue-600" />
            Auto-Applied
          </span>
        )
      default:
        return (
          <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            {action}
          </span>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">Activity</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable chronological log of faculty authorizations, rejections, and applied patches.
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Storage: SQLite WAL
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-2.5 shadow-2xs flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reviewer, report, question ID..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md pl-8 pr-2.5 py-1 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 font-medium focus:outline-none"
        >
          <option value="all">All Actions</option>
          <option value="approve">Approved</option>
          <option value="reject">Rejected</option>
          <option value="defer">Deferred</option>
          <option value="auto_applied">Auto Applied</option>
        </select>
      </div>

      {/* Activity Table */}
      <div className="bg-white border border-slate-200/90 rounded-lg shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[14%]">Action</TableHead>
              <TableHead className="w-[20%]">Question</TableHead>
              <TableHead className="w-[18%]">Reviewer</TableHead>
              <TableHead className="w-[16%]">Date</TableHead>
              <TableHead className="w-[32%]">Result / Modification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-7 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-xs text-slate-400">
                  No activity entries match your filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.log_id || log.id}>
                  {/* Action */}
                  <TableCell>
                    {getActionBadge(log.action)}
                  </TableCell>

                  {/* Question */}
                  <TableCell>
                    <div className="font-mono text-xs text-slate-800 font-medium">
                      Report {log.report_id}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">
                      #{log.question_id?.slice(-8)}
                    </div>
                  </TableCell>

                  {/* Reviewer */}
                  <TableCell className="text-xs text-slate-700">
                    <span className="font-medium">{log.reviewer_name || log.faculty_name || "Dr. A. Sharma"}</span>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-xs text-slate-500 font-mono">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "Recent"}
                  </TableCell>

                  {/* Result */}
                  <TableCell>
                    {log.field_modified ? (
                      <div className="text-xs">
                        <span className="text-slate-500 font-mono text-[11px]">[{log.field_modified}]: </span>
                        <span className="line-through text-rose-700 mr-1 font-mono text-[11px]">
                          {String(log.old_value).slice(0, 20)}
                        </span>
                        <ArrowRight className="w-3 h-3 inline text-slate-400 mx-1" />
                        <span className="text-emerald-700 font-semibold font-mono text-[11px]">
                          {String(log.new_value).slice(0, 20)}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-600 truncate max-w-sm">
                        {log.notes || "Report processed"}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
