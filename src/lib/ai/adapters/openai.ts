import type { NexusAIClient, WorkSummaryInput, TaskPolishInput } from '../types'

/** OpenAI adapter - only available if explicitly configured */
export function createOpenAiAdapter(): NexusAIClient {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'
  const timeout = parseInt(import.meta.env.VITE_NEXUS_AI_TIMEOUT || '10000')

  if (!apiKey) {
    throw new Error('OpenAI adapter requires VITE_OPENAI_API_KEY')
  }

  return {
    async summarizeWorkContext(input: WorkSummaryInput): Promise<string> {
      const prompt = `Summarize this work context in 1-2 concise sentences:
        
Domains: ${input.topDomains.map(d => `${d.domain} (${d.count})`).join(', ')}
Patterns: ${input.patternSummaries.join('; ')}
Mode: ${input.currentMode}
Time: Hour ${input.timeContext.hour}, Day ${input.timeContext.dayOfWeek}

Focus on the main work theme. Be helpful and concise.`

      return await callOpenAI(prompt, model, apiKey, timeout)
    },

    async polishTask(input: TaskPolishInput): Promise<{title: string, description: string}> {
      const prompt = `Improve this task title and description:
        
Current title: "${input.roughTitle}"
Context: ${input.contextSummary}
Related domains: ${input.relatedDomains.join(', ')}
Provenance: ${input.provenance}

Make it more actionable and professional. Keep it concise.`

      const response = await callOpenAI(prompt, model, apiKey, timeout)
      const lines = response.split('\n').filter(line => line.trim())
      
      return {
        title: lines[0] || input.roughTitle,
        description: lines.slice(1).join(' ').trim() || input.provenance
      }
    }
  }
}

async function callOpenAI(prompt: string, model: string, apiKey: string, timeout: number): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    signal: AbortSignal.timeout(timeout),
    body: JSON.stringify({
      model,
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.3
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || 'Unable to generate response'
}
