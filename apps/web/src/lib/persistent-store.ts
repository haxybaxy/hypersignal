/**
 * A tiny external store backed by localStorage, designed for React's
 * `useSyncExternalStore`. The parsed value is cached so `getSnapshot` returns a
 * stable reference between writes (re-parsing on every call would make React loop).
 */

export interface PersistentStore<T> {
  getSnapshot: () => T
  subscribe: (listener: () => void) => () => void
  set: (next: T) => void
  /** Re-read from storage (used after cross-tab changes and in tests). */
  reload: () => void
}

interface PersistentStoreOptions<T> {
  key: string
  /** Validate a JSON-parsed value; return null to fall back. */
  parse: (raw: unknown) => T | null
  fallback: () => T
  /** Shape written to storage; defaults to the value itself. */
  serialize?: (value: T) => unknown
}

function storageOrNull(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function createPersistentStore<T>(options: PersistentStoreOptions<T>): PersistentStore<T> {
  const { key, parse, fallback, serialize = (value: T) => value } = options
  const listeners = new Set<() => void>()
  let snapshot: T | undefined
  let loaded = false

  function read(): T {
    const storage = storageOrNull()
    if (!storage) return fallback()
    const raw = storage.getItem(key)
    if (raw === null) return fallback()
    try {
      const value = parse(JSON.parse(raw))
      if (value !== null) return value
    } catch {
      // fall through to the warning below
    }
    console.warn(`Ignoring unreadable value stored under localStorage["${key}"]`)
    return fallback()
  }

  function emit() {
    for (const listener of listeners) listener()
  }

  const store: PersistentStore<T> = {
    getSnapshot() {
      if (!loaded) {
        snapshot = read()
        loaded = true
      }
      return snapshot as T
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    set(next) {
      snapshot = next
      loaded = true
      try {
        storageOrNull()?.setItem(key, JSON.stringify(serialize(next)))
      } catch (error) {
        console.warn(`Could not persist localStorage["${key}"]`, error)
      }
      emit()
    },
    reload() {
      snapshot = read()
      loaded = true
      emit()
    },
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === key || event.key === null) store.reload()
    })
  }

  return store
}
