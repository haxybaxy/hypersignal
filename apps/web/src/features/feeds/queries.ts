import { queryOptions } from '@tanstack/react-query'
import { fetchFeed } from './api'

/** Slightly above the API's cache TTL (240 s) so a refetch actually gets fresh data. */
export const FEED_REFRESH_MS = 5 * 60_000

export const FEED_QUERY_KEY_ROOT = 'feed' as const

export function feedQueryKey(feedUrl: string) {
  return [FEED_QUERY_KEY_ROOT, feedUrl] as const
}

export function feedQueryOptions(feedUrl: string) {
  return queryOptions({
    queryKey: feedQueryKey(feedUrl),
    queryFn: ({ signal }) => fetchFeed(feedUrl, signal),
    staleTime: FEED_REFRESH_MS,
    refetchInterval: FEED_REFRESH_MS,
    retry: 1,
  })
}
