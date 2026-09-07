import { useState } from 'react'
import { KindBadge } from '@/features/sources/KindBadge'
import type { Source } from '@/features/sources/schema'
import { formatRelativeTime } from './relativeTime'
import type { FeedItem } from './types'

interface FeedItemCardProps {
  item: FeedItem
  source: Source
  /** Show the source name; off inside a per-source panel. */
  showSource?: boolean
}

export function FeedItemCard({ item, source, showSource = false }: FeedItemCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(item.imageUrl) && !imageFailed
  const relative = item.published ? formatRelativeTime(item.published) : null

  return (
    <article className="flex gap-3 px-3 py-2.5">
      {showImage && (
        <img
          src={item.imageUrl ?? undefined}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="size-14 shrink-0 rounded-md bg-muted object-cover"
          onError={() => setImageFailed(true)}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {showSource && <KindBadge kind={source.kind} label={source.name} />}
          {relative && (
            <time dateTime={item.published ?? undefined} title={item.published ?? undefined}>
              {relative}
            </time>
          )}
          {item.author && <span className="truncate">{item.author}</span>}
        </div>
        {item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="line-clamp-2 text-sm leading-snug font-medium hover:underline"
          >
            {item.title}
          </a>
        ) : (
          <p className="line-clamp-2 text-sm leading-snug font-medium">{item.title}</p>
        )}
        {item.summary && (
          <p className="mt-0.5 line-clamp-3 text-[13px] leading-snug text-muted-foreground">
            {item.summary}
          </p>
        )}
      </div>
    </article>
  )
}
