import { normalizeCoarseDomain } from '$lib/config/workDomains'
import type { PageHistory, SearchResult, Thread } from './types'
import { clusterPagesIntoThreads } from './threads'

function normalizeText(s: string): string {
  return s.toLowerCase().trim()
}

/** Cheap fuzzy: substring + token overlap + 1-char typo tolerance on short tokens */
function literalScore(haystack: string, needle: string): number {
  if (!needle) return 0
  const h = normalizeText(haystack)
  const n = normalizeText(needle)
  if (!n) return 0
  if (h.includes(n)) return 1
  const hn = h.replace(/\s+/g, ' ')
  const tokens = n.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return 0
  let hits = 0
  for (const t of tokens) {
    if (t.length <= 2) {
      if (hn.split(/\s/).some((w) => w === t || w.startsWith(t))) hits++
      continue
    }
    if (hn.includes(t)) {
      hits++
      continue
    }
    if (levenshtein1(hn, t)) hits += 0.55
  }
  return hits / tokens.length
}

function levenshtein1(hay: string, word: string): boolean {
  if (word.length < 4) return false
  let i = 0
  while (i <= hay.length - word.length) {
    const slice = hay.slice(i, i + word.length)
    if (editDistanceAtMost1(slice, word)) return true
    i++
  }
  return false
}

function editDistanceAtMost1(a: string, b: string): boolean {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0
  let j = 0
  let edits = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++
      j++
      continue
    }
    if (edits > 0) return false
    edits++
    if (a.length === b.length) {
      i++
      j++
    } else if (a.length > b.length) {
      i++
    } else {
      j++
    }
  }
  if (i < a.length || j < b.length) edits++
  return edits <= 1
}

function pageSearchBlob(p: PageHistory): string {
  const parts = [
    p.title,
    p.url,
    p.domain,
    p.metaDescription ?? '',
    ...(p.headings ?? [])
  ]
  return parts.join(' \n ')
}

function recencyBoost(startedAt: number, now: number): number {
  const ageH = (now - startedAt) / (1000 * 60 * 60)
  return 1 / (1 + ageH / 6)
}

/**
 * Hybrid literal + fuzzy recall over safe metadata only.
 * Threads are derived on the fly from the same page set (MVP).
 */
export function searchMemory(
  query: string,
  pages: PageHistory[],
  now: number,
  maxResults = 24
): SearchResult[] {
  const q = query.trim()
  if (!q) return []

  const threads = clusterPagesIntoThreads(pages)
  const pageById = new Map(pages.map((p) => [p.id, p]))

  const pageScores: Array<{ page: PageHistory; score: number; field: string }> = []
  for (const p of pages) {
    const blob = pageSearchBlob(p)
    const sTitle = literalScore(p.title, q) * 1.15
    const sUrl = literalScore(p.url, q) * 1.05
    const sDomain = literalScore(p.domain, q) * 1.0
    const sBlob = literalScore(blob, q) * 0.95
    const raw = Math.max(sTitle, sUrl, sDomain, sBlob)
    if (raw <= 0.08) continue
    const field =
      sTitle >= sUrl && sTitle >= sDomain && sTitle >= sBlob
        ? 'title'
        : sUrl >= sDomain && sUrl >= sBlob
          ? 'url'
          : sDomain >= sBlob
            ? 'domain'
            : 'text'
    const score = raw * (0.55 + 0.45 * recencyBoost(p.startedAt, now))
    pageScores.push({ page: p, score, field })
  }

  const threadScores: Array<{ thread: Thread; pages: PageHistory[]; score: number }> = []
  for (const t of threads) {
    const members = t.pageIds.map((id) => pageById.get(id)).filter(Boolean) as PageHistory[]
    const blob = members.map(pageSearchBlob).join('\n')
    const raw = literalScore(blob, q)
    if (raw <= 0.06) continue
    const lastStart = Math.max(...members.map((m) => m.startedAt))
    const score = raw * (0.5 + 0.5 * recencyBoost(lastStart, now))
    if (t.label) {
      const ls = literalScore(t.label, q)
      if (ls > raw * 0.8) {
        threadScores.push({ thread: t, pages: members, score: Math.max(score, ls * 1.05) })
        continue
      }
    }
    threadScores.push({ thread: t, pages: members, score })
  }

  const merged: SearchResult[] = [
    ...pageScores.map((x) => ({
      kind: 'page' as const,
      page: x.page,
      score: x.score,
      matchedField: x.field
    })),
    ...threadScores.map((x) => ({
      kind: 'thread' as const,
      thread: x.thread,
      pages: x.pages,
      score: x.score * 1.02
    }))
  ]

  merged.sort((a, b) => b.score - a.score)

  const seenUrl = new Set<string>()
  const deduped: SearchResult[] = []
  for (const m of merged) {
    if (m.kind === 'page') {
      const k = `${normalizeCoarseDomain(m.page.domain)}|${m.page.url}`
      if (seenUrl.has(k)) continue
      seenUrl.add(k)
      deduped.push(m)
    } else {
      deduped.push(m)
    }
    if (deduped.length >= maxResults) break
  }

  return deduped
}
