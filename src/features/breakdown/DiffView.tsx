'use client'

import { useEffect, useRef } from 'react'

import type { DiffFile, DiffLine, ParsedDiff } from '@/domain/diff'

// The change itself, on a solid surface. Lines a step or question points at glow; clicking a line
// asks where it is explained. With `focus`, only the cited lines and their neighbours show.

const ROW: Record<DiffLine['kind'], string> = {
  add: 'bg-ok-wash/70',
  del: 'bg-bad-wash/80',
  ctx: '',
}

const MARK: Record<DiffLine['kind'], string> = { add: '+', del: '-', ctx: ' ' }

function visibleLines(file: DiffFile, focus: Set<string> | null): (DiffLine | 'gap')[] {
  const lines = file.hunks.flatMap((h) => h.lines)
  if (!focus) return lines
  const keep = new Set<number>()
  lines.forEach((line, i) => {
    if (focus.has(line.ref)) for (let j = i - 1; j <= i + 1; j++) keep.add(j)
  })
  const out: (DiffLine | 'gap')[] = []
  lines.forEach((line, i) => {
    if (!keep.has(i)) return
    if (out.length && !keep.has(i - 1)) out.push('gap')
    out.push(line)
  })
  return out
}

export function DiffView({
  diff,
  hot,
  focus = null,
  animate = false,
  onLine,
  onDrill,
  maxHeight = '32rem',
}: {
  diff: ParsedDiff
  hot: ReadonlySet<string>
  focus?: Set<string> | null
  animate?: boolean
  onLine?: (ref: string, file: DiffFile) => void
  onDrill?: (path: string) => void
  maxHeight?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const firstHot = [...hot][0] ?? null

  useEffect(() => {
    if (!firstHot || !box.current) return
    const el = box.current.querySelector<HTMLElement>(`[data-ref="${firstHot}"]`)
    if (!el) return
    const top = el.offsetTop - box.current.clientHeight / 3
    box.current.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }, [firstHot])

  let index = 0
  const files = focus
    ? diff.files.filter((f) => f.hunks.some((h) => h.lines.some((l) => focus.has(l.ref))))
    : diff.files

  return (
    <div
      ref={box}
      className="relative max-w-full min-w-0 overflow-auto rounded-card bg-surface font-mono text-[12.5px] leading-[1.6] ring-1 ring-hairline"
      style={{ maxHeight }}
    >
      {files.map((file) => (
        <section key={file.id} aria-label={file.path}>
          <header className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-hairline bg-surface-2/95 px-3 py-2 font-sans text-[12px] backdrop-blur">
            <span className="font-mono font-medium break-all text-ink">{file.path}</span>
            <span className="text-ok">+{file.additions}</span>
            <span className="text-bad">-{file.deletions}</span>
            {file.status !== 'modified' ? (
              <span className="rounded-full bg-surface px-2 text-muted ring-1 ring-hairline">
                {file.status}
              </span>
            ) : null}
            {file.partial ? (
              <span className="rounded-full bg-warn-wash px-2 text-warn">partly shown</span>
            ) : null}
            {onDrill ? (
              <button
                type="button"
                onClick={() => onDrill(file.path)}
                className="ml-auto rounded-full px-2 py-0.5 font-medium text-accent-text hover:bg-accent-wash"
              >
                Break down this file
              </button>
            ) : null}
          </header>
          <table className="w-full border-collapse">
            <tbody>
              {visibleLines(file, focus).map((line, i) => {
                if (line === 'gap') {
                  return (
                    <tr key={`gap-${i}`}>
                      <td colSpan={4} className="px-3 text-center text-muted select-none">
                        ⋯
                      </td>
                    </tr>
                  )
                }
                const isHot = hot.has(line.ref)
                const delay = animate ? Math.min(index++ * 14, 1400) : 0
                return (
                  <tr
                    key={line.ref}
                    data-ref={line.ref}
                    onClick={onLine ? () => onLine(line.ref, file) : undefined}
                    className={`${ROW[line.kind]} ${isHot ? 'line-hot' : ''} ${animate ? 'line-in' : ''} ${onLine ? 'cursor-pointer hover:bg-accent-wash/60' : ''} transition-colors duration-300`}
                    style={
                      animate ? ({ '--delay': `${delay}ms` } as React.CSSProperties) : undefined
                    }
                  >
                    <td className="w-10 px-2 text-right text-muted/70 tabular-nums select-none">
                      {line.oldNo ?? ''}
                    </td>
                    <td className="w-10 px-2 text-right text-muted/70 tabular-nums select-none">
                      {line.newNo ?? ''}
                    </td>
                    <td className="w-4 text-center text-muted select-none">{MARK[line.kind]}</td>
                    <td className="pr-4 whitespace-pre text-ink">{line.text || ' '}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  )
}
