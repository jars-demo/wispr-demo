import { SiteFooter } from '@/components/SiteFooter'
import { SiteNav } from '@/components/SiteNav'
import { CheckMockup } from '@/components/mockups/CheckMockup'
import { VerdictSheets } from '@/components/ui/VerdictSheets'
import { VoiceStart } from '@/features/home/VoiceStart'

// One action above the fold: tap the orb and talk. Everything below explains it in three beats.

const STEPS = [
  {
    title: 'Say',
    em: 'it.',
    body: 'Talk through the change like you would to a teammate. Receipts turns it into a short checklist. Anything vague becomes a question for you, never a guess.',
  },
  {
    title: 'Hand it',
    em: 'over.',
    body: 'Copy a ready prompt for Claude Code, Codex, Cursor or any agent. It asks the agent to report back honestly.',
  },
  {
    title: 'Check',
    em: 'the work.',
    body: 'Give Receipts the changes. Each item comes back Found, Partly, Missing or Can’t tell, with the exact lines as proof.',
  },
]

const AGENTS = ['Claude Code', 'Codex', 'Cursor', 'Copilot', 'Any agent']

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main id="main" className="flex-1">
        <section
          id="start"
          className="mx-auto flex max-w-4xl scroll-mt-24 flex-col items-center px-4 pt-10 pb-20 text-center sm:pt-14"
        >
          <span className="rise text-[12px] font-medium tracking-[0.18em] text-muted uppercase">
            Voice-first, for coding agents
          </span>
          <h1
            className="rise mt-5 font-display text-[3.4rem] leading-[0.95] tracking-[-0.03em] text-balance sm:text-[5.5rem]"
            style={{ '--delay': '80ms' } as React.CSSProperties}
          >
            Say what you want,
            <br />
            <em className="italic">get proof it&rsquo;s done.</em>
          </h1>
          <p
            className="rise mt-5 max-w-md text-[17px] leading-relaxed text-pretty text-ink-2"
            style={{ '--delay': '160ms' } as React.CSSProperties}
          >
            Talk to Receipts. It writes the checklist for your coding agent, then checks the work
            against what you said.
          </p>
          <div
            className="rise mt-4 flex w-full justify-center"
            style={{ '--delay': '240ms' } as React.CSSProperties}
          >
            <VoiceStart />
          </div>
        </section>

        <section aria-label="Works with" className="pb-24">
          <ul className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 text-[15px]">
            <li className="text-[12px] tracking-[0.18em] text-muted uppercase">Works with</li>
            {AGENTS.map((agent) => (
              <li key={agent} className="font-medium text-ink-2">
                {agent}
              </li>
            ))}
          </ul>
        </section>

        <section
          id="how-it-works"
          aria-labelledby="how-heading"
          className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-28"
        >
          <h2
            id="how-heading"
            className="reveal mb-12 text-center font-display text-5xl tracking-[-0.025em] sm:text-6xl"
          >
            Three steps, <em className="italic">no setup.</em>
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="reveal glass flex flex-col gap-3 rounded-panel p-7">
                <span className="font-mono text-[13px] text-accent-text">0{index + 1}</span>
                <h3 className="font-display text-[2rem] leading-tight tracking-[-0.02em]">
                  {step.title} <em className="italic">{step.em}</em>
                </h3>
                <p className="text-[15px] leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="example-heading" className="mx-auto max-w-3xl px-4 pb-28">
          <h2
            id="example-heading"
            className="reveal mb-10 text-center font-display text-5xl tracking-[-0.025em] sm:text-6xl"
          >
            Proof, <em className="italic">not promises.</em>
          </h2>
          <div className="reveal">
            <CheckMockup compact />
          </div>
          <p className="mt-4 text-center text-[13px] text-muted">
            Checking the work is the next release. This example uses sample data.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-24">
          <div className="reveal flex flex-col items-center gap-7 rounded-panel bg-ink px-6 py-16 text-center text-canvas sm:py-20">
            <h2 className="font-display text-5xl leading-[1.02] tracking-[-0.025em] text-balance sm:text-6xl">
              You said it. <em className="text-accent italic">Now see it done.</em>
            </h2>
            <a
              href="#start"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-canvas px-6 text-[15px] font-medium text-ink transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
            >
              Start talking
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
      <VerdictSheets />
    </>
  )
}
