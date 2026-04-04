import type { ContinueEmptyReason } from '$lib/types/messages'
import type { Settings } from '$lib/types/settings'

/**
 * Derives calm empty-state copy for Continue — single source for UI + tests.
 * When the shell hides Continue (e.g. minimal mode), callers may ignore this.
 */
export function computeContinueEmptyReason(
  settings: Settings,
  tabsPermission: boolean,
  suggestionsLength: number,
  visitCount: number
): ContinueEmptyReason {
  if (suggestionsLength > 0) return null
  if (settings.memoryLevel === 'off') return 'memory_off'
  if (!settings.activityAwarenessEnabled || !tabsPermission) return 'needs_activity'
  if (visitCount === 0) return 'no_visits'
  return 'filtered'
}
