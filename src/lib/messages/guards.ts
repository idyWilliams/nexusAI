import type { BackgroundToUiMessage, HydratePayload, UiToBackgroundMessage } from '$lib/types/messages'
import { parseUiToBackgroundMessage } from './parseUiMessage'
import { validateHydratePayload } from './validateHydratePayload'

export function isUiToBackgroundMessage(msg: unknown): msg is UiToBackgroundMessage {
  return parseUiToBackgroundMessage(msg) !== null
}

/**
 * Runtime validation for chrome.runtime.sendMessage responses — avoids silent corruption in UI.
 */
export function parseHydrateResponse(raw: unknown): HydratePayload | null {
  return validateHydratePayload(raw)
}

const BG_UI_TYPES = new Set<BackgroundToUiMessage['type']>(['HYDRATE_STATE', 'ENRICHMENT_PATCH'])

export function parseBackgroundToUiMessage(raw: unknown): BackgroundToUiMessage | null {
  if (!raw || typeof raw !== 'object' || !('type' in raw)) return null
  const t = (raw as { type: unknown }).type
  if (t !== 'HYDRATE_STATE' && t !== 'ENRICHMENT_PATCH') return null
  const o = raw as Record<string, unknown>
  if (!('payload' in o)) return null
  if (t === 'HYDRATE_STATE') {
    const p = validateHydratePayload(o.payload)
    if (!p) return null
    return { type: 'HYDRATE_STATE', payload: p }
  }
  if (typeof o.payload !== 'object' || o.payload === null) return null
  return { type: 'ENRICHMENT_PATCH', payload: o.payload as Partial<HydratePayload> }
}
