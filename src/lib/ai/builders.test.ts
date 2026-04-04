import { describe, expect, it } from 'vitest'
import { buildWorkSummaryInput, buildTaskPolishInput } from './builders'
import type { AssistantEngineInput } from '$lib/types/assistant'
import type { Settings } from '$lib/types/settings'

describe('AI input builders', () => {
  const baseAssistantInput: AssistantEngineInput = {
    mode: 'normal',
    patternSummaries: ['Recent work on GitHub', 'Code review activity'],
    transparencyTopDomains: [
      { domain: 'github.com', count: 5 },
      { domain: 'stackoverflow.com', count: 2 }
    ],
    suggestions: [],
    taskCandidate: null,
    continueEmptyReason: null,
    assistantDismissals: { schemaVersion: 1, entries: {} },
    now: Date.now()
  }

  const baseSettings: Settings = {
    schemaVersion: 1,
    mode: 'normal',
    memoryLevel: 'light',
    aiEnabled: false,
    aiFeatures: { summaries: false, taskPolish: false },
    personalizationEnabled: true,
    activityAwarenessEnabled: false,
    density: 'compact',
    theme: 'system'
  }

  describe('buildWorkSummaryInput', () => {
    it('creates safe input from assistant data', () => {
      const result = buildWorkSummaryInput(baseAssistantInput, baseSettings)

      expect(result.patternSummaries).toEqual(['Recent work on GitHub', 'Code review activity'])
      expect(result.topDomains).toEqual([
        { domain: 'github.com', count: 5 },
        { domain: 'stackoverflow.com', count: 2 }
      ])
      expect(result.currentMode).toBe('normal')
      expect(result.recentTasks).toEqual([])
      expect(typeof result.timeContext.hour).toBe('number')
      expect(typeof result.timeContext.dayOfWeek).toBe('number')
    })

    it('limits pattern summaries to 5 items', () => {
      const input = {
        ...baseAssistantInput,
        patternSummaries: Array(10).fill('Pattern')
      }
      
      const result = buildWorkSummaryInput(input, baseSettings)
      expect(result.patternSummaries).toHaveLength(5)
    })

    it('limits top domains to 5 items', () => {
      const input = {
        ...baseAssistantInput,
        transparencyTopDomains: Array(10).fill(null).map((_, i) => ({
          domain: `domain${i}.com`,
          count: i
        }))
      }
      
      const result = buildWorkSummaryInput(input, baseSettings)
      expect(result.topDomains).toHaveLength(5)
    })

    it('includes time context', () => {
      const result = buildWorkSummaryInput(baseAssistantInput, baseSettings)
      
      expect(result.timeContext.hour).toBeGreaterThanOrEqual(0)
      expect(result.timeContext.hour).toBeLessThan(24)
      expect(result.timeContext.dayOfWeek).toBeGreaterThanOrEqual(0)
      expect(result.timeContext.dayOfWeek).toBeLessThan(7)
    })
  })

  describe('buildTaskPolishInput', () => {
    it('creates safe input from task data', () => {
      const result = buildTaskPolishInput(
        'review pull request',
        'GitHub activity detected',
        ['github.com', 'stackoverflow.com'],
        ['Recent work on GitHub', 'Code review activity']
      )

      expect(result.roughTitle).toBe('review pull request')
      expect(result.provenance).toBe('GitHub activity detected')
      expect(result.relatedDomains).toEqual(['github.com', 'stackoverflow.com'])
      expect(result.contextSummary).toBe('Recent work on GitHub; Code review activity')
    })

    it('limits provenance length to 200 chars', () => {
      const longProvenance = 'x'.repeat(300)
      const result = buildTaskPolishInput(
        'task',
        longProvenance,
        ['github.com'],
        ['pattern']
      )

      expect(result.provenance.length).toBeLessThanOrEqual(200)
    })

    it('limits related domains to 3 items', () => {
      const domains = Array(10).fill('github.com')
      const result = buildTaskPolishInput('task', 'provenance', domains, ['pattern'])
      
      expect(result.relatedDomains).toHaveLength(3)
    })

    it('limits pattern summaries to 2 items', () => {
      const patterns = Array(10).fill('pattern')
      const result = buildTaskPolishInput('task', 'provenance', ['github.com'], patterns)
      
      const summaryParts = result.contextSummary.split('; ')
      expect(summaryParts).toHaveLength(2)
    })
  })
})
