import type { HydratePayload } from '$lib/types/messages'
import type { UiToBackgroundMessage } from '$lib/types/messages'
import {
  addStoredTask,
  getAssistantDismissals,
  getDismissalState,
  getSessionState,
  getSettings,
  getTaskInferenceMeta,
  patchSettings,
  setAssistantDismissals,
  setDismissalState,
  setRecoveryMeta,
  setSessionState,
  setTaskInferenceMeta,
  type DismissalState
} from '$lib/storage'
import type { WorkPatternEngine } from '$lib/engines/workPatternEngine'
import { buildHydratePayload } from '../hydration/buildHydratePayload'
import { removeOptionalPermission } from '$lib/permissions/chromePermissions'
import { requestTabsPermission } from '../activityObserver'

function dismissSuggestionKey(
  dismissals: DismissalState,
  payload: { suggestionId: string; suggestionType: 'CONTINUE_URL'; neverAgain?: boolean }
): DismissalState {
  const key = `${payload.suggestionType}:${payload.suggestionId}`
  return {
    ...dismissals,
    entries: {
      ...dismissals.entries,
      [key]: {
        lastDismissedAt: Date.now(),
        neverAgain: payload.neverAgain === true
      }
    }
  }
}

export function createUiMessageHandler(deps: {
  workEngine: WorkPatternEngine
  onAfterMutation: () => void
}): (message: UiToBackgroundMessage) => Promise<HydratePayload> {
  const { workEngine, onAfterMutation } = deps

  return async function handleUiMessage(message: UiToBackgroundMessage): Promise<HydratePayload> {
    switch (message.type) {
      case 'SHELL_READY': {
        void message.payload.buildId
        return buildHydratePayload(workEngine)
      }
      case 'HYDRATE_REQUEST':
        return buildHydratePayload(workEngine)
      case 'USER_DISMISS': {
        const d0 = await getDismissalState()
        await setDismissalState(dismissSuggestionKey(d0, message.payload))
        return buildHydratePayload(workEngine)
      }
      case 'MODE_SET': {
        await patchSettings({ mode: message.payload.mode })
        const s = await getSessionState()
        await setSessionState({ ...s, activeMode: message.payload.mode })
        return buildHydratePayload(workEngine)
      }
      case 'SETTINGS_PATCH': {
        const prev = await getSettings()
        const next = await patchSettings(message.payload)
        if (message.payload.mode !== undefined) {
          const s = await getSessionState()
          await setSessionState({ ...s, activeMode: next.mode })
        }
        if (message.payload.activityAwarenessEnabled === true) {
          const granted = await requestTabsPermission()
          if (!granted) {
            await patchSettings({ activityAwarenessEnabled: false })
          }
        }
        if (
          message.payload.activityAwarenessEnabled === false &&
          prev.activityAwarenessEnabled === true
        ) {
          await removeOptionalPermission('tabs').catch(() => false)
        }
        onAfterMutation()
        return buildHydratePayload(workEngine)
      }
      case 'REQUEST_TABS_PERMISSION': {
        await requestTabsPermission()
        onAfterMutation()
        return buildHydratePayload(workEngine)
      }
      case 'TASK_CANDIDATE_DISMISS': {
        const m = await getTaskInferenceMeta()
        await setTaskInferenceMeta({
          ...m,
          dismissedIds: [...new Set([...m.dismissedIds, message.payload.candidateId])]
        })
        return buildHydratePayload(workEngine)
      }
      case 'TASK_CANDIDATE_ACCEPT': {
        const hydrate = await buildHydratePayload(workEngine)
        const c = hydrate.taskCandidate
        const id = message.payload.candidateId
        if (c && c.id === id) {
          await addStoredTask({
            id: c.id,
            title: message.payload.title ?? c.titleGuess,
            createdAt: Date.now(),
            provenanceSummary: c.provenance.evidenceSummary
          })
        } else {
          await addStoredTask({
            id,
            title: message.payload.title ?? 'Task',
            createdAt: Date.now(),
            provenanceSummary: 'Saved from NEXUS.'
          })
        }
        const meta = await getTaskInferenceMeta()
        await setTaskInferenceMeta({
          ...meta,
          dismissedIds: [...new Set([...meta.dismissedIds, id])],
          lastCandidateAt: Date.now()
        })
        return buildHydratePayload(workEngine)
      }
      case 'CLEAR_WORK_PATTERNS': {
        await workEngine.clearAll()
        return buildHydratePayload(workEngine)
      }
      case 'REMOVE_DOMAIN_FROM_PATTERNS': {
        await workEngine.removeDomain(message.payload.domain)
        return buildHydratePayload(workEngine)
      }
      case 'GAME_SESSION_END': {
        await setRecoveryMeta({
          schemaVersion: 1,
          lastPlayedAt: message.payload.endedAt
        })
        return buildHydratePayload(workEngine)
      }
      case 'ASSISTANT_DISMISS_SUGGESTION': {
        const dismissals = await getAssistantDismissals()
        await setAssistantDismissals({
          ...dismissals,
          entries: {
            ...dismissals.entries,
            [message.payload.suggestionId]: {
              lastDismissedAt: Date.now()
            }
          }
        })
        return buildHydratePayload(workEngine)
      }
      default: {
        const _exhaustive: never = message
        return _exhaustive
      }
    }
  }
}
