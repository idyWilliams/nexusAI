import { describe, expect, it } from 'vitest'
import { clusterPagesIntoThreads, pickBestThread } from './threads'
import type { PageHistory } from './types'

function page(p: Partial<PageHistory> & Pick<PageHistory, 'id' | 'url' | 'title' | 'domain' | 'startedAt'>): PageHistory {
  return {
    faviconUrl: null,
    endedAt: null,
    lastSeenAt: p.startedAt,
    activeMs: 60_000,
    ...p
  }
}

describe('clusterPagesIntoThreads', () => {
  it('groups close pages into one thread', () => {
    const t0 = Date.now() - 120_000
    const pages: PageHistory[] = [
      page({ id: 'a', url: 'https://github.com/a', title: 'PR 1', domain: 'github.com', startedAt: t0 }),
      page({
        id: 'b',
        url: 'https://stripe.com/docs',
        title: 'Webhooks',
        domain: 'stripe.com',
        startedAt: t0 + 60_000,
        endedAt: t0 + 60_000
      })
    ]
    const threads = clusterPagesIntoThreads(pages, 20 * 60 * 1000)
    expect(threads).toHaveLength(1)
    expect(threads[0]!.pageIds).toEqual(['a', 'b'])
  })

  it('splits on long gap when context differs', () => {
    const t0 = Date.now() - 3_600_000
    const pages: PageHistory[] = [
      page({ id: 'a', url: 'https://news.example/a', title: 'News', domain: 'news.example', startedAt: t0 }),
      page({
        id: 'b',
        url: 'https://shop.example/b',
        title: 'Shoes',
        domain: 'shop.example',
        startedAt: t0 + 30 * 60 * 1000,
        endedAt: t0 + 30 * 60 * 1000
      })
    ]
    const threads = clusterPagesIntoThreads(pages, 20 * 60 * 1000)
    expect(threads).toHaveLength(2)
  })
})

describe('pickBestThread', () => {
  it('returns null for empty', () => {
    expect(pickBestThread([], [], Date.now())).toBeNull()
  })
})
