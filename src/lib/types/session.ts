import type { Mode } from './settings'

/** Ephemeral + short-TTL session fields hydrated into the new tab */
export interface SessionState {
  schemaVersion: number
  activeMode: Mode
  /** ISO timestamp of last shell hydration (for debugging) */
  lastHydratedAt: string | null
}

export const DEFAULT_SESSION: SessionState = {
  schemaVersion: 1,
  activeMode: 'normal',
  lastHydratedAt: null
}
