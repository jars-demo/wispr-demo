'use client'

// Short spoken replies through the browser's own speech synthesis. Off when the user mutes it,
// and silently skipped where the browser has no voice support.

const MUTE_KEY = 'receipts:voice-muted'

// Kept in memory as well, so muting works for this page even when storage is blocked.
let mutedInMemory: boolean | null = null
const listeners = new Set<() => void>()

export function isMuted(): boolean {
  if (mutedInMemory !== null) return mutedInMemory
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function setMuted(muted: boolean): void {
  mutedInMemory = muted
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    // Storage can be blocked; the in-memory value still applies.
  }
  if (muted) window.speechSynthesis?.cancel()
  for (const listener of listeners) listener()
}

/** For useSyncExternalStore: notifies when the mute setting changes. */
export function subscribeMuted(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function speak(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || isMuted()) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = navigator.language || 'en-US'
  utterance.rate = 1.03
  window.speechSynthesis.speak(utterance)
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

/** "Got it. 3 things to do, 1 to leave alone, and 1 question for you." */
export function summarise(counts: { todo: number; leaveAlone: number; questions: number }): string {
  const parts = [plural(counts.todo, 'thing to do', 'things to do')]
  if (counts.leaveAlone > 0) parts.push(`${counts.leaveAlone} to leave alone`)
  if (counts.questions > 0)
    parts.push(plural(counts.questions, 'question for you', 'questions for you'))
  const list =
    parts.length > 2 ? `${parts.slice(0, -1).join(', ')}, and ${parts.at(-1)}` : parts.join(' and ')
  return `Got it. ${list}. Have a look and fix anything I got wrong.`
}
