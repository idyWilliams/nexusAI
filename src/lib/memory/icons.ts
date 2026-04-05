import { normalizeCoarseDomain } from '$lib/config/workDomains'

const KNOWN_ICON_HOSTS: ReadonlyArray<{ match: (h: string) => boolean; icon: string }> = [
  {
    match: (h) => h === 'github.com' || h.endsWith('.github.com'),
    icon: 'https://github.githubassets.com/favicons/favicon.svg'
  },
  {
    match: (h) => h.includes('notion.so') || h.endsWith('.notion.site'),
    icon: 'https://www.notion.so/images/favicon.ico'
  },
  {
    match: (h) => h === 'linear.app' || h.endsWith('.linear.app'),
    icon: 'https://linear.app/favicon.ico'
  },
  {
    match: (h) => h === 'figma.com' || h.endsWith('.figma.com'),
    icon: 'https://static.figma.com/app/icon/1/favicon.svg'
  },
  {
    match: (h) => h.includes('stackoverflow.com'),
    icon: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico'
  },
  {
    match: (h) => h.includes('google.com') || h === 'docs.google.com',
    icon: 'https://www.google.com/favicon.ico'
  }
]

/**
 * Best-effort icon URL for a page: real favicon when provided, else known app art, else Google's favicon proxy.
 */
export function resolvePageIconUrl(domain: string, url: string, faviconUrl: string | null | undefined): string {
  if (faviconUrl && faviconUrl.startsWith('data:')) return faviconUrl
  if (faviconUrl && (faviconUrl.startsWith('http://') || faviconUrl.startsWith('https://'))) {
    return faviconUrl
  }
  const h = normalizeCoarseDomain(domain)
  for (const row of KNOWN_ICON_HOSTS) {
    if (row.match(h)) return row.icon
  }
  try {
    const origin = new URL(url).origin
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(origin)}&sz=64`
  } catch {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(h)}&sz=64`
  }
}
