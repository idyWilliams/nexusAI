<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { AssistantViewModel, AssistantSuggestion } from '$lib/types/assistant'
  import type { Mode, Settings } from '$lib/types'
  import type { AiSessionState } from '$lib/storage/types'
  import type { TaskCandidate } from '$lib/types/tasks'

  export let assistant: AssistantViewModel
  export let aiSession: AiSessionState
  export let settings: Settings
  export let taskCandidate: TaskCandidate | null
  export let mode: Mode

  let expanded = false
  const dispatch = createEventDispatcher()

  function toggleExpanded() {
    expanded = !expanded
  }

  function handleSuggestionClick(suggestion: AssistantSuggestion) {
    switch (suggestion.actionType) {
      case 'OPEN_CONTINUE':
        if (suggestion.payload?.url) {
          window.open(suggestion.payload.url, '_blank')
        }
        break
      case 'OPEN_TRANSPARENCY':
        dispatch('openTransparency')
        break
      case 'ACCEPT_TASK':
        if (suggestion.payload?.candidateId) {
          dispatch('acceptTask', { candidateId: suggestion.payload.candidateId })
        }
        break
      case 'DISMISS_TASK':
        if (suggestion.payload?.candidateId) {
          dispatch('dismissTask', { candidateId: suggestion.payload.candidateId })
        }
        break
    }
  }

  function handleDismissSuggestion(suggestionId: string) {
    dispatch('dismissSuggestion', { suggestionId })
  }

  function handleAiSummaryRequest() {
    dispatch('aiSummaryRequest')
  }

  function handleAiTaskPolishRequest() {
    if (taskCandidate) {
      dispatch('aiTaskPolishRequest', { candidateId: taskCandidate.id })
    }
  }

  $: isMinimal = mode === 'minimal'
  $: isFocus = mode === 'focus'
  $: showPanel = !isMinimal || assistant.layout === 'minimal-strip'
  
  // AI feature availability
  $: aiEnabled = settings.aiEnabled
  $: aiSummariesEnabled = aiEnabled && settings.aiFeatures.summaries
  $: aiTaskPolishEnabled = aiEnabled && settings.aiFeatures.taskPolish
  
  // AI loading states
  $: aiSummaryLoading = aiSession.summary === 'loading'
  $: aiTaskPolishLoading = aiSession.taskPolish === 'loading'
  
  // Show AI controls based on mode and settings
  $: showAiSummary = aiSummariesEnabled && !isMinimal && (mode === 'normal' || mode === 'focus')
  $: showAiTaskPolish = aiTaskPolishEnabled && taskCandidate && mode === 'normal'
</script>

{#if showPanel}
  <section 
    class="assistant-panel" 
    class:minimal={isMinimal}
    class:focus={isFocus}
    aria-label="Assistant"
  >
    {#if isMinimal && assistant.layout === 'minimal-strip'}
      <!-- Minimal strip: single line with at most one action -->
      <div class="minimal-strip">
        <span class="minimal-preview">{assistant.previewLine}</span>
        {#if assistant.suggestions.length > 0}
          <button
            type="button"
            class="minimal-action"
            on:click={() => handleSuggestionClick(assistant.suggestions[0])}
            aria-label={assistant.suggestions[0].label}
          >
            {assistant.suggestions[0].label}
          </button>
        {/if}
      </div>
    {:else}
      <!-- Standard layout: collapsible -->
      <div class="assistant-header" on:click={toggleExpanded} on:keydown={(e) => e.key === 'Enter' && toggleExpanded()} role="button" tabindex="0">
        <span class="preview-text">{assistant.previewLine}</span>
        <button 
          type="button" 
          class="expand-toggle"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse assistant' : 'Expand assistant'}
        >
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {#if expanded}
        <div class="assistant-content">
          {#if assistant.lastContextSummary.length > 0}
            <div class="context-summary">
              {#each assistant.lastContextSummary as line}
                <p class="summary-line">{line}</p>
              {/each}
            </div>
          {/if}

          <!-- AI Summary Section -->
          {#if showAiSummary}
            <div class="ai-summary-section">
              {#if aiSummaryLoading}
                <div class="ai-loading">
                  <span class="loading-text">Generating summary...</span>
                </div>
              {:else if aiSession.summary === 'error'}
                <div class="ai-error">
                  <span class="error-text">AI unavailable — showing local view</span>
                </div>
              {:else if aiSession.summary === 'success'}
                <div class="ai-summary-success">
                  {#each assistant.lastContextSummary as line}
                    <p class="summary-line ai-assisted">{line}</p>
                  {/each}
                </div>
              {:else}
                <button 
                  type="button" 
                  class="ai-summary-btn"
                  on:click={handleAiSummaryRequest}
                >
                  Explain what I was doing
                </button>
              {/if}
            </div>
          {/if}

          {#if assistant.suggestions.length > 0}
            <div class="suggestions">
              {#each assistant.suggestions as suggestion}
                <div class="suggestion-row">
                  <button
                    type="button"
                    class="suggestion-btn"
                    on:click={() => handleSuggestionClick(suggestion)}
                  >
                    <div class="suggestion-main">
                      <span class="suggestion-label">{suggestion.label}</span>
                      {#if suggestion.description}
                        <span class="suggestion-description">{suggestion.description}</span>
                      {/if}
                    </div>
                  </button>
                  <button
                    type="button"
                    class="dismiss-btn"
                    on:click={() => handleDismissSuggestion(suggestion.id)}
                    aria-label="Dismiss suggestion"
                  >
                    ×
                  </button>
                </div>
              {/each}
            </div>
          {/if}

          <!-- AI Task Polish Section -->
          {#if showAiTaskPolish}
            <div class="ai-task-polish-section">
              {#if aiTaskPolishLoading}
                <div class="ai-loading">
                  <span class="loading-text">Improving wording...</span>
                </div>
              {:else if aiSession.taskPolish === 'error'}
                <div class="ai-error">
                  <span class="error-text">AI unavailable</span>
                </div>
              {:else if aiSession.taskPolish === 'success'}
                <div class="ai-polished-task">
                  <div class="polished-content">
                    <h4 class="polished-title">{taskCandidate?.titleGuess}</h4>
                    {#if taskCandidate?.provenance.evidenceSummary}
                      <p class="polished-description">{taskCandidate.provenance.evidenceSummary}</p>
                    {/if}
                  </div>
                  <div class="polished-actions">
                    <button type="button" class="btn small primary" on:click={() => dispatch('acceptTask', { candidateId: taskCandidate?.id })}>
                      Accept
                    </button>
                    <button type="button" class="btn small ghost" on:click={() => dispatch('dismissTask', { candidateId: taskCandidate?.id })}>
                      Dismiss
                    </button>
                  </div>
                </div>
              {:else}
                <button 
                  type="button" 
                  class="ai-polish-btn"
                  on:click={handleAiTaskPolishRequest}
                >
                  Improve wording
                </button>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </section>
{/if}

<style>
  .assistant-panel {
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--nx-radius);
    margin-top: 0.5rem;
  }

  .assistant-panel.minimal {
    border: none;
    background: transparent;
    box-shadow: none;
    margin-top: 0.5rem;
  }

  .assistant-panel.focus {
    border-color: color-mix(in oklab, var(--nx-accent) 20%, transparent);
  }

  /* Minimal strip */
  .minimal-strip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.5rem 0;
    font-size: 0.85rem;
  }

  .minimal-preview {
    color: var(--nx-fg-muted);
    flex: 1;
  }

  .minimal-action {
    background: color-mix(in oklab, var(--nx-accent) 15%, transparent);
    border: 1px solid color-mix(in oklab, var(--nx-accent) 30%, transparent);
    color: var(--nx-fg);
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .minimal-action:hover {
    opacity: 0.8;
  }

  /* Standard layout */
  .assistant-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    cursor: pointer;
    user-select: none;
    border-radius: var(--nx-radius) var(--nx-radius) 0 0;
    transition: background-color 0.2s ease;
  }

  .assistant-header:hover {
    background: color-mix(in oklab, var(--nx-fg) 3%, transparent);
  }

  .preview-text {
    font-size: 13px;
    color: var(--nx-fg-muted);
    flex: 1;
    font-weight: 500;
  }

  .expand-toggle {
    background: none;
    border: none;
    color: var(--nx-fg-muted);
    padding: 0.25rem;
    cursor: pointer;
    font-size: 0.8rem;
    transition: transform 0.2s ease;
  }

  .expand-toggle:hover {
    color: var(--nx-fg);
  }

  .assistant-content {
    padding: 0 1rem 1rem;
    border-top: 1px solid var(--nx-line);
  }

  .context-summary {
    margin-bottom: 1rem;
  }

  .summary-line {
    margin: 0 0 0.5rem;
    font-size: 13px;
    color: var(--nx-fg-muted);
    line-height: 1.45;
  }

  .summary-line:last-child {
    margin-bottom: 0;
  }

  .suggestions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .suggestion-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .suggestion-btn {
    flex: 1;
    background: transparent;
    border: 1px solid var(--nx-line);
    border-radius: var(--nx-radius);
    padding: 0.75rem;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }

  .suggestion-btn:hover {
    background: color-mix(in oklab, var(--nx-fg) 3%, transparent);
    border-color: color-mix(in oklab, var(--nx-fg) 10%, transparent);
  }

  .suggestion-main {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .suggestion-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--nx-fg);
  }

  .suggestion-description {
    font-size: 12px;
    color: var(--nx-fg-muted);
    line-height: 1.35;
  }

  .dismiss-btn {
    background: none;
    border: none;
    color: var(--nx-fg-muted);
    padding: 0.5rem;
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
    opacity: 0.6;
    transition: opacity 0.2s ease, color 0.2s ease;
    border-radius: var(--nx-radius);
  }

  .dismiss-btn:hover {
    opacity: 1;
    color: var(--nx-fg);
    background: color-mix(in oklab, var(--nx-fg) 5%, transparent);
  }

  /* Focus mode adjustments */
  .assistant-panel.focus .suggestion-label {
    font-weight: 600;
  }

  .assistant-panel.focus .suggestion-btn {
    border-color: color-mix(in oklab, var(--nx-accent) 15%, transparent);
  }

  .assistant-panel.focus .suggestion-btn:hover {
    border-color: color-mix(in oklab, var(--nx-accent) 25%, transparent);
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .expand-toggle {
      transition: none;
    }

    .assistant-header,
    .suggestion-btn,
    .dismiss-btn,
    .minimal-action {
      transition: none;
    }
  }

  /* Keyboard navigation */
  .assistant-header:focus {
    outline: 2px solid var(--nx-accent);
    outline-offset: -2px;
  }

  .suggestion-btn:focus,
  .dismiss-btn:focus,
  .minimal-action:focus {
    outline: 2px solid var(--nx-accent);
    outline-offset: 2px;
  }

  /* AI Summary Styles */
  .ai-summary-section {
    margin: 1rem 0;
    padding: 0.75rem;
    background: transparent;
    border: 1px dotted var(--nx-line);
    border-radius: var(--nx-radius);
  }

  .ai-summary-btn {
    width: 100%;
    background: transparent;
    border: 1px solid var(--nx-line);
    border-radius: var(--nx-radius);
    padding: 0.5rem;
    cursor: pointer;
    font-size: 0.85rem;
    color: var(--nx-fg);
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }

  .ai-summary-btn:hover {
    background: color-mix(in oklab, var(--nx-accent) 5%, transparent);
    border-color: color-mix(in oklab, var(--nx-accent) 15%, transparent);
  }

  .ai-loading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .loading-text {
    font-size: 0.85rem;
    color: var(--nx-fg-muted);
    font-style: italic;
  }

  .ai-error {
    padding: 0.5rem;
  }

  .error-text {
    font-size: 0.85rem;
    color: var(--nx-fg-muted);
    opacity: 0.7;
  }

  .ai-summary-success .summary-line.ai-assisted {
    position: relative;
    padding-left: 1.2rem;
  }

  .ai-summary-success .summary-line.ai-assisted::before {
    content: "✨";
    position: absolute;
    left: 0;
    top: 0;
    font-size: 0.8rem;
  }

  /* AI Task Polish Styles */
  .ai-task-polish-section {
    margin: 1rem 0;
  }

  .ai-polish-btn {
    width: 100%;
    background: transparent;
    border: 1px dashed var(--nx-line);
    border-radius: var(--nx-radius);
    padding: 0.5rem;
    cursor: pointer;
    font-size: 0.8rem;
    color: var(--nx-fg-muted);
    transition: border-color 0.2s ease, color 0.2s ease;
  }

  .ai-polish-btn:hover {
    border-color: color-mix(in oklab, var(--nx-accent) 20%, transparent);
    color: var(--nx-fg);
  }

  .ai-polished-task {
    background: transparent;
    border: 1px dashed var(--nx-line);
    border-radius: var(--nx-radius);
    padding: 1rem;
  }

  .polished-content {
    margin-bottom: 0.75rem;
  }

  .polished-title {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--nx-fg);
  }

  .polished-description {
    margin: 0;
    font-size: 0.85rem;
    color: var(--nx-fg-muted);
    line-height: 1.4;
  }

  .polished-actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn.small {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  /* Mode-specific AI adjustments */
  .assistant-panel.focus .ai-summary-section {
    background: color-mix(in oklab, var(--nx-accent) 3%, transparent);
    border-color: color-mix(in oklab, var(--nx-accent) 20%, transparent);
  }

  .assistant-panel.focus .ai-polish-btn:hover {
    border-color: color-mix(in oklab, var(--nx-accent) 30%, transparent);
  }

  /* AI elements in minimal mode */
  .assistant-panel.minimal .ai-summary-section,
  .assistant-panel.minimal .ai-task-polish-section {
    margin: 0.5rem 0;
    padding: 0.5rem;
  }
</style>
