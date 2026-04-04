<script lang="ts">
  import type { ContinueEmptyReason, Suggestion } from '$lib/types'

  export let suggestion: Suggestion | null
  export let emptyReason: ContinueEmptyReason
  export let onDismiss: (neverAgain: boolean) => void
</script>

{#if suggestion}
  <section class="card" aria-label="Continue">
    <div class="row">
      <div class="text">
        <p class="eyebrow">Continue</p>
        <h2 class="title">{suggestion.title}</h2>
        <p class="reason">{suggestion.reasonLine}</p>
      </div>
    </div>
    <div class="actions">
      <a class="btn primary" href={suggestion.url}>Open</a>
      <button type="button" class="btn ghost" on:click={() => onDismiss(false)}>Dismiss</button>
      <button type="button" class="btn ghost" on:click={() => onDismiss(true)}>Don’t suggest this again</button>
    </div>
  </section>
{:else}
  <section class="card muted" aria-label="Continue">
    <p class="eyebrow">Continue</p>
    {#if emptyReason === 'memory_off'}
      <h2 class="title">Start fresh</h2>
      <p class="empty">Memory is off — NEXUS won’t rank continuations. Turn memory on in Settings when you want gentle resume hints.</p>
    {:else if emptyReason === 'needs_activity'}
      <h2 class="title">Start fresh</h2>
      <p class="empty">
        Enable work-aware mode (optional <code>tabs</code> permission) in Settings to let NEXUS see coarse domains — not page
        content — to suggest continuations.
      </p>
    {:else if emptyReason === 'no_visits'}
      <h2 class="title">Start fresh</h2>
      <p class="empty">No coarse signals yet. As you browse, NEXUS will keep a small local list — enough to suggest a calm resume, not a log.</p>
    {:else}
      <h2 class="title">Start fresh</h2>
      <p class="empty">
        Nothing to resume right now — either you recently dismissed this path, or nothing crossed the calm threshold. Open a tab
        when you’re ready.
      </p>
    {/if}
  </section>
{/if}

<style>
  .card {
    background: var(--nx-bg-elevated);
    border: 1px solid var(--nx-line);
    border-radius: var(--nx-radius);
    padding: 1.25rem 1.35rem;
    box-shadow: var(--nx-shadow);
    max-width: 560px;
    min-height: 11.5rem;
    box-sizing: border-box;
  }
  .muted {
    opacity: 0.96;
  }
  .row {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }
  .eyebrow {
    margin: 0 0 0.35rem;
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--nx-fg-muted);
  }
  .title {
    margin: 0 0 0.35rem;
    font-size: 1.15rem;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .reason {
    margin: 0;
    font-size: 0.92rem;
    color: var(--nx-fg-muted);
    line-height: 1.45;
  }
  .empty {
    margin: 0.25rem 0 0;
    font-size: 0.92rem;
    color: var(--nx-fg-muted);
    line-height: 1.45;
  }
  code {
    font-size: 0.85em;
    color: var(--nx-fg);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  .btn {
    border-radius: 999px;
    border: 1px solid var(--nx-line);
    padding: 0.45rem 0.85rem;
    background: transparent;
    color: var(--nx-fg);
  }
  .btn.primary {
    background: color-mix(in oklab, var(--nx-accent) 22%, transparent);
    border-color: color-mix(in oklab, var(--nx-accent) 45%, transparent);
  }
  .btn.ghost:hover {
    background: rgba(255, 255, 255, 0.04);
  }
  :global(html.light) .btn.ghost:hover {
    background: rgba(0, 0, 0, 0.04);
  }
</style>
