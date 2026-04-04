import { describe, expect, it } from 'vitest'
import { routeContinueSuggestions } from './suggestionRouter'
import type { RecentVisit } from '$lib/types/workPattern'
import { DEFAULT_SETTINGS } from '$lib/types/settings'
import type { DismissalState } from '$lib/storage'

const visit: RecentVisit = {
  url: 'https://docs.google.com/document/d/x',
  title: 'Doc',
  domain: 'docs.google.com',
  visitedAt: Date.now() - 60_000
}

const emptyDismissals: DismissalState = { schemaVersion: 1, entries: {} }

describe('routeContinueSuggestions', () => {
  it('returns nothing when memory is off', () => {
    const out = routeContinueSuggestions({
      settings: { ...DEFAULT_SETTINGS, memoryLevel: 'off' },
      dismissals: emptyDismissals,
      candidateVisit: visit,
      candidateScore: 0.9
    })
    expect(out).toEqual([])
  })

  it('returns nothing in minimal mode', () => {
    const out = routeContinueSuggestions({
      settings: { ...DEFAULT_SETTINGS, mode: 'minimal' },
      dismissals: emptyDismissals,
      candidateVisit: visit,
      candidateScore: 0.9
    })
    expect(out).toEqual([])
  })

  it('returns at most one suggestion when eligible', () => {
    const out = routeContinueSuggestions({
      settings: DEFAULT_SETTINGS,
      dismissals: emptyDismissals,
      candidateVisit: visit,
      candidateScore: 0.9
    })
    expect(out.length).toBeLessThanOrEqual(1)
    if (out.length === 1) {
      expect(out[0].type).toBe('CONTINUE_URL')
      expect(out[0].url).toBe(visit.url)
    }
  })
})
