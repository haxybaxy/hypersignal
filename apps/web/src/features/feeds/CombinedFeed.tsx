import { ScrollArea } from '@/components/ui/scroll-area'
import { FeedItemCard } from './FeedItemCard'
import { FeedStatus } from './FeedStatus'
import type { MergedFeeds } from './merge'

/** Rendering cap; the list is not virtualized. */
export const COMBINED_FEED_LIMIT = 500

interface CombinedFeedProps {
  feeds: MergedFeeds
}

export function CombinedFeed({ feeds }: CombinedFeedProps) {
  const { merged, perSource, isAnyPending, errorCount } = feeds
  const failed = perSource.filter((state) => state.status === 'error')
  const visible = merged.slice(0, COMBINED_FEED_LIMIT)

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-3xl">
        {failed.length > 0 && (
          <div className="m-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {errorCount} source{errorCount === 1 ? '' : 's'} failed:{' '}
            {failed.map((state) => `${state.source.name} (${state.error})`).join('; ')}
          </div>
        )}
        {merged.length === 0 ? (
          isAnyPending ? (
            <FeedStatus status="pending" />
          ) : (
            <FeedStatus status="empty" message="No items yet. Try refreshing or adding sources." />
          )
        ) : (
          <div className="divide-y">
            {visible.map((item) => (
              <FeedItemCard key={item.key} item={item} source={item.source} showSource />
            ))}
          </div>
        )}
        {merged.length > visible.length && (
          <p className="p-3 text-center text-xs text-muted-foreground">
            Showing the newest {visible.length} of {merged.length} items.
          </p>
        )}
      </div>
    </ScrollArea>
  )
}
