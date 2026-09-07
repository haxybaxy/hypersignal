import type { MergedFeeds } from './merge'
import { SourcePanel } from './SourcePanel'

interface SplitFeedProps {
  feeds: MergedFeeds
}

/** One independently scrolling panel per source; the grid itself scrolls when panels wrap. */
export function SplitFeed({ feeds }: SplitFeedProps) {
  return (
    <div className="grid h-full auto-rows-[minmax(22rem,1fr)] grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-3 overflow-y-auto p-3">
      {feeds.perSource.map((state) => (
        <SourcePanel key={state.source.id} state={state} />
      ))}
    </div>
  )
}
