export interface VerificationOutput {
  question_id: string
  question_type: string
  stored_answer: any
  independently_derived_answer?: any
  solution_answer?: any
  verification_status: 'verified' | 'mismatch' | 'uncertain' | 'unsupported' | string
  solver_method: 'sympy' | 'rule_based' | 'knowledge_check' | 'unavailable' | string
  confidence: number
  reasoning_summary: string
  evidence: string[]
  requires_human_review: boolean
}

export interface SolverStatistics {
  total_questions: number
  verified_count: number
  mismatch_count: number
  uncertain_count: number
  unsupported_count: number
  human_review_required: number
  average_confidence: number
}
