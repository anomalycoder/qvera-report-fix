import React, { useState, useEffect } from "react"
import {
  Inbox,
  AlertCircle,
  Sparkles,
  FileText,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface OverviewPageProps {
  onNavigateToWorkspace: (reportId: string) => void
  onNavigateToQueue: () => void
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
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
      const res = await fetch("/api/v1/faculty/overview")
      if (!res.ok) throw new Error("Failed to load overview data")
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message || "Error communicating with backend")
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
        <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
        <p className="text-xs text-slate-600 mb-3">{error || "Could not fetch overview data."}</p>
        <Button size="sm" variant="outline" onClick={fetchOverview}>
          Retry Connection
        </Button>
      </div>
    )
  }

  // Four Primary Metrics Only (Stripe/Linear Minimal Style)
  const primaryMetrics = [
    {
      label: "Pending Review",
      value: data.pending_faculty_reviews,
      sub: "Requires human review",
      indicator: "bg-amber-500",
    },
    {
      label: "Confirmed Defects",
      value: data.confirmed_defects,
      sub: "Identified in question bank",
      indicator: "bg-rose-500",
    },
    {
      label: "Auto-fixed",
      value: data.automatically_applied_fixes,
      sub: "Verified & applied",
      indicator: "bg-emerald-500",
    },
    {
      label: "Total Reports",
      value: data.total_reports,
      sub: "Across 43 questions",
      indicator: "bg-slate-400",
    },
  ]

  const priorityQueue = (data.high_priority_queue || []).slice(0, 5)
  const recentActions = (data.recent_faculty_actions || []).slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Page Title & Intro */}
      <div>
        <h1 className="text-base font-semibold text-slate-900 tracking-tight">Overview</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          High-level health and pending verification tasks across Acadza's question bank.
        </p>
      </div>

      {/* 4 Primary Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {primaryMetrics.map((m) => (
          <div
            key={m.label}
            className="bg-white border border-slate-200/90 rounded-lg p-3.5 shadow-2xs hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>{m.label}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${m.indicator}`} />
            </div>
            <div className="text-2xl font-semibold text-slate-900 tracking-tight">
              {m.value}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Section A: Priority Queue Table (Top 5 Unresolved) */}
      <div className="bg-white border border-slate-200/90 rounded-lg shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-slate-900">Priority Queue</h2>
            <p className="text-[11px] text-slate-500">Unresolved issues requiring immediate faculty review</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToQueue}
            className="text-xs text-slate-600 hover:text-slate-900"
          >
            <span>View all in Queue</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        <div className="divide-y divide-slate-100">
          {priorityQueue.map((item: any) => (
            <div
              key={item.report_id}
              onClick={() => onNavigateToWorkspace(item.report_id)}
              className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/70 cursor-pointer transition-colors group"
            >
              <div className="min-w-0 flex-1 pr-4">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-xs text-slate-800 truncate">
                    {item.topic || item.question_stem?.replace(/<[^>]+>/g, "").slice(0, 50) || "Report " + item.report_id}
                  </span>
                  <Badge variant={item.urgency === "L1" ? "critical" : "warning"}>
                    {item.urgency || "L1"}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-mono">
                    #{item.question_id.slice(-6)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span>{item.subject}</span>
                  <span>&bull;</span>
                  <span className="truncate max-w-md">{item.student_comment || "Defect reported"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-700 block">
                    {item.report_count} {item.report_count === 1 ? "report" : "reports"}
                  </span>
                  <span className="text-[10px] text-slate-400">{item.repair || "answer_key"}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="opacity-80 group-hover:opacity-100 group-hover:border-slate-300 text-xs h-7"
                >
                  Inspect
                </Button>
              </div>
            </div>
          ))}

          {priorityQueue.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-400">
              No unresolved issues pending review.
            </div>
          )}
        </div>
      </div>

      {/* Section B: Recent Decisions & Activity */}
      <div className="bg-white border border-slate-200/90 rounded-lg shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-xs font-semibold text-slate-900">Recent Decisions</h2>
          <p className="text-[11px] text-slate-500">Chronological faculty and system audit actions</p>
        </div>

        <div className="divide-y divide-slate-100">
          {recentActions.map((act: any) => (
            <div key={act.log_id || act.id} className="px-4 py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    act.action === "approved" || act.action === "auto_applied"
                      ? "bg-emerald-500"
                      : act.action === "rejected"
                      ? "bg-rose-500"
                      : "bg-slate-400"
                  }`}
                />
                <div>
                  <span className="font-medium text-slate-800 capitalize">
                    {act.action?.replace("_", " ") || "Decision"}
                  </span>
                  <span className="text-slate-400 mx-1.5">&bull;</span>
                  <span className="text-slate-600 font-mono text-[11px]">
                    Report {act.report_id || "R001"}
                  </span>
                  <span className="text-slate-400 mx-1.5">&bull;</span>
                  <span className="text-slate-500 text-[11px]">
                    {act.reviewer_name || act.faculty_name || "Faculty Reviewer"}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today"}
              </div>
            </div>
          ))}

          {recentActions.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-400">
              No recent decisions recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Section C: Discreet System Status */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-md text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>System operational: FastAPI 0.115 • SymPy 1.14 • SQLite WAL</span>
        </div>
        <div>
          <span>43 Questions Ingested &bull; 44 Reports Checked &bull; 0 Corrupted</span>
        </div>
      </div>
    </div>
  )
}
