import { describe, it, expect } from 'vitest'
import { computeAssistantViewModel } from './assistantViewModel'
import type { AssistantEngineInput } from '$lib/types/assistant'
import { DEFAULT_ASSISTANT_DISMISSALS } from '$lib/storage/types'

describe('computeAssistantViewModel', () => {
  const now = 1000000

  function baseInput(overrides: Partial<AssistantEngineInput> = {}): AssistantEngineInput {
    return {
      mode: 'normal',
      patternSummaries: ['Recent work on github.com', 'Documentation reading'],
      transparencyTopDomains: [
        { domain: 'github.com', count: 5 },
        { domain: 'docs.example.com', count: 3 }
      ],
      suggestions: [
        {
          id: 'test-continue',
          type: 'CONTINUE_URL',
          url: 'https://github.com/example/repo',
          title: 'Continue working on repository',
          confidence: 0.8,
          reasonLine: 'Recent activity',
          createdAt: now - 1000
        }
      ],
      taskCandidate: {
        id: 'task-1',
        titleGuess: 'Review pull requests',
        provenance: {
          kind: 'inferred',
          reasonCodes: ['github'],
          evidenceSummary: 'Based on recent GitHub activity'
        },
        confidence: 0.7,
        createdAt: now - 2000
      },
      continueEmptyReason: null,
      assistantDismissals: DEFAULT_ASSISTANT_DISMISSALS,
      now,
      ...overrides
    }
  }

  describe('normal mode', () => {
    it('shows continue, transparency, and task actions', () => {
      const input = baseInput()
      const result = computeAssistantViewModel(input)

      expect(result.layout).toBe('standard')
      expect(result.lastContextSummary).toHaveLength(3)
      expect(result.suggestions).toHaveLength(2) // Only continue and transparency in normal mode
      
      const suggestionIds = result.suggestions.map(s => s.id)
      expect(suggestionIds).toContain('asst-open-continue')
      expect(suggestionIds).toContain('asst-open-transparency')
      // Task actions are only shown in focus mode
    })

    it('respects dismissed suggestions', () => {
      const input = baseInput({
        assistantDismissals: {
          schemaVersion: 1,
          entries: {
            'asst-open-continue': { lastDismissedAt: now - 1000 }
          }
        }
      })
      const result = computeAssistantViewModel(input)

      const suggestionIds = result.suggestions.map(s => s.id)
      expect(suggestionIds).not.toContain('asst-open-continue')
      expect(suggestionIds).toContain('asst-open-transparency')
      // Task actions are only shown in focus mode, not normal mode when continue is dismissed
    })

    it('handles no continue suggestion', () => {
      const input = baseInput({ suggestions: [] })
      const result = computeAssistantViewModel(input)

      const suggestionIds = result.suggestions.map(s => s.id)
      expect(suggestionIds).not.toContain('asst-open-continue')
      expect(suggestionIds).toContain('asst-open-transparency')
    })

    it('handles no task candidate', () => {
      const input = baseInput({ taskCandidate: null })
      const result = computeAssistantViewModel(input)

      const suggestionIds = result.suggestions.map(s => s.id)
      expect(suggestionIds).toContain('asst-open-continue')
      expect(suggestionIds).toContain('asst-open-transparency')
      expect(suggestionIds).not.toContain('asst-accept-task')
    })
  })

  describe('focus mode', () => {
    it('prioritizes continue and task actions', () => {
      const input = baseInput({ mode: 'focus' })
      const result = computeAssistantViewModel(input)

      expect(result.layout).toBe('standard')
      expect(result.suggestions).toHaveLength(3)
      
      const suggestionIds = result.suggestions.map(s => s.id)
      expect(suggestionIds).toContain('asst-open-continue')
      expect(suggestionIds).toContain('asst-accept-task')
      expect(suggestionIds).toContain('asst-dismiss-task')
    })

    it('uses focus-appropriate copy', () => {
      const input = baseInput({ mode: 'focus' })
      const result = computeAssistantViewModel(input)

      const continueSuggestion = result.suggestions.find(s => s.id === 'asst-open-continue')
      expect(continueSuggestion?.label).toBe('Open continuation (new tab)')
      expect(continueSuggestion?.description).toBe('Same target as Continue above.')

      const transparencySuggestion = result.suggestions.find(s => s.id === 'asst-open-transparency')
      if (transparencySuggestion) {
        expect(transparencySuggestion.label).toBe('Review stored signals')
      }
    })
  })

  describe('minimal mode', () => {
    it('shows minimal strip with single action', () => {
      const input = baseInput({ mode: 'minimal' })
      const result = computeAssistantViewModel(input)

      expect(result.layout).toBe('minimal-strip')
      expect(result.lastContextSummary).toHaveLength(1)
      expect(result.suggestions).toHaveLength(1)
      
      const suggestionIds = result.suggestions.map(s => s.id)
      expect(suggestionIds).toContain('asst-open-continue')
    })

    it('shows transparency when no continue available', () => {
      const input = baseInput({ mode: 'minimal', suggestions: [] })
      const result = computeAssistantViewModel(input)

      expect(result.layout).toBe('minimal-strip')
      expect(result.suggestions).toHaveLength(1)
      expect(result.suggestions[0].id).toBe('asst-open-transparency')
    })
  })

  describe('summary building', () => {
    it('includes pattern summaries and top domains', () => {
      const input = baseInput({
        patternSummaries: ['First pattern', 'Second pattern', 'Third pattern'],
        transparencyTopDomains: [
          { domain: 'site1.com', count: 10 },
          { domain: 'site2.com', count: 5 },
          { domain: 'site3.com', count: 2 }
        ]
      })
      const result = computeAssistantViewModel(input)

      expect(result.lastContextSummary[0]).toBe('First pattern')
      expect(result.lastContextSummary[1]).toBe('Second pattern')
      expect(result.lastContextSummary[2]).toContain('site1.com')
      expect(result.lastContextSummary[2]).toContain('site2.com')
    })

    it('shows helpful empty states', () => {
      const input = baseInput({
        patternSummaries: [],
        transparencyTopDomains: [],
        continueEmptyReason: 'needs_activity',
        mode: 'normal'
      })
      const result = computeAssistantViewModel(input)

      expect(result.lastContextSummary[0]).toContain('work-aware mode')
    })

    it('shows focus-appropriate empty state', () => {
      const input = baseInput({
        patternSummaries: [],
        transparencyTopDomains: [],
        continueEmptyReason: 'needs_activity',
        mode: 'focus'
      })
      const result = computeAssistantViewModel(input)

      expect(result.lastContextSummary[0]).toContain('Work-aware observation is off')
    })

    it('shows memory off empty state', () => {
      const input = baseInput({
        patternSummaries: [],
        transparencyTopDomains: [],
        continueEmptyReason: 'memory_off'
      })
      const result = computeAssistantViewModel(input)

      expect(result.lastContextSummary[0]).toContain('Memory is off')
    })
  })

  describe('preview line', () => {
    it('shows context with action count', () => {
      const input = baseInput()
      const result = computeAssistantViewModel(input)

      expect(result.previewLine).toContain('Recent work')
      expect(result.previewLine).toContain('2 actions')
    })

    it('truncates long context', () => {
      const input = baseInput({
        patternSummaries: ['This is a very long summary that should be truncated because it exceeds the maximum length limit']
      })
      const result = computeAssistantViewModel(input)

      expect(result.previewLine).toContain('…')
    })

    it('shows no action count when no actions', () => {
      const input = baseInput({
        suggestions: [],
        taskCandidate: null,
        assistantDismissals: {
          schemaVersion: 1,
          entries: {
            'asst-open-transparency': { lastDismissedAt: now - 1000 }
          }
        }
      })
      const result = computeAssistantViewModel(input)

      expect(result.previewLine).not.toContain('action')
    })
  })

  describe('dismissal cooldown', () => {
    it('respects cooldown period', () => {
      const input = baseInput({
        assistantDismissals: {
          schemaVersion: 1,
          entries: {
            'asst-open-continue': { lastDismissedAt: now - 1000 } // Within 4 hour cooldown
          }
        }
      })
      const result = computeAssistantViewModel(input)

      const suggestionIds = result.suggestions.map(s => s.id)
      expect(suggestionIds).not.toContain('asst-open-continue')
    })

    it('shows suggestions after cooldown expires', () => {
      const input = baseInput({
        assistantDismissals: {
          schemaVersion: 1,
          entries: {
            'asst-open-continue': { 
              lastDismissedAt: now - (5 * 60 * 60 * 1000) // 5 hours ago, past 4 hour cooldown
            }
          }
        }
      })
      const result = computeAssistantViewModel(input)

      const suggestionIds = result.suggestions.map(s => s.id)
      expect(suggestionIds).toContain('asst-open-continue')
    })
  })
})
