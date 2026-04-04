export type Mode = 'normal' | 'focus' | 'minimal'

export type MemoryLevel = 'off' | 'light' | 'full'

export type AiFeature = 'summaries' | 'taskPolish'

/** User-facing settings persisted locally (subset may sync later). */
export interface Settings {
  schemaVersion: number
  mode: Mode
  memoryLevel: MemoryLevel
  /** Master toggle for AI features */
  aiEnabled: boolean
  /** Granular AI feature controls */
  aiFeatures: Record<AiFeature, boolean>
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
  aiFeatures: {
    summaries: false,
    taskPolish: false
  },
  personalizationEnabled: true,
  activityAwarenessEnabled: false,
  density: 'compact',
  theme: 'system'
}
