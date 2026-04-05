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

<section class="thread-card" aria-label="Recent work thread">
  <div class="thread-header">
    <span class="thread-badge">Continue thread</span>
    {#if !memoryEnabled}
      <span class="thread-hint">Memory off</span>
    {:else if !tabsPermission}
      <span class="thread-hint">Needs activity permission</span>
    {/if}
  </div>
  <h2 class="thread-title">{thread.label}</h2>
  <p class="thread-meta">
    {thread.pageCount} tabs · ~{thread.activeMinutesEstimate} min active · last touch
    {new Date(thread.lastActivityAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
  </p>
  <ul class="thread-pages">
    {#each thread.pages.slice(0, 6) as p}
      <li>
        <img class="favicon" src={p.iconUrl} alt="" width="18" height="18" />
        <a href={p.url} rel="noreferrer" target="_blank">{p.title}</a>
        <span class="domain">{p.domain}</span>
      </li>
    {/each}
  </ul>
  {#if thread.pages.length > 6}
    <p class="more">+{thread.pages.length - 6} more in this thread</p>
  {/if}

  <div class="thread-actions">
    <button class="btn btn-primary" on:click={handleResume} disabled={resuming || !tabsPermission}>
      Resume Session
    </button>
    <button class="btn btn-ghost" on:click={handleExplain} disabled={loadingExplanation || explanation !== null || !tabsPermission}>
      Explain Work ✨
    </button>
  </div>

  {#if loadingExplanation}
    <div class="explain-skeleton sk sk-line" style="margin-top: 1rem; width: 100%;"></div>
    <div class="explain-skeleton sk sk-line" style="width: 80%;"></div>
  {:else if explanation}
    <div class="explanation-box">
      <p class="explanation-summary">{explanation.summary}</p>
      <p class="explanation-disclosure">Based on: {explanation.basedOn.join(', ')} <span class="ai-label">AI-generated</span></p>
    </div>
  {:else if explainError}
    <p class="explanation-error">Unable to generate explanation right now.</p>
  {/if}
</section>

<style>
  .thread-card {
    background: var(--nx-bg-elevated);
    border: 1px solid var(--nx-line);
    border-radius: var(--nx-radius-lg);
    padding: var(--nx-space-5);
    box-shadow: var(--nx-shadow);
  }
  .thread-header {
    display: flex;
    align-items: center;
    gap: var(--nx-space-2);
    margin-bottom: var(--nx-space-2);
  }
  .thread-badge {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--nx-accent);
  }
  .thread-hint {
    font-size: 12px;
    color: var(--nx-fg-muted);
  }
  .thread-title {
    margin: 0 0 var(--nx-space-1);
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--nx-fg);
  }
  .thread-meta {
    margin: 0 0 var(--nx-space-4);
    font-size: 13px;
    color: var(--nx-fg-secondary);
  }
  .thread-pages {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--nx-space-2);
  }
  .thread-pages li {
    display: grid;
    grid-template-columns: 20px 1fr auto;
    align-items: center;
    gap: var(--nx-space-2);
    font-size: 14px;
  }
  .favicon {
    border-radius: 4px;
    background: var(--nx-bg);
  }
  .thread-pages a {
    color: var(--nx-fg);
    text-decoration: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .thread-pages a:hover {
    color: var(--nx-accent);
    text-decoration: underline;
  }
  .domain {
    font-size: 12px;
    color: var(--nx-fg-muted);
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .more {
    margin: var(--nx-space-3) 0 0;
    font-size: 12px;
    color: var(--nx-fg-muted);
  }
  .thread-actions {
    display: flex;
    gap: var(--nx-space-2);
    margin-top: var(--nx-space-5);
  }
  .explanation-box {
    margin-top: var(--nx-space-4);
    padding: var(--nx-space-3);
    background: var(--nx-bg-surface);
    border-radius: var(--nx-radius);
    border: 1px dashed var(--nx-line);
  }
  .explanation-summary {
    margin: 0 0 var(--nx-space-2);
    font-size: 14px;
    color: var(--nx-fg);
    line-height: 1.45;
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
    padding: 2px 6px;
    border-radius: 4px;
  }
  .explanation-error {
    margin-top: var(--nx-space-4);
    font-size: 13px;
    color: #ef4444;
  }
  .btn {
    padding: var(--nx-space-2) var(--nx-space-4);
    border-radius: var(--nx-radius);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn-primary {
    background: var(--nx-accent);
    color: #fff;
  }
  .btn-primary:hover:not(:disabled) {
    background: color-mix(in oklab, var(--nx-accent) 90%, black);
  }
  .btn-ghost {
    background: transparent;
    color: var(--nx-fg);
  }
  .btn-ghost:hover:not(:disabled) {
    background: var(--nx-bg-surface);
  }
</style>
