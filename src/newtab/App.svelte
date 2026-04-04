<script lang="ts">
  import { onMount } from 'svelte'
  import ContinueModule from '../components/ContinueModule.svelte'
  import ShortcutsBar from '../components/ShortcutsBar.svelte'
  import SettingsSheet from '../components/SettingsSheet.svelte'
  import AssistantPanel from '../components/AssistantPanel.svelte'
  import CalmCirclesGame from '../games/CalmCirclesGame.svelte'
  import { sendToBackground } from '$lib/messageBus'
  import type { HydratePayload, Settings } from '$lib/types'
  import { BUILD_ID } from '$lib/types'

  let loading = true
  let hydrate: HydratePayload | null = null
  let settingsOpen = false
  let gameOpen = false
  let timeLabel = ''
  let tick: number

  function applyTheme(theme: Settings['theme']) {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    if (theme === 'light') {
      root.classList.add('light')
      return
    }
    if (theme === 'dark') {
      return
    }
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    if (!prefersDark) root.classList.add('light')
  }

  /** Every hydrate snapshot also drives theme so mode/settings changes never leave the shell visually stale */
  function commitHydrate(next: HydratePayload) {
    hydrate = next
    applyTheme(next.settings.theme)
  }

  function formatTime(d: Date) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }

  function greeting(d: Date) {
    const h = d.getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  async function refresh() {
    commitHydrate(await sendToBackground({ type: 'HYDRATE_REQUEST' }))
  }

  async function patchSettings(patch: Partial<Settings>) {
    commitHydrate(await sendToBackground({ type: 'SETTINGS_PATCH', payload: patch }))
  }

  async function clearPatterns() {
    commitHydrate(await sendToBackground({ type: 'CLEAR_WORK_PATTERNS' }))
  }

  async function removeDomain(domain: string) {
    commitHydrate(await sendToBackground({ type: 'REMOVE_DOMAIN_FROM_PATTERNS', payload: { domain } }))
  }

  async function dismissSuggestion(neverAgain: boolean) {
    if (!hydrate?.suggestions[0]) return
    const s = hydrate.suggestions[0]
    commitHydrate(
      await sendToBackground({
        type: 'USER_DISMISS',
        payload: { suggestionId: s.id, suggestionType: s.type, neverAgain }
      })
    )
  }

  async function dismissTask() {
    if (!hydrate?.taskCandidate) return
    commitHydrate(
      await sendToBackground({
        type: 'TASK_CANDIDATE_DISMISS',
        payload: { candidateId: hydrate.taskCandidate.id }
      })
    )
  }

  async function acceptTask() {
    if (!hydrate?.taskCandidate) return
    commitHydrate(
      await sendToBackground({
        type: 'TASK_CANDIDATE_ACCEPT',
        payload: { candidateId: hydrate.taskCandidate.id }
      })
    )
  }

  async function requestTabs() {
    commitHydrate(await sendToBackground({ type: 'REQUEST_TABS_PERMISSION' }))
  }

  async function endGameSession() {
    gameOpen = false
    commitHydrate(
      await sendToBackground({
        type: 'GAME_SESSION_END',
        payload: { endedAt: Date.now() }
      })
    )
  }

  async function dismissAssistantSuggestion(suggestionId: string) {
    commitHydrate(
      await sendToBackground({
        type: 'ASSISTANT_DISMISS_SUGGESTION',
        payload: { suggestionId }
      })
    )
  }

  function openTransparency() {
    settingsOpen = true
    // Note: SettingsSheet will need to handle opening the transparency tab
    // This could be enhanced with a specific tab state in future
  }

  async function handleAiSummaryRequest() {
    try {
      await sendToBackground({ type: 'AI_SUMMARIZE_REQUEST' })
    } catch (error) {
      console.error('Failed to request AI summary:', error)
    }
  }

  async function handleAiTaskPolishRequest(candidateId: string) {
    try {
      await sendToBackground({ type: 'AI_POLISH_TASK_REQUEST', candidateId })
    } catch (error) {
      console.error('Failed to request AI task polish:', error)
    }
  }

  function onDocumentKeydown(e: KeyboardEvent) {
    if (e.key !== 'Escape') return
    if (gameOpen) {
      e.preventDefault()
      void endGameSession()
      return
    }
    if (settingsOpen) {
      e.preventDefault()
      settingsOpen = false
    }
  }

  onMount(() => {
    const tickFn = () => {
      const d = new Date()
      timeLabel = formatTime(d)
    }
    tickFn()
    tick = window.setInterval(tickFn, 30_000)

    void (async () => {
      commitHydrate(
        await sendToBackground({ type: 'SHELL_READY', payload: { buildId: BUILD_ID } })
      )
      loading = false
    })()

    return () => window.clearInterval(tick)
  })

  $: mode = hydrate?.settings.mode ?? 'normal'
  $: recoveryRecent =
    hydrate?.recoveryLastPlayedAt != null &&
    Date.now() - hydrate.recoveryLastPlayedAt < 1000 * 60 * 120
</script>

<svelte:window on:keydown={onDocumentKeydown} />

{#if loading || !hydrate}
  <main class="page skeleton" aria-busy="true">
    <div class="sk-row">
      <div class="sk sk-title" />
      <div class="sk sk-actions" />
    </div>
    <div class="sk sk-line" />
    <div class="sk sk-card" />
  </main>
{:else}
  <main class="page shell" aria-label="NEXUS new tab">
    <header class="hero">
      <div>
        <p class="time" aria-live="polite">{timeLabel}</p>
        <h1 class="greet">{greeting(new Date())}</h1>
        {#if mode !== 'minimal'}
          <p class="subtle">Calm surface. One intention at a glance.</p>
        {/if}
      </div>
      <div class="actions">
        {#if mode !== 'minimal'}
          <span class="pill" title="Current mode">{mode} mode</span>
        {/if}
        {#if mode === 'normal'}
          <button
            type="button"
            class="ghost"
            class:ghost-quiet={recoveryRecent}
            on:click={() => (gameOpen = true)}
            aria-label="Open recovery moment"
          >
            Recover
          </button>
        {:else if mode === 'focus'}
          <button
            type="button"
            class="link-quiet"
            on:click={() => (gameOpen = true)}
            aria-label="Recovery (subtle)"
          >
            Recovery
          </button>
        {/if}
        {#if mode === 'minimal'}
          <button
            type="button"
            class="icon-ghost"
            on:click={() => (settingsOpen = true)}
            aria-label="Settings"
            title="Settings"
          >
            <span class="gear" aria-hidden="true">⚙</span>
          </button>
        {:else}
          <button type="button" class="ghost" on:click={() => (settingsOpen = true)} aria-label="Open settings">
            Settings
          </button>
        {/if}
      </div>
    </header>

    {#if mode !== 'minimal'}
      <section class="grid" aria-label="Primary">
        <ContinueModule
          suggestion={hydrate.suggestions[0] ?? null}
          emptyReason={hydrate.continueEmptyReason}
          onDismiss={dismissSuggestion}
        />
      </section>
    {/if}

    <!-- Assistant panel: positioned below Continue, alongside other content -->
    <AssistantPanel
      assistant={hydrate.assistant}
      aiSession={hydrate.aiSession}
      settings={hydrate.settings}
      taskCandidate={hydrate.taskCandidate}
      {mode}
      on:openTransparency={openTransparency}
      on:acceptTask={(e) => void acceptTask()}
      on:dismissTask={(e) => void dismissTask()}
      on:dismissSuggestion={(e) => dismissAssistantSuggestion(e.detail.suggestionId)}
      on:aiSummaryRequest={() => handleAiSummaryRequest()}
      on:aiTaskPolishRequest={(e) => handleAiTaskPolishRequest(e.detail.candidateId)}
    />

    {#if mode === 'normal' || mode === 'minimal'}
      <ShortcutsBar />
    {/if}

    {#if hydrate.taskCandidate && mode === 'normal'}
      <section class="task card" aria-label="Suggested follow-up">
        <div>
          <p class="eyebrow">Optional follow-up</p>
          <h3 class="t">{hydrate.taskCandidate.titleGuess}</h3>
          <p class="why">{hydrate.taskCandidate.provenance.evidenceSummary}</p>
        </div>
        <div class="row">
          <button type="button" class="btn primary" on:click={() => void acceptTask()}>Save</button>
          <button type="button" class="btn ghost" on:click={() => void dismissTask()}>Dismiss</button>
        </div>
      </section>
    {/if}

    {#if gameOpen}
      <div class="overlay" role="presentation" />
      <section class="game-modal" aria-label="Recovery">
        <CalmCirclesGame onExit={() => void endGameSession()} />
      </section>
    {/if}

    <SettingsSheet
      open={settingsOpen}
      {hydrate}
      onClose={() => (settingsOpen = false)}
      onPatchSettings={patchSettings}
      onRequestTabs={requestTabs}
      onClearPatterns={clearPatterns}
      onRemoveDomain={removeDomain}
      onOpenRecovery={() => (gameOpen = true)}
    />
  </main>
{/if}

<style>
  .page {
    min-height: 100%;
    padding: clamp(1.25rem, 4vw, 2.75rem);
    max-width: 980px;
    margin: 0 auto;
    transition: opacity 0.35s ease;
  }
  .shell {
    opacity: 1;
  }
  .skeleton {
    opacity: 0.85;
  }
  @media (prefers-reduced-motion: reduce) {
    .page {
      transition: none;
    }
  }
  .sk-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }
  .sk {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.04),
      rgba(255, 255, 255, 0.09),
      rgba(255, 255, 255, 0.04)
    );
    background-size: 200% 100%;
    animation: shimmer 1.2s ease-in-out infinite;
    border-radius: 12px;
  }
  :global(html.light) .sk {
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.04));
    background-size: 200% 100%;
  }
  @media (prefers-reduced-motion: reduce) {
    .sk {
      animation: none;
    }
  }
  @keyframes shimmer {
    0% {
      background-position: 0% 0%;
    }
    100% {
      background-position: -200% 0%;
    }
  }
  .sk-title {
    height: 1.4rem;
    width: 40%;
  }
  .sk-actions {
    height: 2rem;
    width: 120px;
    border-radius: 999px;
  }
  .sk-line {
    height: 0.85rem;
    width: 65%;
    margin-bottom: 1.5rem;
  }
  .sk-card {
    min-height: 11.5rem;
    height: 11.5rem;
    width: min(560px, 100%);
  }
  .hero {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 1.25rem;
  }
  .time {
    margin: 0;
    font-size: 0.85rem;
    letter-spacing: 0.04em;
    color: var(--nx-fg-muted);
  }
  .greet {
    margin: 0.15rem 0 0.25rem;
    font-size: clamp(1.6rem, 2.6vw, 2.1rem);
    font-weight: 600;
    letter-spacing: -0.03em;
  }
  .subtle {
    margin: 0;
    color: var(--nx-fg-muted);
    font-size: 0.95rem;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
  }
  .pill {
    font-size: 0.78rem;
    padding: 0.35rem 0.6rem;
    border-radius: 999px;
    border: 1px solid var(--nx-line);
    color: var(--nx-fg-muted);
    align-self: flex-start;
  }
  .ghost {
    border-radius: 999px;
    border: 1px solid var(--nx-line);
    background: transparent;
    color: var(--nx-fg);
    padding: 0.45rem 0.75rem;
    font-size: 0.88rem;
    transition: opacity 0.2s ease, border-color 0.2s ease;
  }
  .ghost-quiet {
    opacity: 0.65;
  }
  .link-quiet {
    border: none;
    background: none;
    padding: 0.35rem 0.45rem;
    font-size: 0.82rem;
    color: var(--nx-fg-muted);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .icon-ghost {
    border-radius: 999px;
    border: 1px solid var(--nx-line);
    background: transparent;
    color: var(--nx-fg);
    width: 2.25rem;
    height: 2.25rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .gear {
    font-size: 1rem;
    line-height: 1;
  }
  .grid {
    margin-top: 0.25rem;
    min-height: 11.5rem;
  }
  .task {
    margin-top: 1rem;
    max-width: 560px;
  }
  .card {
    background: var(--nx-bg-elevated);
    border: 1px solid var(--nx-line);
    border-radius: var(--nx-radius);
    padding: 1.1rem 1.2rem;
    box-shadow: var(--nx-shadow);
  }
  .eyebrow {
    margin: 0 0 0.35rem;
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--nx-fg-muted);
  }
  .t {
    margin: 0 0 0.35rem;
    font-size: 1.05rem;
    font-weight: 600;
  }
  .why {
    margin: 0;
    font-size: 0.9rem;
    color: var(--nx-fg-muted);
    line-height: 1.45;
  }
  .row {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.85rem;
  }
  .btn {
    border-radius: 999px;
    border: 1px solid var(--nx-line);
    padding: 0.45rem 0.85rem;
    background: transparent;
    color: var(--nx-fg);
    font-size: 0.88rem;
  }
  .btn.primary {
    background: color-mix(in oklab, var(--nx-accent) 22%, transparent);
    border-color: color-mix(in oklab, var(--nx-accent) 45%, transparent);
  }
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(2px);
    z-index: 15;
    animation: nxOverlayIn 0.2s ease-out;
  }
  .game-modal {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(640px, calc(100vw - 2rem));
    z-index: 16;
    background: var(--nx-bg-elevated);
    border: 1px solid var(--nx-line);
    border-radius: 18px;
    padding: 1rem;
    box-shadow: var(--nx-shadow);
    animation: nxModalIn 0.22s ease-out;
  }
  @keyframes nxOverlayIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes nxModalIn {
    from {
      opacity: 0;
      transform: translate(-50%, -48%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .overlay,
    .game-modal {
      animation: none;
    }
  }
</style>
