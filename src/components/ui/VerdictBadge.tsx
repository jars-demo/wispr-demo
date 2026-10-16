import { VERDICT_COPY, type VerdictKind } from '@/domain/verdict'

// Each verdict has its own shape and label, so colour is never the only signal.
// With `explain`, the badge opens that verdict's sheet (render <VerdictSheets /> once per page).

export const VERDICT_TONE: Record<VerdictKind, string> = {
  evidence_found: 'bg-ok-wash text-ok',
  partial: 'bg-warn-wash text-warn',
  not_found: 'bg-bad-wash text-bad',
  violates_non_goal: 'bg-breach-wash text-breach',
  unverifiable: 'bg-unknown-wash text-unknown',
}

export function verdictSheetId(kind: VerdictKind): string {
  return `verdict-sheet-${kind}`
}

export function VerdictIcon({ kind, size = 14 }: { kind: VerdictKind; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  switch (kind) {
    case 'evidence_found':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.25" />
          <path d="m5.25 8.25 1.9 1.9 3.6-4" />
        </svg>
      )
    case 'partial':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.25" />
          <path d="M8 1.75v12.5A6.25 6.25 0 0 0 8 1.75Z" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'not_found':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.25" />
          <path d="m5.75 5.75 4.5 4.5m0-4.5-4.5 4.5" />
        </svg>
      )
    case 'violates_non_goal':
      return (
        <svg {...common}>
          <path d="M8 1.9 14.6 13.6H1.4Z" />
          <path d="M8 6.5v3M8 11.6v.05" />
        </svg>
      )
    case 'unverifiable':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.25" strokeDasharray="2.2 2.2" />
          <path d="M5.5 8h5" />
        </svg>
      )
  }
}

const BADGE =
  'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium'

export function VerdictBadge({ kind, explain = false }: { kind: VerdictKind; explain?: boolean }) {
  const copy = VERDICT_COPY[kind]
  const content = (
    <>
      <VerdictIcon kind={kind} />
      {copy.label}
    </>
  )
  if (!explain) return <span className={`${BADGE} ${VERDICT_TONE[kind]}`}>{content}</span>
  return (
    <button
      type="button"
      popoverTarget={verdictSheetId(kind)}
      aria-label={`${copy.label}: what this means`}
      className={`${BADGE} ${VERDICT_TONE[kind]} cursor-pointer transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]`}
    >
      {content}
    </button>
  )
}
