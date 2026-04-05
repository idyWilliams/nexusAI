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

const workVisit: RecentVisit = {
  url: 'https://github.com/user/repo',
  title: 'user/repo',
  domain: 'github.com',
  visitedAt: Date.now() - 30_000
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

  it('provides specific work domain titles', () => {
    const out = routeContinueSuggestions({
      settings: DEFAULT_SETTINGS,
      dismissals: emptyDismissals,
      candidateVisit: { ...workVisit, title: 'Some long title that would normally be truncated' },
      candidateScore: 0.8
    })
    expect(out).toHaveLength(1)
    // Should use title since it's not a URL and under 72 chars
    expect(out[0].title).toBe('Some long title that would normally be truncated')
  })

  it('provides work domain names when title is URL-like', () => {
    const out = routeContinueSuggestions({
      settings: DEFAULT_SETTINGS,
      dismissals: emptyDismissals,
      candidateVisit: { ...workVisit, title: 'https://github.com/user/repo' },
      candidateScore: 0.8
    })
    expect(out).toHaveLength(1)
    expect(out[0].title).toBe('GitHub')
  })

  it('provides domain-specific reason lines', () => {
    const out = routeContinueSuggestions({
      settings: DEFAULT_SETTINGS,
      dismissals: emptyDismissals,
      candidateVisit: workVisit,
      candidateScore: 0.8
    })
    expect(out).toHaveLength(1)
    expect(out[0].reasonLine).toContain('github.com')
    expect(out[0].reasonLine).toContain('Recent work')
  })

  it('provides focus-mode specific reason lines', () => {
    const out = routeContinueSuggestions({
      settings: { ...DEFAULT_SETTINGS, mode: 'focus' },
      dismissals: emptyDismissals,
      candidateVisit: workVisit,
      candidateScore: 0.8
    })
    expect(out).toHaveLength(1)
    expect(out[0].reasonLine).toContain('without distractions')
  })

  it('respects never-again dismissals', () => {
    const dismissals: DismissalState = {
      schemaVersion: 1,
      entries: {
        'CONTINUE_URL:continue-ac624a27': {
          lastDismissedAt: Date.now() - 1000,
          neverAgain: true
        }
      }
    }
    const out = routeContinueSuggestions({
      settings: DEFAULT_SETTINGS,
      dismissals,
      candidateVisit: { ...workVisit, url: 'https://github.com/user/repo' },
      candidateScore: 0.8
    })
    expect(out).toEqual([])
  })
})
