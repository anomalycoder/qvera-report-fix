import React, { useState } from 'react'
import {
  LayoutDashboard,
  Inbox,
  FileQuestion,
  Sparkles,
  History,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  UserCheck,
  CheckCircle2,
  Layers,
  FileText
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export type FacultyNavTab =
  | 'overview'
  | 'queue'
  | 'workspace'
  | 'reports'
  | 'questions'
  | 'auto_applied'
  | 'audit'
  | 'analytics'
  | 'settings'

interface FacultyLayoutProps {
  children: React.ReactNode
  currentTab: FacultyNavTab
  onTabChange: (tab: FacultyNavTab) => void
  pendingReviewsCount?: number
}

export const FacultyLayout: React.FC<FacultyLayoutProps> = ({
  children,
  currentTab,
  onTabChange,
  pendingReviewsCount = 10,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')

  const navItems = [
    { id: 'overview' as FacultyNavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'queue' as FacultyNavTab, label: 'Review Queue', icon: Inbox, badge: pendingReviewsCount },
    { id: 'workspace' as FacultyNavTab, label: 'Review Workspace', icon: FileText },
    { id: 'auto_applied' as FacultyNavTab, label: 'Auto-applied Fixes', icon: Sparkles },
    { id: 'reports' as FacultyNavTab, label: 'All Reports', icon: Inbox },
    { id: 'questions' as FacultyNavTab, label: 'Questions', icon: FileQuestion },
    { id: 'audit' as FacultyNavTab, label: 'Audit History', icon: History },
    { id: 'analytics' as FacultyNavTab, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as FacultyNavTab, label: 'Settings', icon: Settings },
  ]

  const getBreadcrumbTitle = () => {
    switch (currentTab) {
      case 'overview':
        return 'Overview Dashboard'
      case 'queue':
        return 'Review Queue'
      case 'workspace':
        return 'Question Review Workspace'
      case 'auto_applied':
        return 'Auto-applied Fixes'
      case 'reports':
        return 'All Student Reports'
      case 'questions':
        return 'Question Repository'
      case 'audit':
        return 'Faculty Audit History'
      case 'analytics':
        return 'Dataset Analytics'
      case 'settings':
        return 'System Configuration'
      default:
        return 'Faculty Console'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 antialiased">
      {/* Collapsible Left Sidebar */}
      <aside
        className={`bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800 transition-all duration-300 z-40 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
                A
              </div>
              <div>
                <span className="font-bold text-white text-sm tracking-tight">QVERA</span>
                <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  Report → Fix
                </span>
              </div>
            </div>
          )}

          {sidebarCollapsed && (
            <div className="w-8 h-8 mx-auto rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
              A
            </div>
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-slate-400 hover:text-white p-1 rounded-md transition hover:bg-slate-800"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!sidebarCollapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!sidebarCollapsed && item.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* System Status Compact Indicator */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px]">
          {!sidebarCollapsed ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>System Operational</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                FastAPI • SymPy • SQLite WAL
              </div>
            </div>
          ) : (
            <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto animate-pulse" title="System Operational" />
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Breadcrumb Title */}
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Faculty Operations</span>
              <span>/</span>
              <span className="font-semibold text-slate-900">{getBreadcrumbTitle()}</span>
            </div>
          </div>

          {/* Center Search Input */}
          <div className="hidden md:flex items-center flex-1 max-w-md relative mx-4">
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search reports, questions, subjects..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Backend status pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Backend Connected: 127.0.0.1:8000</span>
            </div>

            {/* Notification button */}
            <button
              onClick={() => onTabChange('queue')}
              className="relative p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {pendingReviewsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {pendingReviewsCount}
                </span>
              )}
            </button>

            {/* Reviewer Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                AS
              </div>
              <div className="hidden lg:block text-left text-xs">
                <div className="font-bold text-slate-800 leading-none">Dr. A. Sharma</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Senior Physics Faculty</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-400">
          QVERA Quality Assurance Platform &bull; Provider-Independent Architecture &bull; SymPy Math Verification
        </footer>
      </div>
    </div>
  )
}
