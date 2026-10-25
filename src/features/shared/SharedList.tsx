'use client'

import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Avatar } from '@/components/Avatar'
import { timeAgo } from '@/domain/feed'
import { changeLabel, sharedHref, type SharedItem } from '@/domain/shared'

import { fetchShared } from './api'

// The public shelf of shared breakdowns: one card per change, newest first.

export function SharedList() {
  const reduce = useReducedMotion()
  const [items, setItems] = useState<SharedItem[] | null | 'error'>(null)

  useEffect(() => {
    let live = true
    void fetchShared().then((result) => live && setItems(result ?? 'error'))
    return () => {
      live = false
    }
  }, [])

  if (items === null) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-panel bg-surface-2/60" />
        ))}
      </div>
    )
  }

  if (items === 'error' || items.length === 0) {
    return (
      <div className="glass flex flex-col items-center gap-3 rounded-panel px-6 py-14 text-center">
        <p className="text-lg font-semibold">
          {items === 'error' ? 'This shelf could not load' : 'Nothing shared yet'}
        </p>
        <p className="max-w-md text-[15px] text-muted">
          {items === 'error'
            ? 'Try again in a moment.'
            : 'Break down a public pull request, then turn on Make this breakdown public at the end. Yours could be first.'}
        </p>
        <Link
          href="/"
          className="text-[14px] font-medium text-accent-text underline-offset-4 hover:underline"
        >
          Find a change to break down
        </Link>
      </div>
    )
  }

  const now = new Date()
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <motion.li
          key={item.id}
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26, delay: Math.min(i, 8) * 0.04 }}
          className="min-w-0"
        >
          <Link
            href={sharedHref(item.id)}
            className="glass group flex h-full flex-col gap-3 rounded-panel p-5 transition-shadow hover:shadow-[var(--shadow-lift)]"
          >
            <p className="truncate font-mono text-[12px] text-muted">{changeLabel(item.url)}</p>
            <h2 className="line-clamp-3 text-[17px] leading-snug font-semibold tracking-tight">
              {item.title}
            </h2>
            {item.only ? (
              <p className="truncate text-[12px] text-muted">
                Focused on <span className="font-mono">{item.only}</span>
              </p>
            ) : null}
            <div className="mt-auto flex items-center gap-2 pt-2 text-[13px]">
              <Avatar id={item.avatar} size={28} />
              <span className="min-w-0 flex-1 truncate">
                <span className="font-medium">{item.name}</span>
                {item.sharers > 1 ? (
                  <span className="text-muted"> and {item.sharers - 1} more</span>
                ) : null}
                <span className="text-muted"> · {timeAgo(item.at, now)}</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 font-medium text-accent-text">
                Play
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </div>
          </Link>
        </motion.li>
      ))}
    </ul>
  )
}
