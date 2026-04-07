<script lang="ts">
  import type { ContinueEmptyReason, Suggestion } from '$lib/types'

  export let suggestion: Suggestion | null
  export let emptyReason: ContinueEmptyReason
  export let onDismiss: (neverAgain: boolean) => void
</script>

{#if suggestion}
  <section class="continue-pane" aria-label="Continue">
    <div class="pane-eyebrow">Continue</div>
    <div class="pane-body">
      <h2 class="command-title">{suggestion.title}</h2>
      <p class="command-context">{suggestion.reasonLine}</p>
    </div>
    <div class="command-actions">
      <a class="command-trigger" href={suggestion.url}>
        Open →
      </a>
      <button type="button" class="control-ghost" on:click={() => onDismiss(false)}>
        Dismiss
      </button>
    </div>
  </section>
{:else}
  <section class="continue-pane empty-surface" aria-label="Continue">
    <div class="pane-eyebrow">Continue</div>
    <div class="pane-body">
      <h2 class="command-title muted">Nothing to resume</h2>
      {#if emptyReason === 'memory_off'}
        <p class="command-context">Memory is off. Turn it on in Settings to get resume hints.</p>
      {:else if emptyReason === 'needs_activity'}
        <p class="command-context">Enable work-aware mode in Settings to get resume hints.</p>
      {:else if emptyReason === 'no_visits'}
        <p class="command-context">No signals yet. Browse and NEXUS will learn your context.</p>
      {:else}
        <p class="command-context">Nothing to resume right now.</p>
      {/if}
    </div>
  </section>
{/if}

<style>
  .continue-pane {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 10px;
    padding: 1rem 1.25rem;
  }

  :global(html.light) .continue-pane {
    background: rgba(0, 0, 0, 0.02);
    border-color: rgba(0, 0, 0, 0.07);
  }

  .empty-surface {
    opacity: 0.65;
  }

  .pane-eyebrow {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--nx-fg-muted);
    margin-bottom: 0.5rem;
  }

  .pane-body {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.875rem;
  }

  .command-title {
    font-size: 17px;
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: var(--nx-fg);
    margin: 0;
  }

  .command-title.muted {
    color: var(--nx-fg-muted);
    font-weight: 500;
  }

  .command-context {
    font-size: 13px;
    color: var(--nx-fg-secondary);
    line-height: 1.5;
    margin: 0;
  }

  .command-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .command-trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.875rem;
    background: var(--nx-accent);
    color: white;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.15s ease;
  }

  .command-trigger:hover {
    opacity: 0.88;
  }

  .control-ghost {
    padding: 0.35rem 0.5rem;
    background: transparent;
    color: var(--nx-fg-muted);
    border: none;
    font-size: 13px;
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .control-ghost:hover {
    color: var(--nx-fg);
  }

  @media (max-width: 600px) {
    .continue-pane {
      padding: 0.875rem 1rem;
    }
  }
</style>
