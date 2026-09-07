import { useQueryClient } from '@tanstack/react-query'
import { RefreshCwIcon } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { KindBadge } from '@/features/sources/KindBadge'
import { FeedItemCard } from './FeedItemCard'
import { FeedStatus } from './FeedStatus'
import type { SourceFeedState } from './merge'
import { feedQueryKey } from './queries'

interface SourcePanelProps {
  state: SourceFeedState
}

export function SourcePanel({ state }: SourcePanelProps) {
  const queryClient = useQueryClient()
  const { source, status, isFetching, error, items } = state

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: feedQueryKey(source.feedUrl) })
  }

  return (
    <section
      aria-label={source.name}
      className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card"
    >
      <header className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
        <KindBadge kind={source.kind} />
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold" title={source.feedUrl}>
          {source.name}
        </h2>
        {status === 'success' && (
          <span className="text-xs text-muted-foreground">{items.length}</span>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={refresh}
          disabled={isFetching}
          aria-label={`Refresh ${source.name}`}
        >
          <RefreshCwIcon className={cn(isFetching && 'animate-spin')} />
        </Button>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        {status === 'pending' && <FeedStatus status="pending" />}
        {status === 'error' && <FeedStatus status="error" message={error} />}
        {status === 'success' && items.length === 0 && <FeedStatus status="empty" />}
        {items.length > 0 && (
          <div className="divide-y">
            {items.map((item) => (
              <FeedItemCard key={item.id} item={item} source={source} />
            ))}
          </div>
        )}
      </ScrollArea>
    </section>
  )
}
