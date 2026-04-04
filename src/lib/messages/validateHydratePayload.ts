import type { AssistantSuggestion, AssistantViewModel } from '$lib/types/assistant'
import type { HydratePayload } from '$lib/types/messages'
import type { Suggestion } from '$lib/types/suggestions'
import type { TaskCandidate } from '$lib/types/tasks'
import { sanitizeSession, sanitizeSettings } from '$lib/storage/sanitize'

const ASSISTANT_ACTIONS = new Set<AssistantSuggestion['actionType']>([
  'OPEN_CONTINUE',
  'OPEN_TRANSPARENCY',
  'ACCEPT_TASK',
  'DISMISS_TASK'
])

const CONTINUE_REASONS = new Set(['memory_off', 'needs_activity', 'no_visits', 'filtered'])

function isSuggestion(x: unknown): x is Suggestion {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    o.type === 'CONTINUE_URL' &&
    typeof o.title === 'string' &&
    typeof o.url === 'string' &&
    typeof o.confidence === 'number' &&
    Number.isFinite(o.confidence) &&
    typeof o.reasonLine === 'string' &&
    typeof o.createdAt === 'number' &&
    Number.isFinite(o.createdAt)
  )
}

function isTaskCandidate(x: unknown): x is TaskCandidate {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  if (
    typeof o.id !== 'string' ||
    typeof o.titleGuess !== 'string' ||
    typeof o.confidence !== 'number' ||
    typeof o.createdAt !== 'number'
  ) {
    return false
  }
  const p = o.provenance
  if (!p || typeof p !== 'object') return false
  const pr = p as Record<string, unknown>
  if (pr.kind !== 'inferred' && pr.kind !== 'user') return false
  if (
    !Array.isArray(pr.reasonCodes) ||
    !pr.reasonCodes.every((x) => typeof x === 'string') ||
    typeof pr.evidenceSummary !== 'string'
  ) {
    return false
  }
  return true
}

function isAssistantSuggestion(x: unknown): x is AssistantSuggestion {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  if (typeof o.id !== 'string' || !o.id) return false
  if (typeof o.label !== 'string') return false
  if (!ASSISTANT_ACTIONS.has(o.actionType as AssistantSuggestion['actionType'])) return false
  if (o.description !== undefined && typeof o.description !== 'string') return false
  if (o.payload !== undefined) {
    if (!o.payload || typeof o.payload !== 'object') return false
    const p = o.payload as Record<string, unknown>
    if (p.url !== undefined && typeof p.url !== 'string') return false
    if (p.candidateId !== undefined && typeof p.candidateId !== 'string') return false
  }
  return true
}

function isAssistantViewModel(x: unknown): x is AssistantViewModel {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  if (o.layout !== 'standard' && o.layout !== 'minimal-strip') return false
  if (!Array.isArray(o.lastContextSummary) || !o.lastContextSummary.every((s) => typeof s === 'string')) {
    return false
  }
  if (!Array.isArray(o.suggestions) || !o.suggestions.every(isAssistantSuggestion)) return false
  if (typeof o.previewLine !== 'string') return false
  return true
}

function isTopDomainRow(x: unknown): x is { domain: string; count: number } {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return typeof o.domain === 'string' && typeof o.count === 'number' && Number.isFinite(o.count)
}

/**
 * Validates background → UI hydrate snapshots before they touch Svelte state.
 * Re-sanitizes settings/session defensively (corrupt storage should not brick UI).
 */
export function validateHydratePayload(raw: unknown): HydratePayload | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>

  const settings = sanitizeSettings(o.settings)
  const session = sanitizeSession(o.session)

  if (!Array.isArray(o.suggestions) || !o.suggestions.every(isSuggestion)) return null
  if (o.taskCandidate !== null && !isTaskCandidate(o.taskCandidate)) return null
  if (typeof o.tabsPermission !== 'boolean') return null
  if (!Array.isArray(o.patternSummaries) || !o.patternSummaries.every((x) => typeof x === 'string')) {
    return null
  }
  const cer = o.continueEmptyReason
  if (cer !== null && (typeof cer !== 'string' || !CONTINUE_REASONS.has(cer))) return null
  if (!Array.isArray(o.transparencyTopDomains) || !o.transparencyTopDomains.every(isTopDomainRow)) {
    return null
  }
  const rlp = o.recoveryLastPlayedAt
  if (rlp !== null && (typeof rlp !== 'number' || !Number.isFinite(rlp))) return null

  if (!isAssistantViewModel(o.assistant)) return null

  // Validate aiSession (optional for backward compatibility)
  const aiSession = o.aiSession && typeof o.aiSession === 'object' && 
    'summary' in o.aiSession && 'taskPolish' in o.aiSession && 'lastError' in o.aiSession
    ? o.aiSession as { summary: string; taskPolish: string; lastError: string | null }
    : { summary: 'idle', taskPolish: 'idle', lastError: null }

  return {
    settings,
    session,
    suggestions: o.suggestions as Suggestion[],
    taskCandidate: o.taskCandidate as TaskCandidate | null,
    tabsPermission: o.tabsPermission,
    patternSummaries: o.patternSummaries as string[],
    continueEmptyReason: cer as HydratePayload['continueEmptyReason'],
    transparencyTopDomains: o.transparencyTopDomains as HydratePayload['transparencyTopDomains'],
    recoveryLastPlayedAt: rlp as number | null,
    assistant: o.assistant as AssistantViewModel,
    aiSession: aiSession as any
  }
}
