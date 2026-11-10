import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  HelpCircle, 
  Layers, 
  Smartphone, 
  Globe, 
  Apple, 
  AlertTriangle,
  FileCheck2,
  Users
} from 'lucide-react'
import type { DatasetStatisticsResponse } from '@/types/dataset'

export const DatasetStatsCard: React.FC = () => {
  const [stats, setStats] = useState<DatasetStatisticsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/dataset/statistics')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStats(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || !stats) {
    return (
      <Card className="p-6 text-center text-sm text-slate-500">
        Loading dataset analytics...
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 4 Key Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Questions</span>
            <HelpCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{stats.total_questions}</div>
          <div className="text-xs text-slate-500 mt-1">JEE / NEET question bank</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Student Reports</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{stats.total_reports}</div>
          <div className="text-xs text-slate-500 mt-1">Covering {stats.distinct_reported_questions} distinct questions</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Duplicate Reports</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{stats.questions_with_duplicate_reports}</div>
          <div className="text-xs text-slate-500 mt-1">Questions reported &gt;1 time</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Unreported Questions</span>
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{stats.unreported_questions}</div>
          <div className="text-xs text-slate-500 mt-1">Candidate pool for silent defects</div>
        </Card>
      </div>

      {/* Distribution Grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Question Type Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Question Types</span>
              <Badge variant="outline" className="text-[10px]">Production Format</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {Object.entries(stats.question_type_distribution).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                <span className="font-mono text-slate-700">{type}</span>
                <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {count} ({Math.round((count / stats.total_questions) * 100)}%)
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Subject Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Subject Breakdown</span>
              <Badge variant="outline" className="text-[10px]">JEE / NEET</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {Object.entries(stats.subject_distribution).map(([subj, count]) => (
              <div key={subj} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                <span className="text-slate-700">{subj}</span>
                <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {count}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Report Source Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Reporting Platforms</span>
              <Badge variant="outline" className="text-[10px]">Student Client</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {Object.entries(stats.report_source_distribution).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                <span className="capitalize text-slate-700 flex items-center gap-1.5">
                  {source === 'android' && <Smartphone className="w-3.5 h-3.5 text-emerald-600" />}
                  {source === 'ios' && <Apple className="w-3.5 h-3.5 text-slate-700" />}
                  {source === 'web' && <Globe className="w-3.5 h-3.5 text-blue-600" />}
                  {source}
                </span>
                <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {count} ({Math.round((count / stats.total_reports) * 100)}%)
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Dataset Health Anomalies Banner */}
      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Parser Intelligence:</strong> Exactly 1 SCQ question has missing option D (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono">622f08d7b70e4b50e4500a1b</code>). 1 question has a raw LaTeX leak (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono">63765a28f1d8416ae0408d89</code>).
          </span>
        </div>
        <Badge variant="warning" className="shrink-0 ml-2">Validated</Badge>
      </div>
    </div>
  )
}
