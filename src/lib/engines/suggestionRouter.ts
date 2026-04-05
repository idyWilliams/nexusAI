import type { Settings } from '$lib/types/settings'
import type { Suggestion } from '$lib/types/suggestions'
import type { RecentVisit } from '$lib/types/workPattern'
import type { DismissalState } from '$lib/storage'
import {
  CONFIDENCE_FROM_SCORE_BASE,
  CONFIDENCE_FROM_SCORE_SCALE,
  CONTINUE_COOLDOWN_MS,
  MAX_CONFIDENCE,
  MIN_CONTINUE_CONFIDENCE
} from '$lib/constants/suggestions'
import { hashString } from './stableId'
import { isLikelyWorkDomain } from '$lib/config/workDomains'

/** Must match service worker dismiss key: `${type}:${suggestionId}` */
function continueDismissalKey(suggestionId: string): string {
  return `CONTINUE_URL:${suggestionId}`
}

function isNeverAgain(dismissals: DismissalState, key: string): boolean {
  return dismissals.entries[key]?.neverAgain === true
}

function isInCooldown(dismissals: DismissalState, key: string, now: number): boolean {
  const last = dismissals.entries[key]?.lastDismissedAt
  if (last == null) return false
  return now - last < CONTINUE_COOLDOWN_MS
}

export interface RouterInput {
  settings: Settings
  dismissals: DismissalState
  candidateVisit: RecentVisit | null
  /** From WorkPatternEngine.pickBestContinuation */
  candidateScore?: number
  now?: number
}

function reasonLine(settings: Settings, visit: RecentVisit): string {
  const work = isLikelyWorkDomain(visit.domain)
  const age = Date.now() - visit.visitedAt
  const ageMinutes = Math.floor(age / (1000 * 60))
  
  if (settings.mode === 'focus') {
    if (work) {
      return 'Recent work context — continue without distractions.'
    }
    return 'Pick up where you left off — single focus.'
  }
  
  if (work) {
    if (ageMinutes < 30) {
      return `Recent work in ${visit.domain} — continue while it's fresh.`
    }
    return `Work context you touched recently — ${visit.domain}.`
  }
  
  if (ageMinutes < 60) {
    return `Recent activity in ${visit.domain} — continue when ready.`
  }
  return `Continue where you were active — ${visit.domain}.`
}

/**
 * At most ONE Continue suggestion per hydration (constitution: resume, don’t nag).
 */
export function routeContinueSuggestions(input: RouterInput): Suggestion[] {
  const now = input.now ?? Date.now()
  const { settings, dismissals, candidateVisit } = input

  if (!candidateVisit) return []
  if (settings.memoryLevel === 'off') return []
  if (settings.mode === 'minimal') return []
  if (!settings.personalizationEnabled) return []

  const stable = hashString(candidateVisit.url)
  const suggestionId = `continue-${stable}`
  const key = continueDismissalKey(suggestionId)
  if (isNeverAgain(dismissals, key)) return []
  if (isInCooldown(dismissals, key, now)) return []

  const confidence =
    input.candidateScore != null
      ? Math.min(
          MAX_CONFIDENCE,
          CONFIDENCE_FROM_SCORE_BASE + input.candidateScore * CONFIDENCE_FROM_SCORE_SCALE
        )
      : 0.5
  if (confidence < MIN_CONTINUE_CONFIDENCE) return []

  const suggestion: Suggestion = {
    id: suggestionId,
    type: 'CONTINUE_URL',
    title: shortTitle(candidateVisit.title, candidateVisit.domain),
    url: candidateVisit.url,
    confidence,
    reasonLine: reasonLine(settings, candidateVisit),
    createdAt: now
  }

  return [suggestion]
}

function shortTitle(title: string, domain: string): string {
  const t = title.trim()
  if (t && t.length < 72 && !/^https?:\/\//i.test(t)) return t
  
  // For work domains, provide more context
  const workContexts: Record<string, string> = {
    'github.com': 'GitHub',
    'gitlab.com': 'GitLab',
    'notion.so': 'Notion',
    'notion.site': 'Notion',
    'linear.app': 'Linear',
    'asana.com': 'Asana',
    'monday.com': 'Monday',
    'clickup.com': 'ClickUp',
    'figma.com': 'Figma',
    'slack.com': 'Slack',
    'docs.google.com': 'Google Docs',
    'drive.google.com': 'Google Drive',
    'mail.google.com': 'Gmail',
    'calendar.google.com': 'Google Calendar',
    'office.com': 'Microsoft 365',
    'outlook.office.com': 'Outlook',
    'teams.microsoft.com': 'Teams'
  }
  
  return workContexts[domain] || domain
}
