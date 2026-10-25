'use client'

import { useEffect, useState } from 'react'

import { cleanName } from '@/domain/profile'

// Live "is this name free?" while typing. Debounced, and each new keystroke cancels the last
// request. The server re-checks on save, so this only guides the form.

export type NameStatus = 'empty' | 'checking' | 'available' | 'taken' | 'yours' | 'unknown'

export function useNameCheck(input: string, ownName: string | null): NameStatus {
  const name = cleanName(input)
  const own = ownName !== null && name.toLowerCase() === ownName.toLowerCase()
  const [result, setResult] = useState<{ name: string; status: NameStatus } | null>(null)

  useEffect(() => {
    if (!name || own) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      fetch(`/api/players/name?name=${encodeURIComponent(name)}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : null))
        .then((body: { available?: boolean } | null) =>
          setResult({
            name,
            status: body ? (body.available ? 'available' : 'taken') : 'unknown',
          }),
        )
        .catch(() => {
          if (!controller.signal.aborted) setResult({ name, status: 'unknown' })
        })
    }, 350)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [name, own])

  if (!name) return 'empty'
  if (own) return 'yours'
  return result?.name === name ? result.status : 'checking'
}
