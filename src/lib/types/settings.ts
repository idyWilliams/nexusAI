export type Mode = 'normal' | 'focus' | 'minimal'

export type MemoryLevel = 'off' | 'light' | 'full'

/** User-facing settings persisted locally (subset may sync later). */
export interface Settings {
  schemaVersion: number
  mode: Mode
  memoryLevel: MemoryLevel
  /** Master toggles — AI is stubbed but wiring exists */
  aiEnabled: boolean
  personalizationEnabled: boolean
  /** User wants activity-based signals; may trigger optional `tabs` permission */
  activityAwarenessEnabled: boolean
  density: 'compact' | 'comfortable'
  theme: 'light' | 'dark' | 'system'
}

export const DEFAULT_SETTINGS: Settings = {
  schemaVersion: 1,
  mode: 'normal',
  memoryLevel: 'light',
  aiEnabled: false,
  personalizationEnabled: true,
  activityAwarenessEnabled: false,
  density: 'compact',
  theme: 'system'
}
