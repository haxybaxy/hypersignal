import { createPersistentStore } from '@/lib/persistent-store'
import { DEFAULT_SOURCES } from './defaults'
import { newId } from './ids'
import {
  SOURCES_FILE_VERSION,
  sourcesFileSchema,
  type NewSource,
  type Source,
  type SourcesFile,
} from './schema'

export const SOURCES_STORAGE_KEY = 'hypersignal.sources.v1'

export type ImportMode = 'merge' | 'replace'

export interface ImportSummary {
  added: number
  skipped: number
  total: number
}

export type AddSourceResult = { ok: true; source: Source } | { ok: false; error: string }

const store = createPersistentStore<readonly Source[]>({
  key: SOURCES_STORAGE_KEY,
  parse: (raw) => {
    const result = sourcesFileSchema.safeParse(raw)
    return result.success ? result.data.sources : null
  },
  fallback: () => DEFAULT_SOURCES,
  serialize: toSourcesFile,
})

export function toSourcesFile(sources: readonly Source[]): SourcesFile {
  return { version: SOURCES_FILE_VERSION, sources: [...sources] }
}

function normalizeUrl(url: string): string {
  return url.trim()
}

function hasFeedUrl(sources: readonly Source[], feedUrl: string): boolean {
  const wanted = normalizeUrl(feedUrl)
  return sources.some((source) => normalizeUrl(source.feedUrl) === wanted)
}

function addSource(input: NewSource): AddSourceResult {
  const current = store.getSnapshot()
  if (hasFeedUrl(current, input.feedUrl)) {
    return { ok: false, error: 'That feed URL is already in your sources' }
  }
  const source: Source = { id: newId(), enabled: true, ...input }
  store.set([...current, source])
  return { ok: true, source }
}

function removeSource(id: string): void {
  store.set(store.getSnapshot().filter((source) => source.id !== id))
}

function setEnabled(id: string, enabled: boolean): void {
  store.set(
    store.getSnapshot().map((source) => (source.id === id ? { ...source, enabled } : source)),
  )
}

function importSources(file: SourcesFile, mode: ImportMode): ImportSummary {
  if (mode === 'replace') {
    store.set(file.sources)
    return { added: file.sources.length, skipped: 0, total: file.sources.length }
  }
  const merged = [...store.getSnapshot()]
  const usedIds = new Set(merged.map((source) => source.id))
  let added = 0
  for (const incoming of file.sources) {
    if (hasFeedUrl(merged, incoming.feedUrl)) continue
    const id = usedIds.has(incoming.id) ? newId() : incoming.id
    usedIds.add(id)
    merged.push({ ...incoming, id })
    added += 1
  }
  store.set(merged)
  return { added, skipped: file.sources.length - added, total: file.sources.length }
}

function clearAll(): void {
  store.set([])
}

function exportFile(): SourcesFile {
  return toSourcesFile(store.getSnapshot())
}

export const sourcesStore = {
  subscribe: store.subscribe,
  getSnapshot: store.getSnapshot,
  reload: store.reload,
  add: addSource,
  remove: removeSource,
  setEnabled,
  importSources,
  clearAll,
  exportFile,
}
