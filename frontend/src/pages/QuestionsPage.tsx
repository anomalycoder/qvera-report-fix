import React, { useState, useEffect } from "react"
import {
  Search,
  BookOpen,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  AlertCircle
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

interface QuestionsPageProps {
  onInspectQuestionReports: (reportId: string) => void
}

export const QuestionsPage: React.FC<QuestionsPageProps> = ({
  onInspectQuestionReports,
}) => {
  const [questions, setQuestions] = useState<any[]>([])
  const [reportsGrouped, setReportsGrouped] = useState<Record<string, any>>({})
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [subject, setSubject] = useState("all")
  const [qType, setQType] = useState("all")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Selected question modal
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null)

  const fetchQuestions = async () => {
    setIsLoading(true)
    try {
      const [qRes, gRes] = await Promise.all([
        fetch(`/api/v1/questions?limit=100${subject !== "all" ? `&subject=${subject}` : ""}${qType !== "all" ? `&question_type=${qType}` : ""}`),
        fetch("/api/v1/reports/grouped"),
      ])

      if (qRes.ok) {
        const qJson = await qRes.json()
        setQuestions(qJson.questions || [])
        setTotal(qJson.total || 0)
      }
      if (gRes.ok) {
        const gJson = await gRes.json()
        const gMap: Record<string, any> = {}
        for (const g of gJson.groups || []) {
          gMap[g.question_id] = g
        }
        setReportsGrouped(gMap)
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [subject, qType])

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredQuestions = questions.filter((q) => {
    if (!search) return true
    const term = search.toLowerCase()
    const text = (q.question || "").replace(/<[^>]+>/g, "").toLowerCase()
    const id = q._id.toLowerCase()
    const ch = (q.chapter || "").toLowerCase()
    return text.includes(term) || id.includes(term) || ch.includes(term)
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">Questions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Repository of all 43 production questions with associated error report links.
          </p>
        </div>
        <div className="text-xs text-slate-500">
          Total: <span className="font-semibold text-slate-800">{filteredQuestions.length}</span> questions
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-2.5 shadow-2xs flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by topic, chapter, or question ID..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md pl-8 pr-2.5 py-1 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 font-medium focus:outline-none"
        >
          <option value="all">All Subjects</option>
          <option value="Physics">Physics</option>
          <option value="Zoology">Zoology</option>
          <option value="Botany">Botany</option>
        </select>

        <select
          value={qType}
          onChange={(e) => setQType(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 font-medium focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="scq">Single Choice (SCQ)</option>
          <option value="integerQuestion">Integer</option>
          <option value="mcq">Multiple Choice (MCQ)</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200/90 rounded-lg shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[18%]">Question ID</TableHead>
              <TableHead className="w-[16%]">Subject</TableHead>
              <TableHead className="w-[26%]">Chapter / Concept</TableHead>
              <TableHead className="w-[14%]">Type</TableHead>
              <TableHead className="w-[14%]">Status</TableHead>
              <TableHead className="w-[12%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-7 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredQuestions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-xs text-slate-400">
                  No questions match your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredQuestions.map((q) => {
                const group = reportsGrouped[q._id]
                const reportCount = group ? group.total_reports : 0
                const firstReportId = group?.reports?.[0]?.reportId

                return (
                  <TableRow
                    key={q._id}
                    className="hover:bg-slate-50/80 cursor-pointer"
                    onClick={() => setSelectedQuestion(q)}
                  >
                    {/* ID */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700">
                        <span>{q._id.slice(0, 10)}...</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(q._id)
                          }}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                          title="Copy ID"
                        >
                          {copiedId === q._id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </TableCell>

                    {/* Subject */}
                    <TableCell className="text-xs font-medium text-slate-900">
                      {q.subject}
                    </TableCell>

                    {/* Chapter */}
                    <TableCell className="text-xs text-slate-600">
                      <div className="truncate max-w-xs">{q.chapter || "—"}</div>
                      {q.concept && (
                        <div className="text-[10px] text-slate-400 truncate">{q.concept}</div>
                      )}
                    </TableCell>

                    {/* Type */}
                    <TableCell className="text-xs">
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {q.questionType}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {reportCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {reportCount} {reportCount === 1 ? "report" : "reports"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                          Unflagged
                        </span>
                      )}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      {firstReportId ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            onInspectQuestionReports(firstReportId)
                          }}
                          className="h-7 text-xs text-blue-600 hover:text-blue-800"
                        >
                          Inspect Report
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedQuestion(q)
                          }}
                          className="h-7 text-xs text-slate-500 hover:text-slate-800"
                        >
                          Preview
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Question Inspection Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-lg border border-slate-200 p-5 max-w-2xl w-full shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedQuestion.subject}</Badge>
                  <span className="text-xs font-semibold text-slate-900 font-mono">
                    #{selectedQuestion._id}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {selectedQuestion.chapter} &bull; Type: {selectedQuestion.questionType}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedQuestion(null)}
                className="h-7 w-7 p-0"
              >
                &times;
              </Button>
            </div>

            {/* Stem content */}
            <div className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                Question Stem
              </span>
              <div
                className="text-xs text-slate-800 leading-relaxed p-3 bg-slate-50 rounded border border-slate-200"
                dangerouslySetInnerHTML={{ __html: selectedQuestion.question }}
              />
            </div>

            {/* Stored answer */}
            <div className="flex items-center gap-3 text-xs p-2.5 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500">Stored Answer Key:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {selectedQuestion.answer || "N/A"}
              </span>
            </div>

            {/* Existing solution */}
            {selectedQuestion.solution && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Original Solution
                </span>
                <div
                  className="text-xs text-slate-600 leading-relaxed p-3 bg-slate-50 rounded border border-slate-200 max-h-40 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: selectedQuestion.solution }}
                />
              </div>
            )}

            <div className="pt-2 flex justify-between items-center">
              {reportsGrouped[selectedQuestion._id]?.reports?.[0]?.reportId ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    const rid = reportsGrouped[selectedQuestion._id].reports[0].reportId
                    setSelectedQuestion(null)
                    onInspectQuestionReports(rid)
                  }}
                >
                  Open in Review Workspace
                </Button>
              ) : (
                <span className="text-[11px] text-slate-400">No student reports filed for this question.</span>
              )}
              <Button size="sm" variant="outline" onClick={() => setSelectedQuestion(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
