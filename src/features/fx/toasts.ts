'use client'

import { useSyncExternalStore } from 'react'

// Side notifications: achievements, unlocks, level ups and "someone just overtook you".

export type ToastTone = 'xp' | 'achievement' | 'avatar' | 'level' | 'rival' | 'info' | 'error'
export type Toast = { id: number; tone: ToastTone; icon: string; title: string; body?: string }

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function toast(input: Omit<Toast, 'id'>, ms = 5200) {
  const item = { ...input, id: nextId++ }
  toasts = [...toasts, item].slice(-4)
  emit()
  window.setTimeout(() => dismiss(item.id), ms)
}

export function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

const EMPTY: Toast[] = []

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => toasts,
    () => EMPTY,
  )
}
