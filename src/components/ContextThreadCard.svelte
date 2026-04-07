<script lang="ts">
  import type { ContextThreadPreview } from '$lib/memory/types'

  export let thread: ContextThreadPreview
  export let memoryEnabled: boolean
  export let tabsPermission: boolean

  let resuming = false
  let loadingExplanation = false
  let explanation: { summary: string, basedOn: string[] } | null = null
  let explainError = false

  async function handleResume() {
    if (thread.pages.length > 8) {
      if (!confirm(`This thread has ${thread.pages.length} tabs. Resume all?`)) return
    }
    resuming = true
    try {
      const urls = thread.pages.map(p => p.url)
      await chrome.runtime.sendMessage({ 
        type: 'RESUME_THREAD_REQUEST', 
        payload: { label: thread.label, urls }
      })
    } finally {
      resuming = false
    }
  }

  async function handleExplain() {
    loadingExplanation = true
    explainError = false
    try {
      const res = await chrome.runtime.sendMessage({
        type: 'AI_EXPLAIN_THREAD_REQUEST',
        threadId: thread.id,
        label: thread.label,
        pages: thread.pages.map(p => ({ title: p.title, domain: p.domain, url: p.url }))
      })
      if (res && res.type === 'AI_EXPLAIN_THREAD_RESPONSE') {
         if (!res.isAiGenerated && res.summary.includes('Unable to explain')) {
            explainError = true
         } else {
            explanation = { summary: res.summary, basedOn: res.basedOn }
         }
      }
    } catch {
      explainError = true
    } finally {
      loadingExplanation = false
    }
  }
</script>

<section class="thread-pane" aria-label="Recent work thread">
  <div class="pane-eyebrow">
    Recent Thread
    {#if !memoryEnabled}<span class="pane-hint">· Memory off</span>{:else if !tabsPermission}<span class="pane-hint">· Needs activity permission</span>{/if}
  </div>

  <div class="thread-row">
    <div class="thread-info">
      <p class="thread-title">{thread.label}</p>
      <p class="thread-meta">{thread.pageCount} tabs · ~{thread.activeMinutesEstimate}m</p>
    </div>

    <div class="thread-favicons">
      {#each thread.pages.slice(0, 5) as p}
        <div class="fav" title={p.title}>
          {#if p.iconUrl}
            <img src={p.iconUrl} alt="" width="16" height="16" />
          {:else}
            <div class="fav-fallback"></div>
          {/if}
        </div>
      {/each}
      {#if thread.pages.length > 5}
        <div class="fav fav-more">+{thread.pages.length - 5}</div>
      {/if}
    </div>
  </div>

  <div class="thread-actions">
    <button class="btn btn-primary" on:click={handleResume} disabled={resuming || !tabsPermission}>
      {resuming ? 'Resuming…' : 'Resume Session'}
    </button>
    <button class="btn btn-ghost" on:click={handleExplain} disabled={loadingExplanation || explanation !== null || !tabsPermission}>
      {loadingExplanation ? 'Thinking…' : 'Explain Work'}
    </button>
  </div>

  {#if explanation}
    <div class="explanation-box">
      <p class="explanation-summary">{explanation.summary}</p>
      <p class="explanation-disclosure">Based on: {explanation.basedOn.join(', ')} <span class="ai-label">AI</span></p>
    </div>
  {:else if explainError}
    <p class="explanation-error">Unable to generate explanation right now.</p>
  {/if}
</section>

<style>
  .thread-pane {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 10px;
    padding: 1rem 1.25rem;
  }

  :global(html.light) .thread-pane {
    background: rgba(0, 0, 0, 0.02);
    border-color: rgba(0, 0, 0, 0.07);
  }

  .pane-eyebrow {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--nx-fg-muted);
    margin-bottom: 0.625rem;
  }

  .pane-hint {
    font-weight: 400;
    font-size: 11px;
    letter-spacing: 0;
    text-transform: none;
  }

  .thread-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .thread-info {
    min-width: 0;
  }

  .thread-title {
    margin: 0 0 0.2rem;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--nx-fg);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .thread-meta {
    margin: 0;
    font-size: 12px;
    color: var(--nx-fg-muted);
  }

  .thread-favicons {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .fav {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--nx-bg-elevated);
    border: 1.5px solid var(--nx-bg-surface);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: -5px;
    overflow: hidden;
    position: relative;
    z-index: 1;
  }

  .fav:first-child { margin-left: 0; }

  .fav-fallback {
    width: 100%;
    height: 100%;
    background: var(--nx-line);
  }

  .fav-more {
    font-size: 10px;
    font-weight: 700;
    color: var(--nx-fg-muted);
    background: var(--nx-bg-elevated);
  }

  .thread-actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn {
    padding: 0.3rem 0.75rem;
    border-radius: 6px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: opacity 0.15s ease;
  }

  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--nx-accent);
    color: #fff;
  }

  .btn-primary:hover:not(:disabled) {
    opacity: 0.88;
  }

  .btn-ghost {
    background: transparent;
    color: var(--nx-fg-muted);
    border: 1px solid var(--nx-line);
  }

  .btn-ghost:hover:not(:disabled) {
    color: var(--nx-fg);
    border-color: var(--nx-fg-muted);
  }

  .explanation-box {
    margin-top: 0.75rem;
    padding: 0.625rem 0.75rem;
    background: rgba(255,255,255,0.02);
    border-radius: 6px;
    border-left: 2px solid var(--nx-accent);
  }

  .explanation-summary {
    margin: 0 0 0.375rem;
    font-size: 13px;
    color: var(--nx-fg);
    line-height: 1.5;
  }

  .explanation-disclosure {
    margin: 0;
    font-size: 11px;
    color: var(--nx-fg-muted);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .ai-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: var(--nx-accent-subtle);
    color: var(--nx-accent);
    padding: 1px 5px;
    border-radius: 4px;
  }

  .explanation-error {
    margin-top: 0.5rem;
    font-size: 12px;
    color: #ef4444;
  }
</style>
