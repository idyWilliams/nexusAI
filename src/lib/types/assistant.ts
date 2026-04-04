import type { Mode } from './settings'
import type { ContinueEmptyReason } from './messages'
import type { Suggestion } from './suggestions'
import type { TaskCandidate } from './tasks'
import type { AssistantDismissalsState } from '$lib/storage/types'

/** Actions the Assistant can trigger (handled in UI or background per type) */
export type AssistantActionType =
  | 'OPEN_CONTINUE'
  | 'OPEN_TRANSPARENCY'
  | 'ACCEPT_TASK'
  | 'DISMISS_TASK'

/** One actionable row in the Assistant panel — not a chat message */
export interface AssistantSuggestion {
  id: string
  label: string
  description?: string
  actionType: AssistantActionType
  /** OPEN_CONTINUE needs url; task actions need candidateId */
  payload?: { url?: string; candidateId?: string }
}

export type AssistantLayout = 'standard' | 'minimal-strip'

/** Built on the background; single source of truth for the Assistant slice */
export interface AssistantViewModel {
  layout: AssistantLayout
  /** Short bullets for expanded view */
  lastContextSummary: string[]
  /** Max 3 in standard; max 1 in minimal-strip */
  suggestions: AssistantSuggestion[]
  /** Collapsed header preview */
  previewLine: string
}

export interface AssistantEngineInput {
  mode: Mode
  patternSummaries: string[]
  transparencyTopDomains: Array<{ domain: string; count: number }>
  suggestions: Suggestion[]
  taskCandidate: TaskCandidate | null
  continueEmptyReason: ContinueEmptyReason
  assistantDismissals: AssistantDismissalsState
  now: number
}
