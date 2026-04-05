import type { RecentVisit } from '$lib/types/workPattern'
import { DOMAIN_FREQ_CAP } from '$lib/constants/workPattern'
import { isLikelyWorkDomain, normalizeCoarseDomain } from '$lib/config/workDomains'

const MS_HOUR = 1000 * 60 * 60

/**
 * Deterministic continuation worthiness — exported for tests and transparency.
 * Constitution: coarse signals only (domain, recency, repeat frequency).
 */
export function scoreVisit(
  v: RecentVisit,
  now: number,
  domainCounts: Record<string, number>
): number {
  const age = now - v.visitedAt
  let recency = 0.35
  if (age < 20 * 60 * 1000) recency = 1.0
  else if (age < MS_HOUR) recency = 0.85
  else if (age < 4 * MS_HOUR) recency = 0.65
  else if (age < 24 * MS_HOUR) recency = 0.45
  else recency = 0.30

  const d = normalizeCoarseDomain(v.domain)
  const freq = Math.min(1, (domainCounts[d] ?? 1) / DOMAIN_FREQ_CAP)
  const workBoost = isLikelyWorkDomain(v.domain) ? 0.25 : 0

  return recency * 0.50 + freq * 0.30 + workBoost
}
