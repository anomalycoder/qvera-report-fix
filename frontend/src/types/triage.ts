export interface ProposedEdit {
  field: 'question' | 'solution' | 'answer' | 'questionType' | string
  operation?: string
  find?: any
  replace?: any
  old_value?: any
  new_value?: any
  reason?: string
  evidence?: string[]
}

export interface TriageResult {
  reportId: string
  questionId: string
  verdict: 'defect' | 'no_error' | 'display_issue' | 'app_issue' | 'language_mode' | 'already_fixed' | 'not_actionable' | string
  repair?: string | null
  edit?: ProposedEdit | null
  route: 'auto_apply' | 'faculty_review' | 'no_change' | string
  confidence: number
  evidence: string
  student_reply: string
}
