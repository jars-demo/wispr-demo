import { markDataUri } from '@/components/logo-mark'
import { PALETTES, taglineFor, type CardData } from '@/domain/card'
import { ACHIEVEMENTS, avatarById, levelFor, type Tier } from '@/domain/game'

// The player card at 1200 by 630. Inline styles and flexbox only, so the exact same component
// renders on the page and as the share image (next/og). No AI, no image generation: a fixed
// template filled with the player's numbers and their drawn avatar.

export const CARD_SIZE = { width: 1200, height: 630 } as const

/** Where the art and fonts come from: files on the page, data and loaded fonts in next/og. */
export type CardAssets = { avatarSrc?: string; display?: string; sans?: string }

const METAL: Record<Tier, string> = {
  bronze: 'linear-gradient(135deg, #f3d2b3 0%, #b8794a 55%, #8f5a33 100%)',
  silver: 'linear-gradient(135deg, #f7f9fb 0%, #9ea7b3 55%, #7d8794 100%)',
  gold: 'linear-gradient(135deg, #fff1c2 0%, #d39b22 55%, #a8740e 100%)',
}
const TIER_ORDER: Record<Tier, number> = { gold: 0, silver: 1, bronze: 2 }

function Stat({ value, label, color, muted, display }: Record<string, string>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontFamily: display, fontSize: 84, lineHeight: 0.9, color }}>{value}</span>
      <span style={{ fontSize: 19, letterSpacing: 2.4, textTransform: 'uppercase', color: muted }}>
        {label}
      </span>
    </div>
  )
}

export function CardArt({ card, assets = {} }: { card: CardData; assets?: CardAssets }) {
  const p = PALETTES[card.template]
  const avatar = avatarById(card.avatar)
  const level = levelFor(card.xp)
  const display = assets.display ?? 'var(--font-display)'
  const sans = assets.sans ?? 'var(--font-sans)'
  const earned = ACHIEVEMENTS.filter((a) => card.achievements.includes(a.id)).sort(
    (a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier],
  )
  const shown = earned.slice(0, 3)
  const tagline = taglineFor(card.tagline)
  const split = /^(.*?\?)\s(.*)$/.exec(tagline)

  return (
    <div
      style={{
        width: CARD_SIZE.width,
        height: CARD_SIZE.height,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '52px 60px',
        background: p.background,
        color: p.ink,
        fontFamily: sans,
      }}
    >
      {/* Masthead */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- also rendered by next/og */}
          <img src={markDataUri()} alt="" width={44} height={44} />
          <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.8 }}>Breakdown</span>
        </div>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, color: p.muted }}
        >
          <span>Built with Wispr Flow</span>
          <span style={{ width: 5, height: 5, borderRadius: 9, background: p.muted }} />
          <span>wispr.jishanahmed.in</span>
        </div>
      </div>

      {/* Player */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 52 }}>
        <div
          style={{
            display: 'flex',
            width: 212,
            height: 212,
            flexShrink: 0,
            borderRadius: 999,
            background: avatar.tone,
            border: `6px solid ${p.surface}`,
            boxShadow: '0 18px 40px rgba(0,0,0,0.12)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- also rendered by next/og */}
          <img
            src={assets.avatarSrc ?? `/avatars/${avatar.id}.svg`}
            alt=""
            width={200}
            height={200}
            style={{ borderRadius: 999 }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 58, fontWeight: 700, letterSpacing: -1.6, lineHeight: 1 }}>
              {card.name}
            </span>
            <span style={{ fontSize: 26, fontWeight: 600, color: p.accent }}>
              Level {level.level} · {level.title}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 56 }}>
            <Stat
              value={card.xp.toLocaleString('en-US')}
              label="XP"
              color={p.ink}
              muted={p.muted}
              display={display}
            />
            <Stat
              value={String(card.breakdowns)}
              label={card.breakdowns === 1 ? 'Change' : 'Changes'}
              color={p.ink}
              muted={p.muted}
              display={display}
            />
            <Stat
              value={String(card.concepts)}
              label="Concepts"
              color={p.ink}
              muted={p.muted}
              display={display}
            />
            {card.streak > 1 ? (
              <Stat
                value={String(card.streak)}
                label="Day streak"
                color={p.ink}
                muted={p.muted}
                display={display}
              />
            ) : null}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {shown.map((a) => (
              <span
                key={a.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '7px 15px 7px 8px',
                  borderRadius: 999,
                  background: p.surface,
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 99,
                    backgroundImage: METAL[a.tier],
                  }}
                />
                {a.title}
              </span>
            ))}
            {earned.length > shown.length ? (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '7px 14px',
                  borderRadius: 999,
                  background: p.surface,
                  fontSize: 18,
                  color: p.muted,
                }}
              >
                +{earned.length - shown.length}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Footer: the tagline */}
      <div
        style={{
          display: 'flex',
          paddingTop: 26,
          borderTop: `2px solid ${p.chip}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 52,
            lineHeight: 1,
            letterSpacing: -0.6,
            whiteSpace: 'nowrap',
          }}
        >
          {split ? (
            <>
              <span style={{ fontWeight: 700, letterSpacing: -1.4 }}>{split[1]}</span>
              <span
                style={{
                  fontFamily: display,
                  fontStyle: 'italic',
                  color: p.accent,
                  marginLeft: 14,
                }}
              >
                {split[2]}
              </span>
            </>
          ) : (
            <span style={{ fontFamily: display, fontStyle: 'italic' }}>{tagline}</span>
          )}
        </div>
      </div>
    </div>
  )
}
