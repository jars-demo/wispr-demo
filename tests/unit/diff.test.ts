import { describe, expect, it } from 'vitest'

import { diffForPrompt, hunkAsDiff, lineIndex, parseDiff } from '@/domain/diff'

const GIT = `diff --git a/src/a.ts b/src/a.ts
index 1..2 100644
--- a/src/a.ts
+++ b/src/a.ts
@@ -1,3 +1,4 @@
 const a = 1
-const b = 2
+const b = 3
+const c = 4
 export { a }
diff --git a/package-lock.json b/package-lock.json
--- a/package-lock.json
+++ b/package-lock.json
@@ -1 +1 @@
-x
+y
`

describe('parseDiff', () => {
  it('numbers every line per file and tracks old and new line numbers', () => {
    const diff = parseDiff(GIT)
    expect(diff.files).toHaveLength(1)
    const [file] = diff.files
    expect(file?.path).toBe('src/a.ts')
    expect(file?.hunks[0]?.lines.map((l) => [l.ref, l.kind, l.oldNo, l.newNo])).toEqual([
      ['F1.L1', 'ctx', 1, 1],
      ['F1.L2', 'del', 2, null],
      ['F1.L3', 'add', null, 2],
      ['F1.L4', 'add', null, 3],
      ['F1.L5', 'ctx', 3, 4],
    ])
    expect(diff.additions).toBe(2)
    expect(diff.deletions).toBe(1)
  })

  it('skips lock files and does not count the trailing newline as a line', () => {
    const diff = parseDiff(GIT)
    expect(diff.skipped.files).toEqual(['package-lock.json'])
    expect(lineIndex(diff).size).toBe(5)
  })

  it('reads a pasted diff that has no "diff --git" header, including new files', () => {
    const diff = parseDiff('--- /dev/null\n+++ b/new.ts\n@@ -0,0 +1,2 @@\n+one\n+two\n')
    expect(diff.files[0]).toMatchObject({ path: 'new.ts', status: 'added', additions: 2 })
  })

  it('puts source before tests and docs when the budget is tight, then keeps original order', () => {
    const file = (path: string, n: number) =>
      `diff --git a/${path} b/${path}\n--- a/${path}\n+++ b/${path}\n@@ -1,${n} +1,${n} @@\n` +
      Array.from({ length: n }, (_, i) => `+line ${i}`).join('\n') +
      '\n'
    const text = file('README.md', 30) + file('src/app.test.ts', 30) + file('src/app.ts', 30)
    const diff = parseDiff(text, { lines: 65, files: 10 })
    expect(diff.files.map((f) => f.path)).toEqual(['src/app.test.ts', 'src/app.ts'])
    expect(diff.files.map((f) => f.id)).toEqual(['F1', 'F2'])
    expect(diff.skipped.files).toEqual(['README.md'])
  })

  it('keeps the hunks that fit when a file is too big, and marks it partial', () => {
    const hunk = (start: number) =>
      `@@ -${start},20 +${start},20 @@\n` + Array.from({ length: 20 }, () => '+x').join('\n') + '\n'
    const text = `diff --git a/big.ts b/big.ts\n--- a/big.ts\n+++ b/big.ts\n${hunk(1)}${hunk(100)}`
    const diff = parseDiff(text, { lines: 30 })
    expect(diff.files[0]?.partial).toBe(true)
    expect(diff.files[0]?.hunks).toHaveLength(1)
    expect(diff.skipped.lines).toBe(20)
  })

  it('can focus on a single file for a drill-down', () => {
    const diff = parseDiff(GIT, { only: ['src/a.ts'] })
    expect(diff.files.map((f) => f.path)).toEqual(['src/a.ts'])
    expect(parseDiff(GIT, { only: ['nope.ts'] }).files).toHaveLength(0)
  })

  it('tags every prompt line with its reference and rebuilds a hunk as its own diff', () => {
    const diff = parseDiff(GIT)
    expect(diffForPrompt(diff)).toContain('F1.L3 + const b = 3')
    const file = diff.files[0]
    const hunk = file?.hunks[0]
    if (!file || !hunk) throw new Error('missing hunk')
    expect(parseDiff(hunkAsDiff(file, hunk)).files[0]?.hunks[0]?.lines).toHaveLength(5)
  })
})
