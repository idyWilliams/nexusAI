<script lang="ts">
  import type { ContinueEmptyReason, Suggestion } from '$lib/types'

  export let suggestion: Suggestion | null
  export let emptyReason: ContinueEmptyReason
  export let onDismiss: (neverAgain: boolean) => void
</script>

{#if suggestion}
  <section class="continue-card command-surface" aria-label="Continue">
    <div class="command-header">
      <div class="system-badge">
        <div class="badge-indicator"></div>
        <span class="badge-label">Continue</span>
      </div>
      <div class="system-status">
        <span class="status-dot"></span>
        <span class="status-text">Ready</span>
      </div>
    </div>
    
    <div class="command-content">
      <div class="primary-content">
        <h2 class="command-title">{suggestion.title}</h2>
        <p class="command-context">{suggestion.reasonLine}</p>
      </div>
    </div>
    
    <div class="command-actions">
      <a class="command-trigger" href={suggestion.url}>
        <span class="trigger-text">Open</span>
        <span class="trigger-arrow">→</span>
      </a>
      <div class="secondary-controls">
        <button type="button" class="control-ghost" on:click={() => onDismiss(false)}>
          Dismiss
        </button>
        <button type="button" class="control-ghost subtle" on:click={() => onDismiss(true)}>
          Don't suggest again
        </button>
      </div>
    </div>
  </section>
{:else}
  <section class="continue-card empty-surface" aria-label="Continue">
    <div class="empty-header">
      <div class="system-badge dormant">
        <div class="badge-indicator"></div>
        <span class="badge-label">Continue</span>
      </div>
    </div>
    
    <div class="empty-content">
      <div class="primary-content">
        <h2 class="command-title">Start fresh</h2>
        {#if emptyReason === 'memory_off'}
          <p class="command-context">
            Memory is off — NEXUS won't rank continuations. Turn memory on in Settings when you want gentle resume hints.
          </p>
        {:else if emptyReason === 'needs_activity'}
          <p class="command-context">
            Enable work-aware mode (optional <code>tabs</code> permission) in Settings to let NEXUS see coarse domains — not page content — to suggest continuations.
          </p>
        {:else if emptyReason === 'no_visits'}
          <p class="command-context">
            No coarse signals yet. As you browse, NEXUS will keep a small local list — enough to suggest a calm resume, not a log.
          </p>
        {:else}
          <p class="command-context">
            Nothing to resume right now — either you recently dismissed this path, or nothing crossed the calm threshold. Open a tab when you're ready.
          </p>
        {/if}
      </div>
    </div>
  </section>
{/if}

<style>
  /* Command Surface - Premium System Panel */
  .continue-card {
    background: var(--nx-bg-elevated);
    border: 1px solid var(--nx-line);
    border-radius: var(--nx-radius-lg);
    box-shadow: var(--nx-shadow);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    position: relative;
  }

  .command-surface {
    background: linear-gradient(145deg, var(--nx-bg-elevated) 0%, color-mix(in oklab, var(--nx-accent) 3%, var(--nx-bg-elevated)) 100%);
    border: 1px solid color-mix(in oklab, var(--nx-accent) 12%, transparent);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.03);
    transform: scale(1.02);
  }

  .command-surface:hover {
    transform: scale(1.03) translateY(-2px);
    box-shadow: 
      0 16px 48px rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    border-color: color-mix(in oklab, var(--nx-accent) 20%, transparent);
  }

  .empty-surface {
    opacity: 0.85;
    background: var(--nx-bg-surface);
    border-color: var(--nx-line);
    transform: scale(1);
  }

  .empty-surface:hover {
    transform: scale(1.01);
    opacity: 0.9;
  }

  /* Command Header - System Panel Top */
  .command-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--nx-space-4) var(--nx-space-6);
    background: linear-gradient(180deg, color-mix(in oklab, var(--nx-accent) 8%, transparent) 0%, transparent 100%);
    border-bottom: 1px solid var(--nx-line);
  }

  .empty-header {
    padding: var(--nx-space-4) var(--nx-space-6);
    background: var(--nx-bg-surface);
    border-bottom: 1px solid var(--nx-line);
  }

  /* System Badge - Status Indicator */
  .system-badge {
    display: flex;
    align-items: center;
    gap: var(--nx-space-2);
    padding: var(--nx-space-1) var(--nx-space-3);
    background: var(--nx-accent);
    color: white;
    border-radius: var(--nx-radius);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .system-badge.dormant {
    background: var(--nx-accent-subtle);
    color: var(--nx-accent);
  }

  .badge-indicator {
    width: 6px;
    height: 6px;
    background: currentColor;
    border-radius: 50%;
    opacity: 0.8;
  }

  .badge-label {
    font-weight: 600;
  }

  /* System Status - Ready State */
  .system-status {
    display: flex;
    align-items: center;
    gap: var(--nx-space-1);
    font-size: 11px;
    color: var(--nx-fg-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-dot {
    width: 4px;
    height: 4px;
    background: var(--nx-success);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Command Content - Main Information */
  .command-content {
    padding: var(--nx-space-8) var(--nx-space-6) var(--nx-space-6);
  }

  .empty-content {
    padding: var(--nx-space-6);
  }

  .primary-content {
    display: flex;
    flex-direction: column;
    gap: var(--nx-space-3);
  }

  .command-title {
    font-size: clamp(28px, 4vw, 36px);
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.03em;
    color: var(--nx-fg);
    margin: 0;
  }

  .command-context {
    font-size: 16px;
    color: var(--nx-fg-secondary);
    line-height: 1.5;
    margin: 0;
    max-width: 90%;
  }

  /* Command Actions - Primary Control */
  .command-actions {
    padding: var(--nx-space-6);
    padding-top: 0;
    display: flex;
    flex-direction: column;
    gap: var(--nx-space-4);
  }

  .command-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--nx-space-3);
    padding: var(--nx-space-4) var(--nx-space-8);
    background: var(--nx-accent);
    color: white;
    border-radius: var(--nx-radius);
    font-size: 18px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid var(--nx-accent);
    position: relative;
    overflow: hidden;
  }

  .command-trigger::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s ease;
  }

  .command-trigger:hover::before {
    left: 100%;
  }

  .command-trigger:hover {
    background: var(--nx-accent-hover);
    border-color: var(--nx-accent-hover);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(74, 124, 158, 0.4);
  }

  .trigger-text {
    font-weight: 600;
  }

  .trigger-arrow {
    font-size: 20px;
    transition: transform 0.3s ease;
  }

  .command-trigger:hover .trigger-arrow {
    transform: translateX(4px);
  }

  /* Secondary Controls - Subtle Actions */
  .secondary-controls {
    display: flex;
    gap: var(--nx-space-3);
    flex-wrap: wrap;
  }

  .control-ghost {
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

  .control-ghost:hover {
    background: var(--nx-accent-subtle);
    color: var(--nx-accent);
    border-color: var(--nx-accent);
    transform: translateY(-1px);
  }

  .control-ghost.subtle {
    opacity: 0.6;
  }

  .control-ghost.subtle:hover {
    opacity: 1;
  }

  /* Code styling */
  code {
    font-family: var(--nx-font-mono);
    font-size: 0.9em;
    background: var(--nx-accent-subtle);
    color: var(--nx-accent);
    padding: 2px 4px;
    border-radius: 4px;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .command-title {
      font-size: 24px;
    }
    
    .command-context {
      font-size: 15px;
    }
    
    .command-trigger {
      padding: var(--nx-space-3) var(--nx-space-6);
      font-size: 16px;
    }
  }
</style>
