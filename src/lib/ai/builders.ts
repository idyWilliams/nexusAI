import type { WorkSummaryInput, TaskPolishInput } from '$lib/types/ai'
import type { AssistantEngineInput } from '$lib/types/assistant'
import type { Settings } from '$lib/types/settings'

/**
 * Builds safe AI input from local NEXUS signals
 * Never includes sensitive data like full URLs or page content
 */
export function buildWorkSummaryInput(
  assistantInput: AssistantEngineInput,
  settings: Settings
): WorkSummaryInput {
  const now = new Date()
  
  return {
    patternSummaries: assistantInput.patternSummaries.slice(0, 5), // Limit context size
    topDomains: assistantInput.transparencyTopDomains
      .slice(0, 5)
      .map(d => ({ domain: d.domain, count: d.count })),
    timeContext: {
      hour: now.getHours(),
      dayOfWeek: now.getDay()
    },
    recentTasks: [], // TODO: Pull from stored tasks if needed
    currentMode: assistantInput.mode
  }
}

/**
 * Builds safe task polish input from rough task candidate
 * Strips any potentially sensitive information
 */
export function buildTaskPolishInput(
  taskTitle: string,
  provenance: string,
  relatedDomains: string[],
  patternSummaries: string[]
): TaskPolishInput {
  return {
    roughTitle: taskTitle,
    provenance: provenance.substring(0, 200), // Limit length
    relatedDomains: relatedDomains.slice(0, 3), // Limit scope
    contextSummary: patternSummaries.slice(0, 2).join('; ') // Provide minimal context
  }
}
