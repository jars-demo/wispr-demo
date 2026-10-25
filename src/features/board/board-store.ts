'use client'

import { useEffect, useSyncExternalStore } from 'react'

import type { BoardView } from '@/domain/board'
import { toast } from '@/features/fx/toasts'
import { profileStore } from '@/features/game/store'

// The live leaderboard, polled while a page that shows it is open. When the player's rank drops,
// it says who just overtook them.

type State = { view: BoardView | null; error: boolean }

let state: State = { view: null, error: false }
const listeners = new Set<() => void>()
let watchers = 0
let timer: number | undefined
let lastRank: number | null = null

function set(next: State) {
  state = next
  for (const listener of listeners) listener()
}

function aheadName(rivalry: string | null): string | null {
  const match = rivalry ? /^(.+?) is [\d,]+ XP ahead of you\.$/.exec(rivalry) : null
  return match?.[1] ?? null
}

export async function refreshBoard() {
  const me = profileStore.read().board?.id
  try {
    const response = await fetch(`/api/board${me ? `?me=${me}` : ''}`, { cache: 'no-store' })
    if (!response.ok) throw new Error('board')
    const view = (await response.json()) as BoardView
    const rank = view.me?.rank ?? null
    if (lastRank !== null && rank !== null && rank > lastRank) {
      const who = aheadName(view.rivalry)
      toast({
        tone: 'rival',
        icon: '⚡',
        title: who ? `${who} just overtook you` : 'Someone just overtook you',
        body: `You are now #${rank}. Break something down to win it back.`,
      })
    }
    lastRank = rank
    set({ view, error: false })
  } catch {
    set({ ...state, error: true })
  }
}

function tick() {
  if (document.visibilityState === 'visible') void refreshBoard()
}

/** Subscribes the calling component to the live board. Polls every 20 seconds while visible. */
export function useBoard(): State {
  useEffect(() => {
    watchers += 1
    if (watchers === 1) {
      void refreshBoard()
      timer = window.setInterval(tick, 20_000)
    }
    return () => {
      watchers -= 1
      if (watchers === 0) window.clearInterval(timer)
    }
  }, [])
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => state,
    () => state,
  )
}
