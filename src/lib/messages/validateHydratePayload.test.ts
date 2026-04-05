import { describe, expect, it } from 'vitest'
import { validateHydratePayload } from './validateHydratePayload'
import { DEFAULT_SETTINGS } from '$lib/types/settings'
import { DEFAULT_SESSION } from '$lib/types/session'
import { DEFAULT_AI_SESSION } from '$lib/storage/types'
import { DEFAULT_CONTEXT_RECOVERY } from '$lib/memory/types'

const minimalValid = {
  settings: DEFAULT_SETTINGS,
  session: DEFAULT_SESSION,
  suggestions: [],
  taskCandidate: null,
  tabsPermission: false,
  patternSummaries: [],
  continueEmptyReason: null,
  transparencyTopDomains: [],
  recoveryLastPlayedAt: null,
  assistant: {
    layout: 'standard' as const,
    lastContextSummary: [],
    suggestions: [],
    previewLine: 'Context & next steps'
  },
  aiSession: DEFAULT_AI_SESSION,
  contextRecovery: { ...DEFAULT_CONTEXT_RECOVERY }
}

describe('validateHydratePayload', () => {
  it('accepts a minimal valid payload', () => {
    const p = validateHydratePayload(minimalValid)
    expect(p).not.toBeNull()
    expect(p?.suggestions).toEqual([])
  })

  it('rejects missing keys', () => {
    expect(validateHydratePayload({ ...minimalValid, transparencyTopDomains: undefined })).toBeNull()
  })

  it('rejects bad continueEmptyReason', () => {
    expect(validateHydratePayload({ ...minimalValid, continueEmptyReason: 'nope' })).toBeNull()
  })

  it('sanitizes corrupt settings enums', () => {
    const p = validateHydratePayload({
      ...minimalValid,
      settings: { ...DEFAULT_SETTINGS, mode: 'hack' as 'normal' }
    })
    expect(p?.settings.mode).toBe(DEFAULT_SETTINGS.mode)
  })
})
