/** Inline storage row types — kept separate from domain types to avoid cycles */

export interface DismissalState {
  schemaVersion: number
  entries: Record<string, { lastDismissedAt: number; neverAgain?: boolean }>
}

export const DEFAULT_DISMISSALS: DismissalState = { schemaVersion: 1, entries: {} }

export interface TaskInferenceMeta {
  schemaVersion: number
  lastCandidateAt: number | null
  shownIds: string[]
  dismissedIds: string[]
}

export const DEFAULT_TASK_INFERENCE_META: TaskInferenceMeta = {
  schemaVersion: 1,
  lastCandidateAt: null,
  shownIds: [],
  dismissedIds: []
}

export interface RecoveryMeta {
  schemaVersion: number
  lastPlayedAt: number | null
}

export const DEFAULT_RECOVERY: RecoveryMeta = { schemaVersion: 1, lastPlayedAt: null }

/** Dismissals for Assistant suggestion rows (separate from Continue dismissals) */
export interface AssistantDismissalsState {
  schemaVersion: number
  entries: Record<string, { lastDismissedAt: number }>
}

export const DEFAULT_ASSISTANT_DISMISSALS: AssistantDismissalsState = {
  schemaVersion: 1,
  entries: {}
}
