import React, { useState, useEffect } from "react"
import {
  SlidersHorizontal,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Database,
  Cpu,
  Layers,
  Workflow,
  RotateCw
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

export const SettingsPage: React.FC = () => {
  const [taxonomy, setTaxonomy] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchTaxonomy = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/v1/taxonomy")
      if (res.ok) {
        const json = await res.json()
        setTaxonomy(json)
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTaxonomy()
  }, [])

  const verdicts: string[] = taxonomy?.verdicts || [
    "defect",
    "no_error",
    "display_issue",
    "app_issue",
    "language_mode",
    "already_fixed",
    "not_actionable",
  ]

  const repairsMap = taxonomy?.repairs || {}
  const repairsList = Object.entries(repairsMap).map(([id, def]: [string, any]) => ({
    id,
    label: def.label || id,
    auto: Boolean(def.auto),
    fields: def.fields || [],
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
            System Settings & Governance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Read-only runtime configuration loaded from <code>data/taxonomy.json</code>. Enforces deterministic validation boundaries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="text-xs font-bold py-1 px-3">
            <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
            Active Governance Policy
          </Badge>
        </div>
      </div>

      {/* 1. Closed Taxonomy Policy Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Lock className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#111827]">
              Closed Verdict Taxonomy (7 States)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              The AI triage engine can only assign verdicts from this closed enum. Fabricated states are strictly rejected.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          {verdicts.map((v) => (
            <span
              key={v}
              className="px-3 py-1.5 rounded-md font-mono text-xs font-bold bg-slate-50 border border-[#E5E7EB] text-slate-800"
            >
              {v}
            </span>
          ))}
        </div>
      </div>

      {/* 2. Repair Rules & Auto-Apply Permissions Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] bg-slate-50/60 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#111827]">
              Surgical Repair Taxonomy & Scope Permissions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Defines which fields each repair type is permitted to mutate, and whether autonomous application is authorized.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600">
            {repairsList.length} Registered Repairs
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#E5E7EB] bg-slate-50/70">
              <TableHead className="w-[20%]">Repair ID</TableHead>
              <TableHead className="w-[36%]">Description / Label</TableHead>
              <TableHead className="w-[24%]">Permitted Fields</TableHead>
              <TableHead className="w-[20%]">Automation Policy</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              repairsList.map((r) => (
                <TableRow key={r.id} className="border-b border-[#E5E7EB]">
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-[#111827]">
                      {r.id}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    {r.label}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {r.fields.map((f: string) => (
                        <span
                          key={f}
                          className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.auto ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Auto-Apply Allowed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                        Faculty Review Mandatory
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 3. System Architecture & Environment Details */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base sm:text-lg font-bold text-[#111827]">
            Backend Engine & Environment Verification
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Core infrastructure components running the Acadza QA pipeline
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg border border-[#E5E7EB] bg-slate-50 space-y-1.5">
            <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-600" />
              SQLite 3 Write-Ahead Logging
            </span>
            <p className="text-slate-600 text-xs leading-relaxed">
              Thread-safe concurrent reads and serial writes in WAL mode. Guarantees zero locking conflicts and immutable audit trails.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-[#E5E7EB] bg-slate-50 space-y-1.5">
            <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-600" />
              SymPy Symbolic Solver
            </span>
            <p className="text-slate-600 text-xs leading-relaxed">
              Executes symbolic phasor calculations, Gauss's law flux integrations, and unit consistency checking from first principles.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-[#E5E7EB] bg-slate-50 space-y-1.5">
            <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Prompt-Injection Shield
            </span>
            <p className="text-slate-600 text-xs leading-relaxed">
              Treats 100% of student comments as untrusted input. Detects adversarial system prompt override attempts and forces routing to <code>no_change</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
