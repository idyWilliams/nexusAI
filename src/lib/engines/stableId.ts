/** Stable id for dismiss/cooldown keys — same URL → same id across sessions. */
export function hashString(input: string): string {
  let h = 5381
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i)
  }
  return (h >>> 0).toString(16)
}
