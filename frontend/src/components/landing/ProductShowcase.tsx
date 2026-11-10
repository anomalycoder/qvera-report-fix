import React, { useState } from "react"
import {
  BarChart3,
  ListFilter,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Check,
  SlidersHorizontal,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const ProductShowcase: React.FC<{ onNavigateToLogin: () => void }> = ({
  onNavigateToLogin,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "queue" | "review">("overview")

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/90 shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Browser chrome header */}
      <div className="bg-[#0B0F19] px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-slate-700" />
            <div className="w-3 h-3 rounded-full bg-slate-700" />
            <div className="w-3 h-3 rounded-full bg-slate-700" />
          </div>
          <span className="text-xs font-mono text-slate-400 pl-2">
            https://acadza.local/dashboard/{activeTab}
          </span>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "overview"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab("queue")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "queue"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Review Queue</span>
          </button>
          <button
            onClick={() => setActiveTab("review")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "review"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Question Review</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Overview Showcase */}
      {activeTab === "overview" && (
        <div className="p-6 sm:p-8 space-y-6 text-slate-200 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Total Student Reports</div>
              <div className="text-2xl font-bold text-white mt-1">44</div>
              <div className="text-[11px] text-blue-400 mt-1">JEE / NEET Ingestion</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Confirmed Defects</div>
              <div className="text-2xl font-bold text-rose-400 mt-1">27</div>
              <div className="text-[11px] text-rose-300 mt-1">Verified via SymPy Engine</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Pending Faculty Reviews</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">10</div>
              <div className="text-[11px] text-amber-300 mt-1">Awaiting Human Approval</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Auto-Applied Fixes</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">17</div>
              <div className="text-[11px] text-emerald-300 mt-1">High Confidence Typos</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Subject Composition</span>
                <span className="text-xs text-slate-400">Evaluation Dataset</span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Physics</span>
                    <span className="font-semibold text-slate-300">33 questions (75%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "75%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Zoology</span>
                    <span className="font-semibold text-slate-300">6 questions (14%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "14%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Botany</span>
                    <span className="font-semibold text-slate-300">4 questions (11%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: "11%" }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">System Governance & Health</span>
                <Badge variant="success" className="text-[11px]">Active</Badge>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded border border-slate-800">
                  <span>SQLite WAL Engine</span>
                  <span className="text-emerald-400 font-mono">WAL mode enabled</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded border border-slate-800">
                  <span>SymPy Math Engine</span>
                  <span className="text-blue-400 font-mono">100% Deterministic</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded border border-slate-800">
                  <span>Closed Taxonomy Policy</span>
                  <span className="text-purple-400 font-mono">7 Verdicts Enforced</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Review Queue Showcase */}
      {activeTab === "queue" && (
        <div className="p-6 sm:p-8 space-y-4 text-slate-200 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="text-sm font-bold text-white">Priority Faculty Review Queue</div>
              <div className="text-xs text-slate-400">10 reports requiring academic decision</div>
            </div>
            <Badge variant="primary" className="text-xs">Real-time Sync</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Report ID</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Urgency</th>
                  <th className="py-2.5 px-3">Verdict / Repair</th>
                  <th className="py-2.5 px-3">Student Comment Snippet</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr className="hover:bg-slate-900/50">
                  <td className="py-3 px-3 font-mono font-semibold text-white">#R001</td>
                  <td className="py-3 px-3">Physics</td>
                  <td className="py-3 px-3"><Badge variant="destructive">L1 Critical</Badge></td>
                  <td className="py-3 px-3 font-mono text-amber-300">answer_key</td>
                  <td className="py-3 px-3 max-w-xs truncate text-slate-400">
                    &quot;At resonance Z=R=50Ω, stored key gives 100Ω...&quot;
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-blue-400 font-semibold hover:underline cursor-pointer">
                      Inspect →
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-3 px-3 font-mono font-semibold text-white">#R004</td>
                  <td className="py-3 px-3">Physics</td>
                  <td className="py-3 px-3"><Badge variant="warning">L2 High</Badge></td>
                  <td className="py-3 px-3 font-mono text-amber-300">option_repair</td>
                  <td className="py-3 px-3 max-w-xs truncate text-slate-400">
                    &quot;Option D is completely blank in the question stem...&quot;
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-blue-400 font-semibold hover:underline cursor-pointer">
                      Inspect →
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-3 px-3 font-mono font-semibold text-white">#R002</td>
                  <td className="py-3 px-3">Physics</td>
                  <td className="py-3 px-3"><Badge variant="destructive">L1 Critical</Badge></td>
                  <td className="py-3 px-3 font-mono text-amber-300">answer_key</td>
                  <td className="py-3 px-3 max-w-xs truncate text-slate-400">
                    &quot;Electric flux through cube face is q/(6*eps0)...&quot;
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-blue-400 font-semibold hover:underline cursor-pointer">
                      Inspect →
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Question Review Showcase */}
      {activeTab === "review" && (
        <div className="p-6 sm:p-8 space-y-6 text-slate-200 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Question Stem & Options */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-blue-400 font-semibold">
                  Question ID: 67a3...8742 (JEE Main)
                </span>
                <Badge variant="outline" className="text-[11px] text-slate-300">Physics // AC</Badge>
              </div>
              <div className="text-xs font-medium text-slate-200 leading-relaxed bg-slate-950/50 p-3 rounded border border-slate-800">
                In a series LCR circuit, R = 50 Ω, X_L = 120 Ω, and X_C = 120 Ω. When connected to an AC source of 220V, 50 Hz, the total impedance of the circuit is:
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded border border-emerald-500/60 bg-emerald-950/30 flex items-center justify-between">
                  <span>(A) 50 Ω</span>
                  <Badge variant="success" className="text-[10px] py-0 px-1.5">Proposed</Badge>
                </div>
                <div className="p-2.5 rounded border border-rose-500/60 bg-rose-950/30 flex items-center justify-between">
                  <span>(B) 100 Ω</span>
                  <Badge variant="destructive" className="text-[10px] py-0 px-1.5 line-through">Stored Key</Badge>
                </div>
                <div className="p-2.5 rounded border border-slate-800 bg-slate-950/30 text-slate-400">
                  (C) 150 Ω
                </div>
                <div className="p-2.5 rounded border border-slate-800 bg-slate-950/30 text-slate-400">
                  (D) 240 Ω
                </div>
              </div>
            </div>

            {/* Right: SymPy Verification & Surgical Patch */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Mathematical Proof Trace</span>
                <Badge variant="success" className="text-[10px]">Verified Correct</Badge>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded text-xs font-mono text-slate-300 space-y-1">
                <div className="text-slate-400">// SymPy Symbolic AC Phasor Engine</div>
                <div>Z = sqrt(50**2 + (120 - 120)**2)</div>
                <div className="text-emerald-400 font-bold">⇒ Z = 50.0 Ω (Exact Match with Option A)</div>
              </div>

              {/* Surgical Diff */}
              <div className="border border-slate-800 rounded p-3 bg-slate-950/50 space-y-2">
                <div className="text-xs text-slate-400 font-mono">Surgical Patch // field: stored_answer</div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="line-through text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/60">
                    - &quot;B&quot;
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60 font-bold">
                    + &quot;A&quot;
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={onNavigateToLogin}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Approve in Console
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer bar of showcase */}
      <div className="bg-[#0B0F19] px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <span>Authentic interface powered by live FastAPI & SQLite WAL backend</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNavigateToLogin}
          className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs"
        >
          Sign in to Faculty Console →
        </Button>
      </div>
    </div>
  )
}
