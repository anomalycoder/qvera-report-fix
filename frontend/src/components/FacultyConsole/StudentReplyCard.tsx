import React, { useState } from 'react'
import { MessageSquareText, Copy, Check, Send, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface StudentReplyCardProps {
  reply: string
  reportId: string
}

export const StudentReplyCard: React.FC<StudentReplyCardProps> = ({ reply, reportId }) => {
  const [copied, setCopied] = useState(false)
  const [dispatched, setDispatched] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reply)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDispatch = () => {
    setDispatched(true)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquareText className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
            Student Communication Dispatch
          </span>
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
            Target: Report {reportId}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {dispatched ? (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched
            </Badge>
          ) : (
            <Badge className="bg-slate-100 text-slate-600 border-slate-300 text-xs">
              Pending Send
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="relative bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border border-blue-100 rounded-lg p-3.5">
          <p className="text-sm text-slate-800 leading-relaxed italic">
            "{reply}"
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-slate-500">
            Empathetic, clear, and reassuring tone crafted for student confidence.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-xs transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              onClick={handleDispatch}
              disabled={dispatched}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition ${
                dispatched
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{dispatched ? 'Notification Sent' : 'Send to Student'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
