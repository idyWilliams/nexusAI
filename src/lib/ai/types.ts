import type { WorkSummaryInput, TaskPolishInput } from '$lib/types/ai'

export interface ThreadExplanationInput {
  label: string
  pages: Array<{ title: string; domain: string }>
}

/** Core AI client interface - provider agnostic */
export interface NexusAIClient {
  /** Generate a concise work context summary from local signals */
  summarizeWorkContext(input: WorkSummaryInput): Promise<string>
  
  /** Improve task title and description from rough candidate */
  polishTask(input: TaskPolishInput): Promise<{title: string, description: string}>
  
  /** Explain a context thread concisely based on its pages */
  explainThread(input: ThreadExplanationInput): Promise<{summary: string, basedOn: string[]}>
}

// Re-export types for adapter use
export type { WorkSummaryInput, TaskPolishInput }
