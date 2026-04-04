/**
 * v2: configurable allowlist of hostnames that look like “work context” for Continue.
 * Match is suffix-based (e.g. github.com matches api.github.com).
 * Constitution: coarse, non-creepy — no page content, just hostname hints.
 */
export const LIKELY_WORK_DOMAIN_SUFFIXES: readonly string[] = [
  'github.com',
  'gitlab.com',
  'bitbucket.org',
  'notion.so',
  'atlassian.net',
  'atlassian.com',
  'jira.com',
  'linear.app',
  'asana.com',
  'monday.com',
  'clickup.com',
  'figma.com',
  'slack.com',
  'docs.google.com',
  'drive.google.com',
  'mail.google.com',
  'calendar.google.com',
  'office.com',
  'sharepoint.com',
  'outlook.office.com',
  'teams.microsoft.com',
  'notion.site',
  'miro.com',
  'loom.com',
  'zoom.us',
  'dropbox.com',
  'box.com',
  'vercel.com',
  'netlify.app',
  'supabase.co',
  'console.cloud.google.com'
]

export function normalizeCoarseDomain(hostname: string): string {
  return hostname.replace(/^www\./i, '').toLowerCase()
}

export function isLikelyWorkDomain(hostname: string): boolean {
  const h = normalizeCoarseDomain(hostname)
  return LIKELY_WORK_DOMAIN_SUFFIXES.some((suffix) => h === suffix || h.endsWith(`.${suffix}`))
}
