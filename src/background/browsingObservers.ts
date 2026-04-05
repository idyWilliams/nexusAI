import type { WorkPatternEngine } from '$lib/engines/workPatternEngine'
import type { PageHistory } from '$lib/memory/types'
import type { MemoryVault } from '$lib/memory/vault'
import { containsOptionalPermission } from '$lib/permissions/chromePermissions'

function normalizeHttpUrl(url: string): { url: string; domain: string } | null {
  try {
    const u = new URL(url)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    const clean = `${u.origin}${u.pathname}${u.search}`
    return { url: clean, domain: u.hostname }
  } catch {
    return null
  }
}

const MAX_SEGMENT_MS = 4 * 60 * 60 * 1000

type ActiveSegment = {
  tabId: number
  pageId: string
  focusStartedAt: number
}

/**
 * Single listener set: coarse work pattern + optional IndexedDB page segments (active time only).
 */
export function attachBrowsingObservers(
  workEngine: WorkPatternEngine,
  vault: MemoryVault | null,
  opts: { recordMemory: boolean }
): () => void {
  let disposed = false
  const detach: Array<() => void> = []
  let active: ActiveSegment | null = null

  const accumulateFocus = async (now: number, closeSegment: boolean) => {
    if (!vault || !opts.recordMemory || !active) return
    const { pageId, focusStartedAt } = active
    const delta = Math.min(Math.max(0, now - focusStartedAt), MAX_SEGMENT_MS)
    await vault.updatePage(pageId, (p) => ({
      ...p,
      lastSeenAt: now,
      activeMs: p.activeMs + delta,
      endedAt: closeSegment ? now : p.endedAt
    }))
    if (!closeSegment) {
      active = { ...active, focusStartedAt: now }
    }
  }

  const startSegment = async (tab: chrome.tabs.Tab, now: number) => {
    if (!tab.id || !tab.url) return
    const n = normalizeHttpUrl(tab.url)
    if (!n) return

    await workEngine.addVisit({
      url: n.url,
      title: tab.title || n.domain,
      domain: n.domain,
      visitedAt: now
    })

    if (!vault || !opts.recordMemory) return

    const id = crypto.randomUUID()
    const page: PageHistory = {
      id,
      url: n.url,
      title: tab.title || n.domain,
      domain: n.domain,
      faviconUrl: tab.favIconUrl ?? null,
      startedAt: now,
      endedAt: null,
      lastSeenAt: now,
      activeMs: 0
    }
    await vault.putPage(page)
    active = { tabId: tab.id, pageId: id, focusStartedAt: now }
  }

  const activated = (info: chrome.tabs.TabActiveInfo) => {
    void (async () => {
      if (disposed) return
      if (active && active.tabId === info.tabId) return
      const now = Date.now()
      if (active) await accumulateFocus(now, true)
      active = null
      try {
        const tab = await chrome.tabs.get(info.tabId)
        await startSegment(tab, Date.now())
      } catch {
        /* tab gone */
      }
    })()
  }

  const updated = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
    if (!changeInfo.url) return
    void (async () => {
      if (disposed) return
      if (active?.tabId !== tabId) return
      const now = Date.now()
      await accumulateFocus(now, true)
      active = null
      try {
        const tab = await chrome.tabs.get(tabId)
        await startSegment(tab, Date.now())
      } catch {
        /* ignore */
      }
    })()
  }

  const removed = (tabId: number) => {
    void (async () => {
      if (disposed) return
      if (active?.tabId !== tabId) return
      const now = Date.now()
      await accumulateFocus(now, true)
      active = null
    })()
  }

  const onAlarm = (a: chrome.alarms.Alarm) => {
    if (a.name !== 'nexus-memory-tick') return
    const now = Date.now()
    void accumulateFocus(now, false)
  }

  const focusChanged = (windowId: number) => {
    void (async () => {
      if (disposed) return
      const now = Date.now()
      if (windowId === chrome.windows.WINDOW_ID_NONE) {
        if (active) await accumulateFocus(now, true)
        active = null
      } else {
        try {
          const [t] = await chrome.tabs.query({ active: true, windowId })
          if (t && t.id) {
            if (active && active.tabId === t.id) return // already tracking this tab
            if (active) await accumulateFocus(now, true)
            active = null
            await startSegment(t, now)
          }
        } catch {
          /* ignore */
        }
      }
    })()
  }

  void (async () => {
    const ok = await containsOptionalPermission('tabs')
    if (!ok || disposed) return

    chrome.tabs.onActivated.addListener(activated)
    chrome.tabs.onUpdated.addListener(updated)
    chrome.tabs.onRemoved.addListener(removed)
    chrome.windows.onFocusChanged.addListener(focusChanged)
    chrome.alarms.onAlarm.addListener(onAlarm)
    detach.push(() => chrome.tabs.onActivated.removeListener(activated))
    detach.push(() => chrome.tabs.onUpdated.removeListener(updated))
    detach.push(() => chrome.tabs.onRemoved.removeListener(removed))
    detach.push(() => chrome.windows.onFocusChanged.removeListener(focusChanged))
    detach.push(() => chrome.alarms.onAlarm.removeListener(onAlarm))

    if (opts.recordMemory && vault) {
      await chrome.alarms.create('nexus-memory-tick', { periodInMinutes: 2 })
    }

    try {
      const [t] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
      if (t?.id) {
        const now = Date.now()
        if (active) await accumulateFocus(now, true)
        active = null
        await startSegment(t, Date.now())
      }
    } catch {
      /* ignore */
    }
  })()

  return () => {
    disposed = true
    void chrome.alarms.clear('nexus-memory-tick')
    detach.forEach((d) => d())
    detach.length = 0
    active = null
  }
}
