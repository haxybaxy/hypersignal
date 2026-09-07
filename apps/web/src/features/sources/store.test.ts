import { DEFAULT_SOURCES } from './defaults'
import { SOURCES_STORAGE_KEY, sourcesStore } from './store'
import type { Source } from './schema'

const hn: Source = {
  id: 'hn',
  name: 'HN',
  kind: 'hackernews',
  feedUrl: 'https://hnrss.org/frontpage',
  enabled: true,
}
const reddit: Source = {
  id: 'reddit',
  name: 'r/startups',
  kind: 'reddit',
  feedUrl: 'https://rss.app/feeds/reddit.xml',
  enabled: true,
}

function stored(): unknown {
  return JSON.parse(localStorage.getItem(SOURCES_STORAGE_KEY) ?? 'null')
}

beforeEach(() => {
  localStorage.clear()
  sourcesStore.reload()
})

describe('sourcesStore', () => {
  it('seeds defaults when storage is empty', () => {
    expect(sourcesStore.getSnapshot()).toEqual(DEFAULT_SOURCES)
  })

  it('returns the same snapshot reference until something changes', () => {
    expect(sourcesStore.getSnapshot()).toBe(sourcesStore.getSnapshot())
  })

  it('adds a source, persists it, and notifies subscribers', () => {
    const listener = vi.fn()
    const unsubscribe = sourcesStore.subscribe(listener)
    sourcesStore.clearAll()
    const result = sourcesStore.add({
      name: 'HN',
      kind: 'hackernews',
      feedUrl: 'https://hnrss.org/frontpage',
    })
    expect(result.ok).toBe(true)
    expect(sourcesStore.getSnapshot()).toHaveLength(1)
    expect(sourcesStore.getSnapshot()[0]).toMatchObject({ name: 'HN', enabled: true })
    expect(stored()).toMatchObject({ version: 1, sources: [{ name: 'HN' }] })
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
  })

  it('rejects duplicate feed URLs', () => {
    sourcesStore.importSources({ version: 1, sources: [hn] }, 'replace')
    const result = sourcesStore.add({
      name: 'Again',
      kind: 'rss',
      feedUrl: ' https://hnrss.org/frontpage ',
    })
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/already/) })
  })

  it('removes and toggles sources', () => {
    sourcesStore.importSources({ version: 1, sources: [hn, reddit] }, 'replace')
    sourcesStore.setEnabled('hn', false)
    expect(sourcesStore.getSnapshot().find((s) => s.id === 'hn')?.enabled).toBe(false)
    sourcesStore.remove('reddit')
    expect(sourcesStore.getSnapshot().map((s) => s.id)).toEqual(['hn'])
  })

  it('merge import skips existing feed URLs and re-keys colliding ids', () => {
    sourcesStore.importSources({ version: 1, sources: [hn] }, 'replace')
    const summary = sourcesStore.importSources(
      {
        version: 1,
        sources: [
          { ...hn, id: 'other-id' },
          { ...reddit, id: 'hn' },
        ],
      },
      'merge',
    )
    expect(summary).toEqual({ added: 1, skipped: 1, total: 2 })
    const snapshot = sourcesStore.getSnapshot()
    expect(snapshot).toHaveLength(2)
    expect(snapshot.map((s) => s.feedUrl)).toEqual([hn.feedUrl, reddit.feedUrl])
    expect(new Set(snapshot.map((s) => s.id)).size).toBe(2)
  })

  it('replace import overwrites everything', () => {
    sourcesStore.importSources({ version: 1, sources: [hn] }, 'replace')
    sourcesStore.importSources({ version: 1, sources: [reddit] }, 'replace')
    expect(sourcesStore.getSnapshot()).toEqual([reddit])
  })

  it('round-trips through export and import', () => {
    sourcesStore.importSources({ version: 1, sources: [hn, reddit] }, 'replace')
    const exported = sourcesStore.exportFile()
    sourcesStore.clearAll()
    expect(sourcesStore.getSnapshot()).toEqual([])
    sourcesStore.importSources(exported, 'merge')
    expect(sourcesStore.getSnapshot()).toEqual([hn, reddit])
  })

  it('falls back to defaults when storage is corrupt', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem(SOURCES_STORAGE_KEY, '{"version": 99}')
    sourcesStore.reload()
    expect(sourcesStore.getSnapshot()).toEqual(DEFAULT_SOURCES)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
