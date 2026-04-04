import { describe, expect, it } from 'vitest'
import { coerceSettingsPatch, sanitizeSettings } from './sanitize'
import { DEFAULT_SETTINGS } from '$lib/types/settings'

describe('sanitizeSettings', () => {
  it('rejects invalid mode strings', () => {
    const s = sanitizeSettings({ ...DEFAULT_SETTINGS, mode: 'nope' as 'normal' })
    expect(s.mode).toBe(DEFAULT_SETTINGS.mode)
  })

  it('accepts valid partial settings', () => {
    const s = sanitizeSettings({ mode: 'focus', memoryLevel: 'off' })
    expect(s.mode).toBe('focus')
    expect(s.memoryLevel).toBe('off')
  })
})

describe('coerceSettingsPatch', () => {
  it('returns null for non-object payloads', () => {
    expect(coerceSettingsPatch('nope')).toBeNull()
  })

  it('strips unknown keys', () => {
    const p = coerceSettingsPatch({ mode: 'normal', extra: 1 } as Record<string, unknown>)
    expect(p).toEqual({ mode: 'normal' })
  })
})
