import React, { useState } from "react"
import {
  LayoutDashboard,
  Inbox,
  BookOpen,
  History,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  X,
  User,
  Bell
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
        return "Question Repository"
      case "activity":
        return "Decision & Audit Log"
      case "workspace":
        return `Review / ${activeReportId || "Question"}`
      default:
        return "Console"
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex font-sans text-[#111827] antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Vercel-Inspired Dark Enterprise Sidebar */}
      <aside
        className={`bg-[#111827] text-slate-300 flex flex-col border-r border-[#1F2937] transition-all duration-200 z-30 shrink-0 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[#1F2937]">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                ▲
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm tracking-tight text-white">
                  Acadza
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#1F2937] text-slate-400 border border-[#374151]">
                  QA
                </span>
              </div>
            </div>
          ) : (
            <div className="w-6 h-6 mx-auto rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              ▲
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#1F2937] transition"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 px-2.5 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#1E293B] text-white font-semibold shadow-xs border-l-2 border-blue-500"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1F2937]"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                {!collapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-blue-600 text-white" : "bg-[#1F2937] text-slate-300 border border-[#374151]"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom Sidebar Footer */}
        <div className="p-3 border-t border-[#1F2937] space-y-1.5">
          {/* Rules / Taxonomy Trigger */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs text-slate-400 hover:text-white hover:bg-[#1F2937] transition ${
              collapsed ? "justify-center" : ""
            }`}
            title="Governance & Closed Taxonomy"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {!collapsed && <span className="text-xs truncate">Rules & Taxonomy</span>}
          </button>

          {/* User Profile */}
          <div
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md bg-[#161F2E] border border-[#1F2937] ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center text-[10px] font-bold shrink-0">
              AS
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 truncate">
                <div className="text-xs font-semibold text-white leading-none truncate">Dr. A. Sharma</div>
                <div className="text-[10px] text-slate-400 mt-1 truncate">Senior Physics Faculty</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Acadza Report → Fix</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-[#111827]">{getBreadcrumb()}</span>
          </div>

          {/* Center Search Input */}
          {onSearchChange && (
            <div className="hidden sm:flex items-center flex-1 max-w-sm relative mx-4">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search question stem, report ID, student comment..."
                className="w-full text-xs bg-slate-50 border border-[#E5E7EB] rounded-md pl-8 pr-2.5 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white focus:border-blue-600 transition"
              />
            </div>
          )}

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-700 bg-slate-50 border border-[#E5E7EB]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>FastAPI Connected</span>
            </div>

            {currentTab !== "queue" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTabChange("queue")}
                className="text-xs text-slate-700 border-[#E5E7EB]"
              >
                <Inbox className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Queue ({pendingCount})
              </Button>
            )}
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Governance & Taxonomy Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-[#111827]">Governance & Closed Taxonomy</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3">
              <div className="p-3 bg-slate-50 rounded-md border border-[#E5E7EB] space-y-1.5">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Closed Taxonomy Enforcement Active</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  All verdicts, repairs, and allowed mutation fields are loaded dynamically from <code>data/taxonomy.json</code>.
                  High-risk repairs (missing diagrams, new options, syllabus removals) strictly enforce human faculty review.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 border border-[#E5E7EB] rounded-md bg-white">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Permitted Verdicts</span>
                  <span className="font-semibold text-[#111827] mt-0.5 block">7 closed states</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">defect, no_error, display_issue...</span>
                </div>
                <div className="p-3 border border-[#E5E7EB] rounded-md bg-white">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Allowed Repairs</span>
                  <span className="font-semibold text-[#111827] mt-0.5 block">13 surgical types</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">answer_key, stem_data, spelling...</span>
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
