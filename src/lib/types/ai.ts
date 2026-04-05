export type AiRequestState = 'idle' | 'loading' | 'success' | 'error'

export interface AiSessionState {
  summary: AiRequestState
  taskPolish: AiRequestState
  lastError: string | null
}

export const DEFAULT_AI_SESSION: AiSessionState = {
  summary: 'idle',
  taskPolish: 'idle',
  lastError: null
}

/** Safe input structures for AI requests */
export interface WorkSummaryInput {
  patternSummaries: string[]
  topDomains: Array<{ domain: string; count: number }>
  timeContext: {
    hour: number
    dayOfWeek: number
  }
  recentTasks: Array<{ title: string; status: string }>
  currentMode: 'normal' | 'focus' | 'minimal'
}

export interface TaskPolishInput {
  roughTitle: string
  provenance: string
  relatedDomains: string[]
  contextSummary: string
}

/** AI request/response types for message bus */
export interface AiSummaryRequest {
  type: 'AI_SUMMARIZE_REQUEST'
}

export interface AiSummaryResponse {
  type: 'AI_SUMMARIZE_RESPONSE'
  summary: string
  isAiGenerated: boolean
}

export interface AiTaskPolishRequest {
  type: 'AI_POLISH_TASK_REQUEST'
  candidateId: string
}

export interface AiTaskPolishResponse {
  type: 'AI_POLISH_TASK_RESPONSE'
  candidateId: string
  polishedTitle: string
  polishedDescription: string
  isAiGenerated: boolean
}

export interface AiExplainThreadRequest {
  type: 'AI_EXPLAIN_THREAD_REQUEST'
  threadId: string
  label: string
  pages: Array<{ title: string; domain: string; url: string }>
}

export interface AiExplainThreadResponse {
  type: 'AI_EXPLAIN_THREAD_RESPONSE'
  threadId: string
  summary: string
  basedOn: string[]
  isAiGenerated: boolean
}

export type AiRequest = AiSummaryRequest | AiTaskPolishRequest | AiExplainThreadRequest
export type AiResponse = AiSummaryResponse | AiTaskPolishResponse | AiExplainThreadResponse
