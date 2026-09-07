import { apiClient } from '@/lib/api-client'
import type { FeedResponse } from './types'

export async function fetchFeed(feedUrl: string, signal?: AbortSignal): Promise<FeedResponse> {
  const response = await apiClient.get<FeedResponse>('/feed', { params: { url: feedUrl }, signal })
  return response.data
}
