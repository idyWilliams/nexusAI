import type { Settings } from '$lib/types/settings'
import type { TaskCandidate } from '$lib/types/tasks'
import type { RecentVisit } from '$lib/types/workPattern'
import { getTaskInferenceMeta, setTaskInferenceMeta } from '$lib/storage'
import {
  TASK_INFERENCE_MIN_INTERVAL_MS,
  TASK_INFERENCE_SHOWN_IDS_CAP
} from '$lib/constants/taskInference'

/**
 * Inference → artifact pipeline (candidate only). No notifications in MVP.
 * Expand: thresholds, provenance from issue trackers, caps per day.
 */
export async function maybeGenerateTaskCandidate(
  settings: Settings,
  visits: RecentVisit[]
): Promise<TaskCandidate | null> {
  if (settings.mode === 'focus') return null
  if (settings.memoryLevel === 'off') return null
  if (!settings.personalizationEnabled) return null
  if (visits.length < 2) return null

  const meta = await getTaskInferenceMeta()
  const now = Date.now()
  if (meta.lastCandidateAt && now - meta.lastCandidateAt < TASK_INFERENCE_MIN_INTERVAL_MS) return null

  const last = visits[visits.length - 1]
  const prev = visits[visits.length - 2]
  if (last.domain !== prev.domain) return null

  const id = `infer-${last.domain}-${Math.floor(now / TASK_INFERENCE_MIN_INTERVAL_MS)}`
  if (meta.shownIds.includes(id)) return null
  if (meta.dismissedIds.includes(id)) return null

  const candidate: TaskCandidate = {
    id,
    titleGuess: `Follow up on ${last.domain}`,
    provenance: {
      kind: 'inferred',
      reasonCodes: ['repeated_domain', 'continuation_rhythm'],
      evidenceSummary: `You returned to ${last.domain} in succession — optional follow-up.`,
      coarseDomain: last.domain
    },
    confidence: 0.42,
    createdAt: now
  }

  await setTaskInferenceMeta({
    ...meta,
    lastCandidateAt: now,
    shownIds: [...meta.shownIds, id].slice(-TASK_INFERENCE_SHOWN_IDS_CAP)
  })

  return candidate
}
