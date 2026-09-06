import { describeApiError } from '@/lib/api-client'
import type { Source } from '@/features/sources/schema'
import type { FeedItem, FeedResponse } from './types'

/** The subset of a TanStack `UseQueryResult` the merge needs; kept small for tests. */
export interface FeedQueryResult {
  status: 'pending' | 'error' | 'success'
  data: FeedResponse | undefined
  error: unknown
  isFetching: boolean
}

export interface SourceFeedState {
  source: Source
  status: FeedQueryResult['status']
  isFetching: boolean
  error: string | null
  feedTitle: string | null
  items: FeedItem[]
}

export interface MergedFeedItem extends FeedItem {
  /** Unique across sources; item ids are only unique within a feed. */
  key: string
  source: Source
}

export interface MergedFeeds {
  perSource: SourceFeedState[]
  merged: MergedFeedItem[]
  isAnyPending: boolean
  isAnyFetching: boolean
  errorCount: number
}

const EMPTY_ITEMS: FeedItem[] = []

function publishedTimestamp(item: FeedItem): number {
  if (!item.published) return Number.NaN
  return Date.parse(item.published)
}

/** Newest first; items without a usable date keep their feed order at the end. */
export function compareByPublishedDesc(a: MergedFeedItem, b: MergedFeedItem): number {
  const ta = publishedTimestamp(a)
  const tb = publishedTimestamp(b)
  const aMissing = Number.isNaN(ta)
  const bMissing = Number.isNaN(tb)
  if (aMissing && bMissing) return 0
  if (aMissing) return 1
  if (bMissing) return -1
  return tb - ta
}

/** Combine per-source query results into per-panel state plus one date-sorted list. */
export function mergeFeeds(
  results: readonly FeedQueryResult[],
  sources: readonly Source[],
): MergedFeeds {
  const perSource: SourceFeedState[] = []
  const merged: MergedFeedItem[] = []
  let isAnyPending = false
  let isAnyFetching = false
  let errorCount = 0

  sources.forEach((source, index) => {
    const result = results[index]
    if (!result) return
    const items = result.data?.items ?? EMPTY_ITEMS
    if (result.status === 'pending') isAnyPending = true
    if (result.status === 'error') errorCount += 1
    if (result.isFetching) isAnyFetching = true
    perSource.push({
      source,
      status: result.status,
      isFetching: result.isFetching,
      error: result.status === 'error' ? describeApiError(result.error) : null,
      feedTitle: result.data?.title ?? null,
      items,
    })
    for (const item of items) {
      merged.push({ ...item, key: `${source.id}:${item.id}`, source })
    }
  })

  merged.sort(compareByPublishedDesc)
  return { perSource, merged, isAnyPending, isAnyFetching, errorCount }
}
