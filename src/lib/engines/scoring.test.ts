import { describe, expect, it } from 'vitest'
import { scoreVisit } from './scoring'
import type { RecentVisit } from '$lib/types/workPattern'

describe('scoreVisit', () => {
  const now = 1_000_000_000_000
  const base: RecentVisit = {
    url: 'https://github.com/org/repo',
    title: 'repo',
    domain: 'github.com',
    visitedAt: now - 5 * 60 * 1000
  }

  it('scores higher when visit is more recent', () => {
    const old: RecentVisit = { ...base, visitedAt: now - 48 * 60 * 60 * 1000 }
    expect(scoreVisit(base, now, { 'github.com': 2 })).toBeGreaterThan(
      scoreVisit(old, now, { 'github.com': 2 })
    )
  })

  it('increases slightly with domain frequency', () => {
    const low = scoreVisit(base, now, { 'github.com': 1 })
    const high = scoreVisit(base, now, { 'github.com': 10 })
    expect(high).toBeGreaterThanOrEqual(low)
  })
})
