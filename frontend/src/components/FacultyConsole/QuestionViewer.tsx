import React, { useState } from 'react'
import type { NormalizedQuestion } from '@/types/question'
import { Badge } from '@/components/ui/badge'
import { 
  HelpCircle, 
  Layers, 
  ImageOff, 
  AlertOctagon, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Smartphone, 
  Globe, 
  Check, 
  Copy 
} from 'lucide-react'

interface QuestionViewerProps {
  question: NormalizedQuestion
  reports?: any[]
  proposedAnswer?: any
  currentAnswer?: any
}

export const QuestionViewer: React.FC<QuestionViewerProps> = ({
  question,
  reports = [],
  proposedAnswer,
  currentAnswer,
}) => {
  const [showSolution, setShowSolution] = useState(false)
  const [copiedId, setCopiedId] = useState(false)

  const handleCopyId = () => {
    navigator.clipboard.writeText(question.question_id)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const effectiveStoredAnswer = currentAnswer ?? question.stored_answer

  const isOptionCurrentAnswer = (optKey: string) => {
    if (Array.isArray(effectiveStoredAnswer)) {
      return effectiveStoredAnswer.includes(optKey)
    }
    return String(effectiveStoredAnswer).trim().toUpperCase() === optKey.toUpperCase()
  }

  const isOptionProposedAnswer = (optKey: string) => {
    if (!proposedAnswer) return false
    if (Array.isArray(proposedAnswer)) {
      return proposedAnswer.includes(optKey)
    }
    return String(proposedAnswer).trim().toUpperCase() === optKey.toUpperCase()
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden space-y-4 p-5">
      {/* Top Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-blue-600 text-white font-bold text-xs uppercase tracking-wider">
            {question.subject || 'General'}
          </Badge>
          <Badge className="bg-slate-100 text-slate-800 border-slate-300 font-mono text-xs">
            {question.question_type}
          </Badge>
          {question.chapter && (
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
              {question.chapter}
            </Badge>
          )}
          {question.difficulty && (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs capitalize">
              {question.difficulty}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyId}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs transition"
            title="Click to copy ID"
          >
            {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>ID: {question.question_id.substring(0, 10)}...</span>
          </button>
        </div>
      </div>

      {/* Warning Banners */}
      {question.has_missing_figure_signal && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900 text-xs flex items-start gap-2.5">
          <ImageOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Missing Diagram Signal:</strong> The question text refers to an illustration or figure, but 
            no diagram image was uploaded (<code className="font-mono">quesImages: []</code>).
          </div>
        </div>
      )}

      {question.missing_options && question.missing_options.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-900 text-xs flex items-start gap-2.5">
          <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong>Missing Options Detected:</strong> Expected standard choices but option(s){' '}
            <strong>{question.missing_options.join(', ')}</strong> were absent from the HTML.
          </div>
        </div>
      )}

      {question.markup_warnings && question.markup_warnings.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-purple-900 text-xs flex items-start gap-2.5">
          <AlertOctagon className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <strong>Markup Warning:</strong> Raw LaTeX or unrendered math detected:{' '}
            <span className="font-mono">{question.markup_warnings.join('; ')}</span>.
          </div>
        </div>
      )}

      {/* Question Stem HTML */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
          Question Stem (Rendered with MathML)
        </span>
        <div
          className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 leading-relaxed overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: question.raw_question_html }}
        />
      </div>

      {/* Options Grid (for SCQ and MCQ) */}
      {question.question_type !== 'integerQuestion' && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Extracted Options & Answer Key Mapping
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {['A', 'B', 'C', 'D'].map((optKey) => {
              const opt = question.options?.[optKey]
              const isCurrent = isOptionCurrentAnswer(optKey)
              const isProposed = isOptionProposedAnswer(optKey)
              const isMissing = question.missing_options?.includes(optKey)
              const isBlank = opt?.is_blank

              let borderClass = 'border-slate-200 bg-white'
              if (isProposed && !isCurrent) {
                borderClass = 'border-emerald-400 bg-emerald-50/30 ring-1 ring-emerald-300'
              } else if (isCurrent && proposedAnswer && !isProposed) {
                borderClass = 'border-rose-300 bg-rose-50/30 line-through'
              } else if (isCurrent) {
                borderClass = 'border-blue-300 bg-blue-50/30 ring-1 ring-blue-200'
              } else if (isBlank || isMissing) {
                borderClass = 'border-amber-300 bg-amber-50/20'
              }

              return (
                <div key={optKey} className={`border rounded-lg p-3 space-y-1.5 transition ${borderClass}`}>
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                      ({optKey})
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {isCurrent && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px]">
                          Current Key
                        </Badge>
                      )}
                      {isProposed && !isCurrent && (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                          Proposed New Key
                        </Badge>
                      )}
                      {isBlank && (
                        <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px]">
                          Blank Option Content
                        </Badge>
                      )}
                      {isMissing && (
                        <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px]">
                          Missing Option
                        </Badge>
                      )}
                    </div>
                  </div>

                  {opt ? (
                    <div
                      className="text-xs text-slate-800 pt-1 overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: opt.raw_html || opt.text }}
                    />
                  ) : (
                    <div className="text-xs text-slate-400 italic pt-1">
                      (Option {optKey} not provided in source question)
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Integer Question Answer Display */}
      {question.question_type === 'integerQuestion' && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Integer Answer Key
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {String(effectiveStoredAnswer)}
            </div>
          </div>
          {proposedAnswer && proposedAnswer !== effectiveStoredAnswer && (
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                Proposed Correction
              </span>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                {String(proposedAnswer)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stored Solution Collapsible Accordion */}
      {question.raw_solution_html && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="w-full bg-slate-50 px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Current Stored Solution & Explanation</span>
            </div>
            {showSolution ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showSolution && (
            <div
              className="p-4 bg-white text-xs text-slate-800 leading-relaxed overflow-x-auto border-t border-slate-200"
              dangerouslySetInnerHTML={{ __html: question.raw_solution_html }}
            />
          )}
        </div>
      )}

      {/* Student Reports Cluster */}
      {reports && reports.length > 0 && (
        <div className="pt-3 border-t border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              Attached Student Reports ({reports.length})
            </span>
            {reports.length > 1 && (
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs font-semibold">
                Multi-Student Consensus Alert
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            {reports.map((rep: any) => (
              <div
                key={rep.reportId}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800">{rep.reportId}</span>
                    <Badge className="bg-slate-200/70 text-slate-700 border-slate-300 text-[10px] flex items-center gap-1">
                      {rep.source === 'android' || rep.source === 'ios' ? (
                        <Smartphone className="w-3 h-3" />
                      ) : (
                        <Globe className="w-3 h-3" />
                      )}
                      {rep.source}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {rep.createdAt ? rep.createdAt.substring(0, 10) : ''}
                  </span>
                </div>
                <div className="text-xs text-slate-700 font-medium bg-white/80 border border-slate-100 rounded p-2 italic">
                  &ldquo;{rep.comment}&rdquo;
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
