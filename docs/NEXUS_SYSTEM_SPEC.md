# NEXUS System Specification & Logic Blueprint

**Status:** Implementation north star for the MVP codebase.  
**Authority:** Subordinate to [NEXUS Product Constitution v1.1](./NEXUS_CONSTITUTION_v1.1.md).  
**Playbook:** [NEXUS Product & Dev Playbook](./NEXUS_PLAYBOOK.md)

When code and this document disagree, **fix the code** or **update this document** in the same change.

---

## 1. Product shape (MVP)

| Surface | Purpose |
|---------|---------|
| **New tab shell** | Time, greeting, mode-aware layout, hydration-driven UI. |
| **Continue** | At most **one** continuation suggestion per hydrate; dismiss + never-again + cooldown. |
| **Shortcuts** | Static / configured shortcuts (normal + minimal; hidden in focus per UX matrix). |
| **Task candidate** | Optional inferred task card in **normal** only; accept saves locally, dismiss updates meta. |
| **Settings sheet** | Mode, memory, theme, work-aware toggle, AI/personalization stubs, transparency tab. |
| **Transparency** | “What NEXUS knows”: memory level copy, top domains, pattern summaries; clear / remove domain. |
| **Recovery** | Calm Circles micro-game; explicit exit; session end updates local recovery meta. |

---

## 2. Modes (behavior matrix)

| Mode | Continue module | Shortcuts | Task candidate | Recovery entry |
|------|-----------------|-----------|------------------|----------------|
| **Normal** | Yes | Yes | If candidate | Hero + Settings |
| **Focus** | Yes | No | No | Subtle link + Settings |
| **Minimal** | No | Yes | No | Settings only (e.g. link in sheet) |

Engine rules (e.g. `SuggestionRouter`) also gate Continue on **memory**, **personalization**, and **minimal** mode.

---

## 3. Permissions (Manifest V3)

- **Required:** `storage`, `alarms` (as in `src/manifest.json`).
- **Optional:** `tabs` — requested when user enables **work-aware** observation; used only to observe **active tab** URL (normalized http/https) and **title** for coarse visits—not page scripts on arbitrary sites.
- **Optional (declared):** `notifications` — reserved; not a MVP notification stream for Continue (constitution).

`tabsPermission` in hydrate reflects **browser grant state**; `settings.activityAwarenessEnabled` reflects **user intent**. UI must show both accurately (e.g. granted but observation off).

---

## 4. Data & storage (conceptual)

- **Settings** — User preferences: `mode`, `memoryLevel`, `theme`, toggles, etc. Versioned schema.
- **Session** — Ephemeral / session fields including `activeMode` aligned with settings on hydrate.
- **Work patterns** — Recent visits (bounded list), domain counts, managed by **WorkPatternEngine**; cleared or pruned via transparency actions.
- **Dismissals** — Continue dismissals (cooldown, never-again keys).
- **Task inference meta** — Shown/dismissed candidate IDs, timestamps.
- **Recovery meta** — Last played timestamp for subtle UI hints.

**Rules:** Sanitize on read; merge defensively on write; no silent cross-device sync in MVP.

---

## 5. Engines (pure logic)

| Engine / module | Role |
|-----------------|------|
| **WorkPatternEngine** | Maintains recent visits and domain aggregates; picks best continuation candidate; pattern summaries and top domains for transparency. |
| **SuggestionRouter** | Maps candidate + settings + dismissals → **0 or 1** Continue suggestion; confidence thresholds and copy variants by mode/work domain heuristics. |
| **TaskInferenceEngine** | May emit a **task candidate** from coarse signals; subject to settings and dismissal meta. |
| **Continue empty reason** | Derives calm empty-state keys when no suggestion (memory off, needs activity, no visits, filtered). |

Engines avoid `chrome.*` and DOM; test with Vitest.

---

## 6. Messaging & hydration

- **Transport:** `chrome.runtime.sendMessage` from new tab → service worker.
- **MVP pattern:** UI messages (settings patch, dismiss, clear patterns, etc.) return a full **`HydratePayload`** after mutation (thin request → full snapshot).
- **Validation:** Responses parsed/validated before UI commits; corrupt or failed messages → **calm fallback** payload (see `fallbackHydrate` in code).
- **Types:** `UiToBackgroundMessage`, `HydratePayload` in `src/lib/types/messages.ts` — keep in sync with handlers.

---

## 7. Background service worker

- Registers **ActivityObserver** only when `tabs` permission is present and product rules say observation is on.
- **buildHydratePayload** assembles settings, session, suggestions, task candidate, tabs flag, summaries, transparency rows, recovery meta.
- **UI handler** applies mutations then rebuilds hydrate payload.

---

## 8. UI shell (new tab)

- **Bootstrap:** Initial `SHELL_READY` (or equivalent) yields first hydrate; theme applied from settings each commit.
- **Loading:** Skeleton → committed hydrate; reduced motion reduces animation.
- **Failure:** Missing/invalid hydrate still shows a **usable** shell with honest pattern-summary lines.

---

## 9. Testing & QA

- **Automated:** Vitest — engines, storage merge/sanitize, message parse/validate.
- **Manual:** [QA_CHECKLIST.md](./QA_CHECKLIST.md), [MV3_DEVELOPER_QA.md](./MV3_DEVELOPER_QA.md).

---

## 10. Out of scope (MVP)

- Cloud LLM on full page content by default.
- Content scripts on arbitrary sites for “assistant everywhere.”
- Multiple Continue cards, infinite feeds, or suggestion notification streams.
- Undisclosed telemetry or cross-device sync without a future spec + constitution pass.

---

## Document history

- Initial blueprint aligned with MVP repo: MV3, Svelte shell, engines, optional tabs, transparency, recovery game.
