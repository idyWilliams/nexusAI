export type SuggestionType = 'CONTINUE_URL'

export interface Suggestion {
  id: string
  type: SuggestionType
  title: string
  url: string
  confidence: number
  /** Short line for UI — “why this” */
  reasonLine: string
  createdAt: number
}
