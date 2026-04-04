import type { HydratePayload } from '$lib/types/messages'
import type { UiToBackgroundMessage } from '$lib/types/messages'
import { BUILD_ID } from '$lib/types/messages'
import { WorkPatternEngine } from '$lib/engines/workPatternEngine'
import { attachActivityObserver, hasTabsPermission } from './activityObserver'
import { createUiMessageHandler } from './handlers/uiMessageHandler'
import { getFallbackSessionForError, getFallbackSettingsForError, getSettings } from '$lib/storage'
import { parseUiToBackgroundMessage, looksLikeNexusUiMessage } from '$lib/messages/parseUiMessage'
import { createInvalidPayloadHydrate } from '$lib/messages/fallbackHydrate'

const workEngine = new WorkPatternEngine()
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
    detachObserver = attachActivityObserver(workEngine)
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
      void Promise.resolve(createInvalidPayloadHydrate()).then(sendResponse)
      return true
    }
    return false
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
        }
      } satisfies HydratePayload)
    })
  return true
})

void (async () => {
  await workEngine.load()
  reconnectObserver()
  void BUILD_ID
})()
