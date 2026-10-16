// Parses unified diffs (git diff, GitHub .diff) into files and hunks with new-file line numbers.
// Pure and defensive: malformed input yields fewer files, never an exception.

export type DiffLine = { kind: 'add' | 'del' | 'ctx'; text: string; line: number | null }

export type DiffHunk = { id: string; lines: DiffLine[] }

export type DiffFile = {
  path: string
  status: 'added' | 'deleted' | 'modified' | 'renamed'
  hunks: DiffHunk[]
  skipped: boolean
}

const SKIP =
  /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|Cargo\.lock|poetry\.lock|uv\.lock|go\.sum|composer\.lock|Gemfile\.lock)$|\.min\.(js|css)$|\.map$|(^|\/)(dist|build|out|\.next|coverage|vendor|node_modules)\//

export function parseDiff(text: string): DiffFile[] {
  const files: DiffFile[] = []
  let file: DiffFile | null = null
  let hunk: DiffHunk | null = null
  let newLine = 0

  for (const raw of text.replace(/\r\n/g, '\n').split('\n')) {
    if (raw.startsWith('diff --git ')) {
      const match = / b\/(.+)$/.exec(raw)
      file = { path: match?.[1] ?? 'unknown', status: 'modified', hunks: [], skipped: false }
      file.skipped = SKIP.test(file.path)
      files.push(file)
      hunk = null
      continue
    }
    if (!file) continue
    if (raw.startsWith('new file mode')) file.status = 'added'
    else if (raw.startsWith('deleted file mode')) file.status = 'deleted'
    else if (raw.startsWith('rename to ')) {
      file.status = 'renamed'
      file.path = raw.slice('rename to '.length)
    } else if (raw.startsWith('+++ ')) {
      const path = raw.slice(4).replace(/^b\//, '')
      if (path !== '/dev/null') file.path = path
      file.skipped = SKIP.test(file.path)
    } else if (raw.startsWith('--- ')) {
      // old path; nothing to record
    } else if (raw.startsWith('@@')) {
      const match = /\+(\d+)/.exec(raw)
      newLine = Number(match?.[1] ?? 1)
      hunk = { id: `H${files.reduce((n, f) => n + f.hunks.length, 0) + 1}`, lines: [] }
      file.hunks.push(hunk)
    } else if (hunk) {
      if (raw.startsWith('+')) hunk.lines.push({ kind: 'add', text: raw.slice(1), line: newLine++ })
      else if (raw.startsWith('-')) hunk.lines.push({ kind: 'del', text: raw.slice(1), line: null })
      else if (raw.startsWith(' ')) {
        hunk.lines.push({ kind: 'ctx', text: raw.slice(1), line: newLine++ })
      }
    }
  }
  return files
}

const TEST_PATH =
  /(^|\/)(__tests__|tests?|spec|e2e)\/|\.(test|spec)\.[cm]?[jt]sx?$|_test\.(go|py|rb)$|(^|\/)test_[^/]+\.py$|Test\.(java|kt|cs)$/i

export function isTestFile(path: string): boolean {
  return TEST_PATH.test(path)
}

export function isDocFile(path: string): boolean {
  return /\.(md|mdx|rst|txt)$/i.test(path) || /(^|\/)docs?\//i.test(path)
}

const MANIFESTS =
  /(^|\/)(package\.json|requirements[^/]*\.txt|pyproject\.toml|go\.mod|Cargo\.toml|Gemfile|composer\.json|build\.gradle(\.kts)?|pom\.xml)$/

export function isManifest(path: string): boolean {
  return MANIFESTS.test(path)
}
