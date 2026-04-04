import type { 
  NexusAIClient, 
  WorkSummaryInput, 
  TaskPolishInput 
} from './types'
import { createMockAdapter } from './adapters/mock'
import { createOpenAiAdapter } from './adapters/openai'
import { createAnthropicAdapter } from './adapters/anthropic'

export type { 
  NexusAIClient, 
  WorkSummaryInput, 
  TaskPolishInput 
} from './types'

export function createAiClient(): NexusAIClient {
  const provider = import.meta.env.VITE_NEXUS_AI_PROVIDER || 'mock'
  
  switch (provider) {
    case 'openai':
      return createOpenAiAdapter()
    case 'anthropic':
      return createAnthropicAdapter()
    case 'mock':
    default:
      return createMockAdapter()
  }
}
