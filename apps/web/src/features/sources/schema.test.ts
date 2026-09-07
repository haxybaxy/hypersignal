import { newSourceSchema, sourcesFileSchema } from './schema'
// Vite's ?raw import keeps the production type-check independent of files outside src/.
import exampleRaw from '../../../../../examples/sources.example.json?raw'

const exampleFile: unknown = JSON.parse(exampleRaw)

describe('sourcesFileSchema', () => {
  it('accepts the shipped example file', () => {
    const result = sourcesFileSchema.safeParse(exampleFile)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sources.length).toBeGreaterThan(0)
      expect(result.data.sources.every((s) => s.enabled)).toBe(true)
    }
  })

  it('defaults enabled to true', () => {
    const result = sourcesFileSchema.parse({
      version: 1,
      sources: [{ id: 'a', name: 'A', kind: 'rss', feedUrl: 'https://example.test/feed' }],
    })
    expect(result.sources[0]?.enabled).toBe(true)
  })

  it('rejects an unknown version', () => {
    expect(sourcesFileSchema.safeParse({ version: 2, sources: [] }).success).toBe(false)
  })

  it('rejects unsupported kinds and non-http URLs', () => {
    const base = { id: 'a', name: 'A', kind: 'rss', feedUrl: 'https://example.test/feed' }
    expect(
      sourcesFileSchema.safeParse({ version: 1, sources: [{ ...base, kind: 'mastodon' }] }).success,
    ).toBe(false)
    expect(
      sourcesFileSchema.safeParse({ version: 1, sources: [{ ...base, feedUrl: 'ftp://x' }] })
        .success,
    ).toBe(false)
    expect(
      sourcesFileSchema.safeParse({ version: 1, sources: [{ ...base, feedUrl: 'not a url' }] })
        .success,
    ).toBe(false)
  })
})

describe('newSourceSchema', () => {
  it('trims and requires a name', () => {
    expect(
      newSourceSchema.parse({
        name: '  HN ',
        kind: 'hackernews',
        feedUrl: 'https://hnrss.org/frontpage',
      }).name,
    ).toBe('HN')
    expect(
      newSourceSchema.safeParse({
        name: '   ',
        kind: 'hackernews',
        feedUrl: 'https://hnrss.org/frontpage',
      }).success,
    ).toBe(false)
  })
})
