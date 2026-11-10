import React, { useState, useEffect } from 'react'
import type { AuditLogEntry } from '@/types/audit'
import { History, ShieldCheck, Clock, UserCheck, RefreshCw, Filter, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const AuditLedgerPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterAction, setFilterAction] = useState('all')

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/v1/audit/logs?limit=100')
      if (res.ok) {
        const data = await res.json()
        setLogs(data)
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'all' && log.action !== filterAction) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Audit Ledger & Faculty Governance Log
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Immutable, timestamped audit log of all faculty decisions, approved patches, and rejected proposals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-700 font-medium"
          >
            <option value="all">All Actions</option>
            <option value="approve">Approved</option>
            <option value="reject">Rejected</option>
            <option value="edit">Edited</option>
          </select>

          <button
            onClick={fetchLogs}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            Decision Records ({filteredLogs.length})
          </span>
          <span className="text-xs font-mono text-slate-500">Storage: SQLite WAL mode</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-300" />
            <p className="text-xs">Loading audit ledger...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No audit records found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Open the Faculty Review Console, select an issue, and click "Approve" or "Reject" to create permanent entries in this ledger.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold uppercase font-mono ${
                        log.action === 'approve'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.action === 'reject'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      Report: {log.report_id}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      QID: {log.question_id.substring(0, 10)}...
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      {log.faculty_name || 'Faculty'}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-slate-400">
                      <Clock className="w-3 h-3" />
                      {log.created_at ? log.created_at.replace('T', ' ').substring(0, 19) : ''}
                    </span>
                  </div>
                </div>

                {log.notes && (
                  <p className="text-xs text-slate-700 bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                    <strong className="text-slate-900">Rationale: </strong>
                    {log.notes}
                  </p>
                )}

                {log.applied_edit && (
                  <div className="text-[11px] font-mono bg-slate-900 text-slate-200 p-2.5 rounded-lg overflow-x-auto">
                    <span>Applied Patch: </span>
                    {JSON.stringify(log.applied_edit, null, 2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
