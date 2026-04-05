<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte'
  import type { MemoryRecallHitUi } from '$lib/memory/types'

  export let recallHits: MemoryRecallHitUi[]
  export let memoryEnabled: boolean
  export let tabsPermission: boolean

  const dispatch = createEventDispatcher<{ search: { query: string } }>()

  let query = ''
  let debounce: ReturnType<typeof setTimeout> | undefined
  let inputEl: HTMLInputElement

  export function focusCommand(): void {
    inputEl?.focus()
  }

  function scheduleSearch() {
    clearTimeout(debounce)
    debounce = setTimeout(() => dispatch('search', { query }), 220)
  }

  onDestroy(() => clearTimeout(debounce))
</script>

<div class="command-wrap" aria-label="Find anything in recent memory">
  <div class="command-inner">
    <span class="kbd-hint" title="Focus search">⌘K / Ctrl+K</span>
    <input
      bind:this={inputEl}
      type="search"
      class="command-input"
      placeholder="Find anything you remember…"
      autocomplete="off"
      spellcheck="false"
      bind:value={query}
      on:input={scheduleSearch}
      disabled={!memoryEnabled || !tabsPermission}
    />
  </div>
  {#if !memoryEnabled}
    <p class="hint">Turn memory on in Settings to index recent titles and URLs locally.</p>
  {:else if !tabsPermission}
    <p class="hint">Allow activity awareness to build your local recall index.</p>
  {:else if query.trim().length === 0}
    <p class="hint subtle">Try: “that Stripe error from Tuesday”, “localhost dashboard”, “GitHub PR”.</p>
  {:else if recallHits.length === 0}
    <p class="hint subtle">No close matches in recent pages. Keep browsing — recall grows locally.</p>
  {:else}
    <ul class="hits">
      {#each recallHits as h}
        <li class="hit">
          <img class="favicon" src={h.iconUrl} alt="" width="20" height="20" />
          <div class="hit-body">
            <div class="hit-title-row">
              <span class="hit-title">{h.title}</span>
              <span class="hit-when">{h.whenLabel}</span>
            </div>
            {#if h.snippet}
              <p class="hit-snippet">{h.snippet}</p>
            {/if}
            <span class="hit-domain">{h.domain}</span>
          </div>
          {#if h.url}
            <a class="hit-open" href={h.url} rel="noreferrer" target="_blank" tabindex="-1">Open</a>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .command-wrap {
    margin-top: var(--nx-space-2);
  }
  .command-inner {
    position: relative;
    display: flex;
    align-items: center;
  }
  .kbd-hint {
    position: absolute;
    right: 12px;
    font-size: 11px;
    color: var(--nx-fg-muted);
    pointer-events: none;
    opacity: 0.75;
  }
  .command-input {
    width: 100%;
    padding: 16px 72px 16px 20px;
    border-radius: var(--nx-radius-lg);
    border: 1px solid var(--nx-line);
    background: var(--nx-bg-elevated);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); /* very subtle native lift */
    color: var(--nx-fg);
    font-size: 16px;
    font-family: var(--nx-font-primary);
    outline: none;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .command-input::placeholder {
    color: var(--nx-fg-muted);
    font-weight: 400;
  }
  .command-input:focus {
    border-color: var(--nx-accent);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1), 0 0 0 2px var(--nx-accent-subtle);
    transform: translateY(-1px);
  }
  .command-input:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .hint {
    margin: var(--nx-space-2) 0 0;
    font-size: 13px;
    color: var(--nx-fg-secondary);
  }
  .hint.subtle {
    color: var(--nx-fg-muted);
  }
  .hits {
    list-style: none;
    margin: var(--nx-space-3) 0 0;
    padding: 0;
    max-height: 280px;
    overflow-y: auto;
    border: 1px solid var(--nx-line);
    border-radius: var(--nx-radius-lg);
    background: var(--nx-bg-elevated);
    box-shadow: var(--nx-shadow-sm);
  }
  .hit {
    display: grid;
    grid-template-columns: 24px 1fr auto;
    gap: var(--nx-space-3);
    align-items: start;
    padding: var(--nx-space-3) var(--nx-space-4);
    border-bottom: 1px solid transparent; /* removing hard borders */
    transition: background 0.2s ease;
  }
  .hit:not(:last-child) {
    border-bottom-color: var(--nx-line);
  }
  .favicon {
    margin-top: 2px;
    border-radius: 4px;
  }
  .hit-body {
    min-width: 0;
  }
  .hit-title-row {
    display: flex;
    justify-content: space-between;
    gap: var(--nx-space-2);
    align-items: baseline;
  }
  .hit-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--nx-fg);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hit-when {
    flex-shrink: 0;
    font-size: 11px;
    color: var(--nx-fg-muted);
  }
  .hit-snippet {
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--nx-fg-secondary);
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .hit-domain {
    display: block;
    margin-top: 4px;
    font-size: 11px;
    color: var(--nx-fg-muted);
  }
  .hit-open {
    font-size: 13px;
    color: var(--nx-accent);
    text-decoration: none;
    align-self: center;
    padding: 4px 8px;
    border-radius: 8px;
  }
  .hit-open:hover {
    background: var(--nx-accent-subtle);
  }
</style>
