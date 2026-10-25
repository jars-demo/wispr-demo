import { BookOpen } from 'lucide-react'
import Link from 'next/link'

import { Logo } from '@/components/Logo'
import { buttonStyles } from '@/components/ui/button-styles'
import { PlayerChip } from '@/features/game/PlayerChip'

export function SiteNav() {
  return (
    <header className="sticky top-3 z-40 px-3 pt-[env(safe-area-inset-top)] sm:top-4 sm:px-4">
      <nav
        aria-label="Main"
        className="glass-strong mx-auto flex h-14 max-w-6xl items-center justify-between gap-1 rounded-full pr-2 pl-4"
      >
        <Link href="/" aria-label="Breakdown home" className="rounded-full">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <div className="hidden items-center sm:flex">
            <Link href="/" className={buttonStyles('ghost')}>
              Wire
            </Link>
            <Link href="/board" className={buttonStyles('ghost')}>
              Board
            </Link>
            <Link href="/learn" className={buttonStyles('ghost')}>
              Learn
            </Link>
            <Link href="/settings" className={buttonStyles('ghost')}>
              Settings
            </Link>
          </div>
          <Link
            href="/learn"
            aria-label="Learn from others"
            className="inline-flex size-9 items-center justify-center rounded-full text-ink-2 hover:bg-surface-2 sm:hidden"
          >
            <BookOpen aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
          </Link>
          <Link
            href="/board"
            aria-label="Leaderboard"
            className="inline-flex size-9 items-center justify-center rounded-full text-ink-2 hover:bg-surface-2 sm:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link
            href="/settings"
            aria-label="Settings"
            className="inline-flex size-9 items-center justify-center rounded-full text-ink-2 hover:bg-surface-2 sm:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 7h10M18 7h2M4 17h4M12 17h8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle cx="16" cy="7" r="2" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="10" cy="17" r="2" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </Link>
          <PlayerChip />
        </div>
      </nav>
    </header>
  )
}
