# NEXUS Product Constitution

**Version:** 1.1  
**Status:** Canonical — amendments require explicit version bump and changelog.  
**Companion:** [NEXUS System Specification & Logic Blueprint](./NEXUS_SYSTEM_SPEC.md)

---

## Preamble

NEXUS is a **browser-native** product for people who **live in the browser**. It exists to reduce **context loss** and **attention fragmentation** without becoming another **noisy dashboard**, **ambient surveillance product**, or **always-on AI companion**.

This constitution defines **non-negotiable principles**. Features, UX, and engineering must align with it. Where the [system spec](./NEXUS_SYSTEM_SPEC.md) adds detail, both apply.

---

## Article I — Calm surface

1. **Single-glance hierarchy.** The new tab presents **one primary work intention** at a time (e.g. Continue), not a grid of widgets or feeds.
2. **Adult, restrained tone.** Copy and visuals are calm and precise; avoid gamification, hype, or chatty personification by default.
3. **No dashboard sprawl.** NEXUS is not an analytics cockpit, notification center, or infinite-scroll start page.

---

## Article II — Contained assistant

1. **NEXUS-owned surfaces.** Primary value is delivered in surfaces the extension controls (new tab, settings, transparency, bounded recovery). The product does **not** inject behavior across arbitrary websites by default.
2. **No default content scripts on arbitrary pages.** Content scripts on third-party sites require **explicit** constitution-level justification and user understanding.
3. **Optional depth.** Advanced behavior is **progressively disclosed** (settings, transparency), not forced on first open.

---

## Article III — Work-aware, not creepy

1. **Coarse signals only.** Work awareness uses **hostnames**, **tab titles**, and **aggregates** appropriate to continuation—not page body text, keystrokes, or full browsing history APIs used as a log.
2. **User intent for observation.** Recording of activity requires the user to enable **work-aware mode** and, where the platform requires it, **optional** permissions (e.g. `tabs`) with a clear explanation.
3. **Transparency.** The user can see **what NEXUS remembers** in human-readable form and can **clear** or **narrow** it (e.g. remove domains, clear patterns).
4. **Honest empty states.** When data is missing or permission is denied, the UI states the truth plainly—never fake richness.

---

## Article IV — Local-first & trust

1. **MVP data stays on device.** Coarse patterns, settings, and task artifacts live in **local extension storage** unless and until a future version defines **explicit** sync with a documented trust model.
2. **Cloud AI is rare and explicit.** Any future cloud or model-assisted feature must be **opt-in**, **labeled**, and **constitution-reviewed**—never silent or ambient.
3. **Kill switches.** Users can disable memory depth, AI-related features (when present), and personalization consistent with the system spec. Settings must remain **usable** when features are off.

---

## Article V — Permissions & reversibility

1. **Minimal permissions.** Required permissions are limited to what the MVP needs (e.g. `storage`, `alarms`). Sensitive capabilities use **optional** permissions where the platform allows.
2. **Reversible.** Users can turn off work-aware observation. Where the platform allows, revoking optional access should be supported without breaking the shell.
3. **No surprise access.** Permission prompts follow **direct user action** (toggle, explicit request)—not hidden triggers.

---

## Article VI — Continue & inference

1. **At most one Continue suggestion** surfaced as the primary continuation path per hydration cycle, with **dismiss** and **never-again** (or equivalent) honored.
2. **Inference → artifact.** Task or follow-up ideas appear as **reviewable candidates** (accept / dismiss)—not silent automation that commits work on the user’s behalf without confirmation.
3. **No notification streams.** No pushy nags, badge spam, or continuous interruption for suggestions in MVP.

---

## Article VII — Modes

1. **Normal, Focus, Minimal** are first-class. They change **density and emphasis**, not the underlying trust model.
2. **Focus** reduces noise (e.g. fewer secondary surfaces); **Minimal** shows **essentials** only, with recovery and depth reachable through **deliberate** paths (e.g. settings).
3. **Mode discipline** must be enforced in product and code reviews when adding UI.

---

## Article VIII — Recovery & play

1. **Games are secondary.** Recovery experiences are **bounded**, **optional**, and **explicitly exited**—never the core loop of the product.
2. **Restorative, not extractive.** Recovery must not become a channel for ads, dark patterns, or endless engagement.

---

## Article IX — Engineering alignment

1. **Typed contracts.** Messages and storage shapes are **typed** and **validated** at runtime where ambiguity would harm users.
2. **Graceful degradation.** If the background worker or messaging fails, the new tab **still loads** a calm, honest fallback—not a blank or hung state.
3. **Tests for core logic.** Engines, merge/sanitize, and message guards warrant **automated tests**; manual QA covers extension lifecycle (see [QA_CHECKLIST](./QA_CHECKLIST.md)).

---

## Amendment process

1. Propose a change with **user impact**, **constitution article**, and **system spec** delta.
2. **Bump version** (e.g. 1.1 → 1.2) and add a short **changelog** at the bottom of this file.
3. Update the [playbook](./NEXUS_PLAYBOOK.md) if contributor norms change.

---

## Changelog

- **v1.1** — Consolidated articles for MVP: calm surface, containment, coarse work-awareness, local-first, permissions, Continue/inference, modes, recovery, engineering alignment.
