import { LIMITS, SPEC_ITEM_KINDS, type SpecItemInput } from '@/domain/spec'

import type { ModelStructureOutput } from './types'

// Turns raw model output into checklist items, keeping only items whose quote really appears in
// what the user said. Pure, so the "never invent" rule is unit tested without any network.

export type RawModelItem = {
  kind: string
  text: string
  acceptance: string | null
  source_quote: string
  note: string | null
}

export type RawModelOutput = { title: string; items: RawModelItem[] }

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\p{L}\p{N}'"]+/gu, ' ')
    .trim()
}

function clip(text: string | null | undefined, max: number): string | undefined {
  const value = text?.trim()
  if (!value) return undefined
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`
}

function isKind(kind: string): kind is SpecItemInput['kind'] {
  return (SPEC_ITEM_KINDS as readonly string[]).includes(kind)
}

export function groundModelOutput(transcript: string, raw: RawModelOutput): ModelStructureOutput {
  const haystack = normalise(transcript)
  let dropped = 0
  const items: SpecItemInput[] = []

  for (const item of raw.items) {
    const quote = normalise(item.source_quote)
    const text = clip(item.text, LIMITS.itemText)
    if (!isKind(item.kind) || !text || quote.length < 3 || !haystack.includes(quote)) {
      dropped += 1
      continue
    }
    items.push({
      kind: item.kind,
      text,
      acceptance: clip(item.acceptance, LIMITS.acceptance),
      sourceQuote: clip(item.source_quote, LIMITS.sourceQuote),
      note: clip(item.note, LIMITS.note),
    })
    if (items.length === LIMITS.items) break
  }

  return {
    title: clip(raw.title, LIMITS.title) ?? 'Untitled checklist',
    items,
    droppedUngrounded: dropped,
  }
}
