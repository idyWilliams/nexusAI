/**
 * Local-first context recovery models — Observer → Vault → Thread/Recall → UI.
 * Full page body is intentionally out of scope for default indexing.
 */

export interface PageHistory {
  id: string
  url: string
  title: string
  domain: string
  faviconUrl: string | null
  startedAt: number
  /** Set when focus leaves the URL/tab segment */
  endedAt: number | null
  lastSeenAt: number
  /** Cumulative time this URL was the active tab (foreground) */
  activeMs: number
  metaDescription?: string
  headings?: string[]
}

export interface Thread {
  id: string
  startedAt: number
  endedAt: number
  pageIds: string[]
  /** AI or heuristic — null until generated */
  label: string | null
}

export type SearchResultKind = 'page' | 'thread'

export interface PageSearchResult {
  kind: 'page'
  page: PageHistory
  score: number
  matchedField?: string
}

export interface ThreadSearchResult {
  kind: 'thread'
  thread: Thread
  pages: PageHistory[]
  score: number
}

export type SearchResult = PageSearchResult | ThreadSearchResult

/** Serializable hit for UI / hydrate */
export interface MemoryRecallHitUi {
  kind: SearchResultKind
  score: number
  title: string
  url?: string
  domain: string
  iconUrl: string
  snippet: string | null
  threadId?: string
  pageId?: string
  whenLabel: string
}

export interface ContextThreadPreview {
  id: string
  label: string
  pageCount: number
  /** Rough minutes from summed activeMs in thread */
  activeMinutesEstimate: number
  lastActivityAt: number
  pages: Array<{ url: string; title: string; domain: string; iconUrl: string }>
}

export interface ContextRecoverySnapshot {
  enabled: boolean
  topThread: ContextThreadPreview | null
  recentPageCount: number
  /** Last MEMORY_RECALL query results (bounded); empty when not a recall response */
  recallHits: MemoryRecallHitUi[]
}

export const DEFAULT_CONTEXT_RECOVERY: ContextRecoverySnapshot = {
  enabled: false,
  topThread: null,
  recentPageCount: 0,
  recallHits: []
}
