export interface DatasetIntegrity {
  questions_count: number
  reports_count: number
  distinct_questions_in_questions: number
  distinct_reports_in_reports: number
  distinct_reported_questions: number
  duplicate_question_ids: string[]
  duplicate_report_ids: string[]
  invalid_report_references: string[]
  unreported_questions_count: number
  unreported_question_ids: string[]
  questions_with_multiple_reports_count: number
  questions_with_multiple_reports: Record<string, number>
}

export interface DatasetHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  dataset_integrity: DatasetIntegrity
  files_present: {
    questions_json: boolean
    reports_json: boolean
    taxonomy_json: boolean
  }
  anomalies_detected: string[]
  timestamp: string
}

export interface DatasetStatisticsResponse {
  total_questions: number
  total_reports: number
  distinct_reported_questions: number
  unreported_questions: number
  questions_with_duplicate_reports: number
  question_type_distribution: Record<string, number>
  subject_distribution: Record<string, number>
  report_source_distribution: Record<string, number>
  missing_option_counts: number
  invalid_report_references: number
}
