'use client'

import { Badge, TIER_LABEL } from '@/components/Badge'
import { Avatar } from '@/components/Avatar'
import { TAGLINES } from '@/domain/card'
import { ACHIEVEMENTS, AVATARS, levelFor, unlockedAvatars } from '@/domain/game'
import { boardStats, chooseAvatar, CARD_TEMPLATES, statsOf } from '@/domain/profile'
import { NameClaim } from '@/features/game/NameClaim'
import { profileStore, updateProfile } from '@/features/game/store'
import { useHydrated } from '@/lib/local-store'

import { ScaledCard } from './ScaledCard'
import { ShareActions } from './ShareActions'
import { cardFromProfile } from './share'

// Your card, as a bento: the card and its X button, your name, the style, the avatars you can
// pick, and the badge cabinet. Everything fits on one desktop screen.

const TEMPLATE_LABEL = { paper: 'Paper', night: 'Night', signal: 'Signal' } as const
const SWATCH = { paper: 'bg-[#fbf8f1]', night: 'bg-[#0f0f0e]', signal: 'bg-[#ff5a1f]' } as const

function TileTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-[13px] font-semibold tracking-wide text-ink uppercase">{children}</h2>
      {aside ? <span className="text-[12.5px] text-muted tabular-nums">{aside}</span> : null}
    </div>
  )
}

export function MyCard() {
  const hydrated = useHydrated()
  const profile = profileStore.use()

  if (!hydrated) {
    return <div className="aspect-[1200/630] w-full animate-pulse rounded-panel bg-surface-2" />
  }

  const today = new Date().toISOString().slice(0, 10)
  const card = cardFromProfile(profile, today)
  const level = levelFor(profile.xp)
  const unlocked = new Set(unlockedAvatars(boardStats(profile)))
  const stats = statsOf(profile, today)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section aria-label="Your card" className="tile">
        <ScaledCard card={card} label={`Your card: level ${level.level}, ${profile.xp} XP`} />
        <ShareActions card={card} size="field" />
        <p className="text-[12px] text-muted">
          The link carries only your card&apos;s numbers: never code, repositories or your GitHub
          name.
        </p>
      </section>

      <div className="flex min-w-0 flex-col gap-4">
        <section aria-label="Your name" className="tile">
          <NameClaim id="card-name" />
        </section>

        <section aria-labelledby="style-title" className="tile">
          <TileTitle>
            <span id="style-title">Style</span>
          </TileTitle>
          <div role="radiogroup" aria-label="Template" className="grid grid-cols-3 gap-2">
            {CARD_TEMPLATES.map((t) => {
              const on = profile.card.template === t
              return (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => updateProfile((p) => ({ ...p, card: { ...p.card, template: t } }))}
                  className={`flex h-11 items-center justify-center gap-2 rounded-full text-[14px] transition ${on ? 'bg-ink text-canvas' : 'ring-1 ring-hairline-strong hover:bg-surface-2'}`}
                >
                  <span
                    aria-hidden="true"
                    className={`size-3.5 rounded-full ring-1 ring-hairline-strong ${SWATCH[t]}`}
                  />
                  {TEMPLATE_LABEL[t]}
                </button>
              )
            })}
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium">Tagline</span>
            <select
              value={profile.card.tagline}
              onChange={(event) => {
                const tagline = Number(event.target.value)
                updateProfile((p) => ({ ...p, card: { ...p.card, tagline } }))
              }}
              className="field field-select"
            >
              {TAGLINES.map((line, i) => (
                <option key={line} value={i}>
                  {line}
                </option>
              ))}
            </select>
          </label>
        </section>
      </div>

      <section aria-labelledby="avatars-title" className="tile">
        <TileTitle aside={`${unlocked.size} of ${AVATARS.length}`}>
          <span id="avatars-title">Avatars</span>
        </TileTitle>
        <div className="grid grid-cols-5 gap-x-2 gap-y-3">
          {AVATARS.map((a) => {
            const open = unlocked.has(a.id)
            const chosen = profile.avatar === a.id
            return (
              <button
                key={a.id}
                type="button"
                disabled={!open}
                onClick={() => updateProfile((p) => chooseAvatar(p, a.id))}
                aria-pressed={chosen}
                title={open ? a.name : `Locked: ${a.unlock?.how}`}
                className="group flex flex-col items-center gap-1.5 text-center disabled:cursor-not-allowed"
              >
                <span
                  className={`rounded-full p-0.5 transition ${chosen ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : 'group-enabled:group-hover:scale-105'}`}
                >
                  <Avatar id={a.id} size={52} locked={!open} />
                </span>
                <span
                  className={`text-[11px] leading-tight ${open ? 'font-medium text-ink-2' : 'text-muted'}`}
                >
                  {open ? a.name : a.unlock?.how}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="badges-title" className="tile">
        <TileTitle aside={`${profile.achievements.length} of ${ACHIEVEMENTS.length}`}>
          <span id="badges-title">Badges</span>
        </TileTitle>
        <ul className="grid grid-cols-5 gap-x-2 gap-y-3">
          {ACHIEVEMENTS.map((a) => {
            const got = profile.achievements.includes(a.id)
            return (
              <li
                key={a.id}
                title={`${a.title} (${TIER_LABEL[a.tier]}): ${a.how}`}
                className="flex flex-col items-center gap-1.5 text-center"
              >
                <Badge id={a.id} size={52} locked={!got} />
                <span
                  className={`text-[11px] leading-tight ${got ? 'font-medium text-ink-2' : 'text-muted'}`}
                >
                  {got ? a.title : a.how}
                </span>
              </li>
            )
          })}
        </ul>
        <p className="mt-auto text-[12.5px] text-muted">
          {stats.perfectQuizzes} perfect quizzes · best explain-back {stats.bestExplain}% ·{' '}
          {stats.streak}-day streak
        </p>
      </section>
    </div>
  )
}
