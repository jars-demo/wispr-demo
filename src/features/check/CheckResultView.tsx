import { ClaimBadge } from '@/components/ui/ClaimBadge'
import { VerdictBadge } from '@/components/ui/VerdictBadge'
import type { Citation, CheckResult } from '@/domain/check/engine'

// The result of a check: one answer per requirement with cited lines, the things to leave
// alone, and the agent's claims. Server component; badges open their explanation sheets.

function CitationBlock({ citation }: { citation: Citation }) {
  return (
    <div className="overflow-hidden rounded-xl bg-surface-2">
      <div className="flex items-center justify-between gap-2 px-3 pt-2 font-mono text-[11px] text-muted">
        <span className="truncate">{citation.file}</span>
        <span className="shrink-0">{citation.lines}</span>
      </div>
      <pre className="overflow-x-auto px-3 pt-1 pb-2.5 font-mono text-[12.5px] leading-relaxed">
        <code>{citation.quote}</code>
      </pre>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-[13px] font-medium text-muted">{title}</h2>
      {children}
    </section>
  )
}

export function CheckResultView({ result }: { result: CheckResult }) {
  return (
    <div className="flex flex-col gap-8">
      <Section title="What you asked for">
        <ol className="flex flex-col gap-2">
          {result.requirements.map((r) => (
            <li key={r.code} className="glass flex flex-col gap-3 rounded-card p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="flex min-w-0 gap-3 text-[15px]">
                  <span className="pt-0.5 font-mono text-xs font-semibold text-accent-text">
                    {r.code}
                  </span>
                  <span>{r.text}</span>
                </p>
                <VerdictBadge kind={r.verdict} explain />
              </div>
              <p className="pl-8 text-sm text-muted">{r.reason}</p>
              {r.citations.map((c) => (
                <div key={`${c.file}${c.lines}`} className="pl-8">
                  <CitationBlock citation={c} />
                </div>
              ))}
            </li>
          ))}
        </ol>
      </Section>

      {result.nonGoals.length > 0 ? (
        <Section title="Leave alone">
          <ul className="flex flex-col gap-2">
            {result.nonGoals.map((n) => (
              <li key={n.code} className="glass flex flex-col gap-3 rounded-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="flex min-w-0 gap-3 text-[15px]">
                    <span className="pt-0.5 font-mono text-xs font-semibold text-muted">
                      {n.code}
                    </span>
                    <span>{n.text}</span>
                  </p>
                  <VerdictBadge
                    kind={n.status === 'violated' ? 'violates_non_goal' : 'evidence_found'}
                    explain
                  />
                </div>
                <p className="pl-8 text-sm text-muted">
                  {n.status === 'violated' ? n.reason : 'Left alone. ' + n.reason}
                </p>
                {n.citations.map((c) => (
                  <div key={`${c.file}${c.lines}`} className="pl-8">
                    <CitationBlock citation={c} />
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="What your agent said">
        {result.claims.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {result.claims.map((c) => (
              <li
                key={c.text}
                className="glass flex items-center justify-between gap-3 rounded-card p-4"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[15px]">&ldquo;{c.text}&rdquo;</span>
                  <span className="text-sm text-muted">{c.evidence}</span>
                </div>
                <ClaimBadge status={c.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="glass rounded-card p-4 text-sm text-muted">
            No checkable claims. Paste the agent&rsquo;s summary next time to check what it said.
          </p>
        )}
      </Section>

      <details className="rounded-card px-1">
        <summary className="cursor-pointer text-sm text-muted hover:text-ink">
          Files checked ({result.files.length})
          {result.skipped.length > 0 ? `, ${result.skipped.length} skipped` : ''}
        </summary>
        <ul className="mt-3 flex flex-col gap-1 font-mono text-[12.5px]">
          {result.files.map((f) => (
            <li
              key={f.path}
              className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2"
            >
              <span className="truncate">{f.path}</span>
              <span className="shrink-0">
                <span className="text-ok">+{f.added}</span>{' '}
                <span className="text-bad">-{f.removed}</span>
              </span>
            </li>
          ))}
          {result.skipped.map((path) => (
            <li
              key={path}
              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-muted"
            >
              <span className="truncate">{path}</span>
              <span className="shrink-0 font-sans text-[12px]">skipped (generated)</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
