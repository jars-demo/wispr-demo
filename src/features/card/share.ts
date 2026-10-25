import { encodeCard, SITE_URL, type CardData } from '@/domain/card'
import { streakFrom } from '@/domain/game'
import type { Profile } from '@/domain/profile'

// Turns a profile into the card that gets shared, and the X link that shares it.

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

/** Always the public site, even when running locally, so shared links never point at localhost. */
export function cardUrl(card: CardData): string {
  return `${SITE_URL}/card/${encodeCard(card)}`
}

/** The card link goes inside the text, after a blank line; X's url parameter would glue it on. */
export function xShareUrl(text: string, url: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(`${text}\n\n${url}`)}`
}
