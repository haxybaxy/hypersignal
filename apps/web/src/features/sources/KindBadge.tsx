import { cn } from 'cn'
import { SOURCE_KIND_LABELS, type SourceKind } from './schema'

const KIND_CLASSES: Record<SourceKind, string> = {
  hackernews: 'bg-orange-500/15 text-orange-800 dark:text-orange-300',
  reddit: 'bg-red-500/15 text-red-800 dark:text-red-300',
  twitter: 'bg-sky-500/15 text-sky-800 dark:text-sky-300',
  linkedin: 'bg-blue-600/15 text-blue-800 dark:text-blue-300',
  rss: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
}

interface KindBadgeProps {
  kind: SourceKind
  /** Text to show; defaults to the kind's label. */
  label?: string
  className?: string
}

export function KindBadge({ kind, label, className }: KindBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-5 max-w-40 shrink-0 items-center truncate rounded-full px-2 text-[11px] font-medium',
        KIND_CLASSES[kind],
        className,
      )}
      title={SOURCE_KIND_LABELS[kind]}
    >
      {label ?? SOURCE_KIND_LABELS[kind]}
    </span>
  )
}
