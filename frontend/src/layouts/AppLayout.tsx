import React, { useState } from "react"
import {
  LayoutDashboard,
  Inbox,
  BookOpen,
  History,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Search,
  RotateCw,
  Menu,
  X,
  User,
  Settings as SettingsIcon,
  ExternalLink
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export type NavTab = "overview" | "queue" | "questions" | "activity" | "settings" | "workspace"

interface AppLayoutProps {
  children: React.ReactNode
  currentTab: NavTab
  onTabChange: (tab: NavTab) => void
  pendingCount?: number
  activeReportId?: string | null
  onSearchChange?: (val: string) => void
  searchValue?: string
  onRefresh?: () => void
  isRefreshing?: boolean
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  currentTab,
  onTabChange,
  pendingCount = 10,
  activeReportId,
  onSearchChange,
  searchValue = "",
  onRefresh,
  isRefreshing = false,
}) => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const workspaceNav = [
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

  const systemNav = [
    {
      id: "settings" as NavTab,
      label: "Settings & Taxonomy",
      icon: SlidersHorizontal,
    },
  ]

  const handleNavClick = (tab: NavTab) => {
    onTabChange(tab)
    setMobileOpen(false)
  }

  const getBreadcrumbs = () => {
    switch (currentTab) {
      case "overview":
        return [{ label: "Overview", tab: "overview" as NavTab }]
      case "queue":
        return [{ label: "Review Queue", tab: "queue" as NavTab }]
      case "questions":
        return [{ label: "Questions Repository", tab: "questions" as NavTab }]
      case "activity":
        return [{ label: "Decision & Audit Log", tab: "activity" as NavTab }]
      case "settings":
        return [{ label: "Settings", tab: "settings" as NavTab }]
      case "workspace":
        return [
          { label: "Review Queue", tab: "queue" as NavTab },
          { label: `Report ${activeReportId || "Inspection"}`, tab: "workspace" as NavTab },
        ]
      default:
        return [{ label: "Console", tab: "overview" as NavTab }]
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex font-sans text-[#111827] antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Vercel-Style Enterprise Dark Sidebar */}
      <aside
        className={`bg-[#111827] text-slate-300 flex flex-col border-r border-[#1F2937] transition-all duration-200 z-50 shrink-0 fixed inset-y-0 left-0 lg:static ${
          mobileOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-16" : "lg:w-60"}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#1F2937]">
          {!collapsed ? (
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => handleNavClick("overview")}
            >
              <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:bg-blue-500 transition-colors">
                ▲
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-bold text-base tracking-tight text-white">
                    Acadza
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/50">
                    QA
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium tracking-tight mt-1">
                  Report → Fix Loop
                </span>
              </div>
            </div>
          ) : (
            <div
              className="w-7 h-7 mx-auto rounded bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-sm cursor-pointer"
              onClick={() => handleNavClick("overview")}
              title="Acadza Report → Fix"
            >
              ▲
            </div>
          )}

          {/* Desktop Collapse / Mobile Close */}
          <div className="flex items-center">
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded hover:bg-[#1F2937]"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex text-slate-400 hover:text-white p-1.5 rounded hover:bg-[#1F2937] transition-colors"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
          {/* Workspace Group */}
          <div>
            {!collapsed && (
              <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Workspace
              </div>
            )}
            <nav className="space-y-1">
              {workspaceNav.map((item) => {
                const Icon = item.icon
                const isActive = currentTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#26364D] text-white font-semibold shadow-xs border-l-2 border-blue-500"
                        : "text-slate-400 hover:text-slate-100 hover:bg-[#1F2937]"
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                    {!collapsed && (
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    )}
                    {!collapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isActive ? "bg-blue-600 text-white" : "bg-[#1F2937] text-slate-300 border border-[#374151]"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* System Group */}
          <div>
            {!collapsed && (
              <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                System
              </div>
            )}
            <nav className="space-y-1">
              {systemNav.map((item) => {
                const Icon = item.icon
                const isActive = currentTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#26364D] text-white font-semibold shadow-xs border-l-2 border-blue-500"
                        : "text-slate-400 hover:text-slate-100 hover:bg-[#1F2937]"
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                    {!collapsed && (
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-3 border-t border-[#1F2937]">
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex items-center gap-3 p-2 rounded-md bg-[#161F2E] border border-[#1F2937] cursor-pointer hover:border-slate-600 transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
            title="Dr. A. Sharma (Senior Physics Faculty)"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center text-xs font-bold shrink-0">
              AS
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 truncate text-left">
                <div className="text-xs font-bold text-white truncate">Dr. A. Sharma</div>
                <div className="text-[11px] text-slate-400 truncate">Senior Physics Faculty</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header - Vercel Clean Light Header */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Drawer Trigger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-sm">
              <span
                onClick={() => onTabChange("overview")}
                className="text-slate-500 hover:text-slate-900 cursor-pointer font-medium"
              >
                Acadza QA
              </span>
              {getBreadcrumbs().map((b, i) => (
                <React.Fragment key={b.label}>
                  <span className="text-slate-300">/</span>
                  <span
                    onClick={() => b.tab && onTabChange(b.tab)}
                    className={`font-semibold cursor-pointer ${
                      i === getBreadcrumbs().length - 1
                        ? "text-[#111827] cursor-default"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {b.label}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Center Search Input */}
          {onSearchChange && (
            <div className="hidden md:flex items-center flex-1 max-w-md relative mx-4">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search question stem, report ID, student comment..."
                className="w-full text-sm bg-slate-50 border border-[#E5E7EB] rounded-md pl-9 pr-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-blue-600 transition"
              />
              {searchValue && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Right Status & Controls */}
          <div className="flex items-center gap-3">
            {/* Functional Refresh Button */}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="h-8 px-2.5 text-xs text-slate-700 border-[#E5E7EB] flex items-center gap-1.5"
                title="Reload live backend data"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : "text-slate-500"}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            )}

            {/* Discreet Live Backend Status */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 bg-slate-50 border border-[#E5E7EB]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>127.0.0.1:8000</span>
            </div>

            {/* Quick Queue Action Button */}
            {currentTab !== "queue" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onTabChange("queue")}
                className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700"
              >
                <Inbox className="w-3.5 h-3.5 mr-1" />
                Queue ({pendingCount})
              </Button>
            )}
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Profile / Quick Settings Dropdown Modal */}
      {showProfileMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                  AS
                </div>
                <div>
                  <div className="font-bold text-sm text-[#111827]">Dr. A. Sharma</div>
                  <div className="text-xs text-slate-500">Senior Physics Faculty</div>
                </div>
              </div>
              <button
                onClick={() => setShowProfileMenu(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <button
                onClick={() => {
                  setShowProfileMenu(false)
                  onTabChange("settings")
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded text-slate-700 hover:bg-slate-50 text-left font-medium"
              >
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span>Closed Taxonomy & Governance</span>
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false)
                  onTabChange("activity")
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded text-slate-700 hover:bg-slate-50 text-left font-medium"
              >
                <History className="w-4 h-4 text-slate-500" />
                <span>My Faculty Decisions Audit</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setShowProfileMenu(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
