<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { AssistantViewModel, AssistantSuggestion } from '$lib/types/assistant'
  import type { Mode } from '$lib/types'

  export let assistant: AssistantViewModel
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

  $: isMinimal = mode === 'minimal'
  $: isFocus = mode === 'focus'
  $: showPanel = !isMinimal || assistant.layout === 'minimal-strip'
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
        </div>
      {/if}
    {/if}
  </section>
{/if}

<style>
  .assistant-panel {
    background: var(--nx-bg-elevated);
    border: 1px solid var(--nx-line);
    border-radius: var(--nx-radius);
    margin-top: 1rem;
    box-shadow: var(--nx-shadow);
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
    font-size: 0.9rem;
    color: var(--nx-fg);
    flex: 1;
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
    font-size: 0.85rem;
    color: var(--nx-fg-muted);
    line-height: 1.4;
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
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--nx-fg);
  }

  .suggestion-description {
    font-size: 0.8rem;
    color: var(--nx-fg-muted);
    line-height: 1.3;
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
</style>
