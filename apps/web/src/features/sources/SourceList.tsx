import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { KindBadge } from './KindBadge'
import type { Source } from './schema'
import { sourcesStore } from './store'

interface SourceListProps {
  sources: readonly Source[]
}

export function SourceList({ sources }: SourceListProps) {
  if (sources.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        No sources yet. Add one above or import a sources file.
      </p>
    )
  }
  return (
    <ul className="max-h-72 divide-y overflow-y-auto rounded-lg border">
      {sources.map((source) => (
        <li key={source.id} className="flex items-center gap-3 px-3 py-2">
          <Switch
            size="sm"
            checked={source.enabled}
            onCheckedChange={(checked) => sourcesStore.setEnabled(source.id, checked)}
            aria-label={`${source.enabled ? 'Disable' : 'Enable'} ${source.name}`}
          />
          <KindBadge kind={source.kind} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{source.name}</p>
            <p className="truncate text-xs text-muted-foreground" title={source.feedUrl}>
              {source.feedUrl}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${source.name}`}
            onClick={() => sourcesStore.remove(source.id)}
          >
            <Trash2Icon />
          </Button>
        </li>
      ))}
    </ul>
  )
}
