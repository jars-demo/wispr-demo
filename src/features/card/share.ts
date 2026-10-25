import { encodeCard, SITE_URL, type CardData } from '@/domain/card'
import { streakFrom } from '@/domain/game'
import type { Profile } from '@/domain/profile'

// Turns a profile into the card that gets shared, and the links that share it.

export function cardFromProfile(profile: Profile, today: string): CardData {
  return {
    name: profile.name || 'You',
    avatar: profile.avatar,
    xp: profile.xp,
    breakdowns: profile.runs.length,
    concepts: profile.concepts.length,
    streak: streakFrom(profile.days, today),
    achievements: profile.achievements,
    topConcepts: profile.concepts.slice(-3).reverse(),
    template: profile.card.template,
    tagline: profile.card.tagline,
  }
}

export function cardUrl(card: CardData, origin = SITE_URL): string {
  return `${origin}/card/${encodeCard(card)}`
}

export function xShareUrl(text: string, url: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
}

export function linkedInShareUrl(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
}
