import { SAMPLE_SPEC, SAMPLE_TRANSCRIPT } from '@/components/mockups/sample'
import { SampleLabel } from '@/components/mockups/SampleLabel'

// Static picture of the "what you asked for" screen. `inert` keeps the fake controls out of
// the tab order and away from screen-reader interaction.

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="px-1 text-[13px] font-medium text-muted">{title}</h4>
      {children}
    </section>
  )
}

export function SpecMockup() {
  return (
    <figure className="glass rounded-panel p-5 sm:p-7">
      <figcaption className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <span className="text-lg font-semibold tracking-tight">{SAMPLE_SPEC.title}</span>
        <SampleLabel />
      </figcaption>

      <div inert className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col gap-4 rounded-card bg-surface/70 p-5">
          <span className="inline-flex items-center gap-2 text-[13px] text-muted">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
            What you said
          </span>
          <p className="text-[15px] leading-relaxed text-ink-2">{SAMPLE_TRANSCRIPT}</p>
          <div className="mt-auto flex items-center gap-2 pt-2">
            <span className="inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-medium text-canvas">
              Turn into a receipt
            </span>
            <span className="glass inline-flex size-10 items-center justify-center rounded-full">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect
                  x="5.5"
                  y="1.5"
                  width="5"
                  height="8"
                  rx="2.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M3 7.5a5 5 0 0 0 10 0M8 12.5v2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <Group title="What you asked for">
            <ol className="flex flex-col gap-2">
              {SAMPLE_SPEC.requirements.map((req) => (
                <li key={req.code} className="flex gap-3 rounded-card bg-surface/70 p-4">
                  <span className="pt-0.5 font-mono text-xs font-semibold text-accent-text">
                    {req.code}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-[15px]">{req.text}</span>
                    {req.acceptance ? (
                      <span className="text-sm text-muted">Done when {req.acceptance}</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </Group>

          <div className="grid gap-5 sm:grid-cols-2">
            <Group title="Leave alone">
              {SAMPLE_SPEC.nonGoals.map((item) => (
                <p
                  key={item.code}
                  className="flex gap-3 rounded-card bg-surface/70 p-4 text-[15px]"
                >
                  <span className="pt-0.5 font-mono text-xs font-semibold text-muted">
                    {item.code}
                  </span>
                  {item.text}
                </p>
              ))}
            </Group>
            <Group title="Needs your answer">
              {SAMPLE_SPEC.openQuestions.map((item) => (
                <div key={item.code} className="flex flex-col gap-1 rounded-card bg-warn-wash p-4">
                  <p className="flex gap-3 text-[15px]">
                    <span className="pt-0.5 font-mono text-xs font-semibold text-warn">
                      {item.code}
                    </span>
                    {item.text}
                  </p>
                  <p className="pl-8 text-sm text-warn">{item.why}</p>
                </div>
              ))}
            </Group>
          </div>
        </div>
      </div>
    </figure>
  )
}
