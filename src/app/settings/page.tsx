import type { Metadata } from 'next'

import { PageHeader, PageShell } from '@/components/PageShell'
import { AiKeyForm } from '@/features/connect/AiKeyForm'
import { ConnectGitHub } from '@/features/connect/ConnectGitHub'
import { ResetProgress } from '@/features/game/ResetProgress'
import { SaveSection } from '@/features/game/SaveSection'

export const metadata: Metadata = { title: 'Settings', robots: { index: false } }

function Section({
  id,
  title,
  children,
  note,
}: {
  id: string
  title: string
  note: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="glass flex scroll-mt-28 flex-col gap-4 rounded-panel p-5 sm:p-6"
    >
      <div>
        <h2 id={`${id}-title`} className="text-[19px] font-semibold tracking-tight">
          {title}
        </h2>
        <p className="text-[14px] text-ink-2">{note}</p>
      </div>
      {children}
    </section>
  )
}

export default function SettingsPage() {
  return (
    <PageShell>
      <PageHeader eyebrow="Settings" title="Plug in, then" em="play." />
      <div className="flex flex-col gap-5">
        <Section
          id="github"
          title="GitHub"
          note="Your own wire: recent PRs and commits from the repos you pushed to last. Private repos work too."
        >
          <ConnectGitHub />
        </Section>
        <Section
          id="ai"
          title="Your own AI key (optional)"
          note="Breakdown runs on a shared free model. Bring your own key for big pull requests and no hourly limit."
        >
          <AiKeyForm />
        </Section>
        <Section
          id="save"
          title="Save and restore"
          note="No account needed. A name saves your progress; a restore link brings it to another device."
        >
          <SaveSection />
        </Section>
        <Section
          id="reset"
          title="Start over"
          note="Clears progress in this browser. Saved progress on the server stays until you delete it above."
        >
          <ResetProgress />
        </Section>
      </div>
    </PageShell>
  )
}
