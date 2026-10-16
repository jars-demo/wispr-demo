import Link from 'next/link'

import { BackToTop } from '@/components/BackToTop'
import { LogoMark } from '@/components/Logo'
import { Mascot } from '@/components/mascot/Mascot'

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline">
      <BackToTop />
      <Mascot />
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2">
          <LogoMark size={20} />
          Receipts
        </span>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/specs" className="hover:text-ink">
            Your checklists
          </Link>
          <Link href="/#how-it-works" className="hover:text-ink">
            How it works
          </Link>
          <Link href="/design" className="hover:text-ink">
            Design
          </Link>
        </nav>
        <span>Built for No Hands: The Wispr Challenge, October 2026.</span>
      </div>
    </footer>
  )
}
