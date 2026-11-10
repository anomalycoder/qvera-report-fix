import React, { useState, useEffect } from 'react'
import {
  FileText,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  History,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface FacultyOverviewPageProps {
  onNavigateToWorkspace: (reportId: string) => void
  onNavigateToQueue: () => void
}

export const FacultyOverviewPage: React.FC<FacultyOverviewPageProps> = ({
  onNavigateToWorkspace,
  onNavigateToQueue,
}) => {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverview = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/faculty/overview')
      if (!res.ok) throw new Error('Failed to load faculty overview from backend')
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message || 'Error communicating with backend')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOverview()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="font-bold text-rose-900 text-sm">Failed to Load Faculty Overview</h3>
        <p className="text-xs text-rose-700">{error || 'Unknown error occurred.'}</p>
        <button
          onClick={fetchOverview}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
        >
          Retry Connection
        </button>
      </div>
    )
  }

  const kpis = [
    {
      label: 'Total Reports',
      value: data.total_reports,
      sub: '43 unique questions',
      icon: FileText,
      color: 'text-slate-900',
      bg: 'bg-slate-100',
    },
    {
      label: 'Confirmed Defects',
      value: data.confirmed_defects,
      sub: `${Math.round((data.confirmed_defects / data.total_reports) * 100)}% defect rate`,
      icon: AlertTriangle,
      color: 'text-rose-700',
      bg: 'bg-rose-50',
    },
    {
      label: 'Pending Review',
      value: data.pending_faculty_reviews,
      sub: 'Action required',
      icon: Clock,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
    },
    {
      label: 'Auto-Applied Fixes',
      value: data.automatically_applied_fixes,
      sub: 'Validated patches',
      icon: Sparkles,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Verified No-Error',
      value: data.no_error_reports,
      sub: 'Mathematically sound',
      icon: CheckCircle,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
    },
    {
      label: 'Unreported Defects',
      value: data.unreported_defects_count,
      sub: 'Pre-report discovery',
      icon: ShieldAlert,
      color: 'text-purple-700',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {kpi.label}
                </span>
                <div className={`w-6 h-6 rounded-md ${kpi.bg} flex items-center justify-center ${kpi.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className={`text-2xl font-extrabold tracking-tight font-mono ${kpi.color}`}>
                  {kpi.value}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">{kpi.sub}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main 2-Column Split: High Priority Queue & Distribution Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: High-Priority Unresolved Defects (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                High-Priority Issues Requiring Decision
              </h3>
            </div>
            <button
              onClick={onNavigateToQueue}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View Full Queue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {data.high_priority_issues && data.high_priority_issues.length > 0 ? (
              data.high_priority_issues.map((item: any) => (
                <div
                  key={item.report_id}
                  className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        item.urgency === 'L1' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.urgency} • {item.label}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-900">{item.report_id}</span>
                      <span className="text-xs text-slate-500 font-medium">({item.subject})</span>
                      <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                        {item.repair || 'Defect'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1 leading-snug">{item.evidence}</p>
                  </div>

                  <button
                    onClick={() => onNavigateToWorkspace(item.report_id)}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                All high-priority issues have been triaged and resolved!
              </div>
            )}
          </div>
        </div>

        {/* Right: Distributions and Recent Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Routing Distribution */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
              Routing Distribution
            </span>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-slate-700 mb-1 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Auto-applied Fixes
                  </span>
                  <span className="font-mono font-bold">{data.routing_distribution.auto_apply || 0}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{
                      width: `${((data.routing_distribution.auto_apply || 0) / data.total_reports) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 mb-1 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    No Change Warranted
                  </span>
                  <span className="font-mono font-bold">{data.routing_distribution.no_change || 0}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-slate-400 h-full"
                    style={{
                      width: `${((data.routing_distribution.no_change || 0) / data.total_reports) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 mb-1 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Faculty Review Required
                  </span>
                  <span className="font-mono font-bold">{data.routing_distribution.faculty_review || 0}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full"
                    style={{
                      width: `${((data.routing_distribution.faculty_review || 0) / data.total_reports) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Faculty Actions Audit Feed */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                Recent Faculty Decisions
              </span>
              <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px]">
                Permanent Log
              </Badge>
            </div>

            <div className="space-y-2">
              {data.recent_faculty_actions && data.recent_faculty_actions.length > 0 ? (
                data.recent_faculty_actions.map((act: any) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                        act.action === 'approve'
                          ? 'bg-emerald-100 text-emerald-800'
                          : act.action === 'reject'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {act.action}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {act.created_at ? act.created_at.substring(0, 16).replace('T', ' ') : 'Recently'}
                      </span>
                    </div>
                    <div className="text-slate-800 font-medium">
                      Report {act.report_id} &bull; {act.faculty_name}
                    </div>
                    {act.notes && (
                      <p className="text-[11px] text-slate-500 italic truncate">&ldquo;{act.notes}&rdquo;</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-2">
                  No recent faculty actions recorded yet. Open the Review Queue to begin triaging items.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
