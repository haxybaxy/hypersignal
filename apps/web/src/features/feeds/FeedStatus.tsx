import { Loader2Icon, TriangleAlertIcon } from 'lucide-react'
import { cn } from 'cn'

interface FeedStatusProps {
  status: 'pending' | 'error' | 'empty'
  message?: string | null
  className?: string
}

/** Loading, error and empty placeholders used by both layouts. */
export function FeedStatus({ status, message, className }: FeedStatusProps) {
  return (
    <div
      role={status === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground',
        className,
      )}
    >
      {status === 'pending' && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
      {status === 'error' && <TriangleAlertIcon className="size-4 text-destructive" aria-hidden />}
      <span>
        {status === 'pending' && 'Loading feed…'}
        {status === 'error' && (message ?? 'Could not load this feed')}
        {status === 'empty' && (message ?? 'No items in this feed')}
      </span>
    </div>
  )
}
