# NEXUS Product & Dev Playbook

**Canonical companions:**

- [**NEXUS Product Constitution v1.1**](./NEXUS_CONSTITUTION_v1.1.md) — non-negotiable principles.
- [**NEXUS System Specification & Logic Blueprint**](./NEXUS_SYSTEM_SPEC.md) — behavior and architecture detail.

This playbook orients collaborators; it does not replace those documents. **Index:** [docs/README.md](./README.md).

---

## 1. Audience & purpose

**Who this is for**

- **Engineers** shipping and reviewing the extension.
- **Designers** shaping surfaces, motion, and hierarchy.
- **PMs / founders** prioritizing work and saying no to scope creep.
- **Contributors** opening a PR or joining for a sprint.

**What this is for**

- **Understanding what NEXUS is** — a calm new-tab shell for people who live in the browser, not another AI dashboard.
- **How to think about features** — through constitution, user calm, and local trust.
- **How to work in this repo** — where logic lives, how data moves, how to test.
- **What “good” looks like** — serious, restrained, reversible, and explainable.

---

## 2. Product story

**What is NEXUS?**  
NEXUS is a **Manifest V3** new-tab experience that helps you **notice one useful next step** in your workday—resume a thread, see an honest summary of what the system inferred locally, and recover attention—**without** turning the browser into a feed, a chatty assistant, or a surveillance surface.

**The core problem**  
People who work in the browser juggle tabs, context loss, and noisy “productivity” products that either **decorate** (pretty but empty), **interrupt** (notifications, sidebars everywhere), or **extract** (opaque cloud AI on your behavior). NEXUS targets the gap: **lightweight continuity and transparency**, on **your device**, with **clear boundaries**.

**What makes it different**

| Alternative | NEXUS stance |
|-------------|--------------|
| **Momentum-style** new tabs | Beauty without pretending to understand your *work*; NEXUS is intentionally **work-aware** only when you opt in, and still **coarse** (domains/titles, not page content). |
| **AI sidebars / omnipresent copilots** | The assistant is **contained** in NEXUS surfaces (new tab, settings, transparency)—not injected across arbitrary sites by default. |
| **Generic “AI start pages”** | No infinite prompts, no chat-as-home. **One focal intention** (e.g. Continue), **inference as candidate artifacts** (tasks), not silent automation. |
| **Game hubs / dopamine feeds** | **Recovery** is a **bounded, optional** micro-experience with explicit exit—secondary to the shell, never the product’s center of gravity. |

Remember this line: **calm, local, optional depth, no dashboard sprawl.**

---

## 3. Non-negotiables (cheat sheet)

Scan before shipping UI, permissions, or data collection.

- [ ] **Calm & adult** — Compact hierarchy; not a busy AI or analytics dashboard.
- [ ] **Contained assistant** — No default content scripts on arbitrary sites; NEXUS value stays in NEXUS-owned surfaces unless the spec explicitly expands (and constitution allows).
- [ ] **Work-aware, not creepy** — Coarse signals only when the user enables work-aware mode; **Transparency** explains what exists; dismissals and kill switches honored.
- [ ] **Local-first** — MVP stays on-device; any future cloud AI is **explicit**, rare, and user-controlled—not ambient telemetry dressed as help.
- [ ] **Minimal permissions** — Optional `tabs` only when needed for agreed signals; reversible; no surprise prompts or hidden persistence of meaning beyond disclosed patterns.
- [ ] **Inference → artifact** — Suggestions and task ideas appear as **reviewable** UI (dismiss, never-again, save)—not silent writes to “the system.”
- [ ] **Games are secondary** — Recovery is restorative and bounded; not competitive, not a content feed.
- [ ] **Modes matter** — Normal / Focus / Minimal change **what surfaces**, not the user’s trust model.

---

## 4. Architecture map for contributors

### Directories (mental model)

| Area | Role |
|------|------|
| `src/background/` | Service worker: **hydration** (build snapshot), **UI message handler**, **ActivityObserver** (optional tabs), wiring to engines. |
| `src/lib/engines/` | **Pure** work logic: work patterns, Continue routing, task inference candidates. No DOM, no `chrome.*` here. |
| `src/lib/storage/` | **Keys, merge, sanitize, read/write** helpers—versioned shapes, defensive reads. |
| `src/lib/messages/` + `messageBus.ts` | **Typed** UI↔background messages; **runtime validation** of responses; fallbacks when messaging or payloads fail. |
| `src/newtab/` | Svelte **shell** entry (e.g. `App.svelte`)—orchestration, loading states, mode-aware layout. |
| `src/components/` | Reusable UI (Continue, settings sheet, etc.). |
| `src/views/` | Feature views (e.g. transparency). |
| `src/games/` | Recovery experience(s)—isolated from core product loops. |
| `docs/` | [**Constitution**](./NEXUS_CONSTITUTION_v1.1.md), [**system spec**](./NEXUS_SYSTEM_SPEC.md), **QA_CHECKLIST**, **MV3_DEVELOPER_QA**, [**index**](./README.md), this playbook. |

### Flow (how it fits together)

```
┌─────────────────────────────────────────────────────────────┐
│  New tab (Svelte) — shell, modes, settings, transparency      │
└───────────────────────────┬─────────────────────────────────┘
                            │  sendMessage (typed, validated)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Service worker — parse message → mutate storage / engine   │
│  → buildHydratePayload (engines + storage + permissions)      │
└───────────────────────────┬─────────────────────────────────┘
                            │  HydratePayload (validated)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  UI commits snapshot + theme; components render one truth     │
└─────────────────────────────────────────────────────────────┘

Engines ◄── read state via SW / storage APIs ──► chrome.storage (sanitized)
Tests ────► engines, merge/sanitize, message guards (Vitest; no browser E2E in MVP)
```

**In one breath:** UI asks for a **hydrated snapshot**; the background **applies mutations**, runs **engines** over **stored/coarse** data, and returns a **validated** payload; UI **never** trusts raw storage without going through that path for MVP actions.

---

## 5. How to work on NEXUS (dev workflow)

### Setup

1. Clone the repo, `npm install`.
2. **Dev:** `npm run dev` (Vite + CRX pipeline as configured).
3. **Production bundle:** `npm run build` → load **`dist/`** as **Load unpacked** in `chrome://extensions` (Developer mode on).

### Tests

- `npm test` — CI-style run.
- `npm run test:watch` — local iteration.

### Manual QA

- **`docs/QA_CHECKLIST.md`** — flows (install, modes, permissions, transparency, recovery, reduced motion, failure paths).
- **`docs/MV3_DEVELOPER_QA.md`** — SW lifecycle, permission drift, messaging pitfalls, what to re-test after touching storage/bus/settings/modes.

### Safe feature loop

1. Read **constitution** + **system spec** sections that apply.
2. Write a **one-paragraph user outcome** and confirm it doesn’t violate non-negotiables.
3. Decide **where change lives**: engine (pure), storage (merge/sanitize), message type (typed + validated), or UI only.
4. Implement the **smallest vertical slice** that respects boundaries.
5. Add or extend **unit tests** for parsers, merge/sanitize, or engine rules you touched.
6. Run **`npm test`** and **`npm run build`**.
7. Run the **relevant rows** of the QA checklist; note gaps in the PR.

---

## 6. Feature decision framework

**Allow / good / in-scope now**

Ask in order:

1. **Workday** — Does it clearly help someone **finish or resume meaningful browser work** without hijacking attention?
2. **Calm** — Does it add **one clear thing** or **dashboard noise** (feeds, grids, always-on widgets)?
3. **Local-first & permissions** — Can it ship **without** new host permissions or broad content scripts? If not, is the trade **documented and user-consented**?
4. **Inference → artifact** — Are outputs **visible, dismissible, and non-autonomous**?
5. **MVP slice** — Is it a **thin vertical** (one flow end-to-end), not a platform?

**Judgment**

| Idea | Verdict (example) |
|------|-------------------|
| Second Continue card + ranking carousel | **Bad** — breaks “at most one” calm surface; constitution conflict. |
| Focus mode hides shortcuts, emphasizes Continue | **Good** — mode discipline; likely in MVP follow-ups if not already. |
| Sync encrypted coarse summaries across devices | **v2+** — needs threat model, spec section, and explicit user opt-in; not MVP by default. |
| Cloud LLM summarizes every tab | **Reject** — noisy, permission-heavy, contradicts contained/local story unless completely redesigned under constitution. |

---

## 7. Patterns to follow vs avoid

### Patterns to follow

- **Engines:** Pure functions, explicit inputs/outputs, **unit-tested**; no side effects.
- **UI:** Small Svelte components, **clear props**, shell orchestrates hydration—not business rules buried in markup.
- **Messaging:** **Narrow** message types; **validate** responses; handle **sendMessage failure** with calm fallbacks.
- **Storage:** **Sanitize on read**; **version** and **merge** defensively when extending shapes.
- **UX:** **One focal intention** per view; details in settings / transparency (**progressive disclosure**).
- **Assistant:** Contained panel, structured actions, mode-aware, dismissible with cooldown—**not a chat interface**.

### Patterns to avoid

- New **global** or ad-hoc **cross-tab state** that bypasses storage + hydrate contract.
- **Heavy logic** or `chrome.*` **inside** presentation components.
- **Content scripts** or **permissions** added “for convenience” without constitution + spec updates.
- **Feeds, card grids, notification streams**, or always-on chat.
- **Over-personified AI** or default **chatty** copy—NEXUS is a **tool**, not a character.
- **Assistant scope creep:** Do not turn the Assistant into a chat feed, notification system, or secondary dashboard. Keep it structured and contained.

---

## 8. How to propose a change

**Process**

1. **Link** constitution + system spec sections (by heading or version).
2. **User story** — What the user sees/does; what problem disappears.
3. **Architecture** — Messages, storage keys, engine surfaces, new permissions (ideally none).
4. **QA** — Checklist rows + any new manual steps.
5. **Implement** — After the above is agreed (even briefly in PR description).

**Good proposal (sketch)**  
“Constitution § modes + spec § hydration. **User:** In Focus, I see Continue but not shortcuts, so I’m not nudged toward errands. **Impact:** `SuggestionRouter` / shell visibility only; no new permissions. **QA:** Mode matrix rows in QA_CHECKLIST.”

**Bad proposal (sketch)**  
“Let’s add a trending links widget; we can scrape from tabs.” — No spec link, violates calm + coarse-signal rules, implies hidden extraction.

---

## 9. Roadmap skeleton (product level)

**MVP (today)**  
Calm new-tab shell, **modes**, **optional** work-aware observation, **Continue** (single suggestion path), **task candidate** cards, **transparency** of coarse local data, **recovery** game, **settings** kill switches, validated messaging and storage—**credible** to serious users and devs.

**v2 (directional)**  
Deeper **work pattern** quality (still coarse), richer **insights** that stay **legible** and **dismissible**, possible **sync** or backup with explicit trust model—**still** not a dashboard product.

**v3 (directional)**  
**Optional, explicit** cloud or model-assisted features where the constitution allows—**never** as default surveillance or ambient automation; **inference → artifact** and **user control** remain non-negotiable.

*This is orientation only; prioritization lives in product planning, not this file.*

---

## 10. Contribution etiquette & code review

**Tone**  
Respectful, **constitution-first**. Ask **why** a change helps the user’s calm workday, not only **whether** it compiles.

**Reviewers should check**

- New **permissions** or **hosts** — default **reject** unless spec + constitution explicitly justify.
- **Constitution alignment** — modes, containment, coarse signals, games secondary.
- **Tests** for logic/parser/storage changes.
- **QA docs** updated when flows or failure modes change.

**Contributors should provide**

- **Pointers** to constitution/spec sections.
- **Before / after** behavior (or screenshots for UI).
- **Test commands run** and results.
- **QA checklist** notes when behavior touches permissions, storage, messaging, modes, or transparency.

---

*End of playbook. Repo root [`README.md`](../README.md) has setup commands; [`docs/README.md`](./README.md) lists all docs; manual tests: [`QA_CHECKLIST.md`](./QA_CHECKLIST.md), [`MV3_DEVELOPER_QA.md`](./MV3_DEVELOPER_QA.md).*
