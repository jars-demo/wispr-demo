import {
  assignCodes,
  specDraftSchema,
  type SpecDraft,
  type SpecItemInput,
  type SpecItemKind,
  type StructuringEngine,
} from '@/domain/spec'

// Client-side draft state. Keys keep React rows stable while items are edited or moved.

/** sessionStorage key the landing page uses to hand what was said to /new. */
export const PENDING_TRANSCRIPT_KEY = 'receipts:pending-transcript'

export type DraftItem = SpecItemInput & { key: string }

export type Draft = { title: string; items: DraftItem[] }

/**
 * Keys are derived from position so server and browser render the same ids (no hydration
 * mismatch). Rows added later get random keys, which only ever happens in the browser.
 */
export function toDraftItems(items: readonly SpecItemInput[], prefix = 'item'): DraftItem[] {
  return items.map((item, index) => ({ ...item, key: `${prefix}-${index}` }))
}

export function emptyItem(kind: SpecItemKind): DraftItem {
  return { key: crypto.randomUUID(), kind, text: '' }
}

/** Codes as they will be saved, keyed by row, so the editor shows R1, N1 and so on live. */
export function liveCodes(items: readonly DraftItem[]): Map<string, string> {
  const coded = assignCodes(items.filter((item) => item.text.trim() !== ''))
  const byKey = new Map<string, string>()
  let index = 0
  for (const item of items) {
    if (item.text.trim() === '') continue
    const code = coded[index++]?.code
    if (code) byKey.set(item.key, code)
  }
  return byKey
}

/** Validates with the same schema the server uses. Blank rows are dropped, not rejected. */
export function finaliseDraft(
  draft: Draft,
  transcript: string,
  engine: StructuringEngine,
): { ok: true; value: SpecDraft } | { ok: false; message: string } {
  const result = specDraftSchema.safeParse({
    title: draft.title,
    transcript,
    engine,
    items: draft.items
      .filter((item) => item.text.trim() !== '')
      .map(({ key: _key, ...item }) => item),
  })
  if (result.success) return { ok: true, value: result.data }
  const issue = result.error.issues[0]
  if (issue?.path[0] === 'title') return { ok: false, message: 'Give the receipt a title.' }
  if (
    issue?.message === 'needs at least one requirement' ||
    issue?.message === 'needs at least one item'
  ) {
    return { ok: false, message: 'Add at least one thing you are asking for.' }
  }
  return { ok: false, message: 'One of the items is too long. Shorten it and try again.' }
}
