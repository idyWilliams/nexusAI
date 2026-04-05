import { describe, expect, it } from 'vitest'
import { scoreVisit } from './scoring'
import type { RecentVisit } from '$lib/types/workPattern'

describe('scoreVisit', () => {
  const now = Date.now()
  const domainCounts: Record<string, number> = {}

  it('scores recent visits higher', () => {
    const recent: RecentVisit = {
      url: 'https://github.com/test',
      title: 'Test',
      domain: 'github.com',
      visitedAt: now - 10 * 60 * 1000 // 10 minutes ago
    }
    const old: RecentVisit = {
      url: 'https://github.com/old',
      title: 'Old',
      domain: 'github.com',
      visitedAt: now - 4 * 60 * 60 * 1000 // 4 hours ago
    }
    const recentScore = scoreVisit(recent, now, domainCounts)
    const oldScore = scoreVisit(old, now, domainCounts)
    expect(recentScore).toBeGreaterThan(oldScore)
  })

  it('boosts work domains', () => {
    const work: RecentVisit = {
      url: 'https://github.com/test',
      title: 'Test',
      domain: 'github.com',
      visitedAt: now - 30 * 60 * 1000
    }
    const nonWork: RecentVisit = {
      url: 'https://example.com/test',
      title: 'Test',
      domain: 'example.com',
      visitedAt: now - 30 * 60 * 1000
    }
    const workScore = scoreVisit(work, now, domainCounts)
    const nonWorkScore = scoreVisit(nonWork, now, domainCounts)
    expect(workScore).toBeGreaterThan(nonWorkScore)
    expect(workScore - nonWorkScore).toBeCloseTo(0.25, 2)
  })

  it('considers domain frequency', () => {
    const visit: RecentVisit = {
      url: 'https://github.com/test',
      title: 'Test',
      domain: 'github.com',
      visitedAt: now - 30 * 60 * 1000
    }
    const noFreqScore = scoreVisit(visit, now, { 'github.com': 1 })
    const withFreqScore = scoreVisit(visit, now, { 'github.com': 5 })
    expect(withFreqScore).toBeGreaterThan(noFreqScore)
  })

  it('caps frequency contribution', () => {
    const visit: RecentVisit = {
      url: 'https://github.com/test',
      title: 'Test',
      domain: 'github.com',
      visitedAt: now - 30 * 60 * 1000
    }
    const moderateFreqScore = scoreVisit(visit, now, { 'github.com': 4 })
    const highFreqScore = scoreVisit(visit, now, { 'github.com': 20 })
    // Frequency should be capped at 1.0, so scores should be very close
    expect(highFreqScore).toBeCloseTo(moderateFreqScore, 0.01)
  })

  it('provides reasonable score ranges', () => {
    const recentWork: RecentVisit = {
      url: 'https://github.com/test',
      title: 'Test',
      domain: 'github.com',
      visitedAt: now - 5 * 60 * 1000
    }
    const score = scoreVisit(recentWork, now, { 'github.com': 3 })
    expect(score).toBeGreaterThan(0.5)
    expect(score).toBeLessThan(1.0)
  })
})
