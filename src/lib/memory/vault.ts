import type { PageHistory } from './types'

const DB_NAME = 'nexus_memory_v1'
const DB_VERSION = 1
const STORE = 'pageHistory'

/** Cap stored segments to keep IDB small for a solo MVP */
const DEFAULT_MAX_RECORDS = 800

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'))
  })
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'))
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
  })
}

export class MemoryVault {
  private db: IDBDatabase | null = null
  private readonly maxRecords: number

  constructor(maxRecords: number = DEFAULT_MAX_RECORDS) {
    this.maxRecords = maxRecords
  }

  async open(): Promise<void> {
    if (this.db) return
    this.db = await new Promise((resolve, reject) => {
      const open = indexedDB.open(DB_NAME, DB_VERSION)
      open.onerror = () => reject(open.error ?? new Error('open failed'))
      open.onsuccess = () => resolve(open.result)
      open.onupgradeneeded = () => {
        const db = open.result
        if (!db.objectStoreNames.contains(STORE)) {
          const os = db.createObjectStore(STORE, { keyPath: 'id' })
          os.createIndex('startedAt', 'startedAt', { unique: false })
          os.createIndex('domain', 'domain', { unique: false })
        }
      }
    })
  }

  private requireDb(): IDBDatabase {
    if (!this.db) throw new Error('MemoryVault not open')
    return this.db
  }

  async putPage(page: PageHistory): Promise<void> {
    const db = this.requireDb()
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(page)
    await txDone(tx)
    await this.trimOld()
  }

  async updatePage(id: string, mutator: (prev: PageHistory) => PageHistory): Promise<void> {
    const db = this.requireDb()
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const prev = await reqToPromise(store.get(id))
    if (!prev) {
      await txDone(tx)
      return
    }
    store.put(mutator(prev as PageHistory))
    await txDone(tx)
  }

  async getPage(id: string): Promise<PageHistory | null> {
    const db = this.requireDb()
    const tx = db.transaction(STORE, 'readonly')
    const r = await reqToPromise(tx.objectStore(STORE).get(id))
    await txDone(tx)
    return (r as PageHistory) ?? null
  }

  async getRecentPages(limit: number): Promise<PageHistory[]> {
    const db = this.requireDb()
    const tx = db.transaction(STORE, 'readonly')
    const idx = tx.objectStore(STORE).index('startedAt')
    const req = idx.openCursor(null, 'prev')
    const out: PageHistory[] = []
    await new Promise<void>((resolve, reject) => {
      req.onerror = () => reject(req.error)
      req.onsuccess = () => {
        const cur = req.result
        if (!cur || out.length >= limit) {
          resolve()
          return
        }
        out.push(cur.value as PageHistory)
        cur.continue()
      }
    })
    await txDone(tx)
    return out
  }

  async clearAll(): Promise<void> {
    await this.open()
    const db = this.requireDb()
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).clear()
    await txDone(tx)
  }

  private async trimOld(): Promise<void> {
    const db = this.requireDb()
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const countReq = store.count()
    const count = await reqToPromise(countReq)
    if (count <= this.maxRecords) {
      await txDone(tx)
      return
    }
    const toRemove = count - this.maxRecords
    const idx = store.index('startedAt')
    const curReq = idx.openCursor()
    let removed = 0
    await new Promise<void>((resolve, reject) => {
      curReq.onerror = () => reject(curReq.error)
      curReq.onsuccess = () => {
        const cur = curReq.result
        if (!cur || removed >= toRemove) {
          resolve()
          return
        }
        cur.delete()
        removed++
        cur.continue()
      }
    })
    await txDone(tx)
  }
}

let singleton: MemoryVault | null = null

export function getMemoryVault(): MemoryVault {
  if (!singleton) singleton = new MemoryVault()
  return singleton
}
