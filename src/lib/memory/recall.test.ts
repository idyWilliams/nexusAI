import { describe, expect, it } from 'vitest'
import { searchMemory } from './recall'
import type { PageHistory } from './types'

function page(p: Partial<PageHistory> & Pick<PageHistory, 'id' | 'url' | 'title' | 'domain' | 'startedAt'>): PageHistory {
  return {
    faviconUrl: null,
    endedAt: null,
    lastSeenAt: p.startedAt,
    activeMs: 120_000,
    metaDescription: p.metaDescription,
    ...p
  }
}

describe('searchMemory', () => {
  const now = Date.now()
  const pages: PageHistory[] = [
    page({
      id: '1',
      url: 'https://stripe.com/docs/webhooks',
      title: 'Stripe webhook retries',
      domain: 'stripe.com',
      startedAt: now - 3600_000,
      metaDescription: 'Learn how to handle retries'
    }),
    page({
      id: '2',
      url: 'https://github.com/org/repo/pull/12',
      title: 'Fix payment bug',
      domain: 'github.com',
      startedAt: now - 7200_000
    })
  ]

  it('matches title tokens', () => {
    const hits = searchMemory('stripe webhook', pages, now, 10)
    expect(hits.some((h) => h.kind === 'page' && h.page.id === '1')).toBe(true)
  })

  it('returns empty for blank query', () => {
    expect(searchMemory('   ', pages, now)).toEqual([])
  })

  it('matches domain-ish query', () => {
    const hits = searchMemory('github pull', pages, now, 10)
    expect(hits.length).toBeGreaterThan(0)
  })
})
