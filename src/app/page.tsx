import { SiteFooter } from '@/components/SiteFooter'
import { SiteNav } from '@/components/SiteNav'
import { TiltCard } from '@/components/TiltCard'
import { CheckMockup } from '@/components/mockups/CheckMockup'
import { VerdictSheets } from '@/components/ui/VerdictSheets'
import { DoodleArrow, Sparkle, Squiggle } from '@/features/home/Doodles'
import { AGENTS } from '@/features/home/agents'
import { VoiceStart } from '@/features/home/VoiceStart'

// One action above the fold: tap the orb and talk. Everything below explains it in three beats.

const STEPS = [
  {
    title: 'Say',
    em: 'it.',
    body: 'Hold your Wispr Flow key and talk it through like you would to a teammate. Receipts turns it into a short checklist. Anything vague becomes a question, never a guess.',
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

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main id="main" className="flex-1">
        <section
          id="start"
          className="mx-auto flex max-w-4xl scroll-mt-24 flex-col items-center overflow-x-clip px-4 pt-10 pb-20 text-center sm:pt-14"
        >
          <span className="rise text-[12px] font-medium tracking-[0.18em] text-muted uppercase">
            Voice-first, made for Wispr Flow
          </span>
          <h1
            className="rise mt-5 font-display text-[3.4rem] leading-[0.95] tracking-[-0.03em] text-balance sm:text-[5.5rem]"
            style={{ '--delay': '80ms' } as React.CSSProperties}
          >
            Say what you want,
            <br />
            <span className="relative inline-block">
              <em className="italic">get proof it&rsquo;s done.</em>
              <Squiggle className="absolute -bottom-2 left-0 h-4 w-full sm:-bottom-3 sm:h-5" />
              <Sparkle className="absolute -top-3 -right-6 size-7 sm:-top-4 sm:-right-9 sm:size-9" />
            </span>
          </h1>
          <p
            className="rise mt-5 max-w-md text-[17px] leading-relaxed text-pretty text-ink-2"
            style={{ '--delay': '160ms' } as React.CSSProperties}
          >
            Talk it through with Wispr Flow. Receipts writes the checklist for your coding agent,
            then checks the work against what you said.
          </p>
          <div
            className="rise relative mt-9 flex w-full justify-center"
            style={{ '--delay': '240ms' } as React.CSSProperties}
          >
            <DoodleArrow className="absolute -top-14 left-[calc(50%-21rem)] hidden h-20 w-28 lg:block" />
            <VoiceStart />
          </div>
        </section>

        <section aria-label="Works with" className="pb-24">
          <p className="mb-5 text-center text-[12px] tracking-[0.18em] text-muted uppercase">
            Works with your agent
          </p>
          <div className="marquee mx-auto max-w-4xl">
            <ul className="marquee-track">
              {[...AGENTS, ...AGENTS].map((agent, index) => (
                <li
                  key={`${agent.name}-${index}`}
                  aria-hidden={index >= AGENTS.length}
                  className="glass shrink-0 rounded-full px-5 py-2.5 text-[15px] font-medium tracking-[-0.01em] text-ink-2 inline-flex items-center gap-2.5"
                >
                  <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true">
                    <path d={agent.path} fill={agent.color} />
                  </svg>
                  {agent.name}
                </li>
              ))}
            </ul>
          </div>
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
            Three steps, <em className="text-gradient italic">no setup.</em>
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="reveal glass lift flex flex-col gap-3 rounded-panel p-7"
              >
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
            Proof, <em className="text-gradient italic">not promises.</em>
          </h2>
          <div className="reveal">
            <CheckMockup compact />
          </div>
          <p className="mt-4 text-center text-[13px] text-muted">
            Checking the work is the next release. This example uses sample data.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-24">
          <TiltCard className="cta-glow relative flex flex-col items-center gap-7 overflow-hidden rounded-panel bg-ink px-6 py-16 text-center text-canvas sm:py-20">
            <h2
              data-depth
              style={{ '--depth': 70 } as React.CSSProperties}
              className="font-display text-5xl leading-[1.02] tracking-[-0.025em] text-balance sm:text-6xl"
            >
              You said it. <em className="text-accent italic">Now see it done.</em>
            </h2>
            <a
              data-depth
              style={{ '--depth': 110 } as React.CSSProperties}
              href="#start"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-canvas px-6 text-[15px] font-medium text-ink transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
            >
              Start talking
            </a>
          </TiltCard>
        </section>
      </main>
      <SiteFooter />
      <VerdictSheets />
    </>
  )
}
