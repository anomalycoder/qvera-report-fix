export interface StudentReport {
  reportId: string
  questionId: string
  studentId: string
  source: 'web' | 'android' | 'ios' | string
  reportedAt: string
  comment: string
}
