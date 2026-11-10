import React, { useState, useEffect } from "react"
import {
  Search,
  BookOpen,
  Filter,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  X
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
        fetch(
          `/api/v1/questions?limit=100${subject !== "all" ? `&subject=${subject}` : ""}${
            qType !== "all" ? `&question_type=${qType}` : ""
          }`
        ),
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
    const id = (q._id || "").toLowerCase()
    const ch = (q.chapter || "").toLowerCase()
    return text.includes(term) || id.includes(term) || ch.includes(term)
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
              Questions Repository
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
              {filteredQuestions.length} Items
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Searchable index of all 43 production questions with associated error report links and mathematical markup.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-3.5 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topic, chapter, question ID..."
            className="w-full text-sm bg-slate-50 border border-[#E5E7EB] rounded-md pl-9 pr-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-blue-600 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="text-sm bg-slate-50 border border-[#E5E7EB] rounded-md px-3 py-1.5 text-slate-800 font-medium focus:outline-none focus:border-blue-600"
        >
          <option value="all">All Subjects</option>
          <option value="Physics">Physics</option>
          <option value="Zoology">Zoology</option>
          <option value="Botany">Botany</option>
        </select>

        <select
          value={qType}
          onChange={(e) => setQType(e.target.value)}
          className="text-sm bg-slate-50 border border-[#E5E7EB] rounded-md px-3 py-1.5 text-slate-800 font-medium focus:outline-none focus:border-blue-600"
        >
          <option value="all">All Types</option>
          <option value="scq">Single Choice (SCQ)</option>
          <option value="integerQuestion">Integer</option>
          <option value="mcq">Multiple Choice (MCQ)</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#E5E7EB] bg-slate-50/70">
              <TableHead className="w-[18%]">Question ID</TableHead>
              <TableHead className="w-[16%]">Subject</TableHead>
              <TableHead className="w-[28%]">Chapter / Concept</TableHead>
              <TableHead className="w-[12%]">Type</TableHead>
              <TableHead className="w-[14%]">Status</TableHead>
              <TableHead className="w-[12%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredQuestions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-36 text-center text-sm text-slate-400">
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
                    className="hover:bg-slate-50 cursor-pointer border-b border-[#E5E7EB]"
                    onClick={() => setSelectedQuestion(q)}
                  >
                    {/* ID */}
                    <TableCell>
                      <div className="flex items-center gap-2 font-mono text-xs text-slate-700">
                        <span className="font-bold text-[#111827]">#{q._id.slice(0, 10)}...</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(q._id)
                          }}
                          className="text-slate-400 hover:text-slate-700 p-0.5"
                          title="Copy Full ID"
                        >
                          {copiedId === q._id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </TableCell>

                    {/* Subject */}
                    <TableCell className="text-sm font-semibold text-[#111827]">
                      {q.subject}
                    </TableCell>

                    {/* Chapter */}
                    <TableCell className="text-sm text-slate-600">
                      <div className="truncate max-w-xs font-semibold text-slate-900">{q.chapter || "—"}</div>
                      {q.concept && (
                        <div className="text-xs text-slate-500 truncate">{q.concept}</div>
                      )}
                    </TableCell>

                    {/* Type */}
                    <TableCell className="text-xs">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-[#E5E7EB]">
                        {q.questionType}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {reportCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                          {reportCount} {reportCount === 1 ? "report" : "reports"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded border border-[#E5E7EB]">
                          Unflagged
                        </span>
                      )}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      {firstReportId ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            onInspectQuestionReports(firstReportId)
                          }}
                          className="h-8 text-xs text-blue-600 border-[#E5E7EB] hover:bg-blue-50 font-semibold"
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
                          className="h-8 text-xs text-slate-600 hover:text-slate-900 font-medium"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <Badge variant="outline" className="text-xs font-bold">{selectedQuestion.subject}</Badge>
                  <span className="text-sm font-bold text-[#111827] font-mono">
                    #{selectedQuestion._id}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {selectedQuestion.chapter} &bull; Type: <strong className="text-slate-700">{selectedQuestion.questionType}</strong>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedQuestion(null)}
                className="h-8 w-8 p-0"
              >
                &times;
              </Button>
            </div>

            {/* Stem content */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Question Stem
              </span>
              <div
                className="text-sm sm:text-base text-slate-900 leading-relaxed p-4 bg-slate-50 rounded-lg border border-[#E5E7EB]"
                dangerouslySetInnerHTML={{ __html: selectedQuestion.question }}
              />
            </div>

            {/* Stored answer */}
            <div className="flex items-center gap-3 text-sm p-3.5 bg-slate-50 rounded-lg border border-[#E5E7EB]">
              <span className="text-slate-600 font-medium">Stored Platform Answer Key:</span>
              <span className="font-mono font-extrabold text-[#111827] text-base">
                {selectedQuestion.answer || "N/A"}
              </span>
            </div>

            {/* Existing solution */}
            {selectedQuestion.solution && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Original Solution
                </span>
                <div
                  className="text-sm text-slate-800 leading-relaxed p-4 bg-slate-50 rounded-lg border border-[#E5E7EB] max-h-48 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: selectedQuestion.solution }}
                />
              </div>
            )}

            <div className="pt-3 flex justify-between items-center border-t border-slate-100">
              {reportsGrouped[selectedQuestion._id]?.reports?.[0]?.reportId ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    const rid = reportsGrouped[selectedQuestion._id].reports[0].reportId
                    setSelectedQuestion(null)
                    onInspectQuestionReports(rid)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9"
                >
                  Open in Review Workspace
                </Button>
              ) : (
                <span className="text-xs text-slate-400">No student reports filed for this question.</span>
              )}
              <Button size="sm" variant="outline" onClick={() => setSelectedQuestion(null)} className="h-9">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
