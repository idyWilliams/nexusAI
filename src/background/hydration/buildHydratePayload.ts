import type { HydratePayload } from '$lib/types/messages'
import { computeAssistantViewModel } from '$lib/engines/assistantViewModel'
import {
  getAiSession,
  getAssistantDismissals,
  getDismissalState,
  getSessionState,
  getSettings,
  getRecoveryMeta,
  getTaskInferenceMeta,
  getWorkPatternState
} from '$lib/storage'
import type { WorkPatternEngine } from '$lib/engines/workPatternEngine'
import type { TaskCandidate } from '$lib/types/tasks'
import type { WorkPatternState } from '$lib/types/workPattern'
import { routeContinueSuggestions, maybeGenerateTaskCandidate } from '$lib/engines'
import { computeContinueEmptyReason } from '$lib/engines/continueEmptyReason'
import { hasTabsPermission } from '../activityObserver'

export { computeContinueEmptyReason } from '$lib/engines/continueEmptyReason'

export async function buildHydratePayload(workEngine: WorkPatternEngine): Promise<HydratePayload> {
  const settings = await getSettings()
  const session = await getSessionState()
  const dismissals = await getDismissalState()
  const assistantDismissals = await getAssistantDismissals()
  const tabsPermission = await hasTabsPermission()
  const recovery = await getRecoveryMeta()

  await workEngine.load()
  const pick = workEngine.pickBestContinuation(Date.now())
  const candidateVisit = pick?.visit ?? null
  const candidateScore = pick?.score

  const suggestions = routeContinueSuggestions({
    settings,
    dismissals,
    candidateVisit,
    candidateScore,
    now: Date.now()
  })

  let taskCandidate: TaskCandidate | null = await maybeGenerateTaskCandidate(
    settings,
    workEngine.getState().recentVisits
  )
  const meta = await getTaskInferenceMeta()
  if (taskCandidate && meta.dismissedIds.includes(taskCandidate.id)) {
    taskCandidate = null
  }

  const patternSummaries = workEngine.getPatternSummaries()
  const transparencyTopDomains = workEngine.getTopDomains(10)
  const visitCount = workEngine.getState().recentVisits.length

  const continueEmptyReason = computeContinueEmptyReason(
    settings,
    tabsPermission,
    suggestions.length,
    visitCount
  )

  const now = Date.now()
  const assistant = computeAssistantViewModel({
    mode: settings.mode,
    patternSummaries,
    transparencyTopDomains,
    suggestions,
    taskCandidate,
    continueEmptyReason,
    assistantDismissals,
    now
  })

  return {
    settings,
    session: { ...session, activeMode: settings.mode, lastHydratedAt: new Date().toISOString() },
    suggestions,
    taskCandidate,
    tabsPermission,
    patternSummaries,
    continueEmptyReason,
    transparencyTopDomains,
    recoveryLastPlayedAt: recovery.lastPlayedAt,
    assistant,
    aiSession: await getAiSession()
  }
}
