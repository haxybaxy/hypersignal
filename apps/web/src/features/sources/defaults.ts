import type { Source } from './schema'

/** Seeded on first run. rss.app feed URLs are per-account, so only public feeds can ship here. */
export const DEFAULT_SOURCES: readonly Source[] = [
  {
    id: 'hn-frontpage',
    name: 'Hacker News front page',
    kind: 'hackernews',
    feedUrl: 'https://hnrss.org/frontpage',
    enabled: true,
  },
]
