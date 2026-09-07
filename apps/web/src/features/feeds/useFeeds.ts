import { useCallback } from 'react'
import { useQueries, type UseQueryResult } from '@tanstack/react-query'
import type { Source } from '@/features/sources/schema'
import { mergeFeeds, type MergedFeeds } from './merge'
import { feedQueryOptions } from './queries'
import type { FeedResponse } from './types'

/**
 * One query per enabled source, merged into panel state and a combined list.
 * `combine` closes over `sources`, so it is memoized on that array; TanStack only
 * re-runs it when the function reference or a query result changes.
 */
export function useFeeds(sources: readonly Source[]): MergedFeeds {
  const combine = useCallback(
    (results: UseQueryResult<FeedResponse, Error>[]) => mergeFeeds(results, sources),
    [sources],
  )
  return useQueries({
    queries: sources.map((source) => feedQueryOptions(source.feedUrl)),
    combine,
  })
}
