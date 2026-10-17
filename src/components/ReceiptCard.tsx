import { agentName } from '@/domain/agent-handoff'
import type { ReceiptStatus } from '@/domain/receipt-status'
import { groupByKind, type SpecItem } from '@/domain/spec'

import { ReceiptStamp } from './ReceiptStamp'

// A receipt, drawn like one: torn edges, mono print, dashed rules, the work as line items, and
// the status stamped on top. Everything printed comes from the saved receipt.

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
})

function Group({ label, items }: { label: string; items: SpecItem[] }) {
  if (items.length === 0) return null
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">{label}</h2>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item.code} className="flex gap-3">
            <span className="w-7 shrink-0 pt-0.5 font-mono text-[12px] text-muted">
              {item.code}
            </span>
            <span className="min-w-0 text-[15px] leading-relaxed text-ink">
              {item.text}
              {item.acceptance ? (
                <span className="block text-[13px] text-muted">Done when: {item.acceptance}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** A decorative barcode drawn from the receipt id, so every receipt has its own. */
function Barcode({ seed }: { seed: string }) {
  const bars = seed.replace(/-/g, '').split('')
  return (
    <div className="flex h-9 items-stretch justify-center gap-[2px]" aria-hidden="true">
      {bars.map((char, i) => (
        <span
          key={i}
          className="bg-ink/80"
          style={{ width: `${(parseInt(char, 16) % 3) + 1}px` }}
        />
      ))}
    </div>
  )
}

export function ReceiptCard({
  id,
  title,
  items,
  updatedAt,
  sentVia,
  status,
  checkLine,
  children,
}: {
  id: string
  title: string
  items: SpecItem[]
  updatedAt: Date
  sentVia: string | null
  status: ReceiptStatus
  checkLine: string
  children?: React.ReactNode
}) {
  const groups = groupByKind(items)
  return (
    <div className="receipt-shadow rise">
      <article className="receipt-paper flex flex-col gap-5 px-5 pt-9 pb-10 sm:px-9">
        <header className="flex flex-col gap-1">
          <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
            <span>Receipts</span>
            <span>No. {id.slice(0, 8)}</span>
          </div>
          <span className="font-mono text-[11px] text-muted">
            {dateFormat.format(updatedAt)} UTC
          </span>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="min-w-0 font-display text-4xl leading-[1.02] tracking-[-0.03em] text-balance sm:text-5xl">
              {title}
            </h1>
            <div className="shrink-0 self-end pr-2 sm:self-auto sm:pt-1 sm:pr-0">
              <ReceiptStamp status={status} />
            </div>
          </div>
        </header>
        <hr className="receipt-rule" />
        <Group label="To do" items={groups.requirement} />
        <Group label="Leave alone" items={groups.non_goal} />
        <Group label="Ask first" items={groups.open_question} />
        <hr className="receipt-rule" />
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-mono text-[12.5px]">
          <dt className="text-muted">ITEMS</dt>
          <dd className="text-right">{items.length}</dd>
          <dt className="text-muted">SENT TO</dt>
          <dd className="text-right">{sentVia ? agentName(sentVia) : 'Not yet'}</dd>
          <dt className="text-muted">CHECKED</dt>
          <dd className="text-right">{checkLine}</dd>
        </dl>
        <Barcode seed={id} />
        {children}
      </article>
    </div>
  )
}
