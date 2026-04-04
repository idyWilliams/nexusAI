import { describe, expect, it } from 'vitest'
import { computeContinueEmptyReason } from './continueEmptyReason'
import { DEFAULT_SETTINGS } from '$lib/types/settings'

describe('computeContinueEmptyReason', () => {
  it('returns null when there are suggestions', () => {
    expect(
      computeContinueEmptyReason(DEFAULT_SETTINGS, true, 1, 5)
    ).toBeNull()
  })

  it('returns memory_off when memory is off', () => {
    expect(
      computeContinueEmptyReason(
        { ...DEFAULT_SETTINGS, memoryLevel: 'off' },
        true,
        0,
        3
      )
    ).toBe('memory_off')
  })

  it('returns needs_activity when work-aware is off', () => {
    expect(
      computeContinueEmptyReason(
        { ...DEFAULT_SETTINGS, activityAwarenessEnabled: false, memoryLevel: 'light' },
        true,
        0,
        3
      )
    ).toBe('needs_activity')
  })

  it('returns needs_activity when tabs permission is missing', () => {
    expect(
      computeContinueEmptyReason(
        { ...DEFAULT_SETTINGS, activityAwarenessEnabled: true, memoryLevel: 'light' },
        false,
        0,
        3
      )
    ).toBe('needs_activity')
  })

  it('returns no_visits when eligible but no visits', () => {
    expect(
      computeContinueEmptyReason(
        { ...DEFAULT_SETTINGS, activityAwarenessEnabled: true, memoryLevel: 'light' },
        true,
        0,
        0
      )
    ).toBe('no_visits')
  })

  it('returns filtered when visits exist but nothing surfaced', () => {
    expect(
      computeContinueEmptyReason(
        { ...DEFAULT_SETTINGS, activityAwarenessEnabled: true, memoryLevel: 'light' },
        true,
        0,
        2
      )
    ).toBe('filtered')
  })
})
