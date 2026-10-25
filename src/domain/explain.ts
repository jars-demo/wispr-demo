import type { KeyPoint } from './breakdown'

// Scores an explain-back without AI: a key point counts as covered when the explanation uses one
// of its keywords (or a close word form). Deterministic, instant and free, and the result says
// exactly which points were heard, so nobody has to trust a hidden judgement.

export const MIN_WORDS = 8

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/** Word forms match on a long shared prefix: "paginate" and "pagination", "retry" and "retries". */
function sameRoot(a: string, b: string): boolean {
  if (a === b) return true
  const shortest = Math.min(a.length, b.length)
  if (shortest < 4) return false
  let shared = 0
  while (shared < shortest && a[shared] === b[shared]) shared += 1
  return shared >= Math.max(4, shortest - 2)
}

function covers(words: string[], text: string, keyword: string): boolean {
  const key = normalise(keyword)
  if (!key) return false
  if (` ${text} `.includes(` ${key} `)) return true
  const parts = key.split(' ').filter((p) => p.length >= 3)
  if (!parts.length) return false
  return parts.every((part) => words.some((w) => sameRoot(w, part)))
}

export type ExplainResult = { score: number; covered: boolean[]; tooShort: boolean }

export function gradeExplanation(
  explanation: string,
  keyPoints: readonly KeyPoint[],
): ExplainResult {
  const text = normalise(explanation)
  const words = text ? text.split(' ') : []
  if (words.length < MIN_WORDS || !keyPoints.length) {
    return { score: 0, covered: keyPoints.map(() => false), tooShort: words.length < MIN_WORDS }
  }
  const covered = keyPoints.map((k) => k.keywords.some((keyword) => covers(words, text, keyword)))
  const score = Math.round((covered.filter(Boolean).length / keyPoints.length) * 100)
  return { score, covered, tooShort: false }
}
