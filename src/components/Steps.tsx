// The whole product in three steps. Shown at the top of each step so you always know where you are.

const STEPS = ['Speak and send', 'Check the work', 'Done or not'] as const

export function Steps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol
      aria-label="Steps"
      className="mb-6 flex items-center gap-2 text-[12px] sm:gap-3 sm:text-[13px]"
    >
      {STEPS.map((label, i) => {
        const n = i + 1
        const state = n < current ? 'done' : n === current ? 'now' : 'next'
        return (
          <li
            key={label}
            aria-current={state === 'now' ? 'step' : undefined}
            className="flex min-w-0 items-center gap-2"
          >
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                state === 'done'
                  ? 'bg-ok text-canvas'
                  : state === 'now'
                    ? 'bg-ink text-canvas'
                    : 'bg-surface-2 text-muted'
              }`}
              aria-hidden="true"
            >
              {state === 'done' ? '✓' : n}
            </span>
            <span
              className={`truncate ${state === 'now' ? 'font-medium text-ink' : 'text-muted'} ${
                state === 'now' ? '' : 'hidden sm:inline'
              }`}
            >
              {label}
              <span className="sr-only">{state === 'done' ? ' (done)' : ''}</span>
            </span>
            {n < STEPS.length ? (
              <span className="h-px w-4 bg-hairline-strong sm:w-8" aria-hidden="true" />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
