import { CLAIM_COPY, type ClaimStatus } from '@/domain/claim'

const TONE: Record<ClaimStatus, string> = {
  supported: 'bg-ok-wash text-ok',
  contradicted: 'bg-bad-wash text-bad',
  unverifiable: 'bg-unknown-wash text-unknown',
}

const GLYPH: Record<ClaimStatus, string> = {
  supported: '✓',
  contradicted: '✕',
  unverifiable: '?',
}

export function ClaimBadge({ status }: { status: ClaimStatus }) {
  const copy = CLAIM_COPY[status]
  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium ${TONE[status]}`}
    >
      <span aria-hidden="true" className="font-mono text-[11px]">
        {GLYPH[status]}
      </span>
      {copy.label}
      <span className="sr-only">. {copy.meaning}</span>
    </span>
  )
}
