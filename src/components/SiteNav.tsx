import Link from 'next/link'

import { Logo } from '@/components/Logo'
import { buttonStyles } from '@/components/ui/button-styles'

export function SiteNav() {
  return (
    <header className="sticky top-4 z-40 px-4">
      <nav
        aria-label="Main"
        className="glass-strong mx-auto flex h-13 max-w-4xl items-center justify-between rounded-full pr-2 pl-4"
      >
        <Link href="/" aria-label="Receipts home" className="rounded-full">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          {/* Hidden on phones via the wrapper: the button styles set their own display. */}
          <div className="hidden items-center gap-1 sm:flex">
            <Link href="/specs" className={buttonStyles('ghost')}>
              Your checklists
            </Link>
          </div>
          <Link href="/new" className={buttonStyles('primary')}>
            New checklist
          </Link>
        </div>
      </nav>
    </header>
  )
}
