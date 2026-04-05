import type { WorkPatternEngine } from '$lib/engines/workPatternEngine'
import {
  containsOptionalPermission,
  requestOptionalPermission
} from '$lib/permissions/chromePermissions'
import { attachBrowsingObservers } from './browsingObservers'

export async function hasTabsPermission(): Promise<boolean> {
  return containsOptionalPermission('tabs')
}

export async function requestTabsPermission(): Promise<boolean> {
  return requestOptionalPermission('tabs')
}

/** @deprecated Use attachBrowsingObservers from browsingObservers.ts with MemoryVault in the service worker. */
export function attachActivityObserver(engine: WorkPatternEngine): () => void {
  return attachBrowsingObservers(engine, null, { recordMemory: false })
}
