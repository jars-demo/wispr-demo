import { PALETTES, taglineFor, type CardData } from '@/domain/card'
import { ACHIEVEMENTS, avatarById, levelFor } from '@/domain/game'

// The player card at 1200 by 630. Inline styles and flexbox only, so the exact same component
// renders on the page and as the share image (next/og). No AI, no image generation: a fixed
// template filled with the player's numbers.

export const CARD_SIZE = { width: 1200, height: 630 } as const

function Stat({
  value,
  label,
  ink,
  muted,
  surface,
}: {
  value: string
  label: string
  ink: string
  muted: string
  surface: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '18px 22px',
        borderRadius: 24,
        background: surface,
        minWidth: 170,
      }}
    >
      <span style={{ fontSize: 44, fontWeight: 700, color: ink, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 20, color: muted, marginTop: 8 }}>{label}</span>
    </div>
  )
}

export function CardArt({ card }: { card: CardData }) {
  const p = PALETTES[card.template]
  const avatar = avatarById(card.avatar)
  const level = levelFor(card.xp)
  const badges = ACHIEVEMENTS.filter((a) => card.achievements.includes(a.id)).slice(0, 8)

  return (
    <div
      style={{
        width: CARD_SIZE.width,
        height: CARD_SIZE.height,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 56,
        background: p.background,
        color: p.ink,
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              display: 'flex',
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#141412',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 9,
                top: 9,
                width: 12,
                height: 12,
                background: '#fbf8f1',
                borderRadius: 2,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 24,
                top: 9,
                width: 11,
                height: 12,
                background: '#fbf8f1',
                borderRadius: 2,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 9,
                top: 24,
                width: 12,
                height: 11,
                background: '#fbf8f1',
                borderRadius: 2,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 26,
                top: 26,
                width: 11,
                height: 11,
                background: '#ff5a1f',
                borderRadius: 2,
              }}
            />
          </div>
          <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>Breakdown</span>
        </div>
        <span style={{ fontSize: 22, color: p.muted }}>wispr.jishanahmed.in</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 210,
            height: 210,
            borderRadius: 999,
            backgroundImage: `linear-gradient(140deg, ${avatar.colors[0]}, ${avatar.colors[1]})`,
            fontSize: 120,
            flexShrink: 0,
          }}
        >
          {avatar.emoji}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 52, fontWeight: 700, letterSpacing: -1, lineHeight: 1.05 }}>
            {card.name}
          </span>
          <span style={{ fontSize: 28, color: p.accent, fontWeight: 600 }}>
            Level {level.level} · {level.title}
          </span>
          <div style={{ display: 'flex', gap: 14, marginTop: 14 }}>
            <Stat
              value={card.xp.toLocaleString('en-US')}
              label="XP"
              ink={p.ink}
              muted={p.muted}
              surface={p.surface}
            />
            <Stat
              value={String(card.breakdowns)}
              label="Changes broken down"
              ink={p.ink}
              muted={p.muted}
              surface={p.surface}
            />
            <Stat
              value={String(card.concepts)}
              label="Concepts"
              ink={p.ink}
              muted={p.muted}
              surface={p.surface}
            />
            {card.streak > 1 ? (
              <Stat
                value={`${card.streak}🔥`}
                label="Day streak"
                ink={p.ink}
                muted={p.muted}
                surface={p.surface}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {badges.map((a) => (
            <span
              key={a.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 999,
                background: p.chip,
                fontSize: 20,
              }}
            >
              {a.emoji} {a.title}
            </span>
          ))}
          {card.topConcepts.map((c) => (
            <span
              key={c}
              style={{
                display: 'flex',
                padding: '6px 14px',
                borderRadius: 999,
                border: `2px solid ${p.chip}`,
                fontSize: 20,
                color: p.muted,
              }}
            >
              {c}
            </span>
          ))}
        </div>
        <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: -0.8 }}>
          {taglineFor(card.tagline)}
        </span>
      </div>
    </div>
  )
}
