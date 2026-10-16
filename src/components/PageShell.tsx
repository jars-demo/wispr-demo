import { SiteFooter } from '@/components/SiteFooter'
import { Squiggle } from '@/features/home/Doodles'
import { SiteNav } from '@/components/SiteNav'

export function PageShell({
  children,
  width = 'max-w-3xl',
}: {
  children: React.ReactNode
  width?: string
}) {
  return (
    <>
      <SiteNav />
      <main id="main" className={`mx-auto flex w-full ${width} flex-1 flex-col px-4 pt-16 pb-24`}>
        {children}
      </main>
      <SiteFooter />
    </>
  )
}

export function PageHeader({
  eyebrow,
  title,
  em,
  children,
}: {
  eyebrow?: string
  title: string
  /** Optional ending set in italics, in the editorial style of the landing page. */
  em?: string
  children?: React.ReactNode
}) {
  return (
    <header className="rise mb-10 flex flex-col gap-3">
      {eyebrow ? (
        <span className="text-[12px] font-medium tracking-[0.16em] text-muted uppercase">
          {eyebrow}
        </span>
      ) : null}
      <h1 className="font-display text-5xl leading-[1] tracking-[-0.03em] text-balance sm:text-6xl">
        {title}
        {em ? (
          <>
            {' '}
            <span className="relative inline-block">
              <em className="text-gradient italic">{em}</em>
              <Squiggle className="absolute -bottom-1.5 left-0 h-3 w-full" />
            </span>
          </>
        ) : null}
      </h1>
      {children}
    </header>
  )
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="glass h-20 animate-pulse rounded-card" />
      ))}
    </div>
  )
}
