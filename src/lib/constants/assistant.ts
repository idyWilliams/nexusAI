/** Hide an Assistant suggestion row after dismiss; same order of magnitude as Continue cooldown */
export const ASSISTANT_DISMISS_COOLDOWN_MS = 4 * 60 * 60 * 1000

export const ASSISTANT_SUGGESTION_IDS = {
  OPEN_CONTINUE: 'asst-open-continue',
  OPEN_TRANSPARENCY: 'asst-open-transparency',
  ACCEPT_TASK: 'asst-accept-task',
  DISMISS_TASK: 'asst-dismiss-task'
} as const
