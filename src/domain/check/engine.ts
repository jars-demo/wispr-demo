import type { ClaimStatus } from '../claim'
import type { SpecItem } from '../spec'
import type { VerdictKind } from '../verdict'

import { isDocFile, isManifest, isTestFile, parseDiff, type DiffFile } from './diff'
import { keywordSet, mentionsTests, words } from './keywords'

// The built-in check engine. Deterministic: every "Found" cites real added lines from the diff,
// claims are decided by hard evidence (which files changed, what the test output says), and
// anything the evidence cannot settle is "Can't tell". It never upgrades a guess to a fact.

export type Citation = { file: string; lines: string; quote: string }

export type RequirementResult = {
  code: string
  text: string
  verdict: VerdictKind
  reason: string
  citations: Citation[]
}

export type NonGoalResult = {
  code: string
  text: string
  status: 'respected' | 'violated'
  reason: string
  citations: Citation[]
}

export type ClaimResult = { text: string; status: ClaimStatus; evidence: string }

export type CheckResult = {
  engine: 'rules'
  requirements: RequirementResult[]
  nonGoals: NonGoalResult[]
  claims: ClaimResult[]
  files: { path: string; status: DiffFile['status']; added: number; removed: number }[]
  skipped: string[]
  summary: { found: number; partly: number; missing: number; cantTell: number; total: number }
}

export type CheckInput = {
  items: readonly SpecItem[]
  diff: string
  summary?: string
  testOutput?: string
}

const MAX_QUOTE = 160

function clip(text: string): string {
  const t = text.trim()
  return t.length > MAX_QUOTE ? `${t.slice(0, MAX_QUOTE - 1)}…` : t
}

function lineRange(lines: number[]): string {
  if (lines.length === 0) return ''
  const min = Math.min(...lines)
  const max = Math.max(...lines)
  return min === max ? `L${min}` : `L${min}-L${max}`
}

type Scored = { file: DiffFile; matched: Set<string>; lines: { text: string; line: number }[] }

/** Finds the hunk whose added lines (plus its file path) share the most keywords. */
function bestEvidence(files: DiffFile[], keys: Set<string>): Scored | null {
  let best: Scored | null = null
  for (const file of files) {
    const pathKeys = keywordSet(file.path)
    for (const hunk of file.hunks) {
      const matched = new Set<string>()
      const lines: Scored['lines'] = []
      for (const key of keys) if (pathKeys.has(key)) matched.add(key)
      for (const l of hunk.lines) {
        if (l.kind !== 'add' || l.line === null) continue
        const lineKeys = words(l.text).filter((w) => keys.has(w))
        if (lineKeys.length > 0) {
          lineKeys.forEach((k) => matched.add(k))
          lines.push({ text: l.text, line: l.line })
        }
      }
      if (lines.length === 0) continue
      if (!best || matched.size > best.matched.size) best = { file, matched, lines }
    }
  }
  return best
}

function cite(scored: Scored): Citation {
  const top = scored.lines.slice(0, 3)
  return {
    file: scored.file.path,
    lines: lineRange(top.map((l) => l.line)),
    quote: clip(top.map((l) => l.text.trim()).join('\n')),
  }
}

function firstAddedLines(file: DiffFile): Citation | null {
  for (const hunk of file.hunks) {
    const added = hunk.lines.filter((l) => l.kind === 'add' && l.line !== null && l.text.trim())
    if (added.length > 0) {
      const top = added.slice(0, 3)
      return {
        file: file.path,
        lines: lineRange(top.map((l) => l.line as number)),
        quote: clip(top.map((l) => l.text.trim()).join('\n')),
      }
    }
  }
  return null
}

function hasAdditions(file: DiffFile): boolean {
  return file.hunks.some((h) => h.lines.some((l) => l.kind === 'add'))
}

function checkRequirement(item: SpecItem, files: DiffFile[]): RequirementResult {
  const base = { code: item.code, text: item.text }

  if (mentionsTests(item.text)) {
    const tests = files.filter((f) => isTestFile(f.path) && hasAdditions(f))
    const citation = tests[0] ? firstAddedLines(tests[0]) : null
    return citation
      ? {
          ...base,
          verdict: 'evidence_found',
          reason: `${tests.length} test file${tests.length === 1 ? '' : 's'} changed.`,
          citations: [citation],
        }
      : {
          ...base,
          verdict: 'not_found',
          reason: 'None of the changed files are tests.',
          citations: [],
        }
  }

  const keys = keywordSet(item.text)
  if (keys.size === 0) {
    return {
      ...base,
      verdict: 'unverifiable',
      reason: 'Too general to match against code automatically.',
      citations: [],
    }
  }
  const best = bestEvidence(files, keys)
  if (!best) {
    return {
      ...base,
      verdict: 'not_found',
      reason: 'Nothing in the changes matches this.',
      citations: [],
    }
  }
  const needed = Math.min(2, keys.size)
  const matched = [...best.matched].join(', ')
  if (best.matched.size >= needed && best.matched.size / keys.size >= 0.4) {
    const acceptanceKeys = item.acceptance ? keywordSet(item.acceptance) : new Set<string>()
    const acceptanceSeen = [...acceptanceKeys].some((k) =>
      files.some((f) =>
        f.hunks.some((h) => h.lines.some((l) => l.kind === 'add' && words(l.text).includes(k))),
      ),
    )
    if (acceptanceKeys.size > 0 && !acceptanceSeen) {
      return {
        ...base,
        verdict: 'partial',
        reason: `The change is there (matched: ${matched}), but nothing shows the "done when" condition.`,
        citations: [cite(best)],
      }
    }
    return {
      ...base,
      verdict: 'evidence_found',
      reason: `Matching changes in ${best.file.path} (matched: ${matched}).`,
      citations: [cite(best)],
    }
  }
  return {
    ...base,
    verdict: 'unverifiable',
    reason: `Only a weak match (${matched}). Look at these lines yourself.`,
    citations: [cite(best)],
  }
}

function nonGoalKeys(text: string): Set<string> {
  return keywordSet(text.replace(/\b(flow|page|pages|file|files|code|module|logic|part)\b/gi, ' '))
}

function checkNonGoal(item: SpecItem, files: DiffFile[]): NonGoalResult {
  const keys = nonGoalKeys(item.text)
  const base = { code: item.code, text: item.text }
  for (const file of files) {
    const pathKeys = keywordSet(file.path)
    const hit = [...keys].find((k) => pathKeys.has(k))
    if (hit && file.hunks.length > 0) {
      const citation = firstAddedLines(file)
      return {
        ...base,
        status: 'violated',
        reason: `${file.path} changed, and it matches "${hit}".`,
        citations: citation ? [citation] : [],
      }
    }
  }
  return { ...base, status: 'respected', reason: 'No changed file matches this.', citations: [] }
}

// ---------- Claims in the agent's summary ----------

type ClaimRule = {
  pattern: RegExp
  judge: (ctx: { files: DiffFile[]; testOutput?: string; match: RegExpMatchArray }) => {
    status: ClaimStatus
    evidence: string
  }
}

const FAIL_SIGNAL =
  /\b([1-9]\d*\s+(failed|failing|errors?)|FAIL\b|AssertionError|Tests?:\s+[1-9]\d*\s+failed)|[✗✕×]\s/i
const PASS_SIGNAL =
  /\b(\d+\s+passed|all tests passed|tests?\s+passed|PASS\b|ok\s+\d+|0\s+failed)\b|✓/i

const CLAIM_RULES: ClaimRule[] = [
  {
    pattern:
      /\b(added|wrote|written|created|included|new)\b[^.]*\btests?\b|\btests?\b[^.]*\b(added|written|created)\b/i,
    judge: ({ files }) => {
      const tests = files.filter((f) => isTestFile(f.path) && hasAdditions(f))
      return tests.length > 0
        ? {
            status: 'supported',
            evidence: `${tests.length} test file${tests.length === 1 ? '' : 's'} changed.`,
          }
        : {
            status: 'contradicted',
            evidence: `0 of ${files.length} changed file${files.length === 1 ? ' is a test' : 's are tests'}.`,
          }
    },
  },
  {
    pattern:
      /\b(all\s+)?tests?\s+(are\s+)?(pass|passing|passed|green|succeed)|\b(passing|green)\s+tests?\b/i,
    judge: ({ testOutput }) => {
      if (!testOutput?.trim())
        return { status: 'unverifiable', evidence: 'No test output was provided.' }
      if (FAIL_SIGNAL.test(testOutput))
        return { status: 'contradicted', evidence: 'The test output shows failures.' }
      if (PASS_SIGNAL.test(testOutput))
        return { status: 'supported', evidence: 'The test output you pasted shows passing tests.' }
      return {
        status: 'unverifiable',
        evidence: 'The test output does not say clearly either way.',
      }
    },
  },
  {
    pattern: /\b(updated|wrote|added)\b[^.]*\b(docs|documentation|readme)\b/i,
    judge: ({ files }) =>
      files.some((f) => isDocFile(f.path))
        ? { status: 'supported', evidence: 'Documentation files changed.' }
        : { status: 'contradicted', evidence: 'No documentation files changed.' },
  },
  {
    pattern: /\b(no|without( adding)?( any)?)\s+new\s+(dependencies|deps|packages)\b/i,
    judge: ({ files }) => {
      const manifest = files.find((f) => isManifest(f.path) && hasAdditions(f))
      return manifest
        ? { status: 'contradicted', evidence: `${manifest.path} gained new lines.` }
        : { status: 'supported', evidence: 'No dependency manifest gained new lines.' }
    },
  },
  {
    pattern:
      /\b(?:didn'?t|did not|haven'?t|have not|no changes to|left|leaving)\s+(?:touch|change|modify)?\s*(?:the\s+)?([a-z][\w-]{2,})/i,
    judge: ({ files, match }) => {
      const subject = (match[1] ?? '').toLowerCase()
      const key = words(subject)[0]
      if (!key) return { status: 'unverifiable', evidence: 'Could not tell what was meant.' }
      const hit = files.find((f) => keywordSet(f.path).has(key))
      return hit
        ? { status: 'contradicted', evidence: `${hit.path} changed.` }
        : { status: 'supported', evidence: `No changed file matches "${subject}".` }
    },
  },
]

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+|(?:^|\s)[-*•]\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
}

export function checkClaims(
  summary: string,
  files: DiffFile[],
  testOutput?: string,
): ClaimResult[] {
  const results: ClaimResult[] = []
  for (const sentence of sentences(summary)) {
    for (const rule of CLAIM_RULES) {
      const match = sentence.match(rule.pattern)
      if (!match) continue
      results.push({ text: clip(sentence), ...rule.judge({ files, testOutput, match }) })
      break
    }
  }
  return results.slice(0, 20)
}

export function runCheck(input: CheckInput): CheckResult {
  const all = parseDiff(input.diff)
  const files = all.filter((f) => !f.skipped)
  const requirements = input.items
    .filter((i) => i.kind === 'requirement')
    .map((i) => checkRequirement(i, files))
  const nonGoals = input.items
    .filter((i) => i.kind === 'non_goal')
    .map((i) => checkNonGoal(i, files))
  const claims = input.summary ? checkClaims(input.summary, files, input.testOutput) : []
  const count = (v: VerdictKind) => requirements.filter((r) => r.verdict === v).length
  return {
    engine: 'rules',
    requirements,
    nonGoals,
    claims,
    files: files.map((f) => ({
      path: f.path,
      status: f.status,
      added: f.hunks.reduce((n, h) => n + h.lines.filter((l) => l.kind === 'add').length, 0),
      removed: f.hunks.reduce((n, h) => n + h.lines.filter((l) => l.kind === 'del').length, 0),
    })),
    skipped: all.filter((f) => f.skipped).map((f) => f.path),
    summary: {
      found: count('evidence_found'),
      partly: count('partial'),
      missing: count('not_found'),
      cantTell: count('unverifiable'),
      total: requirements.length,
    },
  }
}
