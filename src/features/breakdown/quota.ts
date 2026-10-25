'use client'

import { useEffect, useSyncExternalStore } from 'react'

import { visitorHeaders } from './visitor'

// How many free AI breakdowns this visitor has left this hour, from GET /api/breakdown. Fetched
// when something shows it, and again after each fresh breakdown. Samples, cached public links
// and the player's own key never use one.

export type Quota = { limit: number; left: number; resetsInSeconds: number; live: boolean }

let quota: Quota | null = null
let loading = false
const listeners = new Set<() => void>()

export async function refreshQuota(): Promise<void> {
  if (loading) return
  loading = true
  try {
    const response = await fetch('/api/breakdown', { cache: 'no-store', headers: visitorHeaders() })
    if (response.ok) {
      quota = (await response.json()) as Quota
      for (const listener of listeners) listener()
    }
  } catch {
    // Offline: keep the last known number; the server enforces the limit anyway.
  } finally {
    loading = false
  }
}

export function useQuota(): Quota | null {
  useEffect(() => {
    if (!quota) void refreshQuota()
  }, [])
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => quota,
    () => null,
  )
}

export function minutesUntil(seconds: number): string {
  const minutes = Math.max(1, Math.ceil(seconds / 60))
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
}
