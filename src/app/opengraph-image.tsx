import { ImageResponse } from 'next/og'

import { markDataUri } from '@/components/logo-mark'
import { AVATARS } from '@/domain/game'
import { AVATAR_ART } from '@/features/card/avatar-art'
import { loadOgFonts } from '@/features/card/og-fonts'

// The share image for the site itself, so a bare wispr.jishanahmed.in link unfurls on X: the
// tagline, the cast of avatars, and who built it with what.

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Breakdown: SHIPPED IT? Now understand it.'

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '56px 64px',
        background: '#fbf8f1',
        color: '#141412',
        fontFamily: 'Geist',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- rendered by next/og */}
        <img src={markDataUri()} alt="" width={52} height={52} />
        <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: -1 }}>Breakdown</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 96, lineHeight: 0.98 }}>
          <span style={{ fontWeight: 700, letterSpacing: -3.5 }}>SHIPPED IT?</span>
          <span
            style={{
              fontFamily: 'Instrument Serif',
              fontStyle: 'italic',
              color: '#c2410c',
              fontSize: 112,
              letterSpacing: -1.5,
            }}
          >
            Now understand it.
          </span>
        </div>
        <span style={{ fontSize: 28, color: '#4a4740', maxWidth: 1000, lineHeight: 1.35 }}>
          Turn what your coding agent ships into a 3 minute game. Free, no sign-up.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex' }}>
          {AVATARS.slice(0, 7).map((a, i) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                width: 76,
                height: 76,
                marginLeft: i ? -16 : 0,
                borderRadius: 99,
                background: a.tone,
                border: '4px solid #fbf8f1',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- rendered by next/og */}
              <img
                src={AVATAR_ART[a.id]}
                alt=""
                width={68}
                height={68}
                style={{ borderRadius: 99 }}
              />
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 4,
            fontSize: 22,
            color: '#6b675f',
          }}
        >
          <span>Built by @jishanarshaikh with @WisprFlow</span>
          <span style={{ color: '#141412', fontWeight: 600 }}>wispr.jishanahmed.in</span>
        </div>
      </div>
    </div>,
    { ...size, fonts: [...(await loadOgFonts())] },
  )
}
