'use client'

import { useMemo, useSyncExternalStore } from 'react'

import { isRepoName, type RepoName } from '@/domain/github-handoff'

// The GitHub connection for this browser only: a token, the account it belongs to, and the repo
// to send to. Kept in localStorage, shared across tabs, never sent to Receipts' server.

export type Connection = { token: string; login: string; repo: RepoName | null }

const KEY = 'receipts:github'
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY)
  } catch {
    return null
  }
}

function parse(raw: string | null): Connection | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<Connection>
    if (typeof value.token !== 'string' || typeof value.login !== 'string') return null
    const repo = typeof value.repo === 'string' && isRepoName(value.repo) ? value.repo : null
    return { token: value.token, login: value.login, repo }
  } catch {
    return null
  }
}

export function saveConnection(connection: Connection | null) {
  try {
    if (connection) window.localStorage.setItem(KEY, JSON.stringify(connection))
    else window.localStorage.removeItem(KEY)
  } catch {
    // Storage blocked (private window): the connection cannot be kept.
  }
  emit()
}

export function useConnection(): Connection | null {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null)
  return useMemo(() => parse(raw), [raw])
}
