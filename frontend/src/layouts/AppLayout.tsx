import React, { useState } from "react"
import {
  LayoutDashboard,
  Inbox,
  BookOpen,
  History,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  X
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export type NavTab = "overview" | "queue" | "questions" | "activity" | "workspace"

interface AppLayoutProps {
  children: React.ReactNode
  currentTab: NavTab
  onTabChange: (tab: NavTab) => void
  pendingCount?: number
  activeReportId?: string | null
  onSearchChange?: (val: string) => void
  searchValue?: string
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  currentTab,
  onTabChange,
  pendingCount = 10,
  activeReportId,
  onSearchChange,
  searchValue = "",
}) => {
  const [collapsed, setCollapsed] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  const navItems = [
    {
      id: "overview" as NavTab,
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      id: "queue" as NavTab,
      label: "Review Queue",
      icon: Inbox,
      badge: pendingCount,
    },
    {
      id: "questions" as NavTab,
      label: "Questions",
      icon: BookOpen,
    },
    {
      id: "activity" as NavTab,
      label: "Activity",
      icon: History,
    },
  ]

  const getBreadcrumb = () => {
    switch (currentTab) {
      case "overview":
        return "Overview"
      case "queue":
        return "Review Queue"
      case "questions":
        return "Questions Repository"
      case "activity":
        return "Audit & Decision History"
      case "workspace":
        return `Review / ${activeReportId || "Question"}`
      default:
        return "Console"
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex font-sans text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar - Linear/Stripe Inspired */}
      <aside
        className={`bg-white border-r border-slate-200/80 flex flex-col transition-all duration-200 z-30 shrink-0 ${
          collapsed ? "w-14" : "w-56"
        }`}
      >
        {/* Workspace Brand */}
        <div className="h-13 flex items-center justify-between px-3.5 border-b border-slate-100">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
                A
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs tracking-tight text-slate-900">
                  Acadza
                </span>
                <span className="text-[10px] text-slate-400 font-medium px-1 rounded bg-slate-100">
                  QA
                </span>
              </div>
            </div>
          ) : (
            <div className="w-6 h-6 mx-auto rounded bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
              A
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-slate-900" : "text-slate-400"}`} />
                {!collapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom Workspace & Faculty Footer */}
        <div className="p-2 border-t border-slate-100 space-y-1">
          {/* Settings Trigger */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition ${
              collapsed ? "justify-center" : ""
            }`}
            title="System & Governance Rules"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            {!collapsed && <span className="text-xs">Rules & Taxonomy</span>}
          </button>

          {/* User Profile */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-slate-700 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
              AS
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 truncate">
                <div className="text-[11px] font-medium text-slate-800 truncate">Dr. A. Sharma</div>
                <div className="text-[9px] text-slate-400 truncate">Physics Faculty</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header - Stripe/Linear Inspired */}
        <header className="h-13 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Acadza QA</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-800">{getBreadcrumb()}</span>
          </div>

          {/* Search Bar */}
          {onSearchChange && (
            <div className="hidden sm:flex items-center flex-1 max-w-xs relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search question, report, topic..."
                className="w-full text-xs bg-slate-50 border border-slate-200/80 rounded-md pl-8 pr-2.5 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
              />
            </div>
          )}

          {/* Right Status Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>FastAPI Connected</span>
            </div>

            {currentTab !== "queue" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTabChange("queue")}
                className="text-xs text-slate-700"
              >
                <Inbox className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Queue ({pendingCount})
              </Button>
            )}
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Quick Settings & Governance Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-lg border border-slate-200 p-5 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-semibold text-slate-900">Governance & Closed Taxonomy</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3">
              <div className="p-3 bg-slate-50 rounded border border-slate-200/80 space-y-1.5">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Closed Taxonomy Policy Active</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Verdicts, repair types, and allowed edit scopes are strictly bounded by <code>data/taxonomy.json</code>.
                  Non-deterministic repairs (diagrams, new options, syllabus removals) mandate human faculty authorization.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 border border-slate-200 rounded">
                  <span className="text-slate-400 block">Permitted Verdicts</span>
                  <span className="font-mono font-medium text-slate-800">7 closed states</span>
                </div>
                <div className="p-2 border border-slate-200 rounded">
                  <span className="text-slate-400 block">Allowed Repairs</span>
                  <span className="font-mono font-medium text-slate-800">13 surgical types</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setShowSettingsModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
