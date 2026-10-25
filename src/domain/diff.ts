// Parses a unified diff (git, GitHub .diff, or pasted) into files, hunks and lines. Every line gets
// a stable reference like "F2.L14" (file 2, line 14 of that file's hunks). Breakdowns may only
// point at references that exist here, which is how made-up code is caught.

export type DiffLineKind = 'add' | 'del' | 'ctx'

export type DiffLine = {
  ref: string
  kind: DiffLineKind
  text: string
  oldNo: number | null
  newNo: number | null
}

export type DiffHunk = { header: string; lines: DiffLine[] }

export type FileStatus = 'added' | 'deleted' | 'modified' | 'renamed'

export type DiffFile = {
  id: string
  path: string
  oldPath: string | null
  status: FileStatus
  additions: number
  deletions: number
  hunks: DiffHunk[]
  /** True when only some hunks fit the budget. */
  partial: boolean
}

export type ParsedDiff = {
  files: DiffFile[]
  additions: number
  deletions: number
  /** What was left out to keep the breakdown focused: noise files and anything over budget. */
  skipped: { files: string[]; lines: number }
}

// Sized for the shared free model. Players with their own AI key get BIG_DIFF_LIMITS, and
// anything left out can still be broken down file by file.
export const DIFF_LIMITS = { files: 12, lines: 700 } as const
export const BIG_DIFF_LIMITS = { files: 40, lines: 3000 } as const

export type DiffOptions = {
  files?: number
  lines?: number
  /** A character budget on top of lines, since a few very long lines can cost as much as many. */
  chars?: number
  only?: readonly string[]
}

// Lock files, build output and minified code teach nothing and burn the budget.
const NOISE = [
  /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|Cargo\.lock|poetry\.lock|go\.sum|composer\.lock|Gemfile\.lock)$/,
  /(^|\/)(dist|build|out|\.next|vendor|node_modules)\//,
  /\.min\.(js|css)$/,
  /\.(png|jpe?g|gif|webp|ico|pdf|zip|woff2?|ttf|map|snap)$/i,
]

export function isNoisePath(path: string): boolean {
  return NOISE.some((pattern) => pattern.test(path))
}

const HUNK = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)$/

function stripPrefix(path: string): string {
  return path.replace(/^[ab]\//, '').trim()
}

type Draft = Omit<DiffFile, 'id' | 'partial'>

/** Parses raw diff text. Lines outside any hunk (index, mode, binary notes) are ignored. */
export function parseDiff(text: string, options: DiffOptions = {}): ParsedDiff {
  const drafts: Draft[] = []
  let file: Draft | null = null
  let hunk: DiffHunk | null = null
  let oldNo = 0
  let newNo = 0

  const startFile = (path: string, oldPath: string | null) => {
    file = {
      path,
      oldPath,
      status: 'modified',
      additions: 0,
      deletions: 0,
      hunks: [],
    }
    drafts.push(file)
    hunk = null
  }

  // Trailing newlines are the end of the text, not empty context lines.
  for (const raw of text.replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n')) {
    const current = file as Draft | null
    if (raw.startsWith('diff --git ')) {
      const match = / a\/(.+) b\/(.+)$/.exec(raw)
      startFile(match?.[2] ?? 'unknown', match?.[1] ?? null)
      continue
    }
    if (raw.startsWith('--- ') && (!hunk || !current)) {
      // A pasted diff without "diff --git" headers starts its file here.
      if (!current || current.hunks.length > 0) startFile('unknown', null)
      const from = raw.slice(4)
      const target = file as Draft | null
      if (target) {
        if (from.trim() === '/dev/null') target.status = 'added'
        else target.oldPath = stripPrefix(from)
      }
      continue
    }
    if (raw.startsWith('+++ ') && current && !hunk) {
      const to = raw.slice(4)
      if (to.trim() === '/dev/null') {
        current.status = 'deleted'
        if (current.oldPath) current.path = current.oldPath
      } else {
        current.path = stripPrefix(to)
      }
      continue
    }
    if (current && raw.startsWith('new file mode')) current.status = 'added'
    if (current && raw.startsWith('deleted file mode')) current.status = 'deleted'
    if (current && raw.startsWith('rename from ')) current.status = 'renamed'

    const header = HUNK.exec(raw)
    if (header && current) {
      oldNo = Number(header[1])
      newNo = Number(header[2])
      hunk = { header: raw, lines: [] }
      current.hunks.push(hunk)
      continue
    }
    const open = hunk as DiffHunk | null
    if (!open || !current || raw.startsWith('\\')) continue
    const marker = raw[0]
    if (marker === '+') {
      open.lines.push({ ref: '', kind: 'add', text: raw.slice(1), oldNo: null, newNo: newNo++ })
      current.additions += 1
    } else if (marker === '-') {
      open.lines.push({ ref: '', kind: 'del', text: raw.slice(1), oldNo: oldNo++, newNo: null })
      current.deletions += 1
    } else if (marker === ' ' || raw === '') {
      open.lines.push({ ref: '', kind: 'ctx', text: raw.slice(1), oldNo: oldNo++, newNo: newNo++ })
    } else {
      hunk = null
    }
  }

  return budget(drafts, options)
}

// Source code teaches the most, then config and schemas, then tests, then docs.
function priority(path: string): number {
  if (/(^|\/)(test|tests|__tests__|spec)\/|\.(test|spec)\.[a-z]+$/i.test(path)) return 2
  if (/\.(md|mdx|txt|rst|adoc)$/i.test(path)) return 3
  if (/\.(json|ya?ml|toml|ini|env|lock|xml|csv)$/i.test(path)) return 1
  return 0
}

function lineCountOf(hunks: readonly DiffHunk[]): number {
  return hunks.reduce((sum, h) => sum + h.lines.length, 0)
}

function charsOf(lines: readonly DiffLine[]): number {
  return lines.reduce((sum, line) => sum + line.text.length + 1, 0)
}

/** The first lines of a hunk that fit both budgets. */
function prefixThatFits(lines: readonly DiffLine[], room: number, charRoom: number): DiffLine[] {
  const part: DiffLine[] = []
  let chars = 0
  for (const line of lines) {
    if (part.length >= room || chars + line.text.length + 1 > charRoom) break
    part.push(line)
    chars += line.text.length + 1
  }
  return part
}

/**
 * Chooses what fits the budget: the most important files first (source before tests and docs,
 * bigger changes first), then shown in their original order. A file that does not fit whole
 * keeps the hunks that do. Everything left out is listed, so it can be broken down on its own.
 */
function budget(drafts: Draft[], options: DiffOptions): ParsedDiff {
  const maxFiles = options.files ?? DIFF_LIMITS.files
  const maxLines = options.lines ?? DIFF_LIMITS.lines
  const maxChars = options.chars ?? Number.POSITIVE_INFINITY
  const only = options.only ? new Set(options.only) : null
  const skipped: ParsedDiff['skipped'] = { files: [], lines: 0 }

  const candidates = drafts
    .map((draft, order) => ({ draft, order, lines: lineCountOf(draft.hunks) }))
    .filter(({ draft, lines }) => {
      if (lines === 0 || (only && !only.has(draft.path))) return false
      if (isNoisePath(draft.path)) {
        skipped.files.push(draft.path)
        skipped.lines += lines
        return false
      }
      return true
    })
    .sort((a, b) => priority(a.draft.path) - priority(b.draft.path) || b.lines - a.lines)

  const chosen: { draft: Draft; order: number; hunks: DiffHunk[]; partial: boolean }[] = []
  let used = 0
  let usedChars = 0
  for (const candidate of candidates) {
    const room = maxLines - used
    const charRoom = maxChars - usedChars
    if (chosen.length >= maxFiles || room < Math.min(candidate.lines, 20) || charRoom < 200) {
      skipped.files.push(candidate.draft.path)
      skipped.lines += candidate.lines
      continue
    }
    const hunks: DiffHunk[] = []
    let taken = 0
    let takenChars = 0
    for (const hunk of candidate.draft.hunks) {
      const size = charsOf(hunk.lines)
      if (taken + hunk.lines.length <= room && takenChars + size <= charRoom) {
        hunks.push(hunk)
        taken += hunk.lines.length
        takenChars += size
        continue
      }
      // A first hunk bigger than the whole budget (a large new file) is cut to fit, so the file is
      // still covered; whatever does not fit stays listed for its own round.
      if (!hunks.length) {
        const part = prefixThatFits(hunk.lines, room, charRoom)
        if (part.length) {
          hunks.push({ header: hunk.header, lines: part })
          taken += part.length
          takenChars += charsOf(part)
        }
      }
      break
    }
    if (!hunks.length) {
      skipped.files.push(candidate.draft.path)
      skipped.lines += candidate.lines
      continue
    }
    used += taken
    usedChars += takenChars
    skipped.lines += candidate.lines - taken
    chosen.push({ ...candidate, hunks, partial: taken < candidate.lines })
  }

  const files: DiffFile[] = chosen
    .sort((a, b) => a.order - b.order)
    .map(({ draft, hunks, partial }, index) => {
      const id = `F${index + 1}`
      let n = 0
      const rest = draft
      const numbered = hunks.map((h) => ({
        header: h.header,
        lines: h.lines.map((line) => ({ ...line, ref: `${id}.L${++n}` })),
      }))
      const count = (kind: DiffLineKind) =>
        numbered.reduce((sum, h) => sum + h.lines.filter((l) => l.kind === kind).length, 0)
      return {
        ...rest,
        id,
        hunks: numbered,
        partial,
        additions: partial ? count('add') : rest.additions,
        deletions: partial ? count('del') : rest.deletions,
      }
    })

  return {
    files,
    additions: files.reduce((sum, f) => sum + f.additions, 0),
    deletions: files.reduce((sum, f) => sum + f.deletions, 0),
    skipped,
  }
}

export function lineIndex(diff: ParsedDiff): Map<string, { file: DiffFile; line: DiffLine }> {
  const index = new Map<string, { file: DiffFile; line: DiffLine }>()
  for (const file of diff.files) {
    for (const hunk of file.hunks)
      for (const line of hunk.lines) index.set(line.ref, { file, line })
  }
  return index
}

const MARK: Record<DiffLineKind, string> = { add: '+', del: '-', ctx: ' ' }

/** The diff as the model sees it: every line tagged with its reference. */
export function diffForPrompt(diff: ParsedDiff): string {
  return diff.files
    .map((file) => {
      const head = `[${file.id}] ${file.path} (${file.status}, +${file.additions} -${file.deletions})`
      const body = file.hunks
        .map((h) =>
          [
            h.header,
            ...h.lines.map((l) => `${l.ref} ${MARK[l.kind]} ${l.text.slice(0, 240)}`),
          ].join('\n'),
        )
        .join('\n')
      return `${head}\n${body}`
    })
    .join('\n\n')
}

/** One hunk as a standalone unified diff, so it can be broken down on its own. */
export function hunkAsDiff(file: DiffFile, hunk: DiffHunk): string {
  const from = file.status === 'added' ? '/dev/null' : `a/${file.oldPath ?? file.path}`
  const to = file.status === 'deleted' ? '/dev/null' : `b/${file.path}`
  return [
    `diff --git a/${file.oldPath ?? file.path} b/${file.path}`,
    `--- ${from}`,
    `+++ ${to}`,
    hunk.header,
    ...hunk.lines.map((l) => `${MARK[l.kind]}${l.text}`),
  ].join('\n')
}
