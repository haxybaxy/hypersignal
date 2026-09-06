import { useSyncExternalStore } from 'react'
import { createPersistentStore } from '@/lib/persistent-store'

export const VIEW_MODES = ['combined', 'split'] as const
export type ViewMode = (typeof VIEW_MODES)[number]

export function isViewMode(value: unknown): value is ViewMode {
  return typeof value === 'string' && (VIEW_MODES as readonly string[]).includes(value)
}

export const viewModeStore = createPersistentStore<ViewMode>({
  key: 'hypersignal.viewMode',
  parse: (raw) => (isViewMode(raw) ? raw : null),
  fallback: () => 'combined',
})

export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const mode = useSyncExternalStore(viewModeStore.subscribe, viewModeStore.getSnapshot)
  return [mode, viewModeStore.set]
}
