import type { Settings, Mode, MemoryLevel } from '$lib/types/settings'
import { DEFAULT_SETTINGS } from '$lib/types/settings'
import type { SessionState } from '$lib/types/session'
import { DEFAULT_SESSION } from '$lib/types/session'

const MODES: readonly Mode[] = ['normal', 'focus', 'minimal']
const MEMORY: readonly MemoryLevel[] = ['off', 'light', 'full']
const THEMES = ['light', 'dark', 'system'] as const
const DENSITY = ['compact', 'comfortable'] as const

function isMode(x: unknown): x is Mode {
  return typeof x === 'string' && (MODES as readonly string[]).includes(x)
}

function isMemory(x: unknown): x is MemoryLevel {
  return typeof x === 'string' && (MEMORY as readonly string[]).includes(x)
}

function isTheme(x: unknown): x is Settings['theme'] {
  return typeof x === 'string' && (THEMES as readonly string[]).includes(x as Settings['theme'])
}

function isDensity(x: unknown): x is Settings['density'] {
  return typeof x === 'string' && (DENSITY as readonly string[]).includes(x as Settings['density'])
}

/**
 * Defensive merge after storage read — prevents corrupted enums from bricking UI.
 * v2+: migrate versioned blobs here before merge.
 */
export function sanitizeSettings(raw: unknown): Settings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS }
  const o = raw as Partial<Settings>
  return {
    schemaVersion: typeof o.schemaVersion === 'number' ? o.schemaVersion : DEFAULT_SETTINGS.schemaVersion,
    mode: isMode(o.mode) ? o.mode : DEFAULT_SETTINGS.mode,
    memoryLevel: isMemory(o.memoryLevel) ? o.memoryLevel : DEFAULT_SETTINGS.memoryLevel,
    aiEnabled: typeof o.aiEnabled === 'boolean' ? o.aiEnabled : DEFAULT_SETTINGS.aiEnabled,
    personalizationEnabled:
      typeof o.personalizationEnabled === 'boolean'
        ? o.personalizationEnabled
        : DEFAULT_SETTINGS.personalizationEnabled,
    activityAwarenessEnabled:
      typeof o.activityAwarenessEnabled === 'boolean'
        ? o.activityAwarenessEnabled
        : DEFAULT_SETTINGS.activityAwarenessEnabled,
    density: isDensity(o.density) ? o.density : DEFAULT_SETTINGS.density,
    theme: isTheme(o.theme) ? o.theme : DEFAULT_SETTINGS.theme
  }
}

export function sanitizeSession(raw: unknown): SessionState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SESSION }
  const o = raw as Partial<SessionState>
  return {
    schemaVersion: typeof o.schemaVersion === 'number' ? o.schemaVersion : DEFAULT_SESSION.schemaVersion,
    activeMode: isMode(o.activeMode) ? o.activeMode : DEFAULT_SESSION.activeMode,
    lastHydratedAt:
      o.lastHydratedAt === undefined
        ? DEFAULT_SESSION.lastHydratedAt
        : o.lastHydratedAt === null || typeof o.lastHydratedAt === 'string'
          ? o.lastHydratedAt
          : null
  }
}

/**
 * Narrow untrusted message payloads to a safe Partial<Settings> for SETTINGS_PATCH.
 * Unknown keys are dropped; invalid enum values are ignored (patch won't apply them).
 */
export function coerceSettingsPatch(raw: unknown): Partial<Settings> | null {
  if (raw === undefined) return {}
  if (raw === null || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const out: Partial<Settings> = {}
  if ('schemaVersion' in o && typeof o.schemaVersion === 'number' && Number.isFinite(o.schemaVersion)) {
    out.schemaVersion = o.schemaVersion
  }
  if ('mode' in o && isMode(o.mode)) out.mode = o.mode
  if ('memoryLevel' in o && isMemory(o.memoryLevel)) out.memoryLevel = o.memoryLevel
  if ('aiEnabled' in o && typeof o.aiEnabled === 'boolean') out.aiEnabled = o.aiEnabled
  if ('personalizationEnabled' in o && typeof o.personalizationEnabled === 'boolean') {
    out.personalizationEnabled = o.personalizationEnabled
  }
  if ('activityAwarenessEnabled' in o && typeof o.activityAwarenessEnabled === 'boolean') {
    out.activityAwarenessEnabled = o.activityAwarenessEnabled
  }
  if ('density' in o && isDensity(o.density)) out.density = o.density
  if ('theme' in o && isTheme(o.theme)) out.theme = o.theme
  return out
}
