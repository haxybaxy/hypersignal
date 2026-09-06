import { parseSourcesFile } from './parseSourcesFile'

describe('parseSourcesFile', () => {
  it('returns a validated file', () => {
    const result = parseSourcesFile(
      JSON.stringify({
        version: 1,
        sources: [{ id: 'x', name: 'X', kind: 'twitter', feedUrl: 'https://rss.app/feeds/x.xml' }],
      }),
    )
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.file.sources[0]?.enabled).toBe(true)
  })

  it('reports invalid JSON', () => {
    expect(parseSourcesFile('{not json')).toEqual({
      ok: false,
      error: 'The file is not valid JSON',
    })
  })

  it('reports schema violations', () => {
    const result = parseSourcesFile(JSON.stringify({ version: 1, sources: [{ id: 'x' }] }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/Not a Hypersignal sources file/)
  })
})
