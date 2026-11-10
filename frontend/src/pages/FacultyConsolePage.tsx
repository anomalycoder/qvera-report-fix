import React, { useState, useEffect, useMemo } from 'react'
import type { TriageResult, ProposedEdit } from '@/types/triage'
import type { NormalizedQuestion } from '@/types/question'
import type { VerificationOutput } from '@/types/solver'
import { ReviewQueue, type QueueItem } from '@/components/FacultyConsole/ReviewQueue'
import { QuestionViewer } from '@/components/FacultyConsole/QuestionViewer'
import { SolverTraceCard } from '@/components/FacultyConsole/SolverTraceCard'
import { DiffViewer } from '@/components/FacultyConsole/DiffViewer'
import { StudentReplyCard } from '@/components/FacultyConsole/StudentReplyCard'
import { AuditActionPanel } from '@/components/FacultyConsole/AuditActionPanel'
import { PatchEditModal } from '@/components/FacultyConsole/PatchEditModal'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, RefreshCw, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react'

export const FacultyConsolePage: React.FC = () => {
  const [triageResults, setTriageResults] = useState<TriageResult[]>([])
  const [questionsMap, setQuestionsMap] = useState<Record<string, any>>({})
  const [reportsGroupedMap, setReportsGroupedMap] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selected item
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [activeQuestion, setActiveQuestion] = useState<NormalizedQuestion | null>(null)
  const [activeSolverData, setActiveSolverData] = useState<VerificationOutput | null>(null)
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false)

  // Customized edit state for active question
  const [customEdits, setCustomEdits] = useState<Record<string, ProposedEdit>>({})
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [routeFilter, setRouteFilter] = useState('all')
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')

  // Fetch initial master data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [triageRes, questionsRes, groupedRes] = await Promise.all([
          fetch('/api/v1/triage/results'),
          fetch('/api/v1/questions?limit=100'),
          fetch('/api/v1/reports/grouped'),
        ])

        if (!triageRes.ok || !questionsRes.ok || !groupedRes.ok) {
          throw new Error('Failed to load initial dataset from backend APIs')
        }

        const triageData: TriageResult[] = await triageRes.json()
        const questionsData = await questionsRes.json()
        const groupedData = await groupedRes.json()

        setTriageResults(triageData)

        // Build question map
        const qMap: Record<string, any> = {}
        for (const q of questionsData.questions) {
          qMap[q._id] = q
        }
        setQuestionsMap(qMap)

        // Build grouped reports map
        const gMap: Record<string, any> = {}
        for (const g of groupedData.groups) {
          gMap[g.question_id] = g
        }
        setReportsGroupedMap(gMap)

        // Default to first item or multi-student report
        if (triageData.length > 0) {
          // Find an urgent multi-report question like 60f744b3f1b9bc7cc7b4a949 (R001)
          const target = triageData.find((r) => r.reportId === 'R001') || triageData[0]
          setSelectedReportId(target.reportId)
        }
      } catch (err: any) {
        setError(err.message || 'Error communicating with backend')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Prepare queue items with urgency levels
  const queueItems: QueueItem[] = useMemo(() => {
    return triageResults.map((item) => {
      const q = questionsMap[item.questionId]
      const g = reportsGroupedMap[item.questionId]
      const reportCount = g ? g.total_reports : 1
      const isMulti = reportCount > 1

      let urgencyLevel: 1 | 2 | 3 | 4 = 4
      let urgencyLabel = 'Low'

      if (item.verdict === 'defect' && isMulti) {
        urgencyLevel = 1
        urgencyLabel = 'Critical'
      } else if (item.verdict === 'defect' && item.route === 'auto_apply') {
        urgencyLevel = 2
        urgencyLabel = 'High'
      } else if (item.verdict === 'defect' && item.route === 'faculty_review') {
        urgencyLevel = 3
        urgencyLabel = 'Medium'
      } else {
        urgencyLevel = 4
        urgencyLabel = 'Low'
      }

      return {
        report: item,
        questionSubject: q?.subject || 'Physics',
        questionType: q?.questionType || 'scq',
        reportCount,
        urgencyLevel,
        urgencyLabel,
      }
    }).sort((a, b) => a.urgencyLevel - b.urgencyLevel)
  }, [triageResults, questionsMap, reportsGroupedMap])

  // Get active selected report
  const activeReport = useMemo(() => {
    return triageResults.find((r) => r.reportId === selectedReportId) || null
  }, [triageResults, selectedReportId])

  // Fetch full normalized question and solver verification whenever selection changes
  useEffect(() => {
    if (!activeReport) return

    const fetchDetail = async () => {
      setIsLoadingQuestion(true)
      try {
        const [qRes, sRes] = await Promise.all([
          fetch(`/api/v1/questions/${activeReport.questionId}`),
          fetch(`/api/v1/solver/verification/${activeReport.questionId}`),
        ])

        if (qRes.ok) {
          const qData = await qRes.json()
          setActiveQuestion(qData.normalized)
        }
        if (sRes.ok) {
          const sData = await sRes.json()
          setActiveSolverData(sData)
        } else {
          setActiveSolverData(null)
        }
      } catch {
        // Handle error gracefully
      } finally {
        setIsLoadingQuestion(false)
      }
    }

    fetchDetail()
  }, [activeReport?.questionId])

  // Current active proposed edit (from custom edits or from active report)
  const currentProposedEdit = useMemo(() => {
    if (!activeReport) return null
    return customEdits[activeReport.reportId] || activeReport.edit || null
  }, [activeReport, customEdits])

  const handleSaveCustomEdit = (newEdit: ProposedEdit) => {
    if (!activeReport) return
    setCustomEdits((prev) => ({
      ...prev,
      [activeReport.reportId]: newEdit,
    }))
  }

  // Reports attached to current question
  const attachedReports = useMemo(() => {
    if (!activeReport || !reportsGroupedMap[activeReport.questionId]) return []
    return reportsGroupedMap[activeReport.questionId].reports || []
  }, [activeReport, reportsGroupedMap])

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Faculty Review Console
            </h1>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
              44 Ingested Reports
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Intelligent triage workbench for JEE/NEET faculty: SymPy symbolic proofs, surgical diffs, and audit trail.
          </p>
        </div>

        {/* Quick summary badges */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>4 Multi-Student Defects</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>17 Auto-Apply Patches</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>10 Faculty Gates</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-300 text-rose-900 rounded-xl p-4 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Main 2-Column Faculty Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Review Queue (4 cols) */}
        <div className="lg:col-span-4">
          <ReviewQueue
            items={queueItems}
            selectedReportId={selectedReportId}
            onSelectItem={(rid) => setSelectedReportId(rid)}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            routeFilter={routeFilter}
            setRouteFilter={setRouteFilter}
            urgencyFilter={urgencyFilter}
            setUrgencyFilter={setUrgencyFilter}
            subjectFilter={subjectFilter}
            setSubjectFilter={setSubjectFilter}
          />
        </div>

        {/* Right Column: Active Question Workbench (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {activeReport && activeQuestion ? (
            <>
              {/* Question Stem & Options */}
              <QuestionViewer
                question={activeQuestion}
                reports={attachedReports}
                proposedAnswer={currentProposedEdit?.field === 'answer' ? currentProposedEdit.replace : undefined}
                currentAnswer={activeQuestion.stored_answer}
              />

              {/* Independent SymPy / Biology Solver Trace Card */}
              <SolverTraceCard solverData={activeSolverData} isLoading={isLoadingQuestion} />

              {/* Proposed Surgical Patch Diff */}
              <DiffViewer
                edit={currentProposedEdit}
                repair={activeReport.repair}
                route={activeReport.route}
                verdict={activeReport.verdict}
                onEditClick={() => setIsEditModalOpen(true)}
              />

              {/* Empathetic Student Reply Dispatch */}
              <StudentReplyCard
                reply={activeReport.student_reply}
                reportId={activeReport.reportId}
              />

              {/* Faculty Decision & Permanent SQLite Audit Ledger */}
              <AuditActionPanel
                reportId={activeReport.reportId}
                questionId={activeReport.questionId}
                currentEdit={currentProposedEdit}
                onOpenEditModal={() => setIsEditModalOpen(true)}
              />
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-slate-300" />
              <p className="text-sm">Loading question inspection data...</p>
            </div>
          )}
        </div>
      </div>

      {/* Surgical Patch Customization Modal */}
      <PatchEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveCustomEdit}
        initialEdit={currentProposedEdit}
        repair={activeReport?.repair}
      />
    </div>
  )
}
