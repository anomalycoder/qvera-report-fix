import React, { useMemo } from 'react'
import type { TriageResult } from '@/types/triage'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, AlertTriangle, Users, Sparkles, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react'

export interface QueueItem {
  report: TriageResult
  questionSubject?: string
  questionType?: string
  reportCount?: number
  urgencyLevel: 1 | 2 | 3 | 4 // 1: Critical (Multi-student defect), 2: High (Defect auto-apply), 3: Medium (Faculty review), 4: Low (No error)
  urgencyLabel: string
}

interface ReviewQueueProps {
  items: QueueItem[]
  selectedReportId: string | null
  onSelectItem: (reportId: string) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  routeFilter: string
  setRouteFilter: (route: string) => void
  urgencyFilter: string
  setUrgencyFilter: (urgency: string) => void
  subjectFilter: string
  setSubjectFilter: (subject: string) => void
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({
  items,
  selectedReportId,
  onSelectItem,
  searchTerm,
  setSearchTerm,
  routeFilter,
  setRouteFilter,
  urgencyFilter,
  setUrgencyFilter,
  subjectFilter,
  setSubjectFilter,
}) => {
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase()
        const matchesQid = item.report.questionId.toLowerCase().includes(query)
        const matchesRid = item.report.reportId.toLowerCase().includes(query)
        const matchesSubject = (item.questionSubject || '').toLowerCase().includes(query)
        const matchesEvidence = (item.report.evidence || '').toLowerCase().includes(query)
        const matchesRepair = (item.report.repair || '').toLowerCase().includes(query)
        if (!matchesQid && !matchesRid && !matchesSubject && !matchesEvidence && !matchesRepair) {
          return false
        }
      }

      // Route filter
      if (routeFilter !== 'all' && item.report.route !== routeFilter) {
        return false
      }

      // Urgency filter
      if (urgencyFilter !== 'all' && String(item.urgencyLevel) !== urgencyFilter) {
        return false
      }

      // Subject filter
      if (subjectFilter !== 'all' && (item.questionSubject || '').toLowerCase() !== subjectFilter.toLowerCase()) {
        return false
      }

      return true
    })
  }, [items, searchTerm, routeFilter, urgencyFilter, subjectFilter])

  const getUrgencyBadge = (level: number, label: string) => {
    switch (level) {
      case 1:
        return (
          <Badge className="bg-rose-600 text-white font-bold text-[10px] tracking-wider uppercase border-none">
            L1 • {label}
          </Badge>
        )
      case 2:
        return (
          <Badge className="bg-amber-600 text-white font-bold text-[10px] tracking-wider uppercase border-none">
            L2 • {label}
          </Badge>
        )
      case 3:
        return (
          <Badge className="bg-blue-600 text-white font-bold text-[10px] tracking-wider uppercase border-none">
            L3 • {label}
          </Badge>
        )
      default:
        return (
          <Badge className="bg-slate-200 text-slate-700 font-semibold text-[10px] tracking-wider uppercase border-none">
            L4 • {label}
          </Badge>
        )
    }
  }

  const getRouteBadge = (route: string) => {
    switch (route) {
      case 'faculty_review':
        return (
          <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] flex items-center gap-1 font-semibold">
            <ShieldAlert className="w-2.5 h-2.5" /> faculty_review
          </Badge>
        )
      case 'auto_apply':
        return (
          <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px] flex items-center gap-1 font-semibold">
            <Sparkles className="w-2.5 h-2.5" /> auto_apply
          </Badge>
        )
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-300 text-[10px] font-semibold">
            no_change
          </Badge>
        )
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-[820px] overflow-hidden">
      {/* Header with Title and Counts */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">Review & Triage Queue</h3>
            <p className="text-[11px] text-slate-500">
              Showing {filteredItems.length} of {items.length} reports
            </p>
          </div>
          <Badge className="bg-slate-900 text-white font-mono text-xs">
            {filteredItems.length} Active
          </Badge>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search QID, Report, topic, keyword..."
            className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-1.5 py-1 text-slate-700 text-[11px] font-medium"
          >
            <option value="all">All Routes</option>
            <option value="faculty_review">Faculty Review</option>
            <option value="auto_apply">Auto Apply</option>
            <option value="no_change">No Change</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-1.5 py-1 text-slate-700 text-[11px] font-medium"
          >
            <option value="all">All Urgencies</option>
            <option value="1">L1: Critical</option>
            <option value="2">L2: High</option>
            <option value="3">L3: Medium</option>
            <option value="4">L4: Low</option>
          </select>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-1.5 py-1 text-slate-700 text-[11px] font-medium"
          >
            <option value="all">All Subjects</option>
            <option value="Physics">Physics</option>
            <option value="Zoology">Zoology</option>
            <option value="Botany">Botany</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Mathematics">Mathematics</option>
          </select>
        </div>
      </div>

      {/* Scrollable Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No reports match the active search and filter criteria.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSelected = item.report.reportId === selectedReportId
            return (
              <div
                key={item.report.reportId}
                onClick={() => onSelectItem(item.report.reportId)}
                className={`p-3 rounded-lg cursor-pointer transition border ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-400 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200/80'
                }`}
              >
                {/* Top Row: Urgency + QID + Report ID */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {getUrgencyBadge(item.urgencyLevel, item.urgencyLabel)}
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {item.report.reportId}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.reportCount && item.reportCount > 1 ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                        <Users className="w-2.5 h-2.5" /> {item.reportCount} Reps
                      </span>
                    ) : null}
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.report.questionId.substring(0, 6)}...
                    </span>
                  </div>
                </div>

                {/* Second Row: Subject + Route + Verdict */}
                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                  {item.questionSubject && (
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {item.questionSubject}
                    </span>
                  )}
                  {getRouteBadge(item.report.route)}
                  {item.report.repair && (
                    <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                      {item.report.repair}
                    </Badge>
                  )}
                </div>

                {/* Evidence snippet */}
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {item.report.evidence}
                </p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
