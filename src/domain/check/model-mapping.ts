import type { SpecItem } from '../spec'

import type { DiffFile } from './diff'
import type { CheckResult, Citation, RequirementResult } from './engine'
import { mentionsTests } from './keywords'

// Lets a model map requirements to diff hunks, then refuses anything it cannot prove: every
// Found or Partly must quote lines that really exist in the cited hunk, or it becomes Can't tell.
// Pure, so the "no lines, no Found" rule is unit tested without any network.

export type ModelVerdict = {
  code: string
  verdict: 'evidence_found' | 'partial' | 'not_found' | 'unverifiable'
  reason: string
  citations: { hunk: string; quote: string }[]
}

type HunkLines = { file: string; lines: { line: number; text: string }[] }

const MAX_DIGEST_CHARS = 60_000

/** Numbered hunks for the prompt, and the lookup the validator uses. */
export function buildDigest(files: DiffFile[]): { text: string; hunks: Map<string, HunkLines> } {
  const hunks = new Map<string, HunkLines>()
  const parts: string[] = []
  let size = 0
  for (const file of files) {
    if (file.skipped) continue
    for (const hunk of file.hunks) {
      const added = hunk.lines
        .filter((l) => l.kind === 'add' && l.line !== null && l.text.trim())
        .map((l) => ({ line: l.line as number, text: l.text }))
      if (added.length === 0) continue
      const block = `### ${hunk.id} ${file.path}\n${added.map((l) => `${l.line}: ${l.text}`).join('\n')}\n`
      if (size + block.length > MAX_DIGEST_CHARS) break
      size += block.length
      parts.push(block)
      hunks.set(hunk.id, { file: file.path, lines: added })
    }
  }
  return { text: parts.join('\n'), hunks }
}

const squash = (text: string) => text.replace(/\s+/g, ' ').trim()

function validateCitation(
  citation: { hunk: string; quote: string },
  hunks: Map<string, HunkLines>,
): Citation | null {
  const hunk = hunks.get(citation.hunk.trim())
  const quote = squash(citation.quote)
  if (!hunk || quote.length < 4) return null
  const matched = hunk.lines.filter((l) => {
    const line = squash(l.text)
    return line.length > 0 && (quote.includes(line) || line.includes(quote))
  })
  if (matched.length === 0) return null
  const top = matched.slice(0, 3)
  const first = top[0]?.line ?? 0
  const last = top.at(-1)?.line ?? first
  return {
    file: hunk.file,
    lines: first === last ? `L${first}` : `L${first}-L${last}`,
    quote: top
      .map((l) => l.text.trim())
      .join('\n')
      .slice(0, 160),
  }
}

/** Applies validated model verdicts to the rules result. Test items keep the rules verdict. */
export function mergeModelVerdicts(
  rules: CheckResult,
  items: readonly SpecItem[],
  model: ModelVerdict[],
  hunks: Map<string, HunkLines>,
): CheckResult {
  const byCode = new Map(model.map((m) => [m.code, m]))
  const requirements: RequirementResult[] = rules.requirements.map((rule) => {
    const item = items.find((i) => i.code === rule.code)
    const proposal = byCode.get(rule.code)
    if (!item || !proposal || mentionsTests(item.text)) return rule

    const citations = proposal.citations
      .map((c) => validateCitation(c, hunks))
      .filter((c): c is Citation => c !== null)
    const reason = proposal.reason.trim().slice(0, 300) || rule.reason
    const needsLines = proposal.verdict === 'evidence_found' || proposal.verdict === 'partial'
    if (needsLines && citations.length === 0) {
      return {
        ...rule,
        verdict: 'unverifiable',
        reason: 'The AI could not point to real lines for this, so it stays unconfirmed.',
        citations: rule.citations,
      }
    }
    return { ...rule, verdict: proposal.verdict, reason, citations: needsLines ? citations : [] }
  })
  const count = (v: RequirementResult['verdict']) =>
    requirements.filter((r) => r.verdict === v).length
  return {
    ...rules,
    engine: 'model',
    requirements,
    summary: {
      found: count('evidence_found'),
      partly: count('partial'),
      missing: count('not_found'),
      cantTell: count('unverifiable'),
      total: requirements.length,
    },
  }
}
