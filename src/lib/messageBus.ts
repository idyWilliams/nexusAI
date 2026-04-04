import type { BackgroundToUiMessage, HydratePayload, UiToBackgroundMessage } from './types/messages'
import { parseBackgroundToUiMessage, parseHydrateResponse } from './messages/guards'
import {
  createCorruptHydrateFallback,
  createExtensionUnavailableHydrate
} from './messages/fallbackHydrate'

/**
 * UI → background: every request returns a full hydrated snapshot (MVP).
 * Never throws — runtime failures yield a calm fallback so the new tab never dead-ends.
 * v2: split read vs write responses — search MESSAGE_BUS_V2.
 */
export async function sendToBackground(message: UiToBackgroundMessage): Promise<HydratePayload> {
  try {
    const response: unknown = await chrome.runtime.sendMessage(message)
    const parsed = parseHydrateResponse(response)
    if (parsed) return parsed
    console.error('[NEXUS] Invalid hydrate response from background', response)
    return createCorruptHydrateFallback()
  } catch (e) {
    console.error('[NEXUS] sendMessage failed', e)
    return createExtensionUnavailableHydrate()
  }
}

/** Subscribe to push messages from background (e.g. ENRICHMENT_PATCH) — optional in MVP */
export function onBackgroundMessage(
  handler: (msg: BackgroundToUiMessage) => void
): () => void {
  const listener = (message: unknown, _sender: chrome.runtime.MessageSender) => {
    const parsed = parseBackgroundToUiMessage(message)
    if (parsed) handler(parsed)
  }
  chrome.runtime.onMessage.addListener(listener)
  return () => chrome.runtime.onMessage.removeListener(listener)
}
