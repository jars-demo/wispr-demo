import { z } from 'zod'

// A spec is what the user asked for, as a short checklist. Codes (R1, N1, Q1) are derived from
// order and kind on the server, never trusted from the client.

export const SPEC_ITEM_KINDS = ['requirement', 'non_goal', 'open_question'] as const
export type SpecItemKind = (typeof SPEC_ITEM_KINDS)[number]

export const SPEC_ITEM_COPY: Record<SpecItemKind, { group: string; prefix: string }> = {
  requirement: { group: 'What you asked for', prefix: 'R' },
  non_goal: { group: 'Leave alone', prefix: 'N' },
  open_question: { group: 'Needs your answer', prefix: 'Q' },
}

export const STRUCTURING_ENGINES = ['rules', 'model'] as const
export type StructuringEngine = (typeof STRUCTURING_ENGINES)[number]

export const LIMITS = {
  transcript: 8000,
  title: 120,
  itemText: 500,
  acceptance: 300,
  sourceQuote: 500,
  note: 200,
  items: 50,
} as const

const trimmed = (max: number) => z.string().trim().min(1).max(max)
const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === '' ? undefined : value))
    .optional()

export const specItemInputSchema = z.object({
  kind: z.enum(SPEC_ITEM_KINDS),
  text: trimmed(LIMITS.itemText),
  acceptance: optionalTrimmed(LIMITS.acceptance),
  /** The exact words from the transcript this item came from, when there are any. */
  sourceQuote: optionalTrimmed(LIMITS.sourceQuote),
  /** Why the item is what it is, e.g. why something became a question. */
  note: optionalTrimmed(LIMITS.note),
})

export type SpecItemInput = z.infer<typeof specItemInputSchema>

export const specDraftSchema = z.object({
  title: trimmed(LIMITS.title),
  transcript: z.string().max(LIMITS.transcript).default(''),
  engine: z.enum(STRUCTURING_ENGINES),
  items: z
    .array(specItemInputSchema)
    .min(1, 'needs at least one item')
    .max(LIMITS.items)
    .refine((items) => items.some((item) => item.kind === 'requirement'), {
      message: 'needs at least one requirement',
    }),
})

export type SpecDraft = z.infer<typeof specDraftSchema>

export const transcriptSchema = z.object({
  transcript: trimmed(LIMITS.transcript),
})

export type SpecItem = SpecItemInput & { code: string; position: number }

/** Numbers items per kind in their given order: R1, R2, N1, Q1 and so on. */
export function assignCodes(items: readonly SpecItemInput[]): SpecItem[] {
  const counters: Record<SpecItemKind, number> = { requirement: 0, non_goal: 0, open_question: 0 }
  return items.map((item, position) => {
    counters[item.kind] += 1
    return { ...item, position, code: `${SPEC_ITEM_COPY[item.kind].prefix}${counters[item.kind]}` }
  })
}

export function groupByKind(items: readonly SpecItem[]): Record<SpecItemKind, SpecItem[]> {
  return {
    requirement: items.filter((item) => item.kind === 'requirement'),
    non_goal: items.filter((item) => item.kind === 'non_goal'),
    open_question: items.filter((item) => item.kind === 'open_question'),
  }
}
