import Link from 'next/link'
import { Suspense } from 'react'

import { BackToTop } from '@/components/BackToTop'
import { LogoMark } from '@/components/Logo'
import { Mascot } from '@/components/mascot/Mascot'

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline">
      <BackToTop />
      {/* Recei reads the URL to flip on page changes, so it streams in after prerendering. */}
      <Suspense fallback={null}>
        <Mascot />
      </Suspense>
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2">
          <LogoMark size={20} />
          Receipts
        </span>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/specs" className="hover:text-ink">
            Your receipts
          </Link>
          <Link href="/#how-it-works" className="hover:text-ink">
            How it works
          </Link>
          <Link href="/design" className="hover:text-ink">
            Design
          </Link>
        </nav>
      </div>
      <div className="mx-auto max-w-5xl px-4 pb-10">
        <p className="max-w-3xl text-[13px] leading-relaxed text-muted">
          <span className="font-medium text-ink-2">About this project.</span> Receipts is a demo
          built to show{' '}
          <a href="https://wisprflow.ai" className="underline underline-offset-4 hover:text-ink">
            Wispr Flow
          </a>{' '}
          in a developer&apos;s day: you speak, and your coding agent gets the work. It was made for{' '}
          <a
            href="https://www.wemakedevs.org/wispr"
            className="underline underline-offset-4 hover:text-ink"
          >
            No Hands: The Wispr Challenge
          </a>{' '}
          by WeMakeDevs and Wispr Flow (October 2026, Builders track), which is why it lives at
          wispr.jishanahmed.in. It is an independent entry, not an official Wispr product.{' '}
          <a
            href="https://github.com/jars-demo/wispr-demo"
            className="underline underline-offset-4 hover:text-ink"
          >
            Source on GitHub
          </a>
          .
        </p>
      </div>
    </footer>
  )
}
