<script lang="ts">
  import { onMount } from 'svelte'
  import ContinueModule from '../components/ContinueModule.svelte'
  import ShortcutsBar from '../components/ShortcutsBar.svelte'
  import SettingsSheet from '../components/SettingsSheet.svelte'
  import AssistantPanel from '../components/AssistantPanel.svelte'
  import ContextThreadCard from '../components/ContextThreadCard.svelte'
  import MemoryCommandBar from '../components/MemoryCommandBar.svelte'
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
  let memoryCommandBar: { focusCommand: () => void } | undefined

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

  function greeting(d: Date, userName?: string) {
    const h = d.getHours()
    let timeGreeting = 'Good evening'
    if (h < 12) timeGreeting = 'Good morning'
    else if (h < 17) timeGreeting = 'Good afternoon'

    return userName ? `${timeGreeting}, ${userName}` : timeGreeting
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

  async function runMemoryRecall(query: string) {
    commitHydrate(
      await sendToBackground({ type: 'MEMORY_RECALL', payload: { query } })
    )
  }

  async function handleAiTaskPolishRequest(candidateId: string) {
    try {
      await sendToBackground({ type: 'AI_POLISH_TASK_REQUEST', candidateId })
    } catch (error) {
      console.error('Failed to request AI task polish:', error)
    }
  }

  function onDocumentKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      memoryCommandBar?.focusCommand()
      return
    }
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
  <main class="page shell" aria-label="NEXUS new tab" class:minimal={mode === 'minimal'} class:focus={mode === 'focus'}>

    <!-- Premium main content -->
    <div class="nexus-content" class:minimal={mode === 'minimal'} class:focus={mode === 'focus'}>
      <div class="content-grid">
        <!-- Primary focus area -->
        <div class="primary-zone">
          <header class="app-header">
            <div class="brand-hero">
              <div class="time-display" aria-live="polite">{timeLabel}</div>
              <h1 class="greeting">{greeting(new Date(), hydrate.settings.userName)}</h1>
            </div>

            <div class="shell-utilities">
              {#if mode !== 'minimal'}
                <div class="mode-indicator">
                  <span class="mode-label">{mode}</span>
                </div>
              {/if}
              <div class="control-actions">
                {#if mode === 'normal'}
                  <button
                    type="button"
                    class="control-btn recovery-btn"
                    class:subtle={recoveryRecent}
                    on:click={() => (gameOpen = true)}
                    aria-label="Open recovery moment"
                  >
                    <span class="btn-icon">◉</span>
                    <span class="btn-text">Recover</span>
                  </button>
                {:else if mode === 'focus'}
                  <button
                    type="button"
                    class="control-btn subtle-btn"
                    on:click={() => (gameOpen = true)}
                    aria-label="Recovery (subtle)"
                  >
                    Recovery
                  </button>
                {/if}
                <button
                  type="button"
                  class="control-btn settings-btn"
                  on:click={() => (settingsOpen = true)}
                  aria-label="Open settings"
                >
                  <span class="btn-icon">⚙</span>
                  {#if mode !== 'minimal'}<span class="btn-text">Settings</span>{/if}
                </button>
              </div>
            </div>
          </header>

          {#if mode !== 'minimal'}
            <section class="continue-section" aria-label="Primary action">
              <ContinueModule
                suggestion={hydrate.suggestions[0] ?? null}
                emptyReason={hydrate.continueEmptyReason}
                onDismiss={dismissSuggestion}
              />
            </section>
            {#if hydrate.contextRecovery.topThread}
              <section class="thread-section" aria-label="Thread continuation">
                <ContextThreadCard
                  thread={hydrate.contextRecovery.topThread}
                  memoryEnabled={hydrate.settings.memoryLevel !== 'off'}
                  tabsPermission={hydrate.tabsPermission}
                />
              </section>
            {/if}
            <section class="recall-section" aria-label="Memory recall">
              <MemoryCommandBar
                bind:this={memoryCommandBar}
                recallHits={hydrate.contextRecovery.recallHits}
                memoryEnabled={hydrate.settings.memoryLevel !== 'off'}
                tabsPermission={hydrate.tabsPermission}
                on:search={(e) => void runMemoryRecall(e.detail.query)}
              />
            </section>
          {/if}
          
          {#if hydrate.taskCandidate && mode === 'normal'}
            <section class="task-candidate premium-card" aria-label="Suggested follow-up">
              <div class="task-content">
                <div class="task-header">
                  <span class="task-badge">Optional</span>
                  <h3 class="task-title">{hydrate.taskCandidate.titleGuess}</h3>
                </div>
                <p class="task-description">{hydrate.taskCandidate.provenance.evidenceSummary}</p>
              </div>
              <div class="task-actions">
                <button type="button" class="btn btn-primary" on:click={() => void acceptTask()}>
                  Save Task
                </button>
                <button type="button" class="btn btn-ghost" on:click={() => void dismissTask()}>
                  Dismiss
                </button>
              </div>
            </section>
          {/if}
        </div>

        <!-- Secondary intelligence zone -->
        <div class="secondary-zone">
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
        </div>
      </div>
    </div>

    <!-- Premium shortcuts bar -->
    {#if mode === 'normal' || mode === 'minimal'}
      <footer class="nexus-footer">
        <ShortcutsBar />
      </footer>
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
      onClearPatterns={clearPatterns}
      onRemoveDomain={removeDomain}
      onOpenRecovery={() => (gameOpen = true)}
    />
  </main>
{/if}

<style>
  .page {
    min-height: 100vh;
    padding: clamp(1.5rem, 4vw, 3rem) clamp(1.5rem, 4vw, 2.5rem);
    max-width: 1200px;
    margin: 0 auto;
    transition: opacity 0.35s ease;
    position: relative;
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

  /* App Header & Utilities */
  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: var(--nx-space-2);
  }

  .shell-utilities {
    display: flex;
    align-items: center;
    gap: var(--nx-space-4);
  }

  .brand-hero {
    display: flex;
    flex-direction: column;
  }

  .time-display {
    font-size: 14px;
    font-weight: 600;
    color: var(--nx-fg-muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: var(--nx-space-2);
  }

  .greeting {
    font-size: clamp(22px, 3vw, 26px);
    font-weight: 600;
    line-height: 1.1;
    letter-spacing: -0.01em;
    color: var(--nx-fg);
    margin: 0;
  }


    padding: var(--nx-space-1) var(--nx-space-3);
    background: transparent;
    border: 1px dotted var(--nx-line-strong);
    border-radius: 999px;
    color: var(--nx-fg-muted);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .control-actions {
    display: flex;
    gap: var(--nx-space-3);
    align-items: center;
  }

  .control-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--nx-space-2);
    padding: var(--nx-space-2) var(--nx-space-4);
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
    border: none;
    background: transparent;
    color: var(--nx-fg-muted);
  }

  .control-btn:hover {
    background: var(--nx-bg-surface);
    color: var(--nx-fg);
  }

  .control-btn.subtle {
    opacity: 0.7;
  }

  .control-btn.subtle:hover {
    opacity: 1;
  }

  .btn-icon {
    font-size: 16px;
  }

  /* Premium Layout */
  .nexus-content {
    width: 100%;
    margin: 0 auto;
    position: relative;
  }

  .content-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 300px);
    gap: var(--nx-space-8);
    align-items: start;
  }

  .nexus-content.minimal .content-grid {
    grid-template-columns: 1fr;
    gap: var(--nx-space-4);
  }

  .nexus-content.focus .content-grid {
    grid-template-columns: 1fr 320px;
    gap: var(--nx-space-6);
  }

  .primary-zone {
    display: flex;
    flex-direction: column;
    gap: var(--nx-space-4);
  }

  .secondary-zone {
    position: sticky;
    top: var(--nx-space-8);
  }

  .nexus-content.minimal .secondary-zone {
    position: static;
  }

  /* Premium Cards */
  .premium-card {
    background: var(--nx-bg-elevated);
    border: 1px solid var(--nx-line);
    border-radius: var(--nx-radius-lg);
    box-shadow: var(--nx-shadow);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }

  .premium-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--nx-shadow-lg);
  }

  .task-candidate {
    padding: var(--nx-space-6);
  }

  .task-content {
    margin-bottom: var(--nx-space-4);
  }

  .task-header {
    display: flex;
    align-items: center;
    gap: var(--nx-space-3);
    margin-bottom: var(--nx-space-3);
  }

  .task-badge {
    padding: var(--nx-space-1) var(--nx-space-2);
    background: var(--nx-accent-subtle);
    color: var(--nx-accent);
    border-radius: var(--nx-radius-sm);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .task-title {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
    color: var(--nx-fg);
  }

  .task-description {
    font-size: 15px;
    color: var(--nx-fg-secondary);
    line-height: 1.5;
    margin: 0;
  }

  .task-actions {
    display: flex;
    gap: var(--nx-space-2);
  }

  /* Footer */
  .nexus-footer {
    margin-top: var(--nx-space-12);
    padding: 0 var(--nx-space-8);
  }

  /* Mode-specific adjustments */
  .shell.focus :global(.command-surface) {
    transform: scale(1.04);
    border-color: color-mix(in oklab, var(--nx-accent) 25%, transparent);
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .shell.focus :global(.command-surface:hover) {
    transform: scale(1.05) translateY(-3px);
    box-shadow: 
      0 20px 60px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .shell.focus .premium-card {
    opacity: 0.7;
    transform: scale(0.98);
  }

  .shell.focus .premium-card:hover {
    opacity: 0.9;
    transform: scale(0.99);
  }

  .shell.minimal .nexus-content {
    background: radial-gradient(ellipse at center, var(--nx-bg) 0%, var(--nx-bg-surface) 100%);
  }

  .shell.minimal :global(.command-surface) {
    transform: scale(1.06);
    border-color: color-mix(in oklab, var(--nx-accent) 30%, transparent);
    box-shadow: 
      0 16px 48px rgba(0, 0, 0, 0.45);
  }

  .shell.minimal :global(.command-surface:hover) {
    transform: scale(1.07) translateY(-4px);
    box-shadow: 
      0 24px 64px rgba(0, 0, 0, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.07);
  }

  .shell.minimal .premium-card {
    display: none;
  }

  .shell.minimal .nexus-footer {
    opacity: 0.5;
  }

  /* Header mode variations */
  .shell.minimal .shell-utilities {
    opacity: 0.5;
  }

  /* Control button mode variations */
  .shell.focus .control-btn {
    opacity: 0.6;
  }

  .shell.focus .control-btn:hover {
    opacity: 1;
  }

  .shell.minimal .control-btn:not(.settings-btn) {
    display: none;
  }

  .shell.minimal .mode-indicator {
    display: none;
  }

  /* Greeting mode variations */
  .shell.focus .greeting {
    font-size: clamp(24px, 3.5vw, 42px);
  }

  .shell.minimal .greeting {
    font-size: clamp(32px, 4.5vw, 56px);
  }
</style>
