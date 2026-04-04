import type { RecentVisit, WorkPatternState } from '$lib/types/workPattern'
import { DEFAULT_WORK_PATTERN, MAX_DOMAIN_KEYS, MAX_RECENT_VISITS } from '$lib/types/workPattern'
import { getWorkPatternState, setWorkPatternState } from '$lib/storage'
import { normalizeCoarseDomain } from '$lib/config/workDomains'
import { CONTINUATION_SCORE_THRESHOLD } from '$lib/constants/workPattern'
import { scoreVisit } from './scoring'

export interface ContinuationPick {
  visit: RecentVisit
  score: number
}

/**
 * Coarse work signals — bounded recent visits + domain frequency map.
 * v2/v3: flow hints, decay windows — search WORK_PATTERN_V3.
 */
export class WorkPatternEngine {
  private state: WorkPatternState = { ...DEFAULT_WORK_PATTERN }

  async load(): Promise<void> {
    this.state = await getWorkPatternState()
    if (this.state.schemaVersion < 2) {
      this.state = {
        ...DEFAULT_WORK_PATTERN,
        ...this.state,
        schemaVersion: 2,
        domainCounts: this.state.domainCounts ?? {}
      }
    }
  }

  getState(): WorkPatternState {
    return this.state
  }

  private bumpDomainCount(domain: string): void {
    const d = normalizeCoarseDomain(domain)
    const next = { ...this.state.domainCounts }
    next[d] = (next[d] ?? 0) + 1
    const keys = Object.keys(next)
    if (keys.length > MAX_DOMAIN_KEYS) {
      const sorted = keys.sort((a, b) => (next[b] ?? 0) - (next[a] ?? 0))
      for (const k of sorted.slice(MAX_DOMAIN_KEYS)) {
        delete next[k]
      }
    }
    this.state = { ...this.state, domainCounts: next }
  }

  /** Record a normalized visit; persists */
  async addVisit(visit: RecentVisit): Promise<void> {
    this.bumpDomainCount(visit.domain)
    const withoutDup = this.state.recentVisits.filter((v) => v.url !== visit.url)
    const next = [...withoutDup, visit].slice(-MAX_RECENT_VISITS)
    this.state = { ...this.state, recentVisits: next }
    await setWorkPatternState(this.state)
  }

  /** Top domains for transparency — sorted by count, coarse only */
  getTopDomains(limit = 8): Array<{ domain: string; count: number }> {
    const entries = Object.entries(this.state.domainCounts)
    return entries
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  /**
   * Pick the best continuation target: prefers likely-work domains, uses recency + worthiness score.
   * Returns null when nothing is worth showing (caller may show “Start fresh”).
   */
  pickBestContinuation(now: number): ContinuationPick | null {
    const visits = [...this.state.recentVisits].reverse()
    if (visits.length === 0) return null

    let best: RecentVisit | null = null
    let bestScore = 0

    for (const v of visits) {
      const s = scoreVisit(v, now, this.state.domainCounts)
      if (s > bestScore) {
        bestScore = s
        best = v
      }
    }

    if (best == null) return null
    if (bestScore < CONTINUATION_SCORE_THRESHOLD) return null
    return { visit: best, score: bestScore }
  }

  /** Summaries for transparency — human-ish, coarse */
  getPatternSummaries(now: Date = new Date()): string[] {
    let top = this.getTopDomains(3)
    if (top.length === 0 && this.state.recentVisits.length > 0) {
      const m = new Map<string, number>()
      for (const v of this.state.recentVisits) {
        const d = normalizeCoarseDomain(v.domain)
        m.set(d, (m.get(d) ?? 0) + 1)
      }
      top = [...m.entries()]
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
    }
    if (top.length === 0) {
      return [
        'No coarse patterns yet. When memory is on and activity awareness is allowed, NEXUS summarizes domains you revisit — not full URLs.'
      ]
    }
    const hour = now.getHours()
    const tod =
      hour >= 5 && hour < 12
        ? 'morning'
        : hour >= 12 && hour < 17
          ? 'afternoon'
          : hour >= 17 && hour < 22
            ? 'evening'
            : 'night'
    const lines: string[] = []
    lines.push(
      `You often touch “${top[0].domain}” in your recent browsing (${top[0].count} coarse hits).`
    )
    if (top[1]) {
      lines.push(`“${top[1].domain}” shows up regularly too (${top[1].count}).`)
    }
    lines.push(`These rhythms are approximate — useful for context, not surveillance. Often active in the ${tod}.`)
    return lines
  }

  async clearAll(): Promise<void> {
    this.state = {
      ...DEFAULT_WORK_PATTERN,
      schemaVersion: 2,
      recentVisits: [],
      domainCounts: {}
    }
    await setWorkPatternState(this.state)
  }

  async removeDomain(domain: string): Promise<void> {
    const d = normalizeCoarseDomain(domain)
    const nextCounts = { ...this.state.domainCounts }
    delete nextCounts[d]
    const nextVisits = this.state.recentVisits.filter((v) => normalizeCoarseDomain(v.domain) !== d)
    this.state = { ...this.state, domainCounts: nextCounts, recentVisits: nextVisits }
    await setWorkPatternState(this.state)
  }
}
