import type { Settings } from '$lib/types/settings'
import { DEFAULT_SETTINGS } from '$lib/types/settings'
import type { SessionState } from '$lib/types/session'
import type { WorkPatternState } from '$lib/types/workPattern'
import { sanitizeSession, sanitizeSettings } from './sanitize'
import {
  mergeAssistantDismissals,
  mergeDismissals,
  mergeRecoveryMeta,
  mergeTaskInferenceMeta,
  mergeWorkPattern
} from './merge'
import {
  DEFAULT_DISMISSALS,
  DEFAULT_RECOVERY,
  DEFAULT_TASK_INFERENCE_META,
  DEFAULT_ASSISTANT_DISMISSALS,
  DEFAULT_AI_SESSION,
  type AssistantDismissalsState,
  type DismissalState,
  type RecoveryMeta,
  type TaskInferenceMeta,
  type AiSessionState
} from './types'
import { STORAGE_KEYS } from './keys'

export type { AssistantDismissalsState, DismissalState, TaskInferenceMeta, RecoveryMeta, AiSessionState }
export { STORAGE_KEYS }

export interface StoredUserTask {
  id: string
  title: string
  createdAt: number
  provenanceSummary: string
}

export async function getStoredTasks(): Promise<StoredUserTask[]> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.tasks)
  const raw = data[STORAGE_KEYS.tasks]
  if (!raw || !Array.isArray(raw)) return []
  return raw as StoredUserTask[]
}

export async function addStoredTask(task: StoredUserTask): Promise<void> {
  const cur = await getStoredTasks()
  await chrome.storage.local.set({ [STORAGE_KEYS.tasks]: [...cur, task] })
}

export async function getSettings(): Promise<Settings> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.settings)
  return sanitizeSettings(data[STORAGE_KEYS.settings])
}

export async function setSettings(next: Settings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: next })
}

export async function patchSettings(partial: Partial<Settings>): Promise<Settings> {
  const cur = await getSettings()
  const next = sanitizeSettings({ ...cur, ...partial })
  await setSettings(next)
  return next
}

export async function getSessionState(): Promise<SessionState> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.session)
  return sanitizeSession(data[STORAGE_KEYS.session])
}

export async function setSessionState(next: SessionState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.session]: next })
}

export async function getWorkPatternState(): Promise<WorkPatternState> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.workPattern)
  return mergeWorkPattern(data[STORAGE_KEYS.workPattern])
}

export async function setWorkPatternState(next: WorkPatternState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.workPattern]: next })
}

export async function getDismissalState(): Promise<DismissalState> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.dismissals)
  return mergeDismissals(data[STORAGE_KEYS.dismissals])
}

export async function setDismissalState(next: DismissalState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.dismissals]: next })
}

export async function getTaskInferenceMeta(): Promise<TaskInferenceMeta> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.taskInference)
  return mergeTaskInferenceMeta(data[STORAGE_KEYS.taskInference])
}

export async function setTaskInferenceMeta(next: TaskInferenceMeta): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.taskInference]: next })
}

export async function getRecoveryMeta(): Promise<RecoveryMeta> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.recovery)
  return mergeRecoveryMeta(data[STORAGE_KEYS.recovery])
}

export async function setRecoveryMeta(next: RecoveryMeta): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.recovery]: next })
}

export async function getAssistantDismissals(): Promise<AssistantDismissalsState> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.assistantDismissals)
  return mergeAssistantDismissals(data[STORAGE_KEYS.assistantDismissals])
}

export async function setAssistantDismissals(next: AssistantDismissalsState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.assistantDismissals]: next })
}

export async function getAiSession(): Promise<AiSessionState> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.aiSession)
  const merged = { ...DEFAULT_AI_SESSION, ...data[STORAGE_KEYS.aiSession] }
  
  // Reset request count if session is older than 30 minutes
  const sessionAge = Date.now() - merged.sessionStart
  if (sessionAge > 30 * 60 * 1000) {
    merged.requestCount = 0
    merged.sessionStart = Date.now()
  }
  
  return merged
}

export async function setAiSession(next: AiSessionState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.aiSession]: next })
}

/** Fallback hydrate when reads fail — keeps UI consistent with constitution defaults */
export function getFallbackSettingsForError(): Settings {
  return sanitizeSettings({ ...DEFAULT_SETTINGS })
}

export function getFallbackSessionForError(): SessionState {
  return sanitizeSession({})
}
