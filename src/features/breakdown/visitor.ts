'use client'

import { VISITOR_HEADER } from '@/domain/visitor'

// This browser's random visitor id, so its free breakdowns are its own even on a shared network.
// Without storage (private mode, blocked site data) requests go without it and count per network.

const KEY = 'breakdown:visitor'

function visitorId(): string | null {
  try {
    let id = window.localStorage.getItem(KEY)
    if (!id) {
      id = crypto.randomUUID()
      window.localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return null
  }
}

export function visitorHeaders(): Record<string, string> {
  const id = visitorId()
  return id ? { [VISITOR_HEADER]: id } : {}
}
