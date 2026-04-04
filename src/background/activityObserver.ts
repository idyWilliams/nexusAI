import type { WorkPatternEngine } from '$lib/engines/workPatternEngine'
import {
  containsOptionalPermission,
  requestOptionalPermission
} from '$lib/permissions/chromePermissions'

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

export async function hasTabsPermission(): Promise<boolean> {
  return containsOptionalPermission('tabs')
}

export async function requestTabsPermission(): Promise<boolean> {
  return requestOptionalPermission('tabs')
}

/**
 * Minimal ActivityObserver: registers only when optional `tabs` permission is granted.
 * Coarse only: hostname + title — no page content, no history API.
 */
export function attachActivityObserver(engine: WorkPatternEngine): () => void {
  let disposed = false
  const detach: Array<() => void> = []

  const onTab = async (tabId: number) => {
    if (disposed) return
    try {
      const tab = await chrome.tabs.get(tabId)
      if (!tab.url) return
      const n = normalizeHttpUrl(tab.url)
      if (!n) return
      await engine.addVisit({
        url: n.url,
        title: tab.title || n.domain,
        domain: n.domain,
        visitedAt: Date.now()
      })
    } catch {
      /* ignore */
    }
  }

  const activated = (info: chrome.tabs.TabActiveInfo) => {
    void onTab(info.tabId)
  }

  const updated = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
    if (changeInfo.url) {
      void onTab(tabId)
    }
  }

  void (async () => {
    const ok = await hasTabsPermission()
    if (!ok || disposed) return

    chrome.tabs.onActivated.addListener(activated)
    chrome.tabs.onUpdated.addListener(updated)
    detach.push(() => chrome.tabs.onActivated.removeListener(activated))
    detach.push(() => chrome.tabs.onUpdated.removeListener(updated))
  })()

  return () => {
    disposed = true
    detach.forEach((d) => d())
    detach.length = 0
  }
}
