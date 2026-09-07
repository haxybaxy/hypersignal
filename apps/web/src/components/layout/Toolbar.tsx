import { useQueryClient } from '@tanstack/react-query'
import { RefreshCwIcon, Settings2Icon } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { ViewToggle } from '@/features/feeds/ViewToggle'
import { FEED_QUERY_KEY_ROOT } from '@/features/feeds/queries'
import type { ViewMode } from '@/features/sources/viewMode'

interface ToolbarProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  enabledCount: number
  itemCount: number
  isFetching: boolean
  onOpenSources: () => void
}

export function Toolbar({
  viewMode,
  onViewModeChange,
  enabledCount,
  itemCount,
  isFetching,
  onOpenSources,
}: ToolbarProps) {
  const queryClient = useQueryClient()

  function refreshAll() {
    void queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY_ROOT] })
  }

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b bg-background px-4 py-2">
      <div className="flex items-baseline gap-2">
        <h1 className="text-base font-semibold tracking-tight">Hypersignal</h1>
        <span className="text-xs text-muted-foreground">
          {enabledCount} source{enabledCount === 1 ? '' : 's'} · {itemCount} item
          {itemCount === 1 ? '' : 's'}
        </span>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <ViewToggle value={viewMode} onChange={onViewModeChange} />
        <Button
          variant="outline"
          size="sm"
          onClick={refreshAll}
          disabled={isFetching || enabledCount === 0}
        >
          <RefreshCwIcon data-icon="inline-start" className={cn(isFetching && 'animate-spin')} />
          Refresh
        </Button>
        <Button size="sm" onClick={onOpenSources}>
          <Settings2Icon data-icon="inline-start" />
          Sources
        </Button>
      </div>
    </header>
  )
}
