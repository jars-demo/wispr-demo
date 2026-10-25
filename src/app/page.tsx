import { PageShell } from '@/components/PageShell'
import { BoardRail } from '@/features/board/BoardRail'
import { Sparkle, Squiggle } from '@/features/home/Doodles'
import { SearchBar } from '@/features/wire/SearchBar'
import { Wire } from '@/features/wire/Wire'

export default function Home() {
  return (
    <PageShell width="max-w-6xl">
      <section className="relative mb-10 flex flex-col items-center gap-5 pt-6 text-center sm:pt-10">
        <Sparkle className="absolute top-2 right-[12%] hidden size-8 sm:block" />
        <span
          className="rise rounded-full bg-surface px-3 py-1 text-[12px] font-medium tracking-[0.14em] text-muted uppercase ring-1 ring-hairline"
          style={{ '--delay': '0ms' } as React.CSSProperties}
        >
          For developers who ship with agents
        </span>
        <h1
          className="rise font-display text-[52px] leading-[0.95] tracking-[-0.03em] text-balance sm:text-7xl"
          style={{ '--delay': '80ms' } as React.CSSProperties}
        >
          SHIPPED IT?{' '}
          <span className="relative inline-block">
            <em className="text-gradient italic">Now understand it.</em>
            <Squiggle className="absolute -bottom-2 left-0 h-3 w-full" />
          </span>
        </h1>
        <p
          className="rise max-w-xl text-[17px] leading-relaxed text-ink-2"
          style={{ '--delay': '160ms' } as React.CSSProperties}
        >
          Your agent writes the code in minutes. Breakdown turns each change into a three minute
          game: what it did, the engineering behind it, and a quick test that you really get it.
        </p>
        <div
          className="rise w-full max-w-2xl text-left"
          style={{ '--delay': '240ms' } as React.CSSProperties}
        >
          <SearchBar />
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Wire />
        <div className="lg:sticky lg:top-24">
          <BoardRail />
        </div>
      </div>
    </PageShell>
  )
}
