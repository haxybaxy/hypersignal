import { useState } from 'react'
import { Toolbar } from '@/components/layout/Toolbar'
import { Button } from '@/components/ui/button'
import { CombinedFeed } from '@/features/feeds/CombinedFeed'
import { SplitFeed } from '@/features/feeds/SplitFeed'
import { useFeeds } from '@/features/feeds/useFeeds'
import { SourcesDialog } from '@/features/sources/SourcesDialog'
import { useSources } from '@/features/sources/useSources'
import { useViewMode } from '@/features/sources/viewMode'

export default function App() {
  const { sources, enabledSources } = useSources()
  const [viewMode, setViewMode] = useViewMode()
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const feeds = useFeeds(enabledSources)

  return (
    <div className="flex h-dvh flex-col">
      <Toolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        enabledCount={enabledSources.length}
        itemCount={feeds.merged.length}
        isFetching={feeds.isAnyFetching}
        onOpenSources={() => setSourcesOpen(true)}
      />
      <main className="min-h-0 flex-1">
        {enabledSources.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {sources.length === 0
                ? 'No sources yet. Add feed URLs or import a sources file to get started.'
                : 'All sources are disabled. Enable one to see its feed.'}
            </p>
            <Button onClick={() => setSourcesOpen(true)}>Manage sources</Button>
          </div>
        ) : viewMode === 'combined' ? (
          <CombinedFeed feeds={feeds} />
        ) : (
          <SplitFeed feeds={feeds} />
        )}
      </main>
      <SourcesDialog open={sourcesOpen} onOpenChange={setSourcesOpen} />
    </div>
  )
}
