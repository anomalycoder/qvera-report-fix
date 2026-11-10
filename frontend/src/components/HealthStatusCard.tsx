import React from 'react'
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Database, 
  Server, 
  FileText, 
  Clock,
  Activity
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useHealthCheck } from '@/hooks/useHealthCheck'

export const HealthStatusCard: React.FC = () => {
  const { data, loading, error, latencyMs, refetch } = useHealthCheck(15000)

  const isConnected = !!data && !error && data.status !== 'unhealthy'

  return (
    <Card className="w-full border-slate-200/80 shadow-sm bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Backend Connectivity & Infrastructure Status
          </CardTitle>
          <CardDescription>
            Real-time health check linking React + Vite frontend to FastAPI backend & SQLite
          </CardDescription>
        </div>
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          Check Now
        </button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Status Banner */}
        <div className={`p-4 rounded-xl flex items-center justify-between border ${
          isConnected
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : 'bg-red-50/70 border-red-200 text-red-900'
        }`}>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <XCircle className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="font-semibold text-base">
                {isConnected ? 'API Connected & Responding' : 'Backend Disconnected'}
              </div>
              <div className="text-xs text-slate-600">
                {isConnected
                  ? `Service: ${data?.service} (v${data?.version})`
                  : error || 'FastAPI server not reachable at /api/v1/health'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {latencyMs !== null && (
              <Badge variant="outline" className="bg-white/80 font-mono text-[11px] flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {latencyMs}ms
              </Badge>
            )}
            <Badge variant={isConnected ? 'success' : 'destructive'}>
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </Badge>
          </div>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* SQLite Card */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4 text-slate-600" />
                SQLite Engine
              </span>
              <Badge variant={data?.database === 'connected' ? 'success' : 'outline'} className="text-[10px]">
                {data?.database || 'Unknown'}
              </Badge>
            </div>
            <div className="text-sm font-medium text-slate-800">
              acadza.db
            </div>
            <div className="text-xs text-slate-500 mt-1">
              WAL Journal Mode enabled with audit logs table
            </div>
          </div>

          {/* FastAPI Card */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-4 h-4 text-slate-600" />
                FastAPI Host
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {data?.environment || 'development'}
              </Badge>
            </div>
            <div className="text-sm font-medium text-slate-800">
              http://127.0.0.1:8000
            </div>
            <div className="text-xs text-slate-500 mt-1">
              CORS enabled for localhost:5173
            </div>
          </div>

          {/* Data Files Card */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-600" />
                Original Data Files
              </span>
              <Badge
                variant={
                  data?.data_files?.questions_json &&
                  data?.data_files?.reports_json &&
                  data?.data_files?.taxonomy_json
                    ? 'success'
                    : 'warning'
                }
                className="text-[10px]"
              >
                {data?.data_files ? '3 / 3 Mounted' : 'Pending'}
              </Badge>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-mono">questions.json</span>
                <span className={data?.data_files?.questions_json ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                  {data?.data_files?.questions_json ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-mono">reports.json</span>
                <span className={data?.data_files?.reports_json ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                  {data?.data_files?.reports_json ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-mono">taxonomy.json</span>
                <span className={data?.data_files?.taxonomy_json ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                  {data?.data_files?.taxonomy_json ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
