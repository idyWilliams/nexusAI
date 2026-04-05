import type { Settings } from '$lib/types/settings'
import type { ContextRecoverySnapshot, MemoryRecallHitUi, PageHistory, SearchResult } from './types'
import { DEFAULT_CONTEXT_RECOVERY } from './types'
import { formatRelativeTime } from './formatRelative'
import { resolvePageIconUrl } from './icons'
import { searchMemory } from './recall'
import { clusterPagesIntoThreads, pickBestThread } from './threads'
import type { MemoryVault } from './vault'

function toRecallHitUi(r: SearchResult, now: number): MemoryRecallHitUi {
  if (r.kind === 'page') {
    const p = r.page
    const iconUrl = resolvePageIconUrl(p.domain, p.url, p.faviconUrl)
    const snippet = p.metaDescription?.trim() || (p.headings?.[0] ?? null) || null
    return {
      kind: 'page',
      score: r.score,
      title: p.title || p.domain,
      url: p.url,
      domain: p.domain,
      iconUrl,
      snippet,
      pageId: p.id,
      whenLabel: formatRelativeTime(p.startedAt, now)
    }
  }
  const t = r.thread
  const primary = r.pages.reduce((a, b) => (a.activeMs >= b.activeMs ? a : b), r.pages[0]!)
  const iconUrl = resolvePageIconUrl(primary.domain, primary.url, primary.faviconUrl)
  return {
    kind: 'thread',
    score: r.score,
    title: t.label || 'Work thread',
    domain: `${r.pages.length} pages`,
    iconUrl,
    snippet: r.pages.map((p) => p.title).slice(0, 3).join(' · ') || null,
    threadId: t.id,
    whenLabel: formatRelativeTime(t.endedAt, now)
  }
}

export async function buildContextRecoverySnapshot(
  vault: MemoryVault,
  settings: Settings,
  tabsPermission: boolean,
  recallQuery: string | null,
  now: number
): Promise<ContextRecoverySnapshot> {
  const enabled = settings.memoryLevel !== 'off' && tabsPermission
  if (!enabled) {
    return { ...DEFAULT_CONTEXT_RECOVERY, enabled: false }
  }

  await vault.open()
  const pages = await vault.getRecentPages(500)
  const threads = clusterPagesIntoThreads(pages)
  const best = pickBestThread(threads, pages, now)

  let topThread: ContextRecoverySnapshot['topThread'] = null
  if (best) {
    const byId = new Map(pages.map((p) => [p.id, p]))
    const members = best.pageIds.map((id) => byId.get(id)).filter(Boolean) as PageHistory[]
    const activeMs = members.reduce((s, p) => s + p.activeMs, 0)
    topThread = {
      id: best.id,
      label: best.label || 'Recent thread',
      pageCount: members.length,
      activeMinutesEstimate: Math.max(1, Math.round(activeMs / 60000)),
      lastActivityAt: best.endedAt,
      pages: members.map((p) => ({
        url: p.url,
        title: p.title || p.domain,
        domain: p.domain,
        iconUrl: resolvePageIconUrl(p.domain, p.url, p.faviconUrl)
      }))
    }
  }

  const q = recallQuery?.trim() ?? ''
  const hits =
    q.length > 0
      ? searchMemory(q, pages, now, 20).map((r) => toRecallHitUi(r, now))
      : []

  return {
    enabled: true,
    topThread,
    recentPageCount: pages.length,
    recallHits: hits
  }
}
