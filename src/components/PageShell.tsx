import { SiteFooter } from '@/components/SiteFooter'
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
  children,
}: {
  eyebrow?: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <header className="rise mb-10 flex flex-col gap-3">
      {eyebrow ? <span className="text-[13px] font-medium text-accent-text">{eyebrow}</span> : null}
      <h1 className="text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
        {title}
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
