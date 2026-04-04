/**
 * Typed wrappers for optional extension permissions (MVP: `tabs`).
 * v2: notifications — wire similarly when reminders ship.
 */

export type OptionalPermissionName = 'tabs'

export async function containsOptionalPermission(
  permission: OptionalPermissionName
): Promise<boolean> {
  return chrome.permissions.contains({ permissions: [permission] })
}

export async function requestOptionalPermission(
  permission: OptionalPermissionName
): Promise<boolean> {
  try {
    return await chrome.permissions.request({ permissions: [permission] })
  } catch {
    return false
  }
}

export async function removeOptionalPermission(
  permission: OptionalPermissionName
): Promise<boolean> {
  try {
    return await chrome.permissions.remove({ permissions: [permission] })
  } catch {
    return false
  }
}
