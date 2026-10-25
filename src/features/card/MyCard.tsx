'use client'

import { useState } from 'react'

import { Avatar } from '@/components/Avatar'
import { buttonStyles } from '@/components/ui/button-styles'
import { shareText, TAGLINES } from '@/domain/card'
import { ACHIEVEMENTS, AVATARS, levelFor, unlockedAvatars } from '@/domain/game'
import { boardStats, chooseAvatar, cleanName, CARD_TEMPLATES, statsOf } from '@/domain/profile'
import { toast } from '@/features/fx/toasts'
import { profileStore, updateProfile } from '@/features/game/store'
import { useHydrated } from '@/lib/local-store'

import { ScaledCard } from './ScaledCard'
import { cardFromProfile, cardUrl, linkedInShareUrl, xShareUrl } from './share'

// Your card: pick an avatar, a template and a tagline, then post it.

const TEMPLATE_LABEL = { paper: 'Paper', night: 'Night', signal: 'Signal' } as const
const SWATCH = { paper: 'bg-[#fbf8f1]', night: 'bg-[#0f0f0e]', signal: 'bg-[#ff5a1f]' } as const

async function copy(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast({ tone: 'info', icon: '📋', title: done })
  } catch {
    toast({
      tone: 'error',
      icon: '⚠️',
      title: 'Copy failed',
      body: 'Your browser blocked the clipboard.',
    })
  }
}

export function MyCard() {
  const hydrated = useHydrated()
  const profile = profileStore.use()
  const [name, setName] = useState<string | null>(null)

  if (!hydrated)
    return <div className="glass aspect-[1200/630] w-full animate-pulse rounded-panel" />

  const today = new Date().toISOString().slice(0, 10)
  const card = cardFromProfile(profile, today)
  const level = levelFor(profile.xp)
  const url = cardUrl(card, window.location.origin)
  const text = shareText(card, level.title)
  const unlocked = new Set(unlockedAvatars(boardStats(profile)))
  const stats = statsOf(profile, today)

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-4">
          <ScaledCard card={card} label={`Your card: level ${level.level}, ${profile.xp} XP`} />
          <div className="flex flex-wrap gap-2">
            <a
              href={xShareUrl(text, url)}
              target="_blank"
              rel="noreferrer"
              className={buttonStyles('primary', 'lg')}
            >
              Post on X
            </a>
            <button
              type="button"
              onClick={() => {
                void copy(`${text}\n\n${url}`, 'Post text copied. Paste it into LinkedIn.')
                window.open(linkedInShareUrl(url), '_blank', 'noopener')
              }}
              className={buttonStyles('primary', 'lg')}
            >
              Post on LinkedIn
            </button>
            <button
              type="button"
              onClick={() => void copy(url, 'Card link copied')}
              className={buttonStyles('secondary', 'lg')}
            >
              Copy link
            </button>
            <a
              href={`${new URL(url).pathname}/opengraph-image`}
              download="breakdown-card.png"
              className={buttonStyles('ghost', 'lg')}
            >
              Download image
            </a>
          </div>
          <p className="text-[12px] text-muted">
            The link carries your card&apos;s numbers, so it works for anyone with no account. It
            never includes code, repositories or your GitHub name.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="card-name" className="text-[13px] font-medium">
              Name on your card
            </label>
            <input
              id="card-name"
              value={name ?? profile.name}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => {
                if (name !== null) updateProfile((p) => ({ ...p, name: cleanName(name) }))
              }}
              maxLength={24}
              placeholder="Your name or handle"
              className="h-11 rounded-full border border-hairline-strong bg-surface px-4 text-[15px]"
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[13px] font-medium">
              Avatar · {unlocked.size} of {AVATARS.length} unlocked
            </legend>
            <div className="grid grid-cols-5 gap-2">
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
                    className={`flex flex-col items-center gap-1 rounded-card p-1.5 text-[10px] leading-tight transition-all ${chosen ? 'bg-accent-wash ring-2 ring-accent' : 'hover:bg-surface-2'} disabled:cursor-not-allowed`}
                  >
                    <Avatar id={a.id} size={44} locked={!open} />
                    <span className={open ? 'text-ink-2' : 'text-muted'}>
                      {open ? a.name : a.unlock?.how}
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[13px] font-medium">Template</legend>
            <div className="flex gap-2">
              {CARD_TEMPLATES.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={profile.card.template === t}
                  onClick={() => updateProfile((p) => ({ ...p, card: { ...p.card, template: t } }))}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] ring-1 ${profile.card.template === t ? 'ring-2 ring-accent' : 'ring-hairline'}`}
                >
                  <span
                    className={`size-4 rounded-full ring-1 ring-hairline-strong ${SWATCH[t]}`}
                    aria-hidden="true"
                  />
                  {TEMPLATE_LABEL[t]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-2 text-[13px] font-medium">Tagline</legend>
            {TAGLINES.map((line, i) => (
              <label
                key={line}
                className="flex cursor-pointer items-center gap-2 rounded-full px-2 py-1 text-[14px] hover:bg-surface-2"
              >
                <input
                  type="radio"
                  name="tagline"
                  checked={profile.card.tagline === i}
                  onChange={() => updateProfile((p) => ({ ...p, card: { ...p.card, tagline: i } }))}
                  className="accent-[var(--accent)]"
                />
                {line}
              </label>
            ))}
          </fieldset>
        </div>
      </div>

      <section aria-labelledby="ach-title" className="flex flex-col gap-3">
        <h2 id="ach-title" className="font-display text-3xl tracking-tight">
          Achievements · {profile.achievements.length}/{ACHIEVEMENTS.length}
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {ACHIEVEMENTS.map((a) => {
            const got = profile.achievements.includes(a.id)
            return (
              <li
                key={a.id}
                className={`flex flex-col gap-1 rounded-card p-3 ring-1 ${got ? 'bg-accent-wash ring-accent/30' : 'bg-surface/60 ring-hairline'}`}
              >
                <span
                  className={`text-2xl ${got ? '' : 'opacity-40 grayscale'}`}
                  aria-hidden="true"
                >
                  {a.emoji}
                </span>
                <span className="text-[14px] font-semibold">{a.title}</span>
                <span className="text-[12px] text-muted">{got ? 'Unlocked' : a.how}</span>
              </li>
            )
          })}
        </ul>
        <p className="text-[13px] text-muted">
          {stats.breakdowns} breakdowns · {stats.perfectQuizzes} perfect quizzes · best explain-back{' '}
          {stats.bestExplain}% · {stats.streak}-day streak
        </p>
      </section>
    </div>
  )
}
