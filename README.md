# NEXUS (MVP)

Calm **Manifest V3** new-tab extension: TypeScript (strict), Svelte 4, Vite, `@crxjs/vite-plugin`.

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/README.md](docs/README.md) | **Index** of all project docs |
| [docs/NEXUS_CONSTITUTION_v1.1.md](docs/NEXUS_CONSTITUTION_v1.1.md) | Product constitution (non-negotiables) |
| [docs/NEXUS_SYSTEM_SPEC.md](docs/NEXUS_SYSTEM_SPEC.md) | System spec & logic blueprint |
| [docs/NEXUS_PLAYBOOK.md](docs/NEXUS_PLAYBOOK.md) | Product & dev playbook for collaborators |
| [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md) | Manual QA checklist |
| [docs/MV3_DEVELOPER_QA.md](docs/MV3_DEVELOPER_QA.md) | MV3 developer QA notes |

## How to run

```bash
npm install
npm run dev
```

For production output:

```bash
npm run build
```

## Tests

Focused **Vitest** unit tests cover engines, storage merge/sanitize, and message contracts (no browser automation in MVP):

```bash
npm test
npm run test:watch
```

Load **unpacked** in Chrome/Edge: `chrome://extensions` → Developer mode → **Load unpacked** → select the `dist/` folder after `npm run build`.

Manual QA: [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md). MV3 pitfalls and re-test hints: [`docs/MV3_DEVELOPER_QA.md`](docs/MV3_DEVELOPER_QA.md).

## Constitution alignment (MVP)

Full text: [docs/NEXUS_CONSTITUTION_v1.1.md](docs/NEXUS_CONSTITUTION_v1.1.md). Summary:

- **Contained assistant**: no default content scripts on arbitrary pages; optional `tabs` only when the user enables activity awareness.
- **Calm UI**: single glance hierarchy, no busy widget grid.
- **Continue** suggestions only (at most one), with dismiss / never-again.
- **Task inference** as candidate cards only (no notifications).
- **Recovery**: Calm Circles micro-game with explicit exit.
- **Kill switches**: memory, AI (stubbed), personalization in Settings.


## Project layout

- `src/background/` — service worker, hydration builder, UI handler, `ActivityObserver`
- `src/newtab/` — Svelte shell (`App.svelte`)
- `src/lib/` — types, storage (`keys` / `merge` / `sanitize`), message parse+validate, engines
- `src/components/` — Continue, settings sheet
- `src/views/` — transparency (“What NEXUS knows”)
- `src/games/` — Calm Circles game
