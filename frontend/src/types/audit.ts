export interface AuditLogEntry {
  id: number
  report_id: string
  question_id: string
  action: 'approve' | 'edit' | 'reject' | string
  faculty_id?: string | null
  faculty_name?: string | null
  notes?: string | null
  applied_edit?: any
  created_at?: string
}

export interface AuditActionCreate {
  report_id: string
  question_id: string
  action: 'approve' | 'edit' | 'reject'
  faculty_id?: string
  faculty_name?: string
  notes?: string
  applied_edit?: any
}
