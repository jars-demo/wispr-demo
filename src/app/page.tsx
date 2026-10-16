import Link from 'next/link'

import { SiteFooter } from '@/components/SiteFooter'
import { SiteNav } from '@/components/SiteNav'
import { CheckMockup } from '@/components/mockups/CheckMockup'
import { buttonStyles } from '@/components/ui/button-styles'
import { VerdictBadge } from '@/components/ui/VerdictBadge'
import { VerdictSheets } from '@/components/ui/VerdictSheets'
import { EVIDENCE_SOURCE_COPY, EVIDENCE_SOURCE_KINDS } from '@/domain/evidence-source'
import { VERDICT_COPY, VERDICT_KINDS } from '@/domain/verdict'

const STEPS = [
  {
    title: 'Say it',
    body: 'Talk through the change like you would to a teammate. Receipts turns it into a short checklist. Anything vague becomes a question for you, never a guess.',
  },
  {
    title: 'Let your agent work',
    body: 'Hand the checklist to Claude Code, Codex, Copilot, Cursor or any agent you like.',
  },
  {
    title: 'Check it',
    body: 'Give Receipts the result. Each item comes back Found, Partly, Missing, Off-limits or Can’t tell, with the lines that prove it.',
  },
]

const PROMISES = [
  'No lines to point at, no Found.',
  '"Tests pass" is only backed up by real test results.',
  'Finding the code is evidence, not proof it works. We say so.',
  'Anything left out of a check is listed, never hidden.',
]

function SectionHeading({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <div className="mb-10 flex flex-col items-center gap-3 text-center">
      <span className="text-[13px] font-medium text-accent-text">{eyebrow}</span>
      <h2 id={id} className="max-w-xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
        {title}
      </h2>
    </div>
  )
}

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main id="main" className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col items-center px-4 pt-24 pb-20 text-center sm:pt-32">
          <span className="rise glass mb-7 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] text-ink-2">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
            For anyone building with AI coding agents
          </span>
          <h1
            className="rise max-w-3xl text-[2.75rem] leading-[1.05] font-semibold tracking-[-0.045em] text-balance sm:text-7xl"
            style={{ '--delay': '80ms' } as React.CSSProperties}
          >
            Did your AI do what you asked?
          </h1>
          <p
            className="rise mt-6 max-w-xl text-[17px] leading-relaxed text-pretty text-muted sm:text-xl"
            style={{ '--delay': '160ms' } as React.CSSProperties}
          >
            Say what you want. Receipts turns it into a checklist, checks your agent&rsquo;s work
            against it, and shows you the proof.
          </p>
          <div
            className="rise mt-9 flex flex-col items-center gap-3 sm:flex-row"
            style={{ '--delay': '240ms' } as React.CSSProperties}
          >
            <Link href="/new" className={buttonStyles('primary', 'lg')}>
              Start a checklist
            </Link>
            <Link href="#example" className={buttonStyles('secondary', 'lg')}>
              See an example
            </Link>
          </div>
          <p
            className="rise mt-5 text-[13px] text-muted"
            style={{ '--delay': '320ms' } as React.CSSProperties}
          >
            Free, no sign-up. Checking the work is the next milestone; the example below uses sample
            data.
          </p>
        </section>

        <section
          id="example"
          aria-label="Example check"
          className="reveal mx-auto max-w-3xl scroll-mt-24 px-4 pb-32"
        >
          <CheckMockup compact />
        </section>

        <section
          id="how-it-works"
          aria-labelledby="how-heading"
          className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-32"
        >
          <SectionHeading id="how-heading" eyebrow="How it works" title="Three steps. No setup." />
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="reveal glass flex flex-col gap-3 rounded-panel p-7">
                <span className="font-mono text-[13px] text-accent-text">0{index + 1}</span>
                <h3 className="text-xl font-semibold tracking-tight">{step.title}</h3>
                <p className="text-[15px] leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="sources-heading" className="mx-auto max-w-5xl px-4 pb-32">
          <SectionHeading
            id="sources-heading"
            eyebrow="Works with what you have"
            title="A pull request is optional."
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EVIDENCE_SOURCE_KINDS.map((kind) => {
              const source = EVIDENCE_SOURCE_COPY[kind]
              return (
                <li key={kind} className="reveal glass flex flex-col gap-2 rounded-card p-5">
                  <span className="text-[15px] font-semibold tracking-tight">{source.label}</span>
                  <span className="font-mono text-[12.5px] text-ink-2">{source.example}</span>
                  <span className="text-sm leading-relaxed text-muted">{source.provenance}</span>
                </li>
              )
            })}
          </ul>
          <p className="mx-auto mt-6 max-w-lg text-center text-sm text-muted">
            The proof can only be as good as what you give it. When there is not enough, Receipts
            says Can&rsquo;t tell.
          </p>
        </section>

        <section aria-labelledby="answers-heading" className="mx-auto max-w-3xl px-4 pb-32">
          <SectionHeading
            id="answers-heading"
            eyebrow="Plain answers"
            title="Five answers. Tap one to learn more."
          />
          <ul className="reveal glass flex flex-col gap-1 rounded-panel p-3">
            {VERDICT_KINDS.map((kind) => (
              <li key={kind} className="flex items-center gap-4 rounded-card px-3 py-3">
                <VerdictBadge kind={kind} explain />
                <span className="text-[15px] text-ink-2">{VERDICT_COPY[kind].meaning}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="promises-heading" className="mx-auto max-w-5xl px-4 pb-32">
          <div className="reveal rounded-panel bg-ink px-8 py-12 text-canvas sm:px-14 sm:py-16">
            <h2
              id="promises-heading"
              className="max-w-md text-3xl font-semibold tracking-[-0.03em] sm:text-4xl"
            >
              Receipts shows its own receipts.
            </h2>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2">
              {PROMISES.map((promise) => (
                <li key={promise} className="flex gap-3 text-[17px] leading-relaxed">
                  <span
                    className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent"
                    aria-hidden="true"
                  />
                  {promise}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <SiteFooter />
      <VerdictSheets />
    </>
  )
}
