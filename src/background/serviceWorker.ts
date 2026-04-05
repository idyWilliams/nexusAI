import type { HydratePayload } from '$lib/types/messages'
import type { UiToBackgroundMessage } from '$lib/types/messages'
import { BUILD_ID } from '$lib/types/messages'
import { WorkPatternEngine } from '$lib/engines/workPatternEngine'
import { hasTabsPermission } from './activityObserver'
import { attachBrowsingObservers } from './browsingObservers'
import { getMemoryVault } from '$lib/memory/vault'
import { getSettings } from '$lib/storage'
import { DEFAULT_CONTEXT_RECOVERY } from '$lib/memory/types'
import { createUiMessageHandler } from './handlers/uiMessageHandler'
import { getFallbackSettingsForError, getFallbackSessionForError } from '$lib/storage'
import { DEFAULT_AI_SESSION } from '$lib/storage/types'
import { parseUiToBackgroundMessage, looksLikeNexusUiMessage } from '$lib/messages/parseUiMessage'
import { createInvalidPayloadHydrate } from '$lib/messages/fallbackHydrate'

const workEngine = new WorkPatternEngine()
const memoryVault = getMemoryVault()
let detachObserver: (() => void) | null = null

function reconnectObserver(): void {
  detachObserver?.()
  detachObserver = null
  void (async () => {
    const settings = await getSettings()
    if (!settings.activityAwarenessEnabled) return
    const ok = await hasTabsPermission()
    if (!ok) return
    await workEngine.load()
    await memoryVault.open()
    const recordMemory = settings.memoryLevel !== 'off'
    detachObserver = attachBrowsingObservers(
      workEngine,
      recordMemory ? memoryVault : null,
      { recordMemory }
    )
  })()
}

const handleUiMessage = createUiMessageHandler({
  workEngine,
  onAfterMutation: reconnectObserver
})

async function dispatchMessage(message: UiToBackgroundMessage): Promise<HydratePayload> {
  return handleUiMessage(message)
}

chrome.runtime.onInstalled.addListener(() => {
  void chrome.alarms.create('nexus-keepalive', { periodInMinutes: 20 })
})

chrome.alarms.onAlarm.addListener(() => {
  /* placeholder — avoids some SW sleep edge cases; no heavy work */
})

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse: (r: HydratePayload) => void) => {
  const parsed = parseUiToBackgroundMessage(message)
  if (!parsed) {
    if (looksLikeNexusUiMessage(message)) {
      void Promise.resolve(createInvalidPayloadHydrate()).then(sendResponse as any)
      return true
    }
    return false
  }
  
  if (parsed.type === 'AI_EXPLAIN_THREAD_REQUEST') {
    void (async () => {
      try {
        const aiClient = (await import('$lib/ai')).createAiClient()
        const explanation = await aiClient.explainThread({
          label: parsed.label,
          pages: parsed.pages
        })
        sendResponse({
          type: 'AI_EXPLAIN_THREAD_RESPONSE',
          threadId: parsed.threadId,
          summary: explanation.summary,
          basedOn: explanation.basedOn,
          isAiGenerated: true
        } as any)
      } catch (err) {
        sendResponse({
          type: 'AI_EXPLAIN_THREAD_RESPONSE',
          threadId: parsed.threadId,
          summary: 'Unable to explain this work session right now.',
          basedOn: [],
          isAiGenerated: false
        } as any)
      }
    })()
    return true
  }

  void dispatchMessage(parsed)
    .then(sendResponse)
    .catch(async () => {
      sendResponse({
        settings: getFallbackSettingsForError(),
        session: getFallbackSessionForError(),
        suggestions: [],
        taskCandidate: null,
        tabsPermission: false,
        patternSummaries: ['Something went wrong loading NEXUS state. Your data is still local.'],
        continueEmptyReason: 'filtered',
        transparencyTopDomains: [],
        recoveryLastPlayedAt: null,
        assistant: {
          layout: 'standard',
          lastContextSummary: ['Something went wrong loading NEXUS state.'],
          suggestions: [],
          previewLine: 'Error loading assistant'
        },
        aiSession: DEFAULT_AI_SESSION,
        contextRecovery: { ...DEFAULT_CONTEXT_RECOVERY }
      } satisfies HydratePayload)
    })
  return true
})

void (async () => {
  await workEngine.load()
  reconnectObserver()
  void BUILD_ID
})()
