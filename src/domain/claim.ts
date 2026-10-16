// What Receipts concluded about something your agent said it did, checked against evidence.

export const CLAIM_STATUSES = ['supported', 'contradicted', 'unverifiable'] as const

export type ClaimStatus = (typeof CLAIM_STATUSES)[number]

export const CLAIM_COPY: Record<ClaimStatus, { label: string; meaning: string }> = {
  supported: { label: 'Backed up', meaning: 'The evidence agrees with what the agent said.' },
  contradicted: { label: 'Not true', meaning: 'The evidence says otherwise.' },
  unverifiable: { label: "Can't tell", meaning: 'Nothing you provided proves it either way.' },
}
