export interface OptionItem {
  label: string
  raw_html: string
  text: string
  is_blank: boolean
}

export interface QuestionContent {
  question: string
  solution?: string | null
  answer: string | number | string[]
  quesImages?: string[]
  solutionImages?: string[]
}

export interface QuestionItem {
  _id: string
  qid?: string | null
  questionType: 'scq' | 'mcq' | 'integerQuestion' | string
  subject?: string
  chapter?: string
  concept?: string | null
  subConcept?: string | null
  level?: string
  error?: number
  updatedAt?: string
  scq?: QuestionContent
  mcq?: QuestionContent
  integerQuestion?: QuestionContent
}

export interface NormalizedQuestion {
  question_id: string
  qid?: string | null
  question_type: string
  subject?: string
  chapter?: string
  concept?: string | null
  sub_concept?: string | null
  difficulty?: string
  raw_question_html: string
  raw_solution_html?: string | null
  stored_answer: any
  stem_text: string
  options: Record<string, OptionItem>
  missing_options: string[]
  declared_question_images: string[]
  declared_solution_images: string[]
  inline_images: string[]
  has_missing_figure_signal: boolean
  mathml_count: number
  markup_warnings: string[]
}

export interface QuestionDetailResponse {
  raw: QuestionItem
  normalized: NormalizedQuestion
  report_count: number
  reports: any[]
}
