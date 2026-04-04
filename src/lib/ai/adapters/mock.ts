import type { NexusAIClient, WorkSummaryInput, TaskPolishInput } from '../types'

/** Mock AI adapter for development and fallback */
export function createMockAdapter(): NexusAIClient {
  return {
    async summarizeWorkContext(input: WorkSummaryInput): Promise<string> {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const domainCount = input.topDomains.length
      const primaryDomain = input.topDomains[0]?.domain || 'work'
      
      if (input.patternSummaries.length === 0) {
        return `No recent work patterns detected. Start browsing with work-aware mode enabled to build context.`
      }
      
      return `Focused on ${primaryDomain} and ${domainCount - 1} other domains recently. ${input.patternSummaries[0] || 'Active development work detected.'}`
    },
    
    async polishTask(input: TaskPolishInput): Promise<{title: string, description: string}> {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 600))
      
      // Simple rule-based polishing
      const title = input.roughTitle
        .replace(/^review\s+/i, 'Review and complete')
        .replace(/^fix\s+/i, 'Fix and test')
        .replace(/^implement\s+/i, 'Implement and document')
      
      return {
        title: title.charAt(0).toUpperCase() + title.slice(1),
        description: `Based on recent activity: ${input.provenance}`
      }
    }
  }
}
