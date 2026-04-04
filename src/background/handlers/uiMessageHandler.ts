import type { HydratePayload } from '$lib/types/messages'
import type { UiToBackgroundMessage } from '$lib/types/messages'
import {
  addStoredTask,
  getAiSession,
  getAssistantDismissals,
  getDismissalState,
  getSessionState,
  getSettings,
  getTaskInferenceMeta,
  patchSettings,
  setAiSession,
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
import { createAiClient } from '$lib/ai'
import { buildWorkSummaryInput, buildTaskPolishInput } from '$lib/ai/builders'
import type { AssistantEngineInput } from '$lib/types/assistant'

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

async function handleAiSummaryRequest(workEngine: WorkPatternEngine): Promise<HydratePayload> {
  try {
    const settings = await getSettings()
    if (!settings.aiEnabled || !settings.aiFeatures.summaries) {
      return buildHydratePayload(workEngine)
    }

    const session = await getAiSession()
    const requestLimit = parseInt(import.meta.env.VITE_NEXUS_AI_REQUEST_LIMIT || '3')
    
    if (session.requestCount >= requestLimit) {
      await setAiSession({
        ...session,
        lastError: 'Request limit reached. Try again later.'
      })
      return buildHydratePayload(workEngine)
    }

    // Update session state to loading
    await setAiSession({
      ...session,
      summary: 'loading',
      requestCount: session.requestCount + 1
    })

    const hydrate = await buildHydratePayload(workEngine)
    
    // Build the assistant engine input from hydrate data
    const assistantInput: AssistantEngineInput = {
      mode: hydrate.settings.mode,
      patternSummaries: hydrate.patternSummaries,
      transparencyTopDomains: hydrate.transparencyTopDomains,
      suggestions: hydrate.suggestions,
      taskCandidate: hydrate.taskCandidate,
      continueEmptyReason: hydrate.continueEmptyReason,
      assistantDismissals: await getAssistantDismissals(),
      now: Date.now()
    }
    
    const aiInput = buildWorkSummaryInput(assistantInput, hydrate.settings)
    
    const aiClient = createAiClient()
    const summary = await aiClient.summarizeWorkContext(aiInput)
    
    // Update session state with success
    await setAiSession({
      ...session,
      summary: 'success',
      lastError: null
    })

    // Return enriched hydrate payload
    return {
      ...hydrate,
      assistant: {
        ...hydrate.assistant,
        lastContextSummary: [summary],
        previewLine: `${hydrate.assistant.previewLine} (AI-assisted)`
      }
    }
  } catch (error) {
    const session = await getAiSession()
    await setAiSession({
      ...session,
      summary: 'error',
      lastError: error instanceof Error ? error.message : 'Unknown error'
    })
    return buildHydratePayload(workEngine)
  }
}

async function handleAiTaskPolishRequest(workEngine: WorkPatternEngine, candidateId: string): Promise<HydratePayload> {
  try {
    const settings = await getSettings()
    if (!settings.aiEnabled || !settings.aiFeatures.taskPolish) {
      return buildHydratePayload(workEngine)
    }

    const session = await getAiSession()
    const requestLimit = parseInt(import.meta.env.VITE_NEXUS_AI_REQUEST_LIMIT || '3')
    
    if (session.requestCount >= requestLimit) {
      await setAiSession({
        ...session,
        lastError: 'Request limit reached. Try again later.'
      })
      return buildHydratePayload(workEngine)
    }

    // Update session state to loading
    await setAiSession({
      ...session,
      taskPolish: 'loading',
      requestCount: session.requestCount + 1
    })

    const hydrate = await buildHydratePayload(workEngine)
    const taskCandidate = hydrate.taskCandidate
    
    if (!taskCandidate || taskCandidate.id !== candidateId) {
      await setAiSession({
        ...session,
        taskPolish: 'error',
        lastError: 'Task candidate not found'
      })
      return buildHydratePayload(workEngine)
    }

    const aiInput = buildTaskPolishInput(
      taskCandidate.titleGuess,
      taskCandidate.provenance.evidenceSummary,
      hydrate.transparencyTopDomains.slice(0, 3).map(d => d.domain),
      hydrate.patternSummaries
    )
    
    const aiClient = createAiClient()
    const polished = await aiClient.polishTask(aiInput)
    
    // Update session state with success
    await setAiSession({
      ...session,
      taskPolish: 'success',
      lastError: null
    })

    // Return enriched hydrate payload with polished task
    return {
      ...hydrate,
      taskCandidate: {
        ...taskCandidate,
        titleGuess: polished.title,
        provenance: {
          ...taskCandidate.provenance,
          evidenceSummary: polished.description
        }
      }
    }
  } catch (error) {
    const session = await getAiSession()
    await setAiSession({
      ...session,
      taskPolish: 'error',
      lastError: error instanceof Error ? error.message : 'Unknown error'
    })
    return buildHydratePayload(workEngine)
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
      case 'AI_SUMMARIZE_REQUEST': {
        return await handleAiSummaryRequest(workEngine)
      }
      case 'AI_POLISH_TASK_REQUEST': {
        return await handleAiTaskPolishRequest(workEngine, message.candidateId)
      }
      default: {
        const _exhaustive: never = message
        return _exhaustive
      }
    }
  }
}
