import type { ReceiptStatus, ReceiptTone } from '@/domain/receipt-status'

// The receipt's status as a rubber stamp. Colour is never the only signal: the words say it too.

const TONE: Record<ReceiptTone, string> = {
  neutral: 'text-unknown',
  progress: 'text-accent-text',
  ok: 'text-ok',
  warn: 'text-warn',
}

export function ReceiptStamp({
  status,
  size = 'lg',
}: {
  status: ReceiptStatus
  size?: 'sm' | 'lg'
}) {
  return (
    <span
      className={`stamp max-w-[12rem] text-center ${TONE[status.tone]} ${size === 'lg' ? 'text-[15px]' : 'text-[10.5px]'}`}
      aria-label={`Status: ${status.label}. ${status.detail}.`}
    >
      <span>{status.label}</span>
      {size === 'lg' ? (
        <span className="text-[9.5px] font-semibold tracking-[0.18em]">{status.detail}</span>
      ) : null}
    </span>
  )
}
