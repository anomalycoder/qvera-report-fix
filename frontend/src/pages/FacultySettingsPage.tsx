import React, { useState, useEffect } from 'react'
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Workflow,
  Cpu,
  Layers,
  Database
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const FacultySettingsPage: React.FC = () => {
  const [taxonomy, setTaxonomy] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/taxonomy')
      .then((res) => res.json())
      .then((data) => setTaxonomy(data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-blue-600" />
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              System Settings & Governance Rules
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Runtime configurations, closed taxonomy definitions, and human approval safety gates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            All Safety Gates Active
          </Badge>
        </div>
      </div>

      {/* System Governance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900">Closed Taxonomy Scope</h3>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            All verdicts and repairs are loaded at runtime from <code>data/taxonomy.json</code>.
            Arbitrary repair types or edits to unlisted fields are strictly rejected by the backend.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900">SymPy Mathematical Verifier</h3>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            AC phasors, Gauss flux integrations, and photoelectric equations are evaluated deterministically
            via SymPy without guessing or hallucinating intermediate numbers.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mb-2">
            <Database className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900">Persistent SQLite Ledger</h3>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Audit logs and triage states are permanently recorded in SQLite with Write-Ahead Logging (WAL)
            mode for concurrent multi-reader access and duplicate prevention.
          </p>
        </div>
      </div>

      {/* Closed Taxonomy Live Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Workflow className="w-4 h-4 text-blue-600" />
            Active Taxonomy Repairs & Permitted Scopes
          </span>
          <span className="text-[10px] font-mono text-slate-500">Source: data/taxonomy.json</span>
        </div>

        {isLoading || !taxonomy ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading taxonomy rules...</div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-4">Repair Key</th>
                  <th className="py-2.5 px-4">Label & Description</th>
                  <th className="py-2.5 px-4">Permitted Edit Fields</th>
                  <th className="py-2.5 px-4">Auto-Apply Policy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {Object.entries(taxonomy.repairs || {}).map(([key, def]: [string, any]) => (
                  <tr key={key} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{key}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-700">{def.label}</td>
                    <td className="py-2.5 px-4 text-purple-700 font-bold">
                      {def.fields.join(', ')}
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      {def.auto ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Permitted if Confidence &ge; 90%
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Gated: Faculty Review Mandatory
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
