import Link from 'next/link'

import { Logo } from '@/components/Logo'
import { buttonStyles } from '@/components/ui/button-styles'

function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function SiteNav() {
  return (
    <header className="sticky top-3 z-40 px-3 pt-[env(safe-area-inset-top)] sm:top-4 sm:px-4">
      <nav
        aria-label="Main"
        className="glass-strong mx-auto flex h-13 max-w-4xl items-center justify-between rounded-full pr-1.5 pl-4"
      >
        <Link href="/" aria-label="Receipts home" className="rounded-full">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/specs"
            aria-label="My checklists"
            className="inline-flex size-10 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 sm:hidden"
          >
            <ListIcon />
          </Link>
          {/* The wrapper hides this on phones; the button styles set their own display. */}
          <div className="hidden sm:flex">
            <Link href="/specs" className={buttonStyles('ghost')}>
              My checklists
            </Link>
          </div>
          <Link href="/new" className={buttonStyles('primary')}>
            New
          </Link>
        </div>
      </nav>
    </header>
  )
}
