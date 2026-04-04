import type { AssistantEngineInput, AssistantSuggestion, AssistantViewModel } from '$lib/types/assistant'
import { ASSISTANT_DISMISS_COOLDOWN_MS, ASSISTANT_SUGGESTION_IDS } from '$lib/constants/assistant'

function isDismissed(
  id: string,
  entries: AssistantEngineInput['assistantDismissals']['entries'],
  now: number
): boolean {
  const row = entries[id]
  if (!row) return false
  return now - row.lastDismissedAt < ASSISTANT_DISMISS_COOLDOWN_MS
}

function buildSummary(input: AssistantEngineInput): string[] {
  const { patternSummaries, transparencyTopDomains, mode, continueEmptyReason } = input
  const lines: string[] = []

  const ps = patternSummaries.filter((s) => s.trim()).slice(0, 2)
  lines.push(...ps)

  if (transparencyTopDomains.length > 0 && lines.length < 3) {
    const top = transparencyTopDomains.slice(0, 2).map((d) => `${d.domain} (${d.count})`)
    lines.push(`Top domains: ${top.join(', ')}`)
  }

  if (lines.length === 0) {
    if (continueEmptyReason === 'needs_activity') {
      lines.push(
        mode === 'focus'
          ? 'Work-aware observation is off or permission missing — enable in Settings for coarse context.'
          : 'Turn on work-aware mode in Settings when you want NEXUS to learn gentle, local patterns.'
      )
    } else if (continueEmptyReason === 'memory_off') {
      lines.push('Memory is off — NEXUS is not retaining coarse visit signals.')
    } else {
      lines.push('No local work context yet — browse with work-aware on to build a small, honest summary.')
    }
  }

  return lines.slice(0, 4)
}

function previewFrom(lines: string[], suggestionCount: number): string {
  const head = lines[0]?.trim() || 'Context & next steps'
  const short = head.length > 72 ? `${head.slice(0, 69)}…` : head
  if (suggestionCount <= 0) return short
  return `${short} · ${suggestionCount} action${suggestionCount === 1 ? '' : 's'}`
}

/**
 * Pure Assistant view model — no I/O. Call from buildHydratePayload only.
 */
export function computeAssistantViewModel(input: AssistantEngineInput): AssistantViewModel {
  const { mode, suggestions, taskCandidate, assistantDismissals, now } = input
  const cont = suggestions[0] ?? null
  const dismiss = assistantDismissals.entries

  const lastContextSummary = buildSummary(input)

  const continueS: AssistantSuggestion[] = []
  const transparencyS: AssistantSuggestion[] = []
  const taskAcceptS: AssistantSuggestion[] = []
  const taskDismissS: AssistantSuggestion[] = []

  if (cont && !isDismissed(ASSISTANT_SUGGESTION_IDS.OPEN_CONTINUE, dismiss, now)) {
    continueS.push({
      id: ASSISTANT_SUGGESTION_IDS.OPEN_CONTINUE,
      label:
        mode === 'focus'
          ? 'Open continuation (new tab)'
          : 'Open continuation in new tab',
      description:
        mode === 'focus'
          ? 'Same target as Continue above.'
          : 'Opens the same link as Continue above in a new tab.',
      actionType: 'OPEN_CONTINUE',
      payload: { url: cont.url }
    })
  }

  if (!isDismissed(ASSISTANT_SUGGESTION_IDS.OPEN_TRANSPARENCY, dismiss, now)) {
    transparencyS.push({
      id: ASSISTANT_SUGGESTION_IDS.OPEN_TRANSPARENCY,
      label: mode === 'focus' ? 'Review stored signals' : 'Review what NEXUS knows',
      description:
        mode === 'focus'
          ? 'Transparency — domains and summaries you can clear.'
          : 'Opens Settings → What NEXUS knows.',
      actionType: 'OPEN_TRANSPARENCY'
    })
  }

  const showTaskInAssistant = taskCandidate && (mode === 'focus' || mode === 'minimal')
  if (showTaskInAssistant) {
    if (!isDismissed(ASSISTANT_SUGGESTION_IDS.ACCEPT_TASK, dismiss, now)) {
      taskAcceptS.push({
        id: ASSISTANT_SUGGESTION_IDS.ACCEPT_TASK,
        label: mode === 'focus' ? 'Save follow-up' : 'Save follow-up task',
        description: taskCandidate.titleGuess,
        actionType: 'ACCEPT_TASK',
        payload: { candidateId: taskCandidate.id }
      })
    }
    if (!isDismissed(ASSISTANT_SUGGESTION_IDS.DISMISS_TASK, dismiss, now)) {
      taskDismissS.push({
        id: ASSISTANT_SUGGESTION_IDS.DISMISS_TASK,
        label: mode === 'focus' ? 'Dismiss suggestion' : 'Not now',
        actionType: 'DISMISS_TASK',
        payload: { candidateId: taskCandidate.id }
      })
    }
  }

  /** Order so Focus keeps Continue + task actions within the 3-row cap */
  let pool: AssistantSuggestion[]
  if (mode === 'focus' && showTaskInAssistant) {
    pool = [...continueS, ...taskAcceptS, ...taskDismissS, ...transparencyS]
  } else {
    pool = [...continueS, ...transparencyS, ...taskAcceptS, ...taskDismissS]
  }

  if (mode === 'minimal') {
    const strip = pool.slice(0, 1)
    return {
      layout: 'minimal-strip',
      lastContextSummary: lastContextSummary.slice(0, 1),
      suggestions: strip,
      previewLine: previewFrom(lastContextSummary, strip.length)
    }
  }

  const standard = pool.slice(0, 3)
  return {
    layout: 'standard',
    lastContextSummary,
    suggestions: standard,
    previewLine: previewFrom(lastContextSummary, standard.length)
  }
}
