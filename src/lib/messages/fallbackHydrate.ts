import type { HydratePayload } from '$lib/types/messages'
import { DEFAULT_SETTINGS } from '$lib/types/settings'
import { DEFAULT_SESSION } from '$lib/types/session'
import { sanitizeSettings, sanitizeSession } from '$lib/storage/sanitize'

function fallbackAssistant(): HydratePayload['assistant'] {
  return {
    layout: 'standard',
    lastContextSummary: [],
    suggestions: [],
    previewLine: 'Assistant unavailable'
  }
}

function baseFallback(patternSummaries: string[]): HydratePayload {
  return {
    settings: sanitizeSettings({ ...DEFAULT_SETTINGS }),
    session: sanitizeSession({ ...DEFAULT_SESSION }),
    suggestions: [],
    taskCandidate: null,
    tabsPermission: false,
    patternSummaries,
    continueEmptyReason: 'filtered',
    transparencyTopDomains: [],
    recoveryLastPlayedAt: null,
    assistant: fallbackAssistant()
  }
}

/** Last-resort UI snapshot if background returns an unexpected shape — should never happen in normal operation */
export function createCorruptHydrateFallback(): HydratePayload {
  return baseFallback([
    'NEXUS could not read its local state cleanly. Open Settings or reload the extension.'
  ])
}

/** When a message claimed to be NEXUS UI but failed strict parse — avoids hung Promises in the new tab */
export function createInvalidPayloadHydrate(): HydratePayload {
  return baseFallback([
    'That request was not shaped correctly. If this persists, reload the extension from chrome://extensions.'
  ])
}

/** When `chrome.runtime.sendMessage` fails (invalidated extension, torn-down SW, etc.) */
export function createExtensionUnavailableHydrate(): HydratePayload {
  return baseFallback([
    'NEXUS could not reach the extension background. Reload the extension from chrome://extensions or open a new tab.'
  ])
}
