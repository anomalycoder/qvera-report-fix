import React, { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Users,
  Sparkles,
  ShieldAlert,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface FacultyQueuePageProps {
  onSelectReport: (reportId: string) => void
}

export const FacultyQueuePage: React.FC<FacultyQueuePageProps> = ({ onSelectReport }) => {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('all')
  const [verdict, setVerdict] = useState('all')
  const [urgency, setUrgency] = useState('all')
  const [status, setStatus] = useState('all')
  const [sortBy, setSortBy] = useState('urgency')
  const [page, setPage] = useState(0)
  const limit = 20

  const fetchQueue = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('skip', String(page * limit))
      params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (subject !== 'all') params.set('subject', subject)
      if (verdict !== 'all') params.set('verdict', verdict)
      if (urgency !== 'all') params.set('urgency', urgency)
      if (status !== 'all') params.set('status', status)
      params.set('sort_by', sortBy)

      const res = await fetch(`/api/v1/faculty/queue?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setItems(json.items)
        setTotal(json.total)
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [page, search, subject, verdict, urgency, status, sortBy])

  const getUrgencyBadge = (level: string, label: string) => {
    switch (level) {
      case 'L1':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-rose-600 text-white">
            L1 • {label}
          </span>
        )
      case 'L2':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-amber-600 text-white">
            L2 • {label}
          </span>
        )
      case 'L3':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-blue-600 text-white">
            L3 • {label}
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-slate-200 text-slate-700">
            L4 • {label}
          </span>
        )
    }
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'approved':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] flex items-center gap-1 font-semibold">
            <CheckCircle className="w-2.5 h-2.5" /> Approved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px] flex items-center gap-1 font-semibold">
            <XCircle className="w-2.5 h-2.5" /> Rejected
          </Badge>
        )
      case 'deferred':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-[10px] flex items-center gap-1 font-semibold">
            <Clock className="w-2.5 h-2.5" /> Deferred
          </Badge>
        )
      default:
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] flex items-center gap-1 font-semibold">
            <Clock className="w-2.5 h-2.5" /> Pending
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Header and Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Review & Triage Queue</h2>
            <p className="text-xs text-slate-500">
              Showing {items.length} of {total} records across all severity tiers
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
            >
              <option value="urgency">Sort by Urgency</option>
              <option value="confidence">Sort by Confidence</option>
              <option value="date">Sort by Date</option>
            </select>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
          {/* Search */}
          <div className="relative md:col-span-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search QID, Report..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Subject Filter */}
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
          >
            <option value="all">All Subjects</option>
            <option value="Physics">Physics</option>
            <option value="Zoology">Zoology</option>
            <option value="Botany">Botany</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Mathematics">Mathematics</option>
          </select>

          {/* Urgency Filter */}
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
          >
            <option value="all">All Urgency</option>
            <option value="L1">L1: Critical</option>
            <option value="L2">L2: High</option>
            <option value="L3">L3: Medium</option>
            <option value="L4">L4: Low</option>
          </select>

          {/* Verdict Filter */}
          <select
            value={verdict}
            onChange={(e) => setVerdict(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
          >
            <option value="all">All Verdicts</option>
            <option value="defect">Defect</option>
            <option value="no_error">No Error</option>
            <option value="display_issue">Display Issue</option>
            <option value="app_issue">App Issue</option>
            <option value="language_mode">Language Mode</option>
          </select>

          {/* Review Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
          >
            <option value="all">All Review Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="deferred">Deferred</option>
          </select>
        </div>
      </div>

      {/* Main Queue Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading queue records...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No records matched your active filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">Report & QID</th>
                  <th className="py-3 px-4">Subject & Chapter</th>
                  <th className="py-3 px-4">Verdict / Repair</th>
                  <th className="py-3 px-4">Student Comment</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr
                    key={item.report_id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => onSelectReport(item.report_id)}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getUrgencyBadge(item.urgency_level, item.urgency_label)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900">{item.report_id}</div>
                      <div className="font-mono text-[10px] text-slate-400 truncate max-w-[100px]">
                        {item.question_id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block">{item.subject}</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[140px] block">
                        {item.chapter}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 capitalize block">{item.verdict}</span>
                      {item.repair_type && (
                        <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1 py-0.5 rounded border border-purple-200">
                          {item.repair_type}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-slate-600 truncate line-clamp-1 italic">
                        &ldquo;{item.comment_preview}&rdquo;
                      </p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-700">
                      {Math.round(item.confidence * 100)}%
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(item.review_status)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectReport(item.report_id)
                        }}
                        className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] border border-blue-200 inline-flex items-center gap-1 transition"
                      >
                        <span>Workspace</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {page + 1} of {Math.ceil(total / limit) || 1}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1 rounded border border-slate-200 bg-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * limit >= total}
              className="p-1 rounded border border-slate-200 bg-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
