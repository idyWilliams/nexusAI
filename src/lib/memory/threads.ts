import { isLikelyWorkDomain, normalizeCoarseDomain } from '$lib/config/workDomains'
import type { PageHistory, Thread } from './types'

/** Gap after which we start a new temporal episode */
export const DEFAULT_THREAD_GAP_MS = 20 * 60 * 1000

function tokenizeTitle(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  )
}

function titleSimilarity(a: string, b: string): number {
  const A = tokenizeTitle(a)
  const B = tokenizeTitle(b)
  if (A.size === 0 || B.size === 0) return 0
  let inter = 0
  for (const t of A) {
    if (B.has(t)) inter++
  }
  return inter / Math.max(A.size, B.size)
}

function sameContext(a: PageHistory, b: PageHistory): boolean {
  if (normalizeCoarseDomain(a.domain) === normalizeCoarseDomain(b.domain)) return true
  if (titleSimilarity(a.title, b.title) >= 0.35) return true
  try {
    const pa = new URL(a.url).pathname
    const pb = new URL(b.url).pathname
    if (pa.length > 4 && pb.startsWith(pa.slice(0, Math.min(pa.length, 32)))) return true
  } catch {
    /* ignore */
  }
  return false
}

function stableThreadId(pageIds: string[]): string {
  const s = pageIds.join('|')
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return `th_${(h >>> 0).toString(16)}`
}

function heuristicLabel(pages: PageHistory[]): string {
  const sorted = [...pages].sort((a, b) => b.activeMs - a.activeMs)
  const primary = sorted.find((p) => isLikelyWorkDomain(p.domain)) ?? sorted[0]
  if (!primary) return 'Recent browsing'
  const base = primary.title.trim() || primary.domain
  const short = base.length > 48 ? `${base.slice(0, 45)}…` : base
  const uniqDomains = new Set(pages.map((p) => normalizeCoarseDomain(p.domain)))
  if (uniqDomains.size > 1) {
    return `${short} · ${uniqDomains.size} sites`
  }
  return short
}

/**
 * Cluster page segments into temporal threads (time gap + loose context).
 * Pages should be sorted by `startedAt` ascending before calling (caller may sort).
 */
export function clusterPagesIntoThreads(
  pages: PageHistory[],
  gapMs: number = DEFAULT_THREAD_GAP_MS
): Thread[] {
  const sorted = [...pages].sort((a, b) => a.startedAt - b.startedAt)
  if (sorted.length === 0) return []

  const threads: Thread[] = []
  let cur: PageHistory[] = [sorted[0]!]

  for (let i = 1; i < sorted.length; i++) {
    const p = sorted[i]!
    const prev = cur[cur.length - 1]!
    const prevEnd = prev.endedAt ?? prev.lastSeenAt
    const gap = p.startedAt - prevEnd
    if (gap > gapMs && !sameContext(prev, p)) {
      threads.push(finishThread(cur))
      cur = [p]
    } else {
      cur.push(p)
    }
  }
  threads.push(finishThread(cur))
  return threads
}

function finishThread(pages: PageHistory[]): Thread {
  const pageIds = pages.map((p) => p.id)
  const startedAt = pages[0]!.startedAt
  const endedAt = pages.reduce((m, p) => Math.max(m, p.endedAt ?? p.lastSeenAt), startedAt)
  return {
    id: stableThreadId(pageIds),
    startedAt,
    endedAt,
    pageIds,
    label: heuristicLabel(pages)
  }
}

/** Weighted score for “continue this thread” — active time + work-likelihood, recency */
export function scoreThreadForContinuation(thread: Thread, pages: PageHistory[], now: number): number {
  const map = new Map(pages.map((p) => [p.id, p]))
  const members = thread.pageIds.map((id) => map.get(id)).filter(Boolean) as PageHistory[]
  if (members.length === 0) return 0
  const activeMs = members.reduce((s, p) => s + p.activeMs, 0)
  const activeScore = Math.min(1, activeMs / (15 * 60 * 1000))
  const lastAt = Math.max(...members.map((p) => p.endedAt ?? p.lastSeenAt))
  const age = now - lastAt
  let recency = 0.35
  if (age < 20 * 60 * 1000) recency = 1
  else if (age < 60 * 60 * 1000) recency = 0.85
  else if (age < 4 * 60 * 60 * 1000) recency = 0.65
  const workBoost =
    members.some((p) => isLikelyWorkDomain(p.domain) || p.domain === 'localhost') ? 0.2 : 0
  return recency * 0.55 + activeScore * 0.35 + workBoost
}

export function pickBestThread(threads: Thread[], pages: PageHistory[], now: number): Thread | null {
  if (threads.length === 0) return null
  let best: Thread | null = null
  let bestS = 0
  for (const t of threads) {
    const s = scoreThreadForContinuation(t, pages, now)
    if (s > bestS) {
      bestS = s
      best = t
    }
  }
  return best
}
