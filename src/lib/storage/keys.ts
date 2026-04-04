/** Single source of truth for chrome.storage.local keys — bump suffix on breaking schema changes */
export const STORAGE_KEYS = {
  settings: 'nexus_settings_v1',
  session: 'nexus_session_v1',
  workPattern: 'nexus_work_pattern_v1',
  dismissals: 'nexus_dismissals_v1',
  taskInference: 'nexus_task_inference_meta_v1',
  tasks: 'nexus_tasks_v1',
  recovery: 'nexus_recovery_meta_v1',
  assistantDismissals: 'nexus_assistant_dismissals_v1'
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
