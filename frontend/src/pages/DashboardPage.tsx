import React from 'react'
import { HealthStatusCard } from '@/components/HealthStatusCard'
import { DatasetStatsCard } from '@/components/DatasetStatsCard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileCode2, 
  Workflow, 
  Cpu, 
  Sparkles, 
  CheckCircle,
  BarChart2
} from 'lucide-react'

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="max-w-3xl">
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 mb-3 text-xs uppercase tracking-wide">
            Prompt 02: Dataset Processing & Intelligence Foundation
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            QVERA "Report → Fix" Quality Assurance Platform
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            The intelligent pipeline between raw student error reports and surgical repairs for JEE/NEET questions.
            Ingesting and analyzing 43 production questions, 44 student reports, and closed repair taxonomies.
          </p>
        </div>
      </div>

      {/* Connectivity Check Component */}
      <HealthStatusCard />

      {/* Dataset Statistics and Intelligence Breakdown */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Dataset Analytics & Report Intelligence
          </h2>
        </div>
        <DatasetStatsCard />
      </section>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
              <FileCode2 className="w-5 h-5" />
            </div>
            <CardTitle className="text-base">Question Normalizer</CardTitle>
            <CardDescription className="text-xs">
              BeautifulSoup DOM + MathML parser
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 space-y-2">
            <p>
              Extracts stem text, options A-D, missing option markers, image references, and markup leaks without mutating raw HTML.
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-emerald-600 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Preserves inline MathML untouched
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mb-2">
              <Cpu className="w-5 h-5" />
            </div>
            <CardTitle className="text-base">Report Grouper</CardTitle>
            <CardDescription className="text-xs">
              Cluster by questionId + analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 space-y-2">
            <p>
              Aggregates student reports, computes independent reporter consensus, tracks source distribution, and preserves all report IDs.
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-purple-600 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              4 multi-reported questions flagged
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 mb-2">
              <Workflow className="w-5 h-5" />
            </div>
            <CardTitle className="text-base">Taxonomy Engine</CardTitle>
            <CardDescription className="text-xs">
              Closed list & scope enforcement
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 space-y-2">
            <p>
              Validates verdicts and repairs dynamically from <code>taxonomy.json</code>. Enforces field boundaries and gatekeeps auto-apply.
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-amber-600 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Field restriction rules active
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
