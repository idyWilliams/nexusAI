<script lang="ts">
  import type { HydratePayload, Settings } from '$lib/types'
  import TransparencyView from '../views/TransparencyView.svelte'

  export let open: boolean
  export let hydrate: HydratePayload
  export let onClose: () => void
  export let onPatchSettings: (patch: Partial<Settings>) => Promise<void>
  export let onRequestTabs: () => Promise<void>
  export let onClearPatterns: () => Promise<void>
  export let onRemoveDomain: (domain: string) => Promise<void>
  /** Minimal mode hides the hero recovery control; this keeps recovery reachable without adding shell noise */
  export let onOpenRecovery: (() => void) | undefined = undefined

  let pane: 'settings' | 'transparency' = 'settings'

  $: settings = hydrate.settings
  $: tabsGranted = hydrate.tabsPermission

  async function patch(p: Partial<Settings>) {
    await onPatchSettings(p)
  }

  function onModeChange(e: Event) {
    const v = (e.currentTarget as HTMLSelectElement).value
    void patch({ mode: v as Settings['mode'] })
  }

  function onMemoryChange(e: Event) {
    const v = (e.currentTarget as HTMLSelectElement).value
    void patch({ memoryLevel: v as Settings['memoryLevel'] })
  }

  async function onActivityToggle(e: Event) {
    const checked = (e.currentTarget as HTMLInputElement).checked
    await patch({ activityAwarenessEnabled: checked })
  }

  function onAiToggle(e: Event) {
    void patch({ aiEnabled: (e.currentTarget as HTMLInputElement).checked })
  }

  function onPersonalizationToggle(e: Event) {
    void patch({ personalizationEnabled: (e.currentTarget as HTMLInputElement).checked })
  }

  function onThemeChange(e: Event) {
    const v = (e.currentTarget as HTMLSelectElement).value
    void patch({ theme: v as Settings['theme'] })
  }
</script>

{#if open}
  <div class="backdrop" role="presentation" on:click={onClose} />
  <div
    class="sheet"
    role="dialog"
    aria-modal="true"
    aria-labelledby="nx-settings-title"
    tabindex="-1"
  >
    <header class="head">
      <div>
        <h2 id="nx-settings-title" class="title">Settings</h2>
        <p class="sub">Quiet controls. No gamification.</p>
      </div>
      <button type="button" class="icon-btn" on:click={onClose} aria-label="Close settings">×</button>
    </header>

    <div class="tabs">
      <button
        type="button"
        class:active={pane === 'settings'}
        on:click={() => (pane = 'settings')}
      >
        General
      </button>
      <button
        type="button"
        class:active={pane === 'transparency'}
        on:click={() => (pane = 'transparency')}
      >
        What NEXUS knows
      </button>
    </div>

    {#if pane === 'settings'}
      {#key hydrate.session.lastHydratedAt}
        <div class="body">
        <label class="field">
          <span class="label">Mode</span>
          <select class="select" value={settings.mode} on:change={onModeChange}>
            <option value="normal">Normal</option>
            <option value="focus">Focus</option>
            <option value="minimal">Minimal</option>
          </select>
        </label>

        <label class="field">
          <span class="label">Memory</span>
          <select class="select" value={settings.memoryLevel} on:change={onMemoryChange}>
            <option value="off">Off</option>
            <option value="light">Light</option>
            <option value="full">Full</option>
          </select>
        </label>

        <div class="callout" role="note">
          <p class="callout-title">Work-aware mode</p>
          <p class="callout-body">
            When enabled, NEXUS may request the browser’s <code>tabs</code> permission to record
            <strong>coarse</strong> signals: active URL hostnames and tab titles. That powers Continue and domain tallies.
          </p>
          <ul class="callout-list">
            <li>Does not read page content, keystrokes, or full history.</li>
            <li>Does not inject scripts into websites you visit.</li>
            <li>Stays local — no sync of raw signals in MVP.</li>
          </ul>
          <p class="callout-foot">
            If you chose <strong>Block</strong> on the permission prompt, turn work-aware off and on again (or tap
            <strong>Request permission</strong>) to retry.
          </p>
        </div>

        <label class="toggle">
          <input
            type="checkbox"
            checked={settings.activityAwarenessEnabled}
            on:change={(e) => void onActivityToggle(e)}
          />
          <span>Allow work-aware observation (optional permission)</span>
        </label>
        {#if !tabsGranted && settings.activityAwarenessEnabled}
          <p class="hint">
            Permission not granted — approve the browser prompt when it appears, or use the button below. Denying keeps
            NEXUS usable; Continue stays coarse-signal only until you allow access.
          </p>
          <button type="button" class="linkish" on:click={() => void onRequestTabs()}>
            Request permission
          </button>
        {/if}
        {#if tabsGranted && !settings.activityAwarenessEnabled}
          <p class="hint">
            Access may still be granted in the browser, but NEXUS is <strong>not</strong> observing until you turn this on.
          </p>
        {/if}

        <label class="toggle">
          <input type="checkbox" checked={settings.aiEnabled} on:change={onAiToggle} />
          <span>AI features (stubbed in MVP)</span>
        </label>

        <label class="toggle">
          <input
            type="checkbox"
            checked={settings.personalizationEnabled}
            on:change={onPersonalizationToggle}
          />
          <span>Personalization</span>
        </label>

        <label class="field">
          <span class="label">Theme</span>
          <select class="select" value={settings.theme} on:change={onThemeChange}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>

        {#if settings.mode === 'minimal' && onOpenRecovery}
          <p class="hint minimal-recovery">
            <button
              type="button"
              class="linkish"
              on:click={() => {
                onClose()
                onOpenRecovery()
              }}
            >
              Open recovery moment
            </button>
            <span class="hint-rest"> — Calm circles, explicit exit.</span>
          </p>
        {/if}
        </div>
      {/key}
    {:else}
      {#key `${hydrate.session.lastHydratedAt}-${hydrate.transparencyTopDomains.length}`}
        <div class="body">
          <TransparencyView {hydrate} onClearPatterns={onClearPatterns} onRemoveDomain={onRemoveDomain} />
        </div>
      {/key}
    {/if}
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(2px);
  }
  .sheet {
    position: fixed;
    right: 1.25rem;
    top: 1.25rem;
    bottom: 1.25rem;
    width: min(420px, calc(100vw - 2.5rem));
    background: var(--nx-bg-elevated);
    border: 1px solid var(--nx-line);
    border-radius: 18px;
    box-shadow: var(--nx-shadow);
    padding: 1rem 1.1rem;
    overflow: auto;
    z-index: 20;
    animation: sheetEnter 0.2s ease-out;
  }
  @keyframes sheetEnter {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .sheet {
      animation: none;
    }
  }
  .head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
  }
  .title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 600;
  }
  .sub {
    margin: 0.25rem 0 0;
    font-size: 0.85rem;
    color: var(--nx-fg-muted);
  }
  .icon-btn {
    border: none;
    background: transparent;
    color: var(--nx-fg-muted);
    font-size: 1.4rem;
    line-height: 1;
    padding: 0.1rem 0.35rem;
  }
  .tabs {
    display: flex;
    gap: 0.5rem;
    margin: 1rem 0;
  }
  .tabs button {
    border: 1px solid transparent;
    background: transparent;
    color: var(--nx-fg-muted);
    padding: 0.35rem 0.55rem;
    border-radius: 999px;
  }
  .tabs button.active {
    color: var(--nx-fg);
    border-color: var(--nx-line);
    background: rgba(255, 255, 255, 0.03);
  }
  :global(html.light) .tabs button.active {
    background: rgba(0, 0, 0, 0.03);
  }
  .body {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .label {
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--nx-fg-muted);
  }
  .select {
    border-radius: 10px;
    border: 1px solid var(--nx-line);
    padding: 0.45rem 0.55rem;
    background: transparent;
    color: var(--nx-fg);
  }
  .callout {
    padding: 0.65rem 0.75rem;
    border-radius: 12px;
    border: 1px solid var(--nx-line);
    background: rgba(255, 255, 255, 0.02);
  }
  :global(html.light) .callout {
    background: rgba(0, 0, 0, 0.02);
  }
  .callout-title {
    margin: 0 0 0.35rem;
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--nx-fg-muted);
  }
  .callout-body {
    margin: 0 0 0.5rem;
    font-size: 0.88rem;
    color: var(--nx-fg-muted);
    line-height: 1.45;
  }
  .callout-list {
    margin: 0;
    padding-left: 1.1rem;
    font-size: 0.85rem;
    color: var(--nx-fg-muted);
    line-height: 1.4;
  }
  .callout-foot {
    margin: 0.65rem 0 0;
    font-size: 0.82rem;
    color: var(--nx-fg-muted);
    line-height: 1.4;
  }
  .toggle {
    display: flex;
    gap: 0.55rem;
    align-items: flex-start;
    font-size: 0.92rem;
    color: var(--nx-fg-muted);
  }
  .toggle input {
    margin-top: 0.2rem;
  }
  code {
    font-size: 0.85em;
    color: var(--nx-fg);
  }
  .hint {
    margin: 0;
    font-size: 0.85rem;
    color: var(--nx-fg-muted);
    line-height: 1.4;
  }
  .linkish {
    border: none;
    background: none;
    padding: 0;
    color: var(--nx-accent);
    text-decoration: underline;
    text-underline-offset: 3px;
    width: fit-content;
    cursor: pointer;
  }
  .minimal-recovery {
    display: block;
    margin-top: 0.25rem;
  }
  .hint-rest {
    color: var(--nx-fg-muted);
    font-size: 0.85rem;
  }
</style>
