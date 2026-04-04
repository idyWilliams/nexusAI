import type { RecentVisit, WorkPatternState } from '$lib/types/workPattern'
import { DEFAULT_WORK_PATTERN } from '$lib/types/workPattern'
import type {
  AssistantDismissalsState,
  DismissalState,
  TaskInferenceMeta,
  RecoveryMeta
} from './types'
import {
  DEFAULT_ASSISTANT_DISMISSALS,
  DEFAULT_DISMISSALS,
  DEFAULT_TASK_INFERENCE_META,
  DEFAULT_RECOVERY
} from './types'

function sanitizeRecentVisit(raw: unknown): RecentVisit | null {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Partial<RecentVisit>
  if (typeof v.url !== 'string' || typeof v.domain !== 'string' || typeof v.title !== 'string') return null
  if (typeof v.visitedAt !== 'number' || !Number.isFinite(v.visitedAt)) return null
  return { url: v.url, domain: v.domain, title: v.title, visitedAt: v.visitedAt }
}

function sanitizeDomainCounts(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof k !== 'string' || !k) continue
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) out[k] = Math.floor(v)
  }
  return out
}

function sanitizeDismissalEntries(raw: unknown): DismissalState['entries'] {
  if (!raw || typeof raw !== 'object') return {}
  const out: DismissalState['entries'] = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof k !== 'string' || !k) continue
    if (!v || typeof v !== 'object') continue
    const o = v as Record<string, unknown>
    const last = o.lastDismissedAt
    if (typeof last !== 'number' || !Number.isFinite(last)) continue
    const neverAgain = o.neverAgain
    if (neverAgain !== undefined && typeof neverAgain !== 'boolean') continue
    out[k] = neverAgain === undefined ? { lastDismissedAt: last } : { lastDismissedAt: last, neverAgain }
  }
  return out
}

export function mergeWorkPattern(raw: unknown): WorkPatternState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_WORK_PATTERN }
  const w = raw as Partial<WorkPatternState>
  const recentVisits = Array.isArray(w.recentVisits)
    ? w.recentVisits.map(sanitizeRecentVisit).filter((x): x is RecentVisit => x !== null)
    : []
  const domainCounts = sanitizeDomainCounts(w.domainCounts)
  return {
    ...DEFAULT_WORK_PATTERN,
    ...w,
    schemaVersion: typeof w.schemaVersion === 'number' ? w.schemaVersion : DEFAULT_WORK_PATTERN.schemaVersion,
    recentVisits,
    domainCounts
  }
}

export function mergeDismissals(raw: unknown): DismissalState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_DISMISSALS }
  const d = raw as Partial<DismissalState>
  return {
    ...DEFAULT_DISMISSALS,
    ...d,
    schemaVersion: typeof d.schemaVersion === 'number' ? d.schemaVersion : DEFAULT_DISMISSALS.schemaVersion,
    entries: sanitizeDismissalEntries(d.entries)
  }
}

export function mergeTaskInferenceMeta(raw: unknown): TaskInferenceMeta {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_TASK_INFERENCE_META }
  const m = raw as Partial<TaskInferenceMeta>
  const last =
    m.lastCandidateAt === null || (typeof m.lastCandidateAt === 'number' && Number.isFinite(m.lastCandidateAt))
      ? m.lastCandidateAt ?? null
      : DEFAULT_TASK_INFERENCE_META.lastCandidateAt
  return {
    ...DEFAULT_TASK_INFERENCE_META,
    ...m,
    schemaVersion: typeof m.schemaVersion === 'number' ? m.schemaVersion : DEFAULT_TASK_INFERENCE_META.schemaVersion,
    lastCandidateAt: last,
    shownIds: Array.isArray(m.shownIds)
      ? m.shownIds.filter((x): x is string => typeof x === 'string')
      : [],
    dismissedIds: Array.isArray(m.dismissedIds)
      ? m.dismissedIds.filter((x): x is string => typeof x === 'string')
      : []
  }
}

function sanitizeAssistantDismissalEntries(raw: unknown): AssistantDismissalsState['entries'] {
  if (!raw || typeof raw !== 'object') return {}
  const out: AssistantDismissalsState['entries'] = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof k !== 'string' || !k) continue
    if (!v || typeof v !== 'object') continue
    const last = (v as Record<string, unknown>).lastDismissedAt
    if (typeof last !== 'number' || !Number.isFinite(last)) continue
    out[k] = { lastDismissedAt: last }
  }
  return out
}

export function mergeAssistantDismissals(raw: unknown): AssistantDismissalsState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_ASSISTANT_DISMISSALS }
  const d = raw as Partial<AssistantDismissalsState>
  return {
    ...DEFAULT_ASSISTANT_DISMISSALS,
    ...d,
    schemaVersion:
      typeof d.schemaVersion === 'number' ? d.schemaVersion : DEFAULT_ASSISTANT_DISMISSALS.schemaVersion,
    entries: sanitizeAssistantDismissalEntries(d.entries)
  }
}

export function mergeRecoveryMeta(raw: unknown): RecoveryMeta {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_RECOVERY }
  const r = raw as Partial<RecoveryMeta>
  return {
    ...DEFAULT_RECOVERY,
    ...r,
    schemaVersion: typeof r.schemaVersion === 'number' ? r.schemaVersion : DEFAULT_RECOVERY.schemaVersion,
    lastPlayedAt:
      typeof r.lastPlayedAt === 'number' || r.lastPlayedAt === null ? r.lastPlayedAt ?? null : null
  }
}
