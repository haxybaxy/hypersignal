import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AddSourceForm } from './AddSourceForm'
import { ImportExportControls } from './ImportExportControls'
import { SourceList } from './SourceList'
import { sourcesStore } from './store'
import { useSources } from './useSources'

interface SourcesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SourcesDialog({ open, onOpenChange }: SourcesDialogProps) {
  const { sources } = useSources()

  function handleClearAll() {
    if (sources.length === 0) return
    if (!window.confirm(`Remove all ${sources.length} sources? Export first if you want a backup.`))
      return
    sourcesStore.clearAll()
    toast.success('Removed all sources')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sources</DialogTitle>
          <DialogDescription>
            Sources live in this browser. Export them as JSON to back up or share a panel.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <AddSourceForm />
          <SourceList sources={sources} />
        </div>
        <DialogFooter className="sm:justify-between">
          <ImportExportControls />
          <Button
            size="sm"
            variant="destructive"
            onClick={handleClearAll}
            disabled={sources.length === 0}
          >
            Clear all
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
