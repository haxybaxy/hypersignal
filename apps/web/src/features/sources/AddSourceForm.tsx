import { useId, useState, type FormEvent } from 'react'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SOURCE_KINDS, SOURCE_KIND_LABELS, newSourceSchema, type SourceKind } from './schema'
import { sourcesStore } from './store'

type FieldErrors = Partial<Record<'name' | 'kind' | 'feedUrl', string>>

const SELECT_CLASSES =
  'h-8 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function AddSourceForm() {
  const idPrefix = useId()
  const [name, setName] = useState('')
  const [kind, setKind] = useState<SourceKind>('rss')
  const [feedUrl, setFeedUrl] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = newSourceSchema.safeParse({ name, kind, feedUrl })
    if (!parsed.success) {
      const next: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (field === 'name' || field === 'kind' || field === 'feedUrl')
          next[field] ??= issue.message
      }
      setErrors(next)
      return
    }
    const result = sourcesStore.add(parsed.data)
    if (!result.ok) {
      setErrors({ feedUrl: result.error })
      return
    }
    setErrors({})
    setName('')
    setFeedUrl('')
    toast.success(`Added ${result.source.name}`)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-name`}>Name</Label>
          <Input
            id={`${idPrefix}-name`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. @paulg on X"
            aria-invalid={errors.name ? true : undefined}
            autoComplete="off"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-kind`}>Kind</Label>
          <select
            id={`${idPrefix}-kind`}
            value={kind}
            onChange={(event) => setKind(event.target.value as SourceKind)}
            className={SELECT_CLASSES}
          >
            {SOURCE_KINDS.map((option) => (
              <option key={option} value={option}>
                {SOURCE_KIND_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${idPrefix}-url`}>Feed URL</Label>
        <div className="flex gap-2">
          <Input
            id={`${idPrefix}-url`}
            value={feedUrl}
            onChange={(event) => setFeedUrl(event.target.value)}
            placeholder="https://rss.app/feeds/….xml"
            aria-invalid={errors.feedUrl ? true : undefined}
            autoComplete="off"
            inputMode="url"
          />
          <Button type="submit" className="shrink-0">
            <PlusIcon data-icon="inline-start" />
            Add
          </Button>
        </div>
        {errors.feedUrl ? (
          <p className="text-xs text-destructive">{errors.feedUrl}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            For X, LinkedIn or Reddit, create the feed at{' '}
            <a
              href="https://rss.app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              rss.app
            </a>{' '}
            and paste its feed URL. Any public RSS or Atom URL works too.
          </p>
        )}
      </div>
    </form>
  )
}
