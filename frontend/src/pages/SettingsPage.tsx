import React, { useState, useEffect, useCallback } from "react"
import {
  Lock,
  ShieldCheck,
  Check,
  Plus,
  Edit3,
  RotateCw,
  RotateCcw,
  ChevronDown,
  AlertTriangle,
  History,
  SlidersHorizontal,
  Server,
  X,
  Loader2,
  CheckCircle2,
  Ban,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"

type SettingsSection = "taxonomy" | "triage" | "system"

interface VerdictConfig {
  id: string
  display_name: string
  description: string
  active: boolean
  default_route: string
  usage_count: number
}

interface RepairConfig {
  id: string
  display_name: string
  label: string
  fields: string[]
  auto: boolean
  active: boolean
  usage_count: number
}

function formatTs(ts?: string | null): string {
  if (!ts) return "—"
  const d = new Date(ts.includes("T") ? ts : `${ts.replace(" ", "T")}Z`)
  if (Number.isNaN(d.getTime())) return ts
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const SettingsPage: React.FC = () => {
  const { user, token } = useAuth()
  const isAdmin = user?.role === "admin"

  const [activeSection, setActiveSection] = useState<SettingsSection>("taxonomy")
  const [config, setConfig] = useState<any>(null)
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sseLive, setSseLive] = useState(false)
  const [remoteUpdateNotice, setRemoteUpdateNotice] = useState<string | null>(null)

  // Expanded rows
  const [expandedRepairId, setExpandedRepairId] = useState<string | null>(null)

  // Verdict editor modal state
  const [verdictModalOpen, setVerdictModalOpen] = useState(false)
  const [verdictMode, setVerdictMode] = useState<"add" | "edit">("edit")
  const [vId, setVId] = useState("")
  const [vName, setVName] = useState("")
  const [vDesc, setVDesc] = useState("")
  const [vActive, setVActive] = useState(true)
  const [vRoute, setVRoute] = useState("no_change")
  const [vReason, setVReason] = useState("")
  const [vDirty, setVDirty] = useState(false)
  const [vFormError, setVFormError] = useState<string | null>(null)

  // Repair editor modal state
  const [repairModalOpen, setRepairModalOpen] = useState(false)
  const [repairMode, setRepairMode] = useState<"add" | "edit">("edit")
  const [rId, setRId] = useState("")
  const [rName, setRName] = useState("")
  const [rLabel, setRLabel] = useState("")
  const [rFields, setRFields] = useState<string[]>([])
  const [rAuto, setRAuto] = useState(false)
  const [rOrigAuto, setROrigAuto] = useState(false)
  const [rConfirmAutoPromo, setRConfirmAutoPromo] = useState(false)
  const [rActive, setRActive] = useState(true)
  const [rReason, setRReason] = useState("")
  const [rDirty, setRDirty] = useState(false)
  const [rFormError, setRFormError] = useState<string | null>(null)

  // AI & Triage Config state
  const [confFloor, setConfFloor] = useState<number>(90)
  const [reqVerif, setReqVerif] = useState<boolean>(true)
  const [blockInj, setBlockInj] = useState<boolean>(true)
  const [triageReason, setTriageReason] = useState("")
  const [triageDirty, setTriageDirty] = useState(false)

  // Rollback confirm modal state
  const [rollbackTarget, setRollbackTarget] = useState<number | null>(null)

  // Advanced collapsed JSON state
  const [advJsonText, setAdvJsonText] = useState("")
  const [advConfirmAuto, setAdvConfirmAuto] = useState(false)
  const [advError, setAdvError] = useState<string | null>(null)

  const [isSaving, setIsSaving] = useState(false)

  const authHeaders = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" }
    const tk = token || localStorage.getItem("qvera_auth_token")
    if (tk) h.Authorization = `Bearer ${tk}`
    return h
  }, [token])

  const fetchConfig = useCallback(async (silent = false) => {
    if (silent) setIsRefreshing(true)
    else setIsLoading(true)
    setError(null)
    try {
      const [taxRes, healthRes] = await Promise.all([
        fetch("/api/v1/taxonomy/full"),
        fetch("/api/v1/health"),
      ])
      if (!taxRes.ok) throw new Error(`Taxonomy load failed (HTTP ${taxRes.status})`)
      const taxJson = await taxRes.json()
      setConfig(taxJson)
      setRemoteUpdateNotice(null)

      if (taxJson.triage_config) {
        setConfFloor(Math.round((taxJson.triage_config.auto_apply_confidence_floor ?? 0.9) * 100))
        setReqVerif(Boolean(taxJson.triage_config.require_independent_verification))
        setBlockInj(Boolean(taxJson.triage_config.block_prompt_injections))
        setTriageDirty(false)
      }

      // Prepare optional advanced JSON snapshot strictly from current schema
      const rawVerdicts: Record<string, string> = {}
      const rawRepairs: Record<string, { fields: string[]; auto: boolean; label: string }> = {}
      ;(taxJson.verdicts || []).forEach((v: VerdictConfig) => {
        rawVerdicts[v.id] = v.description
      })
      ;(taxJson.repairs || []).forEach((r: RepairConfig) => {
        rawRepairs[r.id] = { fields: r.fields, auto: r.auto, label: r.label }
      })
      setAdvJsonText(JSON.stringify({ verdicts: rawVerdicts, repairs: rawRepairs }, null, 2))

      if (healthRes.ok) {
        setSystemHealth(await healthRes.json())
      }
    } catch (err: any) {
      if (!silent) setError(err.message || "Unable to load taxonomy configuration")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig(false)
  }, [fetchConfig])

  // Real-time SSE sync across active sessions
  useEffect(() => {
    let es: EventSource | null = null
    if (typeof EventSource !== "undefined") {
      es = new EventSource("/api/v1/faculty/notifications/stream")
      es.onopen = () => setSseLive(true)
      es.onerror = () => setSseLive(false)
      es.addEventListener("taxonomy_update", (ev: MessageEvent) => {
        try {
          const payload = JSON.parse(ev.data)
          if (vDirty || rDirty || triageDirty) {
            setRemoteUpdateNotice(
              `Taxonomy updated remotely to v${payload.taxonomy_version} (${payload.actor}). Reload latest when ready.`
            )
          } else {
            fetchConfig(true)
          }
        } catch {
          fetchConfig(true)
        }
      })
    }
    return () => {
      if (es) es.close()
    }
  }, [fetchConfig, vDirty, rDirty, triageDirty])

  // Unsaved changes browser navigation warning
  useEffect(() => {
    const hasUnsaved = (verdictModalOpen && vDirty) || (repairModalOpen && rDirty) || triageDirty
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [verdictModalOpen, vDirty, repairModalOpen, rDirty, triageDirty])

  const openAddVerdict = () => {
    setVerdictMode("add")
    setVId("")
    setVName("")
    setVDesc("")
    setVActive(true)
    setVRoute("no_change")
    setVReason("")
    setVDirty(false)
    setVFormError(null)
    setVerdictModalOpen(true)
  }

  const openEditVerdict = (v: VerdictConfig) => {
    setVerdictMode("edit")
    setVId(v.id)
    setVName(v.display_name)
    setVDesc(v.description)
    setVActive(v.active)
    setVRoute(v.default_route)
    setVReason("")
    setVDirty(false)
    setVFormError(null)
    setVerdictModalOpen(true)
  }

  const handleSaveVerdict = async (e: React.FormEvent) => {
    e.preventDefault()
    setVFormError(null)

    const cleanId = vId.trim().toLowerCase()
    if (verdictMode === "add" && !/^[a-z][a-z0-9_]{1,47}$/.test(cleanId)) {
      setVFormError("Use lowercase snake_case identifier (e.g. duplicate_question).")
      return
    }
    if (vName.trim().length < 2) {
      setVFormError("Display name must be at least 2 characters.")
      return
    }
    if (vDesc.trim().length < 5) {
      setVFormError("Description must be at least 5 characters.")
      return
    }

    setIsSaving(true)
    try {
      const url = verdictMode === "add" ? "/api/v1/taxonomy/verdicts" : `/api/v1/taxonomy/verdicts/${cleanId}`
      const method = verdictMode === "add" ? "POST" : "PATCH"
      const bodyPayload: any = {
        display_name: vName.trim(),
        description: vDesc.trim(),
        active: vActive,
        default_route: vRoute,
        expected_version: config?.version,
        reason: vReason.trim() || undefined,
      }
      if (verdictMode === "add") bodyPayload.id = cleanId

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(bodyPayload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail || `Failed (${res.status})`)

      setConfig(json)
      setVDirty(false)
      setVerdictModalOpen(false)
      window.dispatchEvent(new CustomEvent("qvera:faculty-action"))
      toast.success(`Taxonomy updated to v${json.version}`)
    } catch (err: any) {
      setVFormError(err.message || "Unable to save verdict.")
    } finally {
      setIsSaving(false)
    }
  }

  const openAddRepair = () => {
    setRepairMode("add")
    setRId("")
    setRName("")
    setRLabel("")
    setRFields([])
    setRAuto(false)
    setROrigAuto(false)
    setRConfirmAutoPromo(false)
    setRActive(true)
    setRReason("")
    setRDirty(false)
    setRFormError(null)
    setRepairModalOpen(true)
  }

  const openEditRepair = (r: RepairConfig) => {
    setRepairMode("edit")
    setRId(r.id)
    setRName(r.display_name)
    setRLabel(r.label)
    setRFields(r.fields || [])
    setRAuto(Boolean(r.auto))
    setROrigAuto(Boolean(r.auto))
    setRConfirmAutoPromo(false)
    setRActive(r.active)
    setRReason("")
    setRDirty(false)
    setRFormError(null)
    setRepairModalOpen(true)
  }

  const toggleRepairField = (field: string) => {
    setRDirty(true)
    setRFields((prev) => (prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]))
  }

  const handleSaveRepair = async (e: React.FormEvent) => {
    e.preventDefault()
    setRFormError(null)

    const cleanId = rId.trim().toLowerCase()
    if (repairMode === "add" && !/^[a-z][a-z0-9_]{1,47}$/.test(cleanId)) {
      setRFormError("Use lowercase snake_case identifier (e.g. unit_conversion).")
      return
    }
    if (rName.trim().length < 2) {
      setRFormError("Display name must be at least 2 characters.")
      return
    }
    if (rLabel.trim().length < 5) {
      setRFormError("Description must be at least 5 characters.")
      return
    }
    if (rAuto && rFields.length === 0) {
      setRFormError("Automatic repairs must permit at least one question field.")
      return
    }
    const needsAutoConfirm = (!rOrigAuto && rAuto) || (repairMode === "add" && rAuto)
    if (needsAutoConfirm && !rConfirmAutoPromo) {
      setRFormError("Check explicit confirmation box before enabling auto-application.")
      return
    }

    setIsSaving(true)
    try {
      const url = repairMode === "add" ? "/api/v1/taxonomy/repairs" : `/api/v1/taxonomy/repairs/${cleanId}`
      const method = repairMode === "add" ? "POST" : "PATCH"
      const bodyPayload: any = {
        display_name: rName.trim(),
        label: rLabel.trim(),
        fields: rFields,
        auto: rAuto,
        confirm_auto_promotion: needsAutoConfirm ? rConfirmAutoPromo : true,
        active: rActive,
        expected_version: config?.version,
        reason: rReason.trim() || undefined,
      }
      if (repairMode === "add") bodyPayload.id = cleanId

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(bodyPayload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail || `Failed (${res.status})`)

      setConfig(json)
      setRDirty(false)
      setRepairModalOpen(false)
      window.dispatchEvent(new CustomEvent("qvera:faculty-action"))
      toast.success(`Repair configuration saved (Taxonomy v${json.version})`)
    } catch (err: any) {
      setRFormError(err.message || "Unable to save repair configuration.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveTriageConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch("/api/v1/taxonomy/triage-config", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          auto_apply_confidence_floor: Number((confFloor / 100).toFixed(2)),
          require_independent_verification: reqVerif,
          block_prompt_injections: blockInj,
          expected_version: config?.version,
          reason: triageReason.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail || `Save failed (${res.status})`)
      setConfig(json)
      setTriageDirty(false)
      setTriageReason("")
      window.dispatchEvent(new CustomEvent("qvera:faculty-action"))
      toast.success(`AI triage configuration saved (v${json.version})`)
    } catch (err: any) {
      toast.error(err.message || "Permission denied or validation error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleImportAdvancedJson = async () => {
    setAdvError(null)
    let parsed: any
    try {
      parsed = JSON.parse(advJsonText)
    } catch {
      setAdvError("Invalid JSON syntax. Fix formatting before saving.")
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch("/api/v1/taxonomy/advanced", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          raw_json: parsed,
          expected_version: config?.version,
          confirm_auto_promotion: advConfirmAuto,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail || `Import failed (${res.status})`)
      setConfig(json)
      setAdvConfirmAuto(false)
      window.dispatchEvent(new CustomEvent("qvera:faculty-action"))
      toast.success(`Imported validated taxonomy as v${json.version}`)
    } catch (err: any) {
      setAdvError(err.message || "Schema validation rejected JSON.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmRollback = async () => {
    if (rollbackTarget === null) return
    setIsSaving(true)
    try {
      const params = new URLSearchParams()
      if (config?.version) params.set("expected_version", String(config.version))
      const res = await fetch(`/api/v1/taxonomy/rollback/${rollbackTarget}?${params.toString()}`, {
        method: "POST",
        headers: authHeaders(),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail || `Rollback failed (${res.status})`)
      setConfig(json)
      setRollbackTarget(null)
      window.dispatchEvent(new CustomEvent("qvera:faculty-action"))
      toast.success(`Restored v${rollbackTarget} as new active version v${json.version}`)
    } catch (err: any) {
      toast.error(err.message || "Rollback failed")
    } finally {
      setIsSaving(false)
    }
  }

  const verdictsList: VerdictConfig[] = config?.verdicts || []
  const repairsList: RepairConfig[] = config?.repairs || []
  const availableFields: string[] = config?.available_fields || ["question", "solution", "answer", "questionType"]
  const versionsList: any[] = config?.versions || []

  if (isLoading && !config) {
    return (
      <div className="space-y-5 max-w-[1360px] mx-auto">
        <Skeleton className="h-12 w-full bg-[#EAE7DC] rounded-[14px]" />
        <Skeleton className="h-44 w-full bg-[#EFECE6] rounded-[16px]" />
        <Skeleton className="h-64 w-full bg-[#EFECE6] rounded-[16px]" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-[1360px] mx-auto font-sans">
      {/* =====================================================================
          HEADER & VERSION / ROLE STATUS BAR
      ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[13.5px] text-[#555555]">
            Single source of truth governing verdicts, surgical repair boundaries, and automatic application rules.
          </p>
          <span className="text-[11px] font-mono text-[#777777]">
            Active Version: <strong className="text-[#111111]">v{config?.version ?? 1}</strong> · Updated{" "}
            {formatTs(config?.updated_at)} by {config?.updated_by || "system"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border ${
              isAdmin
                ? "bg-[#ECFDF3] text-[#15803D] border-[#D1FADF]"
                : "bg-[#EFECE6] text-[#444444] border-[#DFDBD0]"
            }`}
          >
            {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isAdmin ? "Admin Edit Access" : "Faculty Read-Only"}</span>
          </span>

          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border ${
              sseLive ? "bg-[#ECFDF3] text-[#15803D] border-[#D1FADF]" : "bg-[#F9F8F3] text-[#666666] border-[#DFDBD0]"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${sseLive ? "bg-[#16A34A] animate-pulse" : "bg-[#888888]"}`} />
            Live
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchConfig(true)}
            className="h-8 text-xs border-[#DFDBD0] bg-white rounded-[8px] text-[#111111]"
          >
            <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Role Notice for Faculty Viewers */}
      {!isAdmin && (
        <div className="bg-[#FAF9F5] border border-[#C5C1B4] rounded-[12px] px-4 py-2.5 text-[12px] text-[#555555] flex items-center justify-between gap-3">
          <span>
            You are signed in as <strong className="text-[#111111]">{user?.role || "faculty"}</strong>. Taxonomy viewing is enabled; write operations require an Administrator session (<code className="font-mono text-[#111111]">admin@qvera.local</code>).
          </span>
        </div>
      )}

      {/* Remote SSE Update Notice when Editing */}
      {remoteUpdateNotice && (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[12px] px-4 py-2.5 text-[12px] text-[#92400E] flex items-center justify-between gap-3">
          <span>{remoteUpdateNotice}</span>
          <button
            type="button"
            onClick={() => fetchConfig(false)}
            className="h-7 px-3 rounded-[6px] bg-[#0B0F12] text-white font-medium cursor-pointer"
          >
            Reload Latest
          </button>
        </div>
      )}

      {error && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] px-4 py-3 rounded-[12px] text-xs">
          {error}
        </div>
      )}

      {/* =====================================================================
          SIMPLE SETTINGS NAVIGATION (TAXONOMY / AI & TRIAGE / SYSTEM INFO)
      ===================================================================== */}
      <div className="inline-flex items-center gap-1 bg-[#EFECE6] p-1 rounded-[10px] border border-[#DFDBD0] text-[12.5px]">
        {[
          { id: "taxonomy" as SettingsSection, label: "Taxonomy", icon: ShieldCheck },
          { id: "triage" as SettingsSection, label: "AI & Triage Configuration", icon: SlidersHorizontal },
          { id: "system" as SettingsSection, label: "System Information", icon: Server },
        ].map((sec) => {
          const Icon = sec.icon
          const active = activeSection === sec.id
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className={`px-3.5 py-1.5 rounded-[7px] font-medium inline-flex items-center gap-2 cursor-pointer transition-colors ${
                active ? "bg-white text-[#111111] font-semibold shadow-2xs" : "text-[#555555] hover:text-[#111111]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sec.label}</span>
            </button>
          )
        })}
      </div>

      {/* =====================================================================
          SECTION 1: TAXONOMY (VERDICTS, REPAIR TYPES, ALLOWED FIELDS, VERSIONS)
      ===================================================================== */}
      {activeSection === "taxonomy" && (
        <div className="space-y-5">
          {/* A. VERDICTS */}
          <section className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E2D9]">
              <div>
                <h2 className="font-display text-[17px] font-[425] text-[#111111]">
                  A. Verdicts ({verdictsList.length})
                </h2>
                <p className="text-[12px] text-[#666666]">
                  Allowed report classifications governing routing. Existing identifiers remain stable for historical auditability.
                </p>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={openAddVerdict}
                  className="h-8.5 px-3.5 rounded-[8px] bg-[#0B0F12] hover:bg-[#1f2328] text-white text-[12px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Verdict</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {verdictsList.map((v) => (
                <div
                  key={v.id}
                  className={`p-3.5 rounded-[12px] border space-y-2 transition-colors ${
                    v.active ? "bg-[#F9F8F3] border-[#DFDBD0]" : "bg-[#F9F8F3]/50 border-[#E5E2D9] opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[13px] font-semibold text-[#111111] block">
                        {v.display_name}
                      </span>
                      <span className="font-mono text-[11px] text-[#666666]">{v.id}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          v.active
                            ? "bg-[#ECFDF3] text-[#15803D] border-[#D1FADF]"
                            : "bg-[#EFECE6] text-[#666666] border-[#DFDBD0]"
                        }`}
                      >
                        {v.active ? "Active" : "Disabled"}
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => openEditVerdict(v)}
                          className="p-1 rounded-[6px] hover:bg-white border border-transparent hover:border-[#DFDBD0] text-[#555555] hover:text-[#111111] cursor-pointer"
                          title={`Edit ${v.id}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[12px] text-[#555555] leading-relaxed">{v.description}</p>

                  <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-[#666666]">
                    <span>route: {v.default_route}</span>
                    <span>{v.usage_count} reviewed cases</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* B. REPAIR TYPES & C. ALLOWED FIELDS */}
          <section className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E2D9]">
              <div>
                <h2 className="font-display text-[17px] font-[425] text-[#111111]">
                  B. Repair Types & Permitted Question Fields ({repairsList.length})
                </h2>
                <p className="text-[12px] text-[#666666]">
                  Repairs with <code className="font-mono text-[#111111]">auto: false</code> require faculty signoff. Every edit is scoped strictly to checked fields.
                </p>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={openAddRepair}
                  className="h-8.5 px-3.5 rounded-[8px] bg-[#0B0F12] hover:bg-[#1f2328] text-white text-[12px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Repair Type</span>
                </button>
              )}
            </div>

            <div className="border border-[#E5E2D9] rounded-[12px] divide-y divide-[#F0EEE6]">
              {repairsList.map((r) => {
                const isExpanded = expandedRepairId === r.id
                return (
                  <div key={r.id} className={r.active ? "bg-white" : "bg-[#FAF9F5] opacity-75"}>
                    <div
                      onClick={() => setExpandedRepairId(isExpanded ? null : r.id)}
                      className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-[#FAF9F5] cursor-pointer text-[12.5px]"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[#111111]">{r.display_name}</span>
                          <span className="font-mono text-[11px] text-[#666666]">({r.id})</span>
                          {!r.active && (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
                              <Ban className="w-2.5 h-2.5" />
                              Disabled
                            </span>
                          )}
                        </div>
                        <p className="text-[11.5px] text-[#666666] line-clamp-1">{r.label}</p>
                      </div>

                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Allowed Fields Summary */}
                        <div className="flex items-center gap-1 font-mono text-[10.5px]">
                          {r.fields.length === 0 ? (
                            <span className="px-2 py-0.5 rounded bg-[#F9F8F3] border border-[#DFDBD0] text-[#777777]">
                              no direct field edit
                            </span>
                          ) : (
                            r.fields.map((f) => (
                              <span
                                key={f}
                                className="px-2 py-0.5 rounded bg-[#F9F8F3] border border-[#DFDBD0] text-[#111111]"
                              >
                                {f}
                              </span>
                            ))
                          )}
                        </div>

                        {/* Auto vs Faculty Gate Badge */}
                        <span
                          className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${
                            r.auto && r.active
                              ? "bg-[#ECFDF3] text-[#15803D] border-[#D1FADF]"
                              : "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]"
                          }`}
                        >
                          {r.auto ? "Auto-Apply Eligible" : "Faculty Required"}
                        </span>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditRepair(r)
                            }}
                            className="h-7 px-2.5 rounded-[7px] bg-white hover:bg-[#EFECE6] border border-[#DFDBD0] text-[11.5px] font-medium text-[#111111] cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                        <ChevronDown
                          className={`w-4 h-4 text-[#666666] transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 py-3 bg-[#F9F8F3] border-t border-[#E5E2D9] grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px]">
                        <div>
                          <span className="font-mono text-[10.5px] uppercase text-[#666666] block mb-1">
                            C. Permitted Fields
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {availableFields.map((fld) => {
                              const allowed = r.fields.includes(fld)
                              return (
                                <span
                                  key={fld}
                                  className={`px-2 py-0.5 rounded font-mono text-[11px] border ${
                                    allowed
                                      ? "bg-white text-[#111111] border-[#111111] font-semibold"
                                      : "bg-transparent text-[#999999] border-[#E5E2D9] line-through"
                                  }`}
                                >
                                  {fld}
                                </span>
                              )
                            })}
                          </div>
                        </div>

                        <div>
                          <span className="font-mono text-[10.5px] uppercase text-[#666666] block mb-1">
                            Execution Gate
                          </span>
                          <p className="text-[#333333]">
                            {r.auto
                              ? `Eligible when confidence ≥ ${confFloor}% and verification checks pass.`
                              : "auto: false — Never automatically applied; strictly routed to faculty review."}
                          </p>
                        </div>

                        <div>
                          <span className="font-mono text-[10.5px] uppercase text-[#666666] block mb-1">
                            Usage & Status
                          </span>
                          <p className="text-[#333333]">
                            Referenced in <strong className="font-mono">{r.usage_count}</strong> triage record(s).{" "}
                            {r.active ? "Active for new triage." : "Disabled for new triage."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Collapsed Optional Advanced JSON Import (Admin Only) */}
            {isAdmin && (
              <details className="pt-2 border-t border-[#F0EEE6] text-[12px]">
                <summary className="cursor-pointer font-mono text-[#666666] hover:text-[#111111]">
                  Advanced: Schema-Validated Raw JSON Configuration (Administrators Only)
                </summary>
                <div className="mt-3 p-4 rounded-[12px] bg-[#F9F8F3] border border-[#DFDBD0] space-y-3">
                  <textarea
                    value={advJsonText}
                    onChange={(e) => setAdvJsonText(e.target.value)}
                    rows={10}
                    className="w-full p-3 rounded-[8px] bg-white border border-[#C5C1B4] font-mono text-[11.5px] text-[#111111]"
                  />
                  <label className="flex items-center gap-2 text-[12px] text-[#333333]">
                    <input
                      type="checkbox"
                      checked={advConfirmAuto}
                      onChange={(e) => setAdvConfirmAuto(e.target.checked)}
                    />
                    <span>Confirm any auto: false → auto: true promotions included in this JSON</span>
                  </label>
                  {advError && (
                    <div className="text-xs text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] px-3 py-2 rounded-[8px]">
                      {advError}
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleImportAdvancedJson}
                    className="h-9 px-4 rounded-[8px] bg-[#0B0F12] text-white text-xs font-medium cursor-pointer disabled:opacity-50"
                  >
                    Validate & Apply JSON
                  </button>
                </div>
              </details>
            )}
          </section>

          {/* VERSION HISTORY & SAFE ROLLBACK */}
          <section className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5E2D9]">
              <History className="w-4 h-4 text-[#111111]" />
              <div>
                <h2 className="font-display text-[17px] font-[425] text-[#111111]">
                  Taxonomy Version History
                </h2>
                <p className="text-[12px] text-[#666666]">
                  Every modification creates an immutable version. Historical investigations preserve their evaluated version reference.
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#F0EEE6] text-[12.5px] max-h-64 overflow-y-auto">
              {versionsList.map((ver) => (
                <div key={ver.version} className="py-2.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[#111111]">v{ver.version}</span>
                      {ver.version === config?.version && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ECFDF3] text-[#15803D] border border-[#D1FADF]">
                          Current
                        </span>
                      )}
                      <span className="text-[#666666] text-[11.5px]">
                        by {ver.updated_by} ({ver.updated_by_role})
                      </span>
                    </div>
                    <p className="text-[12px] text-[#333333]">{ver.change_summary}</p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-mono text-[11px] text-[#777777]">{formatTs(ver.created_at)}</span>
                    {isAdmin && ver.version !== config?.version && (
                      <button
                        type="button"
                        onClick={() => setRollbackTarget(ver.version)}
                        className="h-7 px-2.5 rounded-[7px] bg-[#F9F8F3] hover:bg-[#EFECE6] border border-[#DFDBD0] text-[11px] font-medium text-[#111111] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore as New Version</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* =====================================================================
          SECTION 2: AI & TRIAGE CONFIGURATION (BACKEND ENFORCED)
      ===================================================================== */}
      {activeSection === "triage" && (
        <section className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] p-6 shadow-xs space-y-5 max-w-2xl">
          <div>
            <h2 className="font-display text-[17px] font-[425] text-[#111111]">
              AI & Triage Safety Configuration
            </h2>
            <p className="text-[12px] text-[#666666]">
              Controls enforced directly by <code className="font-mono text-[#111111]">SafetyValidator</code> during triage evaluation.
            </p>
          </div>

          <form onSubmit={handleSaveTriageConfig} className="space-y-4 text-[13px]">
            <div className="space-y-1.5">
              <label className="font-medium text-[#111111] block">
                Auto-Apply Confidence Floor ({confFloor}%)
              </label>
              <input
                type="range"
                min={50}
                max={100}
                value={confFloor}
                disabled={!isAdmin}
                onChange={(e) => {
                  setConfFloor(Number(e.target.value))
                  setTriageDirty(true)
                }}
                className="w-full accent-[#111111]"
              />
              <p className="text-[11.5px] text-[#666666]">
                Repairs with <code className="font-mono">auto: true</code> require at least {confFloor}% confidence to route to <code className="font-mono">auto_apply</code>.
              </p>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6] cursor-pointer">
              <input
                type="checkbox"
                checked={reqVerif}
                disabled={!isAdmin}
                onChange={(e) => {
                  setReqVerif(e.target.checked)
                  setTriageDirty(true)
                }}
                className="mt-1"
              />
              <div>
                <span className="font-medium text-[#111111] block">Require Independent Verification</span>
                <span className="text-[11.5px] text-[#666666]">
                  Student comments are investigated as leads only; never trusted blindly without SymPy/stem verification.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6] cursor-pointer">
              <input
                type="checkbox"
                checked={blockInj}
                disabled={!isAdmin}
                onChange={(e) => {
                  setBlockInj(e.target.checked)
                  setTriageDirty(true)
                }}
                className="mt-1"
              />
              <div>
                <span className="font-medium text-[#111111] block">Block Prompt Injection Attempts</span>
                <span className="text-[11.5px] text-[#666666]">
                  Neutralizes adversarial instruction injection inside student report text.
                </span>
              </div>
            </label>

            {isAdmin && (
              <>
                <input
                  type="text"
                  value={triageReason}
                  onChange={(e) => setTriageReason(e.target.value)}
                  placeholder="Optional change note for Audit Ledger..."
                  className="w-full h-9 px-3 rounded-[8px] bg-[#F9F8F3] border border-[#DFDBD0] text-[12px]"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving || !triageDirty}
                    className="h-9 px-4 rounded-[8px] bg-[#0B0F12] text-white text-[12.5px] font-medium cursor-pointer disabled:opacity-45"
                  >
                    {isSaving ? "Saving..." : "Save Configuration"}
                  </button>
                </div>
              </>
            )}
          </form>
        </section>
      )}

      {/* =====================================================================
          SECTION 3: REAL SYSTEM INFORMATION
      ===================================================================== */}
      {activeSection === "system" && (
        <section className="bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] p-6 shadow-xs space-y-4 max-w-3xl text-[12.5px]">
          <h2 className="font-display text-[17px] font-[425] text-[#111111]">System Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6] space-y-1">
              <span className="font-mono text-[10.5px] uppercase text-[#666666]">Backend Service</span>
              <div className="font-semibold text-[#111111]">{systemHealth?.service || "qvera-report-fix-backend"}</div>
              <div className="font-mono text-[11px] text-[#15803D]">Status: {systemHealth?.status || "healthy"}</div>
            </div>
            <div className="p-3.5 rounded-[10px] bg-[#F9F8F3] border border-[#E2DFD6] space-y-1">
              <span className="font-mono text-[10.5px] uppercase text-[#666666]">Database & Audit Mode</span>
              <div className="font-semibold text-[#111111]">SQLite WAL + Append-Only Triggers</div>
              <div className="font-mono text-[11px] text-[#555555]">Taxonomy Source: taxonomy_versions (seed: data/taxonomy.json)</div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          COMPACT VERDICT EDIT / ADD MODAL
      ===================================================================== */}
      {verdictModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0B0F12]/25 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => (!vDirty || window.confirm("Discard unsaved verdict changes?")) && setVerdictModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-3.5 bg-[#F9F8F3] border-b border-[#E5E2D9] flex items-center justify-between">
              <h3 className="font-display text-[17px] font-[425] text-[#111111]">
                {verdictMode === "add" ? "Add Verdict Classification" : `Edit Verdict · ${vId}`}
              </h3>
              <button
                type="button"
                onClick={() => setVerdictModalOpen(false)}
                className="p-1 rounded-[6px] text-[#666666] hover:text-[#111111] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVerdict} className="p-5 space-y-3.5 text-[12.5px]">
              {verdictMode === "add" && (
                <div>
                  <label className="block text-[11.5px] font-medium text-[#111111] mb-1">Identifier (snake_case)</label>
                  <input
                    type="text"
                    value={vId}
                    onChange={(e) => {
                      setVId(e.target.value)
                      setVDirty(true)
                    }}
                    placeholder="e.g. duplicate_question"
                    className="w-full h-9 px-3 rounded-[8px] border border-[#C5C1B4] font-mono"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-[11.5px] font-medium text-[#111111] mb-1">Display Name</label>
                <input
                  type="text"
                  value={vName}
                  onChange={(e) => {
                    setVName(e.target.value)
                    setVDirty(true)
                  }}
                  className="w-full h-9 px-3 rounded-[8px] border border-[#C5C1B4]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-[#111111] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={vDesc}
                  onChange={(e) => {
                    setVDesc(e.target.value)
                    setVDirty(true)
                  }}
                  className="w-full p-2.5 rounded-[8px] border border-[#C5C1B4]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[#111111] mb-1">Default Route</label>
                  <select
                    value={vRoute}
                    onChange={(e) => {
                      setVRoute(e.target.value)
                      setVDirty(true)
                    }}
                    className="w-full h-9 px-2.5 rounded-[8px] border border-[#C5C1B4] font-mono"
                  >
                    <option value="no_change">no_change</option>
                    <option value="faculty_review">faculty_review</option>
                    <option value="auto_apply">auto_apply</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 pt-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vActive}
                    onChange={(e) => {
                      setVActive(e.target.checked)
                      setVDirty(true)
                    }}
                  />
                  <span className="font-medium text-[#111111]">Verdict Active</span>
                </label>
              </div>

              <div>
                <label className="block text-[11.5px] text-[#666666] mb-1">Change Reason (Audit Log)</label>
                <input
                  type="text"
                  value={vReason}
                  onChange={(e) => setVReason(e.target.value)}
                  placeholder="Optional reason..."
                  className="w-full h-9 px-3 rounded-[8px] bg-[#F9F8F3] border border-[#DFDBD0]"
                />
              </div>

              {vFormError && (
                <div className="p-2.5 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[12px] text-[#B91C1C]">
                  {vFormError}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVerdictModalOpen(false)}
                  className="h-9 px-3.5 rounded-[8px] bg-white border border-[#C5C1B4] text-[#111111] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-9 px-4 rounded-[8px] bg-[#0B0F12] text-white font-medium cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          COMPACT REPAIR TYPE EDIT / ADD MODAL
      ===================================================================== */}
      {repairModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0B0F12]/25 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => (!rDirty || window.confirm("Discard unsaved repair changes?")) && setRepairModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-3.5 bg-[#F9F8F3] border-b border-[#E5E2D9] flex items-center justify-between">
              <h3 className="font-display text-[17px] font-[425] text-[#111111]">
                {repairMode === "add" ? "Add Repair Type" : `Edit Repair Type · ${rId}`}
              </h3>
              <button
                type="button"
                onClick={() => setRepairModalOpen(false)}
                className="p-1 rounded-[6px] text-[#666666] hover:text-[#111111] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRepair} className="p-5 space-y-3.5 text-[12.5px]">
              {repairMode === "add" && (
                <div>
                  <label className="block text-[11.5px] font-medium text-[#111111] mb-1">Identifier (snake_case)</label>
                  <input
                    type="text"
                    value={rId}
                    onChange={(e) => {
                      setRId(e.target.value)
                      setRDirty(true)
                    }}
                    placeholder="e.g. unit_clarification"
                    className="w-full h-9 px-3 rounded-[8px] border border-[#C5C1B4] font-mono"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-[11.5px] font-medium text-[#111111] mb-1">Display Name</label>
                <input
                  type="text"
                  value={rName}
                  onChange={(e) => {
                    setRName(e.target.value)
                    setRDirty(true)
                  }}
                  className="w-full h-9 px-3 rounded-[8px] border border-[#C5C1B4]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-[#111111] mb-1">Rule Description</label>
                <textarea
                  rows={2}
                  value={rLabel}
                  onChange={(e) => {
                    setRLabel(e.target.value)
                    setRDirty(true)
                  }}
                  className="w-full p-2.5 rounded-[8px] border border-[#C5C1B4]"
                  required
                />
              </div>

              {/* Permitted Question Fields Checkboxes */}
              <div className="space-y-1.5">
                <label className="block text-[11.5px] font-medium text-[#111111]">
                  Permitted Question Fields (Question Schema Scope)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableFields.map((fld) => (
                    <label
                      key={fld}
                      className="flex items-center gap-2 p-2 rounded-[8px] bg-[#F9F8F3] border border-[#DFDBD0] cursor-pointer font-mono text-[11.5px]"
                    >
                      <input
                        type="checkbox"
                        checked={rFields.includes(fld)}
                        onChange={() => toggleRepairField(fld)}
                      />
                      <span>{fld}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rAuto}
                    onChange={(e) => {
                      setRAuto(e.target.checked)
                      setRDirty(true)
                    }}
                  />
                  <span className="font-medium text-[#111111]">Eligible for Auto-Apply</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rActive}
                    onChange={(e) => {
                      setRActive(e.target.checked)
                      setRDirty(true)
                    }}
                  />
                  <span className="font-medium text-[#111111]">Repair Type Active</span>
                </label>
              </div>

              {/* Explicit Confirmation Gate when Promoting auto: false -> true */}
              {((!rOrigAuto && rAuto) || (repairMode === "add" && rAuto)) && (
                <div className="p-3 rounded-[10px] bg-[#FFFBEB] border border-[#FDE68A] text-[12px] text-[#92400E] space-y-2">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Safety Escalation: Enabling Auto-Apply</span>
                  </div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rConfirmAutoPromo}
                      onChange={(e) => setRConfirmAutoPromo(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>I confirm allowing automated execution within checked fields subject to confidence ≥ {confFloor}%.</span>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-[11.5px] text-[#666666] mb-1">Change Reason (Audit Log)</label>
                <input
                  type="text"
                  value={rReason}
                  onChange={(e) => setRReason(e.target.value)}
                  placeholder="Optional reason..."
                  className="w-full h-9 px-3 rounded-[8px] bg-[#F9F8F3] border border-[#DFDBD0]"
                />
              </div>

              {rFormError && (
                <div className="p-2.5 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[12px] text-[#B91C1C]">
                  {rFormError}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRepairModalOpen(false)}
                  className="h-9 px-3.5 rounded-[8px] bg-white border border-[#C5C1B4] text-[#111111] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-9 px-4 rounded-[8px] bg-[#0B0F12] text-white font-medium cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          SAFE VERSION ROLLBACK CONFIRMATION MODAL
      ===================================================================== */}
      {rollbackTarget !== null && (
        <div
          className="fixed inset-0 z-50 bg-[#0B0F12]/25 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setRollbackTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] shadow-2xl p-5 space-y-4 text-[13px]"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#111111] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-display text-[17px] font-[425] text-[#111111]">
                  Restore Taxonomy v{rollbackTarget}?
                </h3>
                <p className="text-[12px] text-[#555555]">
                  This will create a <strong>new sequential version (v{(config?.version ?? 1) + 1})</strong> matching v{rollbackTarget} without deleting any history or altering evaluated investigations.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRollbackTarget(null)}
                className="h-9 px-3.5 rounded-[8px] bg-white border border-[#C5C1B4] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmRollback}
                className="h-9 px-4 rounded-[8px] bg-[#0B0F12] text-white font-medium cursor-pointer disabled:opacity-50"
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
