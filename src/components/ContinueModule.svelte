<script lang="ts">
  import type { ContinueEmptyReason, Suggestion } from '$lib/types'

  export let suggestion: Suggestion | null
  export let emptyReason: ContinueEmptyReason
  export let onDismiss: (neverAgain: boolean) => void
</script>

{#if suggestion}
  <section class="continue-card premium-card hero-card" aria-label="Continue">
    <div class="continue-content">
      <div class="continue-header">
        <div class="continue-badge">
          <span class="badge-icon">→</span>
          <span class="badge-text">Continue</span>
        </div>
      </div>
      
      <div class="continue-body">
        <h2 class="continue-title">{suggestion.title}</h2>
        <p class="continue-reason">{suggestion.reasonLine}</p>
      </div>
    </div>
    
    <div class="continue-actions">
      <a class="continue-btn btn-primary" href={suggestion.url}>
        <span class="btn-text">Open</span>
        <span class="btn-arrow">→</span>
      </a>
      <div class="secondary-actions">
        <button type="button" class="btn-ghost" on:click={() => onDismiss(false)}>
          Dismiss
        </button>
        <button type="button" class="btn-ghost subtle" on:click={() => onDismiss(true)}>
          Don't suggest again
        </button>
      </div>
    </div>
  </section>
{:else}
  <section class="continue-card empty-card premium-card" aria-label="Continue">
    <div class="empty-content">
      <div class="empty-header">
        <div class="continue-badge muted">
          <span class="badge-icon">○</span>
          <span class="badge-text">Continue</span>
        </div>
      </div>
      
      <div class="empty-body">
        <h2 class="empty-title">Start fresh</h2>
        {#if emptyReason === 'memory_off'}
          <p class="empty-reason">
            Memory is off — NEXUS won't rank continuations. Turn memory on in Settings when you want gentle resume hints.
          </p>
        {:else if emptyReason === 'needs_activity'}
          <p class="empty-reason">
            Enable work-aware mode (optional <code>tabs</code> permission) in Settings to let NEXUS see coarse domains — not page content — to suggest continuations.
          </p>
        {:else if emptyReason === 'no_visits'}
          <p class="empty-reason">
            No coarse signals yet. As you browse, NEXUS will keep a small local list — enough to suggest a calm resume, not a log.
          </p>
        {:else}
          <p class="empty-reason">
            Nothing to resume right now — either you recently dismissed this path, or nothing crossed the calm threshold. Open a tab when you're ready.
          </p>
        {/if}
      </div>
    </div>
  </section>
{/if}

<style>
  /* Premium Continue Card */
  .continue-card {
    background: var(--nx-bg-elevated);
    border: 1px solid var(--nx-line);
    border-radius: var(--nx-radius-lg);
    box-shadow: var(--nx-shadow);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    position: relative;
  }

  .hero-card {
    background: linear-gradient(135deg, var(--nx-bg-elevated) 0%, color-mix(in oklab, var(--nx-accent) 5%, var(--nx-bg-elevated)) 100%);
    border-color: color-mix(in oklab, var(--nx-accent) 15%, transparent);
  }

  .hero-card:hover {
    transform: translateY(-6px);
    box-shadow: var(--nx-shadow-lg);
    border-color: color-mix(in oklab, var(--nx-accent) 25%, transparent);
  }

  .empty-card {
    opacity: 0.8;
    background: var(--nx-bg-surface);
    border-color: var(--nx-line);
  }

  .empty-card:hover {
    transform: none;
    box-shadow: var(--nx-shadow);
  }

  /* Continue Badge */
  .continue-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--nx-space-1);
    padding: var(--nx-space-1) var(--nx-space-3);
    background: var(--nx-accent);
    color: white;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--nx-space-4);
  }

  .continue-badge.muted {
    background: var(--nx-accent-subtle);
    color: var(--nx-accent);
  }

  .badge-icon {
    font-size: 14px;
  }

  /* Continue Content */
  .continue-content {
    padding: var(--nx-space-6);
  }

  .continue-body {
    margin-bottom: var(--nx-space-6);
  }

  .continue-title {
    font-size: clamp(24px, 3.5vw, 32px);
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.02em;
    color: var(--nx-fg);
    margin: 0 0 var(--nx-space-3);
  }

  .continue-reason {
    font-size: 16px;
    color: var(--nx-fg-secondary);
    line-height: 1.5;
    margin: 0;
  }

  /* Empty State */
  .empty-content {
    padding: var(--nx-space-6);
  }

  .empty-body {
    margin-top: var(--nx-space-4);
  }

  .empty-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--nx-fg);
    margin: 0 0 var(--nx-space-3);
  }

  .empty-reason {
    font-size: 15px;
    color: var(--nx-fg-secondary);
    line-height: 1.5;
    margin: 0;
  }

  /* Continue Actions */
  .continue-actions {
    padding: var(--nx-space-6);
    padding-top: 0;
    display: flex;
    flex-direction: column;
    gap: var(--nx-space-3);
  }

  .continue-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--nx-space-2);
    padding: var(--nx-space-3) var(--nx-space-6);
    background: var(--nx-accent);
    color: white;
    border-radius: var(--nx-radius);
    font-size: 16px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
    border: 2px solid var(--nx-accent);
  }

  .continue-btn:hover {
    background: var(--nx-accent-hover);
    border-color: var(--nx-accent-hover);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(74, 124, 158, 0.3);
  }

  .btn-arrow {
    font-size: 18px;
    transition: transform 0.2s ease;
  }

  .continue-btn:hover .btn-arrow {
    transform: translateX(2px);
  }

  .secondary-actions {
    display: flex;
    gap: var(--nx-space-2);
    flex-wrap: wrap;
  }

  .btn-ghost {
    padding: var(--nx-space-2) var(--nx-space-3);
    background: transparent;
    color: var(--nx-fg-muted);
    border: 1px solid var(--nx-line);
    border-radius: var(--nx-radius-sm);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-ghost:hover {
    background: var(--nx-accent-subtle);
    color: var(--nx-accent);
    border-color: var(--nx-accent);
  }

  .btn-ghost.subtle {
    opacity: 0.7;
  }

  .btn-ghost.subtle:hover {
    opacity: 1;
  }

  code {
    font-family: var(--nx-font-mono);
    font-size: 0.9em;
    background: var(--nx-accent-subtle);
    color: var(--nx-accent);
    padding: 2px 4px;
    border-radius: 4px;
  }
</style>
