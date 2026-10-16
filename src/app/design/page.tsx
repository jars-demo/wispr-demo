import type { Metadata } from 'next'

import { SiteFooter } from '@/components/SiteFooter'
import { SiteNav } from '@/components/SiteNav'
import { CheckMockup } from '@/components/mockups/CheckMockup'
import { SpecMockup } from '@/components/mockups/SpecMockup'
import { buttonStyles, type ButtonVariant } from '@/components/ui/button-styles'
import { VerdictBadge } from '@/components/ui/VerdictBadge'
import { VerdictSheets } from '@/components/ui/VerdictSheets'
import { VERDICT_KINDS } from '@/domain/verdict'
import { contrastRatio, gradeContrast } from '@/lib/contrast'

import { TOKEN_PAIRS, type Theme } from './tokens'

export const metadata: Metadata = {
  title: 'Design preview',
  robots: { index: false, follow: false },
}

const PRINCIPLES = [
  {
    title: 'One thing per screen',
    body: 'Each screen has a single primary action in black. Everything else steps back.',
  },
  {
    title: 'Plain words',
    body: 'Found, Partly, Missing, Off-limits, Can’t tell. No jargon, no scores.',
  },
  {
    title: 'Detail on request',
    body: 'Summaries first. Lines of code, reasons and sources open when you ask for them.',
  },
  {
    title: 'Quiet motion',
    body: 'Things rise in gently and sheets float up. All of it stops if you prefer less motion.',
  },
]

const BUTTONS: { variant: ButtonVariant; label: string }[] = [
  { variant: 'primary', label: 'Primary' },
  { variant: 'secondary', label: 'Secondary' },
  { variant: 'accent', label: 'Accent' },
  { variant: 'ghost', label: 'Ghost' },
]

function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string
  title: string
  intro: string
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={id} className="reveal flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 id={id} className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
          {title}
        </h2>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted">{intro}</p>
      </div>
      {children}
    </section>
  )
}

function ContrastTable({ theme }: { theme: Theme }) {
  return (
    <div className="glass overflow-x-auto rounded-panel p-2">
      <table className="w-full min-w-[560px] text-left text-sm">
        <caption className="px-3 pt-2 pb-1 text-left text-[13px] font-medium text-muted capitalize">
          {theme} palette
        </caption>
        <thead className="text-[12px] text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">
              Sample
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Tokens
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Use
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Contrast
            </th>
          </tr>
        </thead>
        <tbody>
          {TOKEN_PAIRS[theme].map((pair) => {
            const ratio = contrastRatio(pair.foreground, pair.background)
            return (
              <tr key={pair.name}>
                <td className="px-3 py-2">
                  <span
                    className="inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium"
                    style={{
                      color: pair.foreground,
                      background: pair.background,
                      boxShadow: 'inset 0 0 0 1px rgb(128 128 128 / 0.15)',
                    }}
                  >
                    {pair.name}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-[12px] text-muted">
                  {pair.fgToken} on {pair.bgToken}
                </td>
                <td className="px-3 py-2 text-muted">{pair.use}</td>
                <td className="px-3 py-2 text-right font-mono text-[12px]">
                  {ratio.toFixed(2)}:1 <span className="text-muted">{gradeContrast(ratio)}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function DesignPreviewPage() {
  return (
    <>
      <SiteNav />
      <main
        id="main"
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-24 px-4 pt-20 pb-32"
      >
        <header className="rise flex flex-col gap-4">
          <span className="text-[13px] font-medium text-accent-text">Design preview</span>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
            Simple outside. Rigorous inside.
          </h1>
          <p className="max-w-2xl text-[17px] leading-relaxed text-muted">
            The visual system for Receipts and static mockups of its two screens. Contrast below is
            computed from the token values when the page renders, not typed in by hand.
          </p>
        </header>

        <Section
          id="principles"
          title="Principles"
          intro="Borrowed from how Apple makes complex things feel obvious."
        >
          <ul className="grid gap-3 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <li key={p.title} className="glass flex flex-col gap-2 rounded-panel p-6">
                <span className="text-[17px] font-semibold tracking-tight">{p.title}</span>
                <span className="text-[15px] leading-relaxed text-muted">{p.body}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="spec-screen"
          title="Screen 1: what you asked for"
          intro="What you said on one side, the checklist on the other. A vague phrase becomes a question for you, not a requirement."
        >
          <SpecMockup />
        </Section>

        <Section
          id="check-screen"
          title="Screen 2: the check"
          intro="One answer per item, with the lines that support it, then what your agent claimed. Tap any status to open its sheet."
        >
          <CheckMockup />
        </Section>

        <Section
          id="controls"
          title="Controls and sheets"
          intro="Pill buttons with an orange focus ring (press Tab). Status badges open a frosted sheet that rises over a soft blur. Escape or a tap outside closes it."
        >
          <div className="glass flex flex-col gap-6 rounded-panel p-6">
            <div className="flex flex-wrap gap-3">
              {BUTTONS.map((button) => (
                <button key={button.variant} type="button" className={buttonStyles(button.variant)}>
                  {button.label}
                </button>
              ))}
              <button type="button" disabled className={buttonStyles('primary')}>
                Disabled
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {VERDICT_KINDS.map((kind) => (
                <VerdictBadge key={kind} kind={kind} explain />
              ))}
            </div>
          </div>
        </Section>

        <Section
          id="glass"
          title="Material"
          intro="Frosted glass with a bright top edge, over soft ambient light. It turns solid when blur is unsupported or reduced transparency is on. Code always sits on a solid surface."
        >
          <div className="relative overflow-hidden rounded-panel p-10 sm:p-16">
            <div aria-hidden="true" className="absolute inset-0 grid grid-cols-6 gap-3 p-6">
              {Array.from({ length: 18 }, (_, i) => (
                <div
                  key={i}
                  className={`rounded-2xl ${i % 7 === 2 ? 'bg-accent/80' : i % 3 === 0 ? 'bg-ink/80' : 'bg-ink/10'}`}
                />
              ))}
            </div>
            <div className="glass relative mx-auto max-w-sm rounded-panel p-6">
              <p className="text-[15px] font-semibold">Frosted panel</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">
                Whatever sits behind is softened, so text on top stays easy to read.
              </p>
            </div>
          </div>
        </Section>

        <Section
          id="type"
          title="Type"
          intro="Geist for words, Geist Mono for code and commit hashes. Large, tight headlines. Calm 15 to 17 pixel body text."
        >
          <div className="glass flex flex-col gap-4 rounded-panel p-8">
            <p className="text-5xl font-semibold tracking-[-0.045em] sm:text-6xl">
              Proof, not promises.
            </p>
            <p className="text-2xl font-semibold tracking-tight">Rate-limit the login endpoint</p>
            <p className="max-w-xl text-[17px] leading-relaxed text-ink-2">
              Body text is generous so a long checklist still reads easily.
            </p>
            <p className="font-mono text-sm text-muted">src/app/api/login/route.ts L14-L18</p>
          </div>
        </Section>

        <Section
          id="contrast"
          title="Colour and contrast"
          intro="White, black and one orange. Orange is a fill, an accent and the focus ring. Orange text uses a deeper shade so it stays readable. Every pair passes WCAG AA, and a test keeps it that way."
        >
          <div className="grid gap-6">
            <ContrastTable theme="light" />
            <ContrastTable theme="dark" />
          </div>
        </Section>
      </main>
      <SiteFooter />
      <VerdictSheets />
    </>
  )
}
