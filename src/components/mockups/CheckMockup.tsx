import { SAMPLE_CHECK } from '@/components/mockups/sample'
import { SampleLabel } from '@/components/mockups/SampleLabel'
import { ClaimBadge } from '@/components/ui/ClaimBadge'
import { VerdictBadge } from '@/components/ui/VerdictBadge'
import { EVIDENCE_SOURCE_COPY } from '@/domain/evidence-source'

// Static picture of a check result. Verdict badges open their explanation sheets, so the page
// that renders this must also render <VerdictSheets /> once.

export function CheckMockup({ compact = false }: { compact?: boolean }) {
  const { title, sources, verdicts, claims } = SAMPLE_CHECK
  const shown = compact ? verdicts.slice(0, 3) : verdicts
  const found = verdicts.filter((v) => v.verdict === 'evidence_found').length

  return (
    <figure className="glass rounded-panel p-5 sm:p-7">
      <figcaption className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <ul aria-label="Evidence used" className="flex flex-wrap gap-1.5">
            {sources.map((s) => (
              <li key={s} className="rounded-full bg-surface-2 px-2.5 py-1 text-[12px] text-ink-2">
                {EVIDENCE_SOURCE_COPY[s].label}
              </li>
            ))}
          </ul>
          <span className="text-lg font-semibold tracking-tight">{title}</span>
          <span className="text-sm text-ink-2">
            {found} of {verdicts.length} found. Tap a status to see what it means.
          </span>
        </div>
        <SampleLabel />
      </figcaption>

      <ol className="flex flex-col gap-2">
        {shown.map((v) => (
          <li key={v.code} className="flex flex-col gap-3 rounded-card bg-surface/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="flex min-w-0 gap-3 text-[15px]">
                <span className="pt-0.5 font-mono text-xs font-semibold text-accent-text">
                  {v.code}
                </span>
                <span>{v.requirement}</span>
              </p>
              <VerdictBadge kind={v.verdict} explain />
            </div>
            <p className="pl-8 text-sm text-muted">{v.reason}</p>
            {v.citation && !compact ? (
              <div className="ml-8 overflow-hidden rounded-xl bg-surface-2">
                <div className="flex items-center justify-between gap-2 px-3 pt-2 font-mono text-[11px] text-muted">
                  <span className="truncate">{v.citation.file}</span>
                  <span className="shrink-0">{v.citation.lines}</span>
                </div>
                <pre className="overflow-x-auto px-3 pt-1 pb-2.5 font-mono text-[12.5px] leading-relaxed">
                  <code>{v.citation.quote}</code>
                </pre>
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      {!compact ? (
        <section className="mt-6 flex flex-col gap-2">
          <h4 className="px-1 text-[13px] font-medium text-muted">What your agent said</h4>
          <ul className="flex flex-col gap-2">
            {claims.map((claim) => (
              <li
                key={claim.text}
                className="flex items-center justify-between gap-3 rounded-card bg-surface/70 p-4"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[15px]">&ldquo;{claim.text}&rdquo;</span>
                  <span className="text-sm text-muted">{claim.evidence}</span>
                </div>
                <ClaimBadge status={claim.status} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </figure>
  )
}
