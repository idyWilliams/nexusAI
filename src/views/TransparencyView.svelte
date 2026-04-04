<script lang="ts">
  import type { HydratePayload, MemoryLevel } from '$lib/types'

  export let hydrate: HydratePayload
  export let onClearPatterns: () => Promise<void>
  export let onRemoveDomain: (domain: string) => Promise<void>

  $: top = hydrate.transparencyTopDomains
  $: lines = hydrate.patternSummaries
  $: memory = hydrate.settings.memoryLevel

  function memoryCopy(level: MemoryLevel): string {
    if (level === 'off') {
      return 'Off — NEXUS does not keep coarse visit aggregates for continuation or summaries.'
    }
    if (level === 'light') {
      return 'Light — a small local list of recent visits and domain tallies. Nothing leaves your device in MVP.'
    }
    return 'Full — richer local rhythm signals for follow-up suggestions. Still coarse; never page content.'
  }

  let clearing = false
  let removing: string | null = null

  async function clearAll() {
    clearing = true
    try {
      await onClearPatterns()
    } finally {
      clearing = false
    }
  }

  async function remove(domain: string) {
    removing = domain
    try {
      await onRemoveDomain(domain)
    } finally {
      removing = null
    }
  }
</script>

<section class="panel" aria-label="What NEXUS knows">
  <h3 class="h">What NEXUS knows</h3>
  <p class="lede">
    Coarse, local signals — <strong>not</strong> a browsing log. Domains are aggregated; full URLs stay bounded in a small
    recent list for continuation only.
  </p>

  <div class="block memory">
    <h4 class="sub">Memory level</h4>
    <p class="mem-val">{memory}</p>
    <p class="mem-desc">{memoryCopy(memory)}</p>
  </div>

  <div class="block">
    <div class="row">
      <h4 class="sub">Top domains</h4>
      {#if top.length > 0}
        <button
          type="button"
          class="text-btn"
          disabled={clearing}
          on:click={() => void clearAll()}
        >
          {clearing ? 'Clearing…' : 'Clear learned patterns'}
        </button>
      {/if}
    </div>
    {#if top.length === 0}
      <p class="empty">No domain tallies yet — browse with activity awareness on to build a small, humane summary.</p>
    {:else}
      <ul class="domains" aria-label="Domain frequency">
        {#each top as row}
          <li class="domain-row">
            <span class="dn">{row.domain}</span>
            <span class="ct">{row.count}</span>
            <button
              type="button"
              class="text-btn danger"
              disabled={removing === row.domain}
              on:click={() => void remove(row.domain)}
              aria-label={`Remove ${row.domain} from patterns`}
            >
              {removing === row.domain ? '…' : 'Remove'}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <div class="block">
    <h4 class="sub">Patterns</h4>
    <ul class="list">
      {#each lines as line}
        <li>{line}</li>
      {/each}
    </ul>
  </div>
</section>

<style>
  .panel {
    max-width: 520px;
  }
  .h {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    font-weight: 600;
  }
  .lede {
    margin: 0 0 1rem;
    font-size: 0.92rem;
    color: var(--nx-fg-muted);
    line-height: 1.45;
  }
  .block {
    margin-bottom: 1.1rem;
  }
  .memory {
    padding: 0.65rem 0.75rem;
    border-radius: 12px;
    border: 1px solid var(--nx-line);
    background: rgba(255, 255, 255, 0.02);
  }
  :global(html.light) .memory {
    background: rgba(0, 0, 0, 0.02);
  }
  .sub {
    margin: 0 0 0.35rem;
    font-size: 0.78rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--nx-fg-muted);
  }
  .mem-val {
    margin: 0 0 0.25rem;
    font-weight: 600;
    font-size: 0.95rem;
  }
  .mem-desc {
    margin: 0;
    font-size: 0.88rem;
    color: var(--nx-fg-muted);
    line-height: 1.45;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
  }
  .empty {
    margin: 0;
    font-size: 0.9rem;
    color: var(--nx-fg-muted);
    line-height: 1.45;
  }
  .domains {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .domain-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 0.5rem;
    align-items: center;
    font-size: 0.9rem;
    color: var(--nx-fg-muted);
  }
  .dn {
    color: var(--nx-fg);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ct {
    font-variant-numeric: tabular-nums;
    opacity: 0.85;
  }
  .text-btn {
    border: none;
    background: none;
    padding: 0;
    color: var(--nx-accent);
    font-size: 0.82rem;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .text-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .text-btn.danger {
    color: color-mix(in oklab, #c47b7b 70%, var(--nx-accent));
  }
  .list {
    margin: 0;
    padding-left: 1.1rem;
    color: var(--nx-fg-muted);
    font-size: 0.92rem;
    line-height: 1.45;
  }
</style>
