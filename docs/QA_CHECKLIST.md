# NEXUS MVP — manual QA checklist

Use after `npm run build` and loading **unpacked** from `dist/`. Chrome or Chromium-based browser.

**Product law:** [NEXUS_CONSTITUTION_v1.1.md](./NEXUS_CONSTITUTION_v1.1.md) · **Expected behavior:** [NEXUS_SYSTEM_SPEC.md](./NEXUS_SYSTEM_SPEC.md) · **All docs:** [README.md](./README.md)

## Core flows

- [ ] **Install / load unpacked** — Extension loads without errors; new tab shows NEXUS shell.
- [ ] **First new tab** — Time, greeting, and mode-appropriate chrome appear; no blank or stuck state.
- [ ] **Skeleton → loaded** — Brief skeleton then content; no permanent spinner; layout does not jump sharply when Continue appears.
- [ ] **Mode switching** — Normal / Focus / Minimal: hero, Continue, shortcuts, task card, and recovery entry points match expectations (see [constitution](./NEXUS_CONSTITUTION_v1.1.md) and [system spec](./NEXUS_SYSTEM_SPEC.md) mode matrix).
- [ ] **Settings persistence** — Change mode, memory, theme, toggles; reload new tab; values persist.
- [ ] **Tabs permission — grant** — Enable work-aware; approve prompt; `tabsPermission` true; Continue / domains can populate after browsing.
- [ ] **Tabs permission — deny** — Deny prompt; UI stays usable; honest copy explains state; can retry via toggle + Request permission.
- [ ] **Activity off after grant** — Turn work-aware off; hint reflects "granted but not observing"; observation stops per product rules.
- [ ] **Continue dismiss** — Dismiss and "never again" update suggestion; empty state is calm and accurate.
- [ ] **Transparency** — Clear patterns and remove domain refresh lists and summaries without sheet going stale.
- [ ] **Recovery game** — Open Calm circles; exit via button; shell returns cleanly; Escape exits and updates state.
- [ ] **Browser restart** — After full browser restart, new tab hydrates; storage intact.
- [ ] **Reduced motion** — OS "reduce motion" on: skeleton shimmer and modal/sheet motion minimized or off.
- [ ] **Broken extension / SW** — Reload extension while tab open, or trigger `sendMessage` failure: calm fallback message, not infinite load.

## Assistant panel

- [ ] **Assistant visibility** — Panel appears below Continue in normal/focus modes; minimal strip in minimal mode.
- [ ] **Collapsed state** — Shows preview line with action count; expandable via click/keyboard.
- [ ] **Normal mode** — Shows up to 3 suggestions (Continue, Transparency, Task actions) when available.
- [ ] **Focus mode** — Shows work-related suggestions only; copy is direct and functional.
- [ ] **Minimal mode** — Shows single-line strip with at most one action; no expandable content.
- [ ] **Context summary** — Displays pattern summaries and top domains appropriately.
- [ ] **Action handling** — Open Continue opens new tab; Open Transparency opens settings; Task actions work correctly.
- [ ] **Dismissal** — Dismiss button hides suggestions for 4-hour cooldown; persists across reloads.
- [ ] **Empty states** — Helpful copy when no context or suggestions available.
- [ ] **Keyboard navigation** — Tab through suggestions; Enter to activate; Escape still works for settings/game.

## AI features (disabled by default)

- [ ] **AI toggle** — AI features are OFF by default; Settings shows clear toggle.
- [x] **Feature toggles** — Individual controls for "AI summaries" and "Task polish".
- [x] **Mock behavior** — With mock provider, AI features work without real API calls.
- [x] **"Explain what I was doing"** — Button appears when AI summaries enabled; generates context summary.
- [x] **AI-assisted badge** — Shows "(AI-assisted)" indicator on AI-generated content.
- [x] **Task polish** — "Improve wording" button appears for task candidates when enabled.
- [x] **Loading states** — Shows loading spinner during AI requests; other UI remains interactive.
- [x] **Error handling** — Graceful fallback to local behavior when AI fails.
- [ ] **Rate limiting** — After 3 requests, shows "try again later" message.
- [ ] **Data privacy** — No full URLs or page content sent to AI (verify with mock logs).

## Mode spot-checks

| Mode    | Continue | Shortcuts | Task card | Recovery entry        |
|---------|----------|-----------|-----------|------------------------|
| Normal  | Yes      | Yes       | If candidate | Hero + Settings (minimal link N/A) |
| Focus   | Yes      | No        | No        | Subtle link + Settings |
| Minimal | No       | Yes       | No        | Via Settings only      |

## AI Manual Testing Steps

### Basic AI Setup
1. Load extension with default settings
2. Verify AI features are disabled by default
3. Enable AI globally in Settings
4. Enable individual AI features (summaries, task polish)
5. Verify mock adapter works without API keys

### AI Summary Testing
1. With AI summaries enabled, verify "Explain what I was doing" button appears
2. Click button and verify loading state shows
3. Verify success state shows AI-assisted content
4. Test error state by disabling AI provider
5. Verify fallback to local view works

### Task Polish Testing
1. With task polish enabled and task candidate present, verify "Improve wording" button appears
2. Click button and verify loading state
3. Verify polished content appears with accept/dismiss actions
4. Test that accepting feeds into existing task flow
5. Test that dismissing removes only polished suggestion

### Mode Discipline Testing
1. **Normal mode**: Both AI controls visible and functional
2. **Focus mode**: Only AI summary visible, task polish hidden
3. **Minimal mode**: All AI controls hidden

### Rate Limiting Testing
1. Make 3 AI requests in quick succession
2. Verify 4th request shows rate limit message
3. Wait 30 minutes and verify requests work again

## Regression triggers

If you change **storage**, **message parsing**, **settings patch**, **mode gating**, or **permissions**, re-run the rows that touch those areas at minimum.

See `docs/MV3_DEVELOPER_QA.md` for extension-specific pitfalls.
