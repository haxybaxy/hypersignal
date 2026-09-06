import { useRef, useState, type ChangeEvent } from 'react'
import { DownloadIcon, UploadIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { parseSourcesFile } from './parseSourcesFile'
import type { SourcesFile } from './schema'
import { sourcesStore, type ImportMode } from './store'

export const EXPORT_FILENAME = 'hypersignal-sources.json'

function downloadJson(file: SourcesFile) {
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = EXPORT_FILENAME
  anchor.click()
  URL.revokeObjectURL(url)
}

export function ImportExportControls() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<SourcesFile | null>(null)

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const result = parseSourcesFile(await file.text())
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setPending(result.file)
  }

  function applyImport(mode: ImportMode) {
    if (!pending) return
    const summary = sourcesStore.importSources(pending, mode)
    setPending(null)
    toast.success(
      mode === 'replace'
        ? `Replaced sources with ${summary.total} from the file`
        : `Imported ${summary.added} new source${summary.added === 1 ? '' : 's'}` +
            (summary.skipped ? ` (${summary.skipped} already present)` : ''),
    )
  }

  function handleExport() {
    const file = sourcesStore.exportFile()
    if (file.sources.length === 0) {
      toast.error('Nothing to export yet')
      return
    }
    downloadJson(file)
  }

  if (pending) {
    const count = pending.sources.length
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>
          {count} source{count === 1 ? '' : 's'} in file.
        </span>
        <Button size="sm" onClick={() => applyImport('merge')}>
          Merge
        </Button>
        <Button size="sm" variant="outline" onClick={() => applyImport('replace')}>
          Replace all
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
        data-testid="import-file-input"
      />
      <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
        <UploadIcon data-icon="inline-start" />
        Import JSON
      </Button>
      <Button size="sm" variant="outline" onClick={handleExport}>
        <DownloadIcon data-icon="inline-start" />
        Export JSON
      </Button>
    </div>
  )
}
