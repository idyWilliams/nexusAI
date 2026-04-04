# MV3 new-tab extension — developer QA notes

Concise pitfalls for NEXUS and what to re-test when you edit certain layers.

**Related:** [docs/README.md](./README.md) · [NEXUS_SYSTEM_SPEC.md](./NEXUS_SYSTEM_SPEC.md) · [NEXUS_CONSTITUTION_v1.1.md](./NEXUS_CONSTITUTION_v1.1.md)

## Common pitfalls

1. **Service worker sleep** — The background worker can stop; the next `sendMessage` wakes it. If you cache in-memory state only, assume it may be cold. NEXUS persists work patterns in `chrome.storage` via the work engine; still re-test hydration after idle or restart.

2. **`sendMessage` failures** — Invalidated extension, torn-down SW, or malformed responses should not leave the new tab hung. UI path uses validated payloads and fallbacks when messaging fails or the payload is invalid.

3. **Permission drift** — `tabs` may remain granted in the browser while the user turns off work-aware in NEXUS (or the reverse). UI must show **both** intent (settings) and **capability** (`tabsPermission`) honestly.

4. **Stale Reactivity** — Selects and toggles bound to a hydrate snapshot can lag after async patches. Prefer driving controls from the latest `lastHydratedAt` snapshot (or equivalent full refresh).

5. **Double hydration** — Avoid redundant round-trips on load when possible; ensure the first paint still has a defined fallback if the first message fails.

6. **Layout shift** — Skeleton and Continue should reserve similar vertical space so the shell does not jump when data arrives.

## Re-test map

| Area touched        | Minimum re-test |
|---------------------|-----------------|
| Storage read/write/merge/sanitize | Transparency clear/remove; settings persistence; corrupt-key recovery |
| Message bus / parse / validate | New tab load; any action that `sendMessage`s; invalid SW response handling |
| Settings / patch   | Toggles, theme, mode; permission prompt flow; sheet controls match stored state |
| Mode logic         | Normal / Focus / Minimal visibility matrix; Continue and shortcuts |
| Permissions        | Grant, deny, retry, off-after-grant, Request permission button |

Keep automated tests (`npm test`) green when changing parsers, merge/sanitize, or pure engines.
