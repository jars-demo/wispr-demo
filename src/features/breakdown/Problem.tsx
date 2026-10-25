import {
  CloudOff,
  FileWarning,
  Plug,
  Hourglass,
  KeyRound,
  Link2Off,
  SearchX,
  TriangleAlert,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'

import { buttonStyles } from '@/components/ui/button-styles'

import { minutesUntil } from './quota'

// One calm error state for every way a breakdown can fail: what happened in plain words, and
// the next step that fixes it. Never a dead end: there is always a free sample to play.

type Action = { label: string; href: string } | 'retry'
type Kind = { icon: LucideIcon; title: string; actions: Action[] }

const OWN_KEY = { label: 'Add your own AI key', href: '/settings#ai' }
const SAMPLE = { label: 'Play a free sample', href: '/b?sample=pagination' }

const KINDS: Record<string, Kind> = {
  free_limit: {
    icon: Hourglass,
    title: 'That was this hour of free breakdowns',
    actions: [OWN_KEY, SAMPLE],
  },
  network_limit: {
    icon: Hourglass,
    title: 'Your network used its free breakdowns',
    actions: [OWN_KEY, SAMPLE],
  },
  rate_limited: { icon: Hourglass, title: 'Time for a short breather', actions: ['retry', SAMPLE] },
  busy: { icon: Zap, title: 'The free AI is busy right now', actions: ['retry', OWN_KEY] },
  too_large: { icon: FileWarning, title: 'Too big for the free AI', actions: [OWN_KEY, SAMPLE] },
  bad_key: {
    icon: KeyRound,
    title: 'Your AI key was turned down',
    actions: [{ label: 'Check your key', href: '/settings#ai' }, 'retry'],
  },
  ai_not_configured: {
    icon: KeyRound,
    title: 'Live breakdowns are not on here yet',
    actions: [OWN_KEY, SAMPLE],
  },
  no_github: {
    icon: Plug,
    title: 'Connect GitHub to open this one',
    actions: [{ label: 'Connect GitHub', href: '/settings#github' }],
  },
  github_fetch: { icon: Link2Off, title: 'We could not open that link', actions: ['retry'] },
  bad_link: { icon: Link2Off, title: 'That link is not a change we can read', actions: [] },
  offline: { icon: CloudOff, title: 'You look offline', actions: ['retry'] },
  not_found: { icon: SearchX, title: 'Nothing to break down here', actions: [SAMPLE] },
}

const FALLBACK: Kind = { icon: TriangleAlert, title: 'Something went wrong', actions: ['retry'] }

export function Problem({
  code,
  message,
  retryAfter,
  onRetry,
}: {
  code: string
  message: string
  retryAfter: number | null
  onRetry: () => void
}) {
  const kind = KINDS[code] ?? FALLBACK
  const Icon = kind.icon
  return (
    <div className="glass mt-10 flex flex-col items-center gap-5 rounded-panel px-6 py-12 text-center sm:py-14">
      <span className="grid size-14 place-items-center rounded-2xl bg-accent-wash text-accent-text">
        <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
      </span>
      <div role="alert" className="flex max-w-md flex-col gap-2">
        <h2 className="font-display text-3xl tracking-tight text-balance">{kind.title}</h2>
        <p className="text-[15px] text-ink-2">{message}</p>
        {retryAfter ? (
          <p className="text-[13px] text-muted">Resets in {minutesUntil(retryAfter)}.</p>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {kind.actions.map((action, i) =>
          action === 'retry' ? (
            <button
              key="retry"
              type="button"
              onClick={onRetry}
              className={buttonStyles(i === 0 ? 'primary' : 'secondary', 'field')}
            >
              Try again
            </button>
          ) : (
            <Link
              key={action.href}
              href={action.href}
              className={buttonStyles(i === 0 ? 'primary' : 'secondary', 'field')}
            >
              {action.label}
            </Link>
          ),
        )}
        <Link href="/" className={buttonStyles('ghost', 'field')}>
          Back to the wire
        </Link>
      </div>
    </div>
  )
}
