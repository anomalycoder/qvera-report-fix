import React, { useState } from 'react'
import type { ProposedEdit } from '@/types/triage'
import { X, Check, Edit3, ShieldAlert } from 'lucide-react'

interface PatchEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newEdit: ProposedEdit) => void
  initialEdit?: ProposedEdit | null
  repair?: string | null
}

export const PatchEditModal: React.FC<PatchEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEdit,
  repair,
}) => {
  if (!isOpen) return null

  const [field, setField] = useState(initialEdit?.field || 'answer')
  const [findVal, setFindVal] = useState(
    initialEdit?.find !== undefined && initialEdit?.find !== null ? String(initialEdit.find) : ''
  )
  const [replaceVal, setReplaceVal] = useState(
    initialEdit?.replace !== undefined && initialEdit?.replace !== null ? String(initialEdit.replace) : ''
  )

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      field,
      find: findVal,
      replace: replaceVal,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Adjust Surgical Patch</h3>
              <p className="text-xs text-slate-500">Fine-tune targeted replacement parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Target Field
            </label>
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="answer">answer (Answer Key)</option>
              <option value="question">question (Stem Text / MathML)</option>
              <option value="solution">solution (Solution Text)</option>
              <option value="chapter">chapter (Taxonomy Classification)</option>
              <option value="questionType">questionType (scq / mcq / integerQuestion)</option>
            </select>
            {repair && (
              <p className="text-[11px] text-slate-500 mt-1">
                Active repair taxonomy: <code className="bg-slate-100 px-1 py-0.5 rounded">{repair}</code>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-rose-700 mb-1.5">
              Find (Erroneous Text to Replace)
            </label>
            <textarea
              rows={3}
              value={findVal}
              onChange={(e) => setFindVal(e.target.value)}
              placeholder="Exact string or value to search for..."
              className="w-full font-mono text-xs bg-rose-50/30 border border-rose-200 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-rose-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1.5">
              Replace With (Corrected Text)
            </label>
            <textarea
              rows={3}
              value={replaceVal}
              onChange={(e) => setReplaceVal(e.target.value)}
              placeholder="Exact replacement string or value..."
              className="w-full font-mono text-xs bg-emerald-50/30 border border-emerald-200 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-xs text-amber-800">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              All modifications are logged in SQLite audit trail with your faculty signature.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            >
              <Check className="w-4 h-4" />
              Save Surgical Edit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
