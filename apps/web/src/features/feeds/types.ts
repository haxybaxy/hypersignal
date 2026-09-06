/** Mirrors `FeedItem` / `FeedResponse` in apps/api/src/hypersignal_api/schemas.py. */
export interface FeedItem {
  id: string
  title: string
  link: string | null
  summary: string
  /** ISO-8601 timestamp or null when the feed did not provide one. */
  published: string | null
  author: string | null
  imageUrl: string | null
}

export interface FeedResponse {
  title: string
  link: string | null
  fetchedAt: string
  items: FeedItem[]
}
