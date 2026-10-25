'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { ArrowRight, Brain } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { Avatar } from '@/components/Avatar'
import { Badge, TIER_LABEL } from '@/components/Badge'
import { buttonStyles } from '@/components/ui/button-styles'
import { achievementById, avatarById, levelFor, XP } from '@/domain/game'
import type { RunOutcome } from '@/domain/profile'
import { CardModal } from '@/features/card/CardModal'
import { cardFromProfile } from '@/features/card/share'
import { Confetti } from '@/features/fx/Confetti'
import { NameClaim } from '@/features/game/NameClaim'
import { ShareDialog } from '@/features/shared/ShareDialog'
import { ShareToggle } from '@/features/shared/ShareToggle'
import { useShare } from '@/features/shared/useShare'

// Round 5: the score. XP counts up, the level bar fills, and every unlock gets its moment.

function prefersLessMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function useCountUp(target: number, ms = 1100): number {
  const [value, setValue] = useState(() => (prefersLessMotion() ? target : 0))
  useEffect(() => {
    if (prefersLessMotion()) return
    const start = performance.now()
    let frame = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / ms)
      setValue(Math.round(target * (1 - (1 - p) ** 3)))
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, ms])
  return value
}

/** One unlock, springing in after the ones before it. */
function Unlock({
  i,
  art,
  children,
}: {
  i: number
  art: React.ReactNode
  children: React.ReactNode
}) {
  const reduce = useReducedMotion()
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.5 + i * 0.18 }}
      className="flex items-center gap-3 rounded-card bg-surface px-2.5 py-2 text-[14px] ring-1 ring-hairline"
    >
      {art}
      <span className="min-w-0">{children}</span>
    </motion.li>
  )
}

function LevelMark({ level }: { level: number }) {
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink font-display text-2xl text-canvas">
      {level}
    </span>
  )
}

export function Results({
  outcome,
  correct,
  total,
  explain,
  explore,
  skippedFiles,
  saved,
  share,
  onDrill,
}: {
  outcome: RunOutcome
  correct: number
  total: number
  explain: number | null
  explore: string[]
  skippedFiles: string[]
  saved: boolean
  /** The public link this breakdown came from, when it can be shared. */
  share: { url: string; only: string | null } | null
  onDrill: ((path: string) => void) | null
}) {
  const gained = useCountUp(outcome.gained)
  const xp = outcome.profile.xp
  const level = levelFor(xp)
  const span = level.next ? level.next - level.floor : 1
  const progress = level.next ? Math.min(100, ((xp - level.floor) / span) * 100) : 100
  const [bar, setBar] = useState(0)
  useEffect(() => {
    const id = window.setTimeout(() => setBar(progress), 300)
    return () => window.clearTimeout(id)
  }, [progress])

  // Once the score has landed, a public change first asks to be shared, then the card pops up
  // with "Post on X" right in it. Anything else goes straight to the card.
  const sharing = useShare(share?.url ?? '', share?.only ?? null)
  const [popup, setPopup] = useState<'share' | 'card' | null>(null)
  const asksToShare = share !== null
  useEffect(() => {
    const id = window.setTimeout(() => setPopup(asksToShare ? 'share' : 'card'), 1400)
    return () => window.clearTimeout(id)
  }, [asksToShare])
  const card = cardFromProfile(outcome.profile, new Date().toISOString().slice(0, 10))

  const perfect = total > 0 && correct === total
  const celebrate = perfect || outcome.levelUp !== null || outcome.newAchievements.length > 0
  const replay =
    outcome.gained > 0 &&
    outcome.profile.runs.filter((r) => r.key === outcome.profile.runs[0]?.key).length > 1

  const lines = [
    { label: `${correct} of ${total} predictions right`, xp: correct * XP.correct },
    {
      label: explain === null ? 'Explain it back skipped' : `Explained it back: ${explain}%`,
      xp: Math.round((explain ?? 0) * XP.explainPerPoint),
    },
    { label: 'Finished the breakdown', xp: XP.finish },
    {
      label: `${outcome.newConcepts.length} new ${outcome.newConcepts.length === 1 ? 'concept' : 'concepts'}`,
      xp: outcome.newConcepts.length * XP.newConcept,
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      {celebrate ? <Confetti seed={xp} /> : null}
      {share ? (
        <ShareDialog
          state={sharing}
          open={popup === 'share'}
          onClose={() => setPopup((p) => (p === 'share' ? 'card' : p))}
        />
      ) : null}
      <CardModal
        card={card}
        open={popup === 'card'}
        onClose={() => setPopup((p) => (p === 'card' ? null : p))}
      />
      <div className="glass-strong flex flex-col items-center gap-3 rounded-panel px-5 py-8 text-center sm:py-10">
        <p className="text-[13px] font-medium tracking-[0.16em] text-muted uppercase">
          {perfect ? 'Perfect round' : 'Breakdown complete'}
        </p>
        <p className="font-display text-7xl leading-none tracking-tight text-accent-text tabular-nums sm:text-8xl">
          +{gained} XP
        </p>
        {replay ? (
          <p className="text-[13px] text-muted">Replays earn a quarter of the XP.</p>
        ) : null}
        <div className="mt-2 flex w-full max-w-md flex-col gap-1.5">
          <div className="flex justify-between text-[13px]">
            <span className="font-medium">
              Level {level.level} · {level.title}
            </span>
            <span className="text-muted tabular-nums">
              {xp.toLocaleString('en-US')}
              {level.next ? ` / ${level.next.toLocaleString('en-US')}` : ''} XP
            </span>
          </div>
          <div
            className="h-3 overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progress to next level"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-out"
              style={{ width: `${bar}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass flex flex-col gap-2 rounded-panel p-5">
          <h3 className="text-[15px] font-semibold">Where the XP came from</h3>
          <ul className="flex flex-col gap-1.5 text-[14px]">
            {lines.map((line) => (
              <li key={line.label} className="flex justify-between gap-3">
                <span className="text-ink-2">{line.label}</span>
                <span className="font-medium tabular-nums">+{line.xp}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass flex flex-col gap-3 rounded-panel p-5">
          <h3 className="text-[15px] font-semibold">Unlocked</h3>
          <ul className="flex flex-col gap-2">
            {outcome.levelUp ? (
              <Unlock i={0} art={<LevelMark level={outcome.levelUp.to} />}>
                <span className="font-medium">Level {outcome.levelUp.to}</span> · {level.title}
              </Unlock>
            ) : null}
            {outcome.newAchievements.map((id, i) => {
              const a = achievementById(id)
              return a ? (
                <Unlock key={id} i={i + 1} art={<Badge id={id} size={44} />}>
                  <span className="font-medium">{a.title}</span>
                  <span className="text-muted"> · {TIER_LABEL[a.tier]} badge</span>
                </Unlock>
              ) : null
            })}
            {outcome.newAvatars.map((id, i) => (
              <Unlock
                key={id}
                i={i + 1 + outcome.newAchievements.length}
                art={<Avatar id={id} size={44} />}
              >
                <span className="font-medium">{avatarById(id).name}</span>
                <span className="text-muted"> · new avatar</span>
              </Unlock>
            ))}
          </ul>
          {outcome.newConcepts.length ? (
            <div className="flex flex-wrap gap-1.5">
              {outcome.newConcepts.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[13px] ring-1 ring-hairline"
                >
                  <Brain aria-hidden="true" className="size-3.5 text-accent-text" />
                  {c}
                </span>
              ))}
            </div>
          ) : null}
          {!outcome.levelUp &&
          !outcome.newAchievements.length &&
          !outcome.newAvatars.length &&
          !outcome.newConcepts.length ? (
            <p className="text-[14px] text-muted">Nothing new this time. Try a harder change.</p>
          ) : null}
        </div>
      </div>

      {!saved ? (
        <div id="save" className="glass rounded-panel p-5">
          <h3 className="text-[15px] font-semibold">Keep this progress and get on the board</h3>
          <p className="mb-3 text-[14px] text-ink-2">Just a name. No sign-up, no email.</p>
          <NameClaim id="results-name" />
        </div>
      ) : null}

      {share ? <ShareToggle state={sharing} /> : null}

      {skippedFiles.length && onDrill ? (
        <div className="glass flex flex-col gap-2 rounded-panel p-5">
          <h3 className="text-[15px] font-semibold">
            Big change: {skippedFiles.length} more {skippedFiles.length === 1 ? 'part' : 'parts'} to
            go
          </h3>
          <p className="text-[14px] text-ink-2">
            This round covered the most important part. Carry on with the next one, or pick any
            file.
          </p>
          <button
            type="button"
            onClick={() => onDrill(skippedFiles[0] ?? '')}
            className={`${buttonStyles('accent', 'field')} self-start`}
          >
            Continue with the next part
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
          <ul className="flex flex-col gap-1">
            {skippedFiles.slice(0, 12).map((path) => (
              <li key={path} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="truncate font-mono">{path}</span>
                <button
                  type="button"
                  onClick={() => onDrill(path)}
                  className="shrink-0 font-medium text-accent-text hover:underline"
                >
                  Break down
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {explore.length ? (
        <div className="flex flex-wrap items-center gap-2 text-[14px]">
          <span className="text-muted">Explore next:</span>
          {explore.map((topic) => (
            <span key={topic} className="rounded-full bg-surface px-3 py-1 ring-1 ring-hairline">
              {topic}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPopup('card')}
          className={buttonStyles('accent', 'lg')}
        >
          Share my card
        </button>
        <Link href="/" className={buttonStyles('secondary', 'lg')}>
          Next change
        </Link>
      </div>
    </div>
  )
}
