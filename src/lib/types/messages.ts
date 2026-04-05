import type { Mode, Settings } from './settings'
import type { SessionState } from './session'
import type { Suggestion } from './suggestions'
import type { TaskCandidate } from './tasks'
import type { AssistantViewModel } from './assistant'
import type { AiRequest, AiResponse } from './ai'
import type { AiSessionState } from '../storage/types'
import type { ContextRecoverySnapshot } from '$lib/memory/types'

export const BUILD_ID = '0.1.0-mvp'

export type ContinueEmptyReason =
  | 'memory_off'
  | 'needs_activity'
  | 'no_visits'
  | 'filtered'
  | null

/** UI → background */
export type UiToBackgroundMessage =
  | { type: 'SHELL_READY'; payload: { buildId: string } }
  | { type: 'HYDRATE_REQUEST' }
  | {
      type: 'USER_DISMISS'
      payload: { suggestionId: string; suggestionType: Suggestion['type']; neverAgain?: boolean }
    }
  | { type: 'MODE_SET'; payload: { mode: Mode } }
  | { type: 'SETTINGS_PATCH'; payload: Partial<Settings> }
  | { type: 'REQUEST_TABS_PERMISSION' }
  | { type: 'TASK_CANDIDATE_ACCEPT'; payload: { candidateId: string; title?: string } }
  | { type: 'TASK_CANDIDATE_DISMISS'; payload: { candidateId: string } }
  | { type: 'CLEAR_WORK_PATTERNS' }
  | { type: 'REMOVE_DOMAIN_FROM_PATTERNS'; payload: { domain: string } }
  | { type: 'GAME_SESSION_END'; payload: { endedAt: number } }
  /** Hide an Assistant row for cooldown — OPEN_CONTINUE stays UI-side (no extra tabs permission) */
  | { type: 'ASSISTANT_DISMISS_SUGGESTION'; payload: { suggestionId: string } }
  /** Local memory recall (IndexedDB metadata search) */
  | { type: 'MEMORY_RECALL'; payload: { query: string } }
  | { type: 'RESUME_THREAD_REQUEST'; payload: { label: string; urls: string[] } }
  /** AI-powered Assistant features */
  | AiRequest

/** Background → UI */
export type BackgroundToUiMessage =
  | { type: 'HYDRATE_STATE'; payload: HydratePayload }
  | { type: 'ENRICHMENT_PATCH'; payload: Partial<HydratePayload> }
  | AiResponse

/** Background → UI primary response shape for all UI-initiated actions (MVP). */
export type BackgroundHydrateResponse = HydratePayload

export interface HydratePayload {
  settings: Settings
  session: SessionState
  suggestions: Suggestion[]
  taskCandidate: TaskCandidate | null
  /** Whether optional tabs permission is granted */
  tabsPermission: boolean
  /** Human-readable pattern summary lines */
  patternSummaries: string[]
  /** Why Continue is empty — drives calm empty states */
  continueEmptyReason: ContinueEmptyReason
  /** Coarse domain counts for transparency */
  transparencyTopDomains: Array<{ domain: string; count: number }>
  /** Local-only recovery signal */
  recoveryLastPlayedAt: number | null
  /** Contained Assistant panel — computed on hydrate */
  assistant: AssistantViewModel
  /** AI session state for tracking ongoing requests */
  aiSession: AiSessionState
  /** Context Recovery Engine snapshot — threads + optional recall hits */
  contextRecovery: ContextRecoverySnapshot
}

export type NexusMessage = UiToBackgroundMessage | BackgroundToUiMessage
