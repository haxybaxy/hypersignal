import { useMemo, useSyncExternalStore } from 'react'
import { sourcesStore } from './store'

export function useSources() {
  const sources = useSyncExternalStore(sourcesStore.subscribe, sourcesStore.getSnapshot)
  const enabledSources = useMemo(() => sources.filter((source) => source.enabled), [sources])
  return { sources, enabledSources }
}
