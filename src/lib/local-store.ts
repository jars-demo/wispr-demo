'use client'

import { useMemo, useSyncExternalStore } from 'react'

// A tiny reactive wrapper over one localStorage key: shared across components and tabs, and safe
// when storage is blocked (private windows), in which case values simply do not persist.

export type LocalStore<T> = {
  use(): T
  read(): T
  write(value: T | null): void
}

export function createLocalStore<T>(key: string, parse: (raw: string | null) => T): LocalStore<T> {
  const listeners = new Set<() => void>()

  const readRaw = (): string | null => {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  }

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) listener()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(listener)
      window.removeEventListener('storage', onStorage)
    }
  }

  return {
    use() {
      const raw = useSyncExternalStore(subscribe, readRaw, () => null)
      return useMemo(() => parse(raw), [raw])
    },
    read: () => parse(readRaw()),
    write(value) {
      try {
        if (value === null) window.localStorage.removeItem(key)
        else window.localStorage.setItem(key, JSON.stringify(value))
      } catch {
        // Storage full or blocked: keep working for this page view.
      }
      for (const listener of listeners) listener()
    },
  }
}

/** True after hydration, so client-only values never cause a server/client mismatch. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}
