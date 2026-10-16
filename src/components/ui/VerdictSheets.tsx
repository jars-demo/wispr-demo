import { VERDICT_TONE, VerdictIcon, verdictSheetId } from '@/components/ui/VerdictBadge'
import { VERDICT_COPY, VERDICT_KINDS } from '@/domain/verdict'

// One native popover per verdict. Light-dismiss, Escape and focus return come from the browser.

export function VerdictSheets() {
  return (
    <>
      {VERDICT_KINDS.map((kind) => {
        const copy = VERDICT_COPY[kind]
        const titleId = `${verdictSheetId(kind)}-title`
        return (
          <div
            key={kind}
            id={verdictSheetId(kind)}
            popover="auto"
            role="dialog"
            aria-labelledby={titleId}
            className="sheet glass-strong shadow-lift"
          >
            <div className="flex flex-col gap-4 p-6">
              <span
                className={`inline-flex size-10 items-center justify-center rounded-full ${VERDICT_TONE[kind]}`}
              >
                <VerdictIcon kind={kind} size={20} />
              </span>
              <div className="flex flex-col gap-1.5">
                <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                  {copy.label}
                </h2>
                <p className="text-[15px] leading-relaxed text-ink-2">{copy.meaning}</p>
                <p className="text-sm leading-relaxed text-muted">{copy.needs}</p>
              </div>
              <button
                type="button"
                popoverTarget={verdictSheetId(kind)}
                popoverTargetAction="hide"
                className="h-10 rounded-full bg-ink text-sm font-medium text-canvas transition-opacity hover:opacity-90"
              >
                Got it
              </button>
            </div>
          </div>
        )
      })}
    </>
  )
}
