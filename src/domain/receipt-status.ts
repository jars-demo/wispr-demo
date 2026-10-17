import { agentName } from './agent-handoff'
import type { CheckResult } from './check/engine'
import { describeCheck } from './check/report'

// Where a receipt is in its life: ready to send, sent and waiting for a check, or checked. One
// pure function, so the list, the receipt page and the tests all agree.

export type ReceiptStage = 'ready' | 'sent' | 'checked'
export type ReceiptTone = 'neutral' | 'progress' | 'ok' | 'warn'

export type ReceiptStatus = {
  stage: ReceiptStage
  /** Short, for the stamp: "Sent to Copilot", "2 of 3 done". */
  label: string
  /** The stamp's second line: "Not checked yet", "Needs work". */
  detail: string
  tone: ReceiptTone
  /** The full sentence about the last check, when there is one. */
  summary?: string
}

export function receiptStatus(input: {
  sentAt: Date | string | null
  sentVia: string | null
  lastCheck: CheckResult | null
  /** When the last check ran. A send after it means the new work is not checked yet. */
  lastCheckAt?: Date | string | null
}): ReceiptStatus {
  const resentSince =
    input.sentAt && input.lastCheckAt
      ? new Date(input.sentAt).getTime() > new Date(input.lastCheckAt).getTime()
      : false
  const check = resentSince ? null : input.lastCheck
  if (check) {
    const { found, total } = check.summary
    const clean =
      found === total &&
      !check.nonGoals.some((n) => n.status === 'violated') &&
      !check.claims.some((c) => c.status === 'contradicted')
    return clean
      ? {
          stage: 'checked',
          label: 'Done',
          detail: 'All verified',
          tone: 'ok',
          summary: describeCheck(check),
        }
      : {
          stage: 'checked',
          label: `${found} of ${total} done`,
          detail: 'Needs work',
          tone: 'warn',
          summary: describeCheck(check),
        }
  }
  if (input.sentAt) {
    return {
      stage: 'sent',
      label: `Sent to ${agentName(input.sentVia)}`,
      detail: 'Not checked yet',
      tone: 'progress',
    }
  }
  return { stage: 'ready', label: 'Ready to send', detail: 'Not sent yet', tone: 'neutral' }
}
