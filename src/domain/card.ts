import { z } from 'zod'

import { ACHIEVEMENT_IDS, AVATARS, DEFAULT_AVATAR } from './game'
import { CARD_TEMPLATES, type CardTemplate } from './profile'

// The share card: fixed templates and taglines filled with the player's own numbers. Its data
// travels inside the share link itself, so a card needs no database and no image generation.

export const TAGLINES = [
  'SHIPPED IT? Now understand it.',
  "I don't just ship it. I understand it.",
  'My agent writes it. I break it down.',
  'Shipping at 10x. Understanding at 10x.',
  'Read the diff. Own the code.',
] as const

export type CardPalette = {
  background: string
  surface: string
  ink: string
  muted: string
  accent: string
  chip: string
}

export const PALETTES: Record<CardTemplate, CardPalette> = {
  paper: {
    background: '#fbf8f1',
    surface: '#ffffff',
    ink: '#141412',
    muted: '#6b675f',
    accent: '#c2410c',
    chip: '#f3efe6',
  },
  night: {
    background: '#0f0f0e',
    surface: '#1c1c1a',
    ink: '#f5f5f4',
    muted: '#a8a29e',
    accent: '#ff8a5c',
    chip: '#262624',
  },
  signal: {
    background: '#ff5a1f',
    surface: '#ff7a47',
    ink: '#141412',
    muted: '#3b1d10',
    accent: '#141412',
    chip: '#ff8f63',
  },
}

export type CardData = {
  name: string
  avatar: string
  xp: number
  breakdowns: number
  concepts: number
  streak: number
  achievements: string[]
  topConcepts: string[]
  template: CardTemplate
  tagline: number
}

const codeSchema = z.object({
  n: z.string().max(24),
  a: z.string().max(24),
  x: z.number().int().min(0).max(10_000_000),
  b: z.number().int().min(0).max(100_000),
  c: z.number().int().min(0).max(100_000),
  s: z.number().int().min(0).max(10_000),
  h: z.array(z.string().max(24)).max(20),
  t: z.array(z.string().max(32)).max(3),
  k: z.enum(CARD_TEMPLATES),
  g: z.number().int().min(0),
})

export const MAX_CODE_LENGTH = 900

function toBase64Url(text: string): string {
  let binary = ''
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(code: string): string {
  const binary = atob(code.replace(/-/g, '+').replace(/_/g, '/'))
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
}

export function encodeCard(card: CardData): string {
  return toBase64Url(
    JSON.stringify({
      n: card.name.slice(0, 24),
      a: card.avatar,
      x: card.xp,
      b: card.breakdowns,
      c: card.concepts,
      s: card.streak,
      h: card.achievements.filter((id) => ACHIEVEMENT_IDS.has(id)).slice(0, 20),
      t: card.topConcepts.map((c) => c.slice(0, 32)).slice(0, 3),
      k: card.template,
      g: card.tagline,
    }),
  )
}

/** Decodes a share link. Returns null for anything malformed; values are clamped to known ones. */
export function decodeCard(code: string): CardData | null {
  if (!code || code.length > MAX_CODE_LENGTH || !/^[\w-]+$/.test(code)) return null
  try {
    const parsed = codeSchema.safeParse(JSON.parse(fromBase64Url(code)))
    if (!parsed.success) return null
    const d = parsed.data
    return {
      name: d.n.trim() || 'A developer',
      avatar: AVATARS.some((a) => a.id === d.a) ? d.a : DEFAULT_AVATAR,
      xp: d.x,
      breakdowns: d.b,
      concepts: d.c,
      streak: d.s,
      achievements: d.h.filter((id) => ACHIEVEMENT_IDS.has(id)),
      topConcepts: d.t,
      template: d.k,
      tagline: d.g < TAGLINES.length ? d.g : 0,
    }
  } catch {
    return null
  }
}

export function taglineFor(index: number): string {
  return TAGLINES[index] ?? TAGLINES[0]
}

export const SITE_URL = 'https://wispr.jishanahmed.in'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function numbersLine(card: CardData): string {
  return [
    `${card.xp.toLocaleString('en-US')} XP`,
    plural(card.breakdowns, 'breakdown', 'breakdowns'),
    `${plural(card.concepts, 'concept', 'concepts')} unlocked`,
  ].join(', ')
}

/** X handles credited in every post: the tool it was built with, and who built it. */
export const WISPR_HANDLE = '@WisprFlow'
export const MAKER_HANDLE = '@jishanarshaikh'
export const HOST_HANDLE = '@WeMakeDevs'

/**
 * The X post. Numbers only, never code, repositories or GitHub names. It credits the maker, the
 * WeMakeDevs hackathon it was built for and Wispr Flow. The card link is added after a blank
 * line (X counts it as 23 characters) and unfurls into the card image.
 */
export function shareText(card: CardData, levelTitle: string): string {
  return [
    taglineFor(card.tagline),
    '',
    `I'm a ${levelTitle} on Breakdown: ${numbersLine(card)}.`,
    '',
    `Built by ${MAKER_HANDLE} at the ${HOST_HANDLE} hackathon. 100% hands-free with ${WISPR_HANDLE}.`,
    '',
    'Try it: wispr.jishanahmed.in',
  ].join('\n')
}
