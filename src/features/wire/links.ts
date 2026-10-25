import type { FeedItem } from '@/domain/feed'

// Where "Break it down" goes for each kind of source. The breakdown page reads these back.

export function breakdownHref(item: Pick<FeedItem, 'source'>): string {
  const s = item.source
  if (s.kind === 'sample') return `/b?sample=${encodeURIComponent(s.id)}`
  if ('pr' in s) return `/b?repo=${encodeURIComponent(s.repo)}&pr=${s.pr}`
  return `/b?repo=${encodeURIComponent(s.repo)}&sha=${encodeURIComponent(s.sha)}`
}

export const PASTE_KEY = 'breakdown:paste'

/** A pasted diff rather than a link: it has diff headers or hunk markers. */
export function looksLikeDiff(text: string): boolean {
  return /^diff --git /m.test(text) || (/^@@ -\d/m.test(text) && /^[+-]/m.test(text))
}
