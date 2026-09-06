import type { Source } from '@/features/sources/schema'
import { mergeFeeds, type FeedQueryResult } from './merge'
import type { FeedItem } from './types'

const hn: Source = {
  id: 'hn',
  name: 'HN',
  kind: 'hackernews',
  feedUrl: 'https://hnrss.org/frontpage',
  enabled: true,
}
const x: Source = {
  id: 'x',
  name: 'X',
  kind: 'twitter',
  feedUrl: 'https://rss.app/feeds/x.xml',
  enabled: true,
}

function item(id: string, published: string | null): FeedItem {
  return { id, title: id, link: null, summary: '', published, author: null, imageUrl: null }
}

function success(items: FeedItem[], title = 'feed'): FeedQueryResult {
  return {
    status: 'success',
    data: { title, link: null, fetchedAt: '2026-09-07T00:00:00Z', items },
    error: null,
    isFetching: false,
  }
}

describe('mergeFeeds', () => {
  it('sorts newest first and puts undated items last, keeping their order', () => {
    const results = [
      success([item('a', '2026-09-01T00:00:00Z'), item('undated-1', null)]),
      success([
        item('b', '2026-09-03T00:00:00Z'),
        item('undated-2', null),
        item('c', '2026-09-02T00:00:00Z'),
      ]),
    ]
    const { merged } = mergeFeeds(results, [hn, x])
    expect(merged.map((m) => m.key)).toEqual(['x:b', 'x:c', 'hn:a', 'hn:undated-1', 'x:undated-2'])
    expect(merged[0]?.source).toBe(x)
  })

  it('keeps successful sources when another one errors', () => {
    const results: FeedQueryResult[] = [
      { status: 'error', data: undefined, error: new Error('boom'), isFetching: false },
      success([item('b', '2026-09-03T00:00:00Z')], 'X posts'),
    ]
    const merged = mergeFeeds(results, [hn, x])
    expect(merged.errorCount).toBe(1)
    expect(merged.perSource[0]).toMatchObject({
      source: hn,
      status: 'error',
      error: 'boom',
      items: [],
    })
    expect(merged.perSource[1]).toMatchObject({
      source: x,
      status: 'success',
      feedTitle: 'X posts',
    })
    expect(merged.merged).toHaveLength(1)
  })

  it('reports pending and fetching flags', () => {
    const results: FeedQueryResult[] = [
      { status: 'pending', data: undefined, error: null, isFetching: true },
      success([]),
    ]
    const merged = mergeFeeds(results, [hn, x])
    expect(merged.isAnyPending).toBe(true)
    expect(merged.isAnyFetching).toBe(true)
    expect(merged.merged).toEqual([])
  })

  it('ignores results without a matching source', () => {
    expect(mergeFeeds([success([item('a', null)])], []).merged).toEqual([])
  })
})
