import { LIMITS, type SpecItemInput } from './spec'

// Deterministic structuring: turns a spoken request into a receipt without any model.
// It never invents content: every item is a cleaned-up clause the user actually said, and its
// sourceQuote is an exact substring of the transcript.

export type RulesResult = { title: string; items: SpecItemInput[] }

const SENTENCE_SPLIT = /(?<=[.!?])\s+|\n+/
const CLAUSE_SPLIT = /;\s*|,?\s+\b(?:and also|also|plus|and then)\b\s+/i

const NON_GOAL =
  /\b(?:don'?t|do not|never|avoid|no need to|shouldn'?t|should not|must not|without (?:touching|changing)|leave\b.{1,40}\balone|keep\b.{1,40}\b(?:as is|unchanged))\b/i
const HEDGE =
  /\b(?:maybe|might|perhaps|possibly|probably|not sure|i think|i guess|if possible|or not)\b/i

const LEADING_FILLER =
  /^(?:(?:and|so|then|also|okay|ok|um+|uh+|like|please|well|right|now|basically|actually)\b[\s,]*)+/i
const LEADING_ASK =
  /^(?:i (?:want|need|would like) (?:you )?to|i want|can you|could you|we need to|you should|make sure(?: that)?|let'?s)\s+/i
const FILLER_ONLY =
  /^(?:ok(?:ay)?|thanks?(?: you)?|(?:that'?s|that is) (?:it|all)|cool|great|done|yes|no)[.!]?$/i

function splitClauses(transcript: string): string[] {
  return transcript
    .split(SENTENCE_SPLIT)
    .flatMap((sentence) => sentence.split(CLAUSE_SPLIT))
    .map((clause) => clause.trim())
    .filter((clause) => clause.length > 0)
}

function clean(clause: string): string {
  let text = clause.replace(LEADING_FILLER, '').replace(LEADING_ASK, '').trim()
  text = text.replace(/[\s,;:]+$/, '')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function withEnding(text: string, ending: '.' | '?'): string {
  const bare = text.replace(/[.!?]+$/, '')
  return `${bare}${ending}`
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 1))}…`
}

const TITLE_WORDS = 10

function titleFrom(items: readonly SpecItemInput[]): string {
  const first = items.find((item) => item.kind === 'requirement')
  if (!first) return 'Untitled receipt'
  const sentence = first.text.replace(/[.!?]+$/, '')
  // Prefer the first clause ("Add rate limiting to the login route, five per minute").
  const clause = sentence.split(/[,;:]\s+|\s+-\s+/)[0] ?? sentence
  const words = (clause.split(/\s+/).length >= 2 ? clause : sentence).split(/\s+/)
  const short = words.slice(0, TITLE_WORDS).join(' ')
  return clip(words.length > TITLE_WORDS ? `${short}…` : short, 60)
}

function classify(clause: string): SpecItemInput | null {
  const sourceQuote = clip(clause, LIMITS.sourceQuote)
  if (FILLER_ONLY.test(clause)) return null

  if (NON_GOAL.test(clause)) {
    const text = clean(clause)
    if (wordCount(text) < 2) return null
    return { kind: 'non_goal', text: clip(withEnding(text, '.'), LIMITS.itemText), sourceQuote }
  }

  const hedge = HEDGE.exec(clause)?.[0]
  if (hedge || clause.endsWith('?')) {
    const text = clean(clause.replace(HEDGE, ' ').replace(/\s{2,}/g, ' '))
    if (wordCount(text) < 2) return null
    const note = hedge
      ? `You said "${hedge.toLowerCase()}", so this was not made a requirement.`
      : 'You asked this as a question.'
    return {
      kind: 'open_question',
      text: clip(withEnding(text, '?'), LIMITS.itemText),
      sourceQuote,
      note,
    }
  }

  const text = clean(clause)
  if (wordCount(text) < 2) return null
  return { kind: 'requirement', text: clip(withEnding(text, '.'), LIMITS.itemText), sourceQuote }
}

export function structureWithRules(transcript: string): RulesResult {
  const items = splitClauses(transcript)
    .map(classify)
    .filter((item): item is SpecItemInput => item !== null)
    .slice(0, LIMITS.items)
  return { title: titleFrom(items), items }
}
