import React from 'react'
import { ShieldCheck, Layers, ClipboardCheck, BarChart3, History } from 'lucide-react'

export type NavTab = 'faculty' | 'analytics' | 'audit'

interface DashboardLayoutProps {
  children: React.ReactNode
  currentTab: NavTab
  onTabChange: (tab: NavTab) => void
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentTab,
  onTabChange,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                A
              </div>
              <div>
                <span className="font-bold text-slate-900 text-lg tracking-tight">Acadza</span>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Report → Fix
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 border-l border-slate-200 pl-6">
              <button
                onClick={() => onTabChange('faculty')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  currentTab === 'faculty'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ClipboardCheck className="w-4 h-4 text-blue-600" />
                <span>Faculty Review Console</span>
              </button>

              <button
                onClick={() => onTabChange('analytics')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  currentTab === 'analytics'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Dataset & Intelligence</span>
              </button>

              <button
                onClick={() => onTabChange('audit')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  currentTab === 'audit'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <History className="w-4 h-4 text-blue-600" />
                <span>Audit Ledger</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Production Ready
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              SymPy + SQLite WAL
            </span>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-200 py-2 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => onTabChange('faculty')}
            className={`px-3 py-1 rounded ${currentTab === 'faculty' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
          >
            Review Console
          </button>
          <button
            onClick={() => onTabChange('analytics')}
            className={`px-3 py-1 rounded ${currentTab === 'analytics' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
          >
            Analytics
          </button>
          <button
            onClick={() => onTabChange('audit')}
            className={`px-3 py-1 rounded ${currentTab === 'audit' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
          >
            Audit Log
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        Acadza Question Quality Assurance Platform &bull; Provider-Independent Architecture &bull; SymPy Math Verification
      </footer>
    </div>
  )
}
