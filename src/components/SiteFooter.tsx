import Link from 'next/link'

import { BackToTop } from '@/components/BackToTop'
import { LogoMark } from '@/components/Logo'

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline">
      <BackToTop />
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2">
          <LogoMark size={20} />
          Breakdown
        </span>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/" className="hover:text-ink">
            The wire
          </Link>
          <Link href="/board" className="hover:text-ink">
            Leaderboard
          </Link>
          <Link href="/me" className="hover:text-ink">
            Your card
          </Link>
          <Link href="/settings" className="hover:text-ink">
            Settings
          </Link>
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-10">
        <p className="max-w-3xl text-[13px] leading-relaxed text-muted">
          <span className="font-medium text-ink-2">About this project.</span> Breakdown was built
          for{' '}
          <a
            href="https://www.wemakedevs.org/wispr"
            className="underline underline-offset-4 hover:text-ink"
          >
            No Hands: The Wispr Challenge
          </a>{' '}
          by WeMakeDevs and{' '}
          <a href="https://wisprflow.ai" className="underline underline-offset-4 hover:text-ink">
            Wispr Flow
          </a>{' '}
          (October 2026, Builders track), which is why it lives at wispr.jishanahmed.in. It is an
          independent entry, not an official Wispr product. Your GitHub token and AI key stay in
          your browser. Leaderboard numbers are self-reported and checked against the game rules.{' '}
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
