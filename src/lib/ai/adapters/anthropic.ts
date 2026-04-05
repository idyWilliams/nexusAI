import type { NexusAIClient, WorkSummaryInput, TaskPolishInput } from '../types'

/** Anthropic Claude adapter - only available if explicitly configured */
export function createAnthropicAdapter(): NexusAIClient {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  const model = import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-3-haiku-20240307'
  const timeout = parseInt(import.meta.env.VITE_NEXUS_AI_TIMEOUT || '10000')

  if (!apiKey) {
    throw new Error('Anthropic adapter requires VITE_ANTHROPIC_API_KEY')
  }

  return {
    async summarizeWorkContext(input: WorkSummaryInput): Promise<string> {
      const prompt = `Summarize this work context in 1-2 concise sentences:
        
Domains: ${input.topDomains.map(d => `${d.domain} (${d.count})`).join(', ')}
Patterns: ${input.patternSummaries.join('; ')}
Mode: ${input.currentMode}
Time: Hour ${input.timeContext.hour}, Day ${input.timeContext.dayOfWeek}

Focus on the main work theme. Be helpful and concise.`

      return await callAnthropic(prompt, model, apiKey, timeout)
    },

    async polishTask(input: TaskPolishInput): Promise<{title: string, description: string}> {
      const prompt = `Improve this task title and description:
        
Current title: "${input.roughTitle}"
Context: ${input.contextSummary}
Related domains: ${input.relatedDomains.join(', ')}
Provenance: ${input.provenance}

Make it more actionable and professional. Keep it concise.`

      const response = await callAnthropic(prompt, model, apiKey, timeout)
      const lines = response.split('\n').filter(line => line.trim())
      
      return {
        title: lines[0] || input.roughTitle,
        description: lines.slice(1).join(' ').trim() || input.provenance
      }
    },
    
    async explainThread(input: { label: string, pages: Array<{ title: string; domain: string }> }): Promise<{ summary: string, basedOn: string[] }> {
      const pageList = input.pages.map(p => `- ${p.title} (${p.domain})`).join('\n')
      const prompt = `Summarize this contextual browsing thread into 2 concise sentences or 2-4 bullets. Focus on what the user was likely trying to accomplish.
      
Thread Label: "${input.label}"
Pages in thread:
${pageList}

Output only the summary, keep it under 40 words.`

      const response = await callAnthropic(prompt, model, apiKey, timeout)
      
      return {
        summary: response.trim(),
        basedOn: input.pages.slice(0, 3).map(p => p.title)
      }
    }
  }
}

async function callAnthropic(prompt: string, model: string, apiKey: string, timeout: number): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    signal: AbortSignal.timeout(timeout),
    body: JSON.stringify({
      model,
      max_tokens: 150,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    })
  })

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content[0]?.text || 'Unable to generate response'
}
