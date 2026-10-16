import { groupByKind, SPEC_ITEM_COPY, SPEC_ITEM_KINDS, type SpecItem } from '@/domain/spec'

// Read-only checklist, grouped. Server component.

export function SpecView({ items }: { items: SpecItem[] }) {
  const groups = groupByKind(items)
  return (
    <div className="flex flex-col gap-8">
      {SPEC_ITEM_KINDS.filter((kind) => groups[kind].length > 0).map((kind) => (
        <section key={kind} aria-labelledby={`view-${kind}`} className="flex flex-col gap-2">
          <h2 id={`view-${kind}`} className="px-1 text-[13px] font-medium text-muted">
            {SPEC_ITEM_COPY[kind].group}
          </h2>
          <ol className="glass flex flex-col gap-1 rounded-panel p-2">
            {groups[kind].map((item) => (
              <li key={item.code} className="flex gap-3 rounded-card px-3 py-3">
                <span
                  className={`w-7 shrink-0 pt-0.5 font-mono text-xs font-semibold ${kind === 'open_question' ? 'text-warn' : kind === 'non_goal' ? 'text-muted' : 'text-accent-text'}`}
                >
                  {item.code}
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[15px] leading-relaxed">{item.text}</span>
                  {item.acceptance ? (
                    <span className="text-sm text-ink-2">Done when {item.acceptance}</span>
                  ) : null}
                  {item.note ? <span className="text-[13px] text-warn">{item.note}</span> : null}
                  {item.sourceQuote ? (
                    <span className="text-[13px] text-muted">
                      You said: &ldquo;{item.sourceQuote}&rdquo;
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
