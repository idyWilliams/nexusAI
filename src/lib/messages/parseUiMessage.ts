import type { Settings } from '$lib/types/settings'
import type { UiToBackgroundMessage } from '$lib/types/messages'
import { coerceSettingsPatch } from '$lib/storage/sanitize'

const KNOWN_TYPES = new Set<string>([
  'SHELL_READY',
  'HYDRATE_REQUEST',
  'USER_DISMISS',
  'MODE_SET',
  'SETTINGS_PATCH',
  'REQUEST_TABS_PERMISSION',
  'TASK_CANDIDATE_ACCEPT',
  'TASK_CANDIDATE_DISMISS',
  'CLEAR_WORK_PATTERNS',
  'REMOVE_DOMAIN_FROM_PATTERNS',
  'GAME_SESSION_END',
  'ASSISTANT_DISMISS_SUGGESTION',
  'MEMORY_RECALL',
  'RESUME_THREAD_REQUEST',
  'AI_SUMMARIZE_REQUEST',
  'AI_POLISH_TASK_REQUEST',
  'AI_EXPLAIN_THREAD_REQUEST'
])

function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object'
}

const MODES = new Set(['normal', 'focus', 'minimal'])

/**
 * Strict parse for UI → background messages. Rejects malformed payloads so the SW never runs
 * switch arms with undefined assumptions.
 */
export function parseUiToBackgroundMessage(raw: unknown): UiToBackgroundMessage | null {
  if (!isRecord(raw) || typeof raw.type !== 'string') return null
  if (!KNOWN_TYPES.has(raw.type)) return null

  switch (raw.type) {
    case 'SHELL_READY': {
      if (!isRecord(raw.payload) || typeof raw.payload.buildId !== 'string' || !raw.payload.buildId) {
        return null
      }
      return { type: 'SHELL_READY', payload: { buildId: raw.payload.buildId } }
    }
    case 'HYDRATE_REQUEST':
      return { type: 'HYDRATE_REQUEST' }
    case 'USER_DISMISS': {
      if (!isRecord(raw.payload)) return null
      const id = raw.payload.suggestionId
      const st = raw.payload.suggestionType
      if (typeof id !== 'string' || !id) return null
      if (st !== 'CONTINUE_URL') return null
      const neverAgain = raw.payload.neverAgain
      if (neverAgain !== undefined && typeof neverAgain !== 'boolean') return null
      return {
        type: 'USER_DISMISS',
        payload: { suggestionId: id, suggestionType: st, neverAgain }
      }
    }
    case 'MODE_SET': {
      if (!isRecord(raw.payload) || typeof raw.payload.mode !== 'string') return null
      if (!MODES.has(raw.payload.mode)) return null
      return { type: 'MODE_SET', payload: { mode: raw.payload.mode as Settings['mode'] } }
    }
    case 'SETTINGS_PATCH': {
      const patch = coerceSettingsPatch(raw.payload === undefined ? {} : raw.payload)
      if (patch === null) return null
      return { type: 'SETTINGS_PATCH', payload: patch }
    }
    case 'REQUEST_TABS_PERMISSION':
      return { type: 'REQUEST_TABS_PERMISSION' }
    case 'TASK_CANDIDATE_ACCEPT': {
      if (!isRecord(raw.payload) || typeof raw.payload.candidateId !== 'string' || !raw.payload.candidateId) {
        return null
      }
      const title = raw.payload.title
      if (title !== undefined && typeof title !== 'string') return null
      return { type: 'TASK_CANDIDATE_ACCEPT', payload: { candidateId: raw.payload.candidateId, title } }
    }
    case 'TASK_CANDIDATE_DISMISS': {
      if (!isRecord(raw.payload) || typeof raw.payload.candidateId !== 'string' || !raw.payload.candidateId) {
        return null
      }
      return { type: 'TASK_CANDIDATE_DISMISS', payload: { candidateId: raw.payload.candidateId } }
    }
    case 'CLEAR_WORK_PATTERNS':
      return { type: 'CLEAR_WORK_PATTERNS' }
    case 'REMOVE_DOMAIN_FROM_PATTERNS': {
      if (!isRecord(raw.payload) || typeof raw.payload.domain !== 'string' || !raw.payload.domain.trim()) {
        return null
      }
      return { type: 'REMOVE_DOMAIN_FROM_PATTERNS', payload: { domain: raw.payload.domain.trim() } }
    }
    case 'GAME_SESSION_END': {
      if (!isRecord(raw.payload) || typeof raw.payload.endedAt !== 'number' || !Number.isFinite(raw.payload.endedAt)) {
        return null
      }
      return { type: 'GAME_SESSION_END', payload: { endedAt: raw.payload.endedAt } }
    }
    case 'ASSISTANT_DISMISS_SUGGESTION': {
      if (!isRecord(raw.payload) || typeof raw.payload.suggestionId !== 'string' || !raw.payload.suggestionId) {
        return null
      }
      return { type: 'ASSISTANT_DISMISS_SUGGESTION', payload: { suggestionId: raw.payload.suggestionId } }
    }
    case 'MEMORY_RECALL': {
      if (!isRecord(raw.payload) || typeof raw.payload.query !== 'string') return null
      return { type: 'MEMORY_RECALL', payload: { query: raw.payload.query } }
    }
    case 'AI_SUMMARIZE_REQUEST':
      return { type: 'AI_SUMMARIZE_REQUEST' }
    case 'AI_POLISH_TASK_REQUEST': {
      if (typeof raw.candidateId !== 'string' || !raw.candidateId.trim()) return null
      return { type: 'AI_POLISH_TASK_REQUEST', candidateId: raw.candidateId.trim() }
    }
    case 'RESUME_THREAD_REQUEST': {
      if (!isRecord(raw.payload) || typeof raw.payload.label !== 'string' || !Array.isArray(raw.payload.urls)) return null
      if (!raw.payload.urls.every((u) => typeof u === 'string')) return null
      return { type: 'RESUME_THREAD_REQUEST', payload: { label: raw.payload.label, urls: raw.payload.urls } as any }
    }
    case 'AI_EXPLAIN_THREAD_REQUEST': {
      if (typeof raw.threadId !== 'string' || typeof raw.label !== 'string' || !Array.isArray(raw.pages)) return null
      return { 
        type: 'AI_EXPLAIN_THREAD_REQUEST', 
        threadId: raw.threadId, 
        label: raw.label, 
        pages: raw.pages as any 
      }
    }
    default:
      return null
  }
}

/** True when the message claims a NEXUS UI type (even if payload is invalid). */
export function looksLikeNexusUiMessage(raw: unknown): boolean {
  return isRecord(raw) && typeof raw.type === 'string' && KNOWN_TYPES.has(raw.type)
}
