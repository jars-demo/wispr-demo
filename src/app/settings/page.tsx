import { Infinity as InfinityIcon, KeyRound, RotateCcw, UserRound } from 'lucide-react'
import type { Metadata } from 'next'

import { PageHeader, PageShell } from '@/components/PageShell'
import { AiKeyForm } from '@/features/connect/AiKeyForm'
import { ConnectGitHub, GitHubMark } from '@/features/connect/ConnectGitHub'
import { ResetProgress } from '@/features/game/ResetProgress'
import { SaveSection } from '@/features/game/SaveSection'

export const metadata: Metadata = { title: 'Settings', robots: { index: false } }

// Settings as a bento: AI and GitHub on top, your name and saving below, starting over off to
// the side. Everything fits on one desktop screen.

function Tile({
  id,
  icon,
  title,
  note,
  tag,
  className = '',
  children,
}: {
  id: string
  icon: React.ReactNode
  title: string
  note: string
  tag?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`tile scroll-mt-28 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink ring-1 ring-hairline">
          {icon}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={`${id}-title`} className="text-[17px] font-semibold tracking-tight">
              {title}
            </h2>
            {tag ? (
              <span className="rounded-full bg-accent-wash px-2 py-0.5 text-[11px] font-semibold tracking-wide text-accent-text uppercase">
                {tag}
              </span>
            ) : null}
          </div>
          <p className="text-[13.5px] leading-snug text-ink-2">{note}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

export default function SettingsPage() {
  return (
    <PageShell width="max-w-6xl">
      <PageHeader eyebrow="Settings" title="Plug in, then" em="play." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Tile
          id="ai"
          icon={<KeyRound aria-hidden="true" className="size-5" />}
          title="Your own AI key"
          tag="Unlimited"
          note="Breakdown gives everyone 2 free AI breakdowns an hour. With your own key there is no limit, and big pull requests are covered up to 3,000 changed lines at once."
          className="lg:col-span-2"
        >
          <AiKeyForm />
        </Tile>
        <Tile
          id="github"
          icon={<GitHubMark size={20} />}
          title="GitHub"
          tag="Always free"
          note="Your own wire: recent pull requests and commits, private repos too."
        >
          <ConnectGitHub />
        </Tile>
        <Tile
          id="save"
          icon={<UserRound aria-hidden="true" className="size-5" />}
          title="Your name and saving"
          note="No account. Claim a name to save progress and join the board; a restore link brings it to another device."
          className="lg:col-span-2"
        >
          <SaveSection />
        </Tile>
        <Tile
          id="reset"
          icon={<RotateCcw aria-hidden="true" className="size-5" />}
          title="Start over"
          note="Clears progress in this browser. Saved progress stays until you delete it."
        >
          <ResetProgress />
        </Tile>
      </div>
      <p className="mt-6 flex items-center gap-2 text-[13px] text-muted">
        <InfinityIcon aria-hidden="true" className="size-4" />
        Samples and links someone already broke down are always free.
      </p>
    </PageShell>
  )
}
