import { z } from 'zod'

import { lineIndex, type ParsedDiff } from './diff'

// A breakdown: what the agent did, the engineering behind it, and a short game about it.
// Model output passes groundBreakdown before anyone sees it: every reference must be a real line
// of the diff, and parts that point at nothing real are dropped.

export const CHANGE_KINDS = [
  'feature',
  'fix',
  'refactor',
  'performance',
  'test',
  'docs',
  'chore',
] as const
export const DIFFICULTIES = ['starter', 'intermediate', 'advanced'] as const

export type Step = { title: string; detail: string; refs: string[] }
export type Concept = {
  name: string
  oneLiner: string
  explain: string
  whyHere: string
  analogy: string
  refs: string[]
}
export type QuizItem = {
  question: string
  options: string[]
  answer: number
  why: string
  refs: string[]
}
export type KeyPoint = { point: string; keywords: string[] }

export type Breakdown = {
  title: string
  gist: string
  kind: (typeof CHANGE_KINDS)[number]
  difficulty: (typeof DIFFICULTIES)[number]
  steps: Step[]
  concepts: Concept[]
  quiz: QuizItem[]
  explainBack: { prompt: string; keyPoints: KeyPoint[] }
  explore: string[]
}

export const LIMITS = {
  title: 90,
  gist: 320,
  steps: 6,
  concepts: 4,
  quiz: 4,
  keyPoints: 5,
  refsPerItem: 8,
  text: 600,
  short: 160,
  explore: 4,
} as const

const refs = z.array(z.string())

/** What a model must return. Loose on purpose: grounding does the strict part. */
export const rawBreakdownSchema = z.object({
  title: z.string(),
  gist: z.string(),
  kind: z.string(),
  difficulty: z.string(),
  steps: z.array(z.object({ title: z.string(), detail: z.string(), refs })),
  concepts: z.array(
    z.object({
      name: z.string(),
      one_liner: z.string(),
      explain: z.string(),
      why_here: z.string(),
      analogy: z.string(),
      refs,
    }),
  ),
  quiz: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      answer: z.number().int(),
      why: z.string(),
      refs,
    }),
  ),
  explain_back: z.object({
    prompt: z.string(),
    key_points: z.array(z.object({ point: z.string(), keywords: z.array(z.string()) })),
  }),
  explore: z.array(z.string()),
})

export type RawBreakdown = z.infer<typeof rawBreakdownSchema>

const str = { type: 'string' } as const
const strs = { type: 'array', items: str } as const
const obj = (properties: Record<string, unknown>) => ({
  type: 'object',
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
})

/** The same shape as JSON Schema, for providers with strict structured output. */
export const RAW_BREAKDOWN_JSON_SCHEMA = obj({
  title: str,
  gist: str,
  kind: { type: 'string', enum: [...CHANGE_KINDS] },
  difficulty: { type: 'string', enum: [...DIFFICULTIES] },
  steps: { type: 'array', items: obj({ title: str, detail: str, refs: strs }) },
  concepts: {
    type: 'array',
    items: obj({
      name: str,
      one_liner: str,
      explain: str,
      why_here: str,
      analogy: str,
      refs: strs,
    }),
  },
  quiz: {
    type: 'array',
    items: obj({ question: str, options: strs, answer: { type: 'integer' }, why: str, refs: strs }),
  },
  explain_back: obj({
    prompt: str,
    key_points: { type: 'array', items: obj({ point: str, keywords: strs }) },
  }),
  explore: strs,
})

function clip(text: string | null | undefined, max: number): string {
  const value = (text ?? '').replace(/\s+/g, ' ').trim()
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`
}

function oneOf<T extends string>(values: readonly T[], value: string, fallback: T): T {
  return (values as readonly string[]).includes(value) ? (value as T) : fallback
}

export class UngroundedBreakdownError extends Error {
  override name = 'UngroundedBreakdownError'
}

export type GroundedBreakdown = { breakdown: Breakdown; dropped: number }

/**
 * Keeps only what points at real lines. Steps, concepts and questions need at least one valid
 * reference. Throws when nothing grounded is left, so an empty or invented breakdown never ships.
 */
export function groundBreakdown(diff: ParsedDiff, raw: RawBreakdown): GroundedBreakdown {
  const known = lineIndex(diff)
  let dropped = 0
  const keep = (list: string[]) => {
    const valid = [...new Set(list.map((r) => r.trim()))].filter((r) => known.has(r))
    dropped += list.length - valid.length
    return valid.slice(0, LIMITS.refsPerItem)
  }

  const steps: Step[] = []
  for (const step of raw.steps) {
    const valid = keep(step.refs)
    const title = clip(step.title, LIMITS.short)
    if (!valid.length || !title) continue
    steps.push({ title, detail: clip(step.detail, LIMITS.text), refs: valid })
    if (steps.length === LIMITS.steps) break
  }

  const concepts: Concept[] = []
  for (const concept of raw.concepts) {
    const valid = keep(concept.refs)
    const name = clip(concept.name, 60)
    if (!valid.length || !name) continue
    concepts.push({
      name,
      oneLiner: clip(concept.one_liner, LIMITS.short),
      explain: clip(concept.explain, LIMITS.text),
      whyHere: clip(concept.why_here, LIMITS.text),
      analogy: clip(concept.analogy, LIMITS.short * 2),
      refs: valid,
    })
    if (concepts.length === LIMITS.concepts) break
  }

  const quiz: QuizItem[] = []
  for (const item of raw.quiz) {
    const valid = keep(item.refs)
    const options = item.options.map((o) => clip(o, LIMITS.short)).filter(Boolean)
    const question = clip(item.question, LIMITS.short * 2)
    const answerOk = item.answer >= 0 && item.answer < options.length
    if (!valid.length || !question || options.length < 2 || options.length > 4 || !answerOk) {
      dropped += 1
      continue
    }
    quiz.push({
      question,
      options,
      answer: item.answer,
      why: clip(item.why, LIMITS.text),
      refs: valid,
    })
    if (quiz.length === LIMITS.quiz) break
  }

  const keyPoints = raw.explain_back.key_points
    .map((k) => ({
      point: clip(k.point, LIMITS.short),
      keywords: k.keywords.map((w) => clip(w, 40).toLowerCase()).filter((w) => w.length >= 2),
    }))
    .filter((k) => k.point && k.keywords.length)
    .slice(0, LIMITS.keyPoints)

  if (!steps.length || !concepts.length) {
    throw new UngroundedBreakdownError('Nothing in the breakdown pointed at real lines.')
  }

  return {
    breakdown: {
      title: clip(raw.title, LIMITS.title) || 'A change',
      gist: clip(raw.gist, LIMITS.gist),
      kind: oneOf(CHANGE_KINDS, raw.kind, 'feature'),
      difficulty: oneOf(DIFFICULTIES, raw.difficulty, 'intermediate'),
      steps,
      concepts,
      quiz,
      explainBack: {
        prompt:
          clip(raw.explain_back.prompt, LIMITS.short * 2) ||
          'Explain this change in your own words.',
        keyPoints,
      },
      explore: raw.explore
        .map((e) => clip(e, 80))
        .filter(Boolean)
        .slice(0, LIMITS.explore),
    },
    dropped,
  }
}

/** Every reference a breakdown uses, so a drill-down can show where a line is explained. */
export function sectionsForRef(breakdown: Breakdown, ref: string): string[] {
  return [
    ...breakdown.steps.filter((s) => s.refs.includes(ref)).map((s) => `Step: ${s.title}`),
    ...breakdown.concepts.filter((c) => c.refs.includes(ref)).map((c) => `Concept: ${c.name}`),
  ]
}
