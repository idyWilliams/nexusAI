import { describe, expect, it } from 'vitest'
import { mergeDismissals, mergeWorkPattern } from './merge'

describe('mergeWorkPattern', () => {
  it('drops malformed recent visits', () => {
    const w = mergeWorkPattern({
      schemaVersion: 2,
      recentVisits: [
        { url: 'https://a.com', domain: 'a.com', title: 'A', visitedAt: 1 },
        { url: 123, domain: 'b.com', title: 'B', visitedAt: 2 } as unknown as never
      ],
      domainCounts: { 'a.com': 1, bad: NaN as unknown as number }
    })
    expect(w.recentVisits).toHaveLength(1)
    expect(w.domainCounts).toEqual({ 'a.com': 1 })
  })
})

describe('mergeDismissals', () => {
  it('drops invalid dismissal entries', () => {
    const d = mergeDismissals({
      schemaVersion: 1,
      entries: {
        ok: { lastDismissedAt: 10, neverAgain: true },
        bad: { lastDismissedAt: 'x' } as unknown as never
      }
    })
    expect(Object.keys(d.entries)).toEqual(['ok'])
  })
})
