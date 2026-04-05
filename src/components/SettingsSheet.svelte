<script lang="ts">
  import type { HydratePayload, Settings } from '$lib/types'
  import TransparencyView from '../views/TransparencyView.svelte'

  export let open: boolean
  export let hydrate: HydratePayload
  export let onClose: () => void
  export let onPatchSettings: (patch: Partial<Settings>) => Promise<void>
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

  let toggleStatus: 'off' | 'enabling...' | 'on' | 'permission blocked' = hydrate.settings.activityAwarenessEnabled ? 'on' : 'off'

  $: if (hydrate.settings.activityAwarenessEnabled && toggleStatus !== 'enabling...') toggleStatus = 'on'
  $: if (!hydrate.settings.activityAwarenessEnabled && toggleStatus !== 'permission blocked' && toggleStatus !== 'enabling...') toggleStatus = 'off'

  async function handleActivityToggle() {
    if (settings.activityAwarenessEnabled) {
      toggleStatus = 'off'
      await patch({ activityAwarenessEnabled: false })
      try {
        await chrome.permissions.remove({ permissions: ['tabs'] })
      } catch (err) {}
    } else {
      toggleStatus = 'enabling...'
      try {
        const granted = await chrome.permissions.request({ permissions: ['tabs'] })
        if (granted) {
          toggleStatus = 'on'
          await patch({ activityAwarenessEnabled: true })
        } else {
          toggleStatus = 'permission blocked'
        }
      } catch (err) {
        toggleStatus = 'permission blocked'
      }
    }
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

        <div class="toggle-row">
          <button 
            type="button"
            class="nx-switch"
            class:nx-switch-on={settings.activityAwarenessEnabled}
            class:nx-switch-loading={toggleStatus === 'enabling...'}
            on:click={() => void handleActivityToggle()}
            aria-label="Allow work-aware observation"
            disabled={toggleStatus === 'enabling...'}
          >
            <span class="nx-switch-knob"></span>
          </button>
          <div class="toggle-labels">
            <span class="toggle-main-label">Allow work-aware observation (optional permission)</span>
            {#if toggleStatus === 'permission blocked'}
              <p class="toggle-error">Chrome permission was denied. Enable it to allow work-aware observation.</p>
            {:else if toggleStatus === 'enabling...'}
              <p class="toggle-loading-text">Requesting permission...</p>
            {/if}
          </div>
        </div>

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
    font-size: 1.45rem;
    line-height: 1;
    padding: 0.25rem 0.35rem;
    border-radius: var(--nx-radius-sm);
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .icon-btn:hover {
    color: var(--nx-fg);
    background: color-mix(in oklab, var(--nx-fg) 5%, transparent);
  }
  .icon-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--nx-accent-subtle);
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
    border-radius: 8px;
    border: 1px solid var(--nx-line);
    padding: 0.45rem 0.55rem;
    background: transparent;
    color: var(--nx-fg);
    transition: all 0.2s ease;
  }
  .select:focus-visible {
    outline: none;
    border-color: var(--nx-accent);
    box-shadow: 0 0 0 2px var(--nx-accent-subtle);
  }
  .callout {
    padding: 0.75rem 0.85rem;
    border-radius: var(--nx-radius);
    border: none;
    background: color-mix(in oklab, var(--nx-line) 50%, transparent);
  }
  :global(html.light) .callout {
    background: color-mix(in oklab, var(--nx-line) 80%, transparent);
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
  .toggle-row {
    display: flex;
    gap: 0.8rem;
    align-items: flex-start;
    margin-top: 0.25rem;
  }
  .nx-switch {
    position: relative;
    width: 36px;
    height: 20px;
    background: var(--nx-line);
    border-radius: 999px;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: background 0.2s ease;
    flex-shrink: 0;
  }
  .nx-switch:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .nx-switch-on {
    background: var(--nx-accent);
  }
  .nx-switch:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--nx-accent-subtle);
  }
  .nx-switch-loading {
    animation: nxPulse 1.5s infinite;
  }
  @keyframes nxPulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
  .nx-switch-knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .nx-switch-on .nx-switch-knob {
    transform: translateX(16px);
  }
  .toggle-labels {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .toggle-main-label {
    font-size: 0.92rem;
    color: var(--nx-fg);
  }
  .toggle-error {
    margin: 0;
    font-size: 0.8rem;
    color: #ef4444; /* Calm red */
  }
  .toggle-loading-text {
    margin: 0;
    font-size: 0.8rem;
    color: var(--nx-accent);
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
