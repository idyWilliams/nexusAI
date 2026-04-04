/** Coarse continuation targets — bounded, local-only. */
export interface RecentVisit {
  url: string
  title: string
  domain: string
  visitedAt: number
}

export interface WorkPatternState {
  schemaVersion: number
  /** Bounded list, most recent last — persisted for continuity across SW restarts */
  recentVisits: RecentVisit[]
  /**
   * Rolling counts per coarse domain (hostname, www-stripped), capped keys in engine.
   * v2+: used for transparency + continuation worthiness.
   */
  domainCounts: Record<string, number>
}

export const DEFAULT_WORK_PATTERN: WorkPatternState = {
  schemaVersion: 2,
  recentVisits: [],
  domainCounts: {}
}

export const MAX_RECENT_VISITS = 16
export const MAX_DOMAIN_KEYS = 48
