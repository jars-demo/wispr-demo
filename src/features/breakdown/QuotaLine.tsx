'use client'

import { Infinity as InfinityIcon, Sparkles } from 'lucide-react'
import Link from 'next/link'

import { AI_PROVIDER_INFO } from '@/domain/ai'
import { aiKeyStore } from '@/features/connect/connection'
import { useHydrated } from '@/lib/local-store'

import { minutesUntil, useQuota } from './quota'

// One quiet line under the search bar: how many free AI breakdowns are left this hour, or
// "unlimited" with the player's own key. Samples and links someone already opened are free.

export function QuotaLine() {
  const hydrated = useHydrated()
  const own = aiKeyStore.use()
  const quota = useQuota()

  if (!hydrated) return <p className="h-5" aria-hidden="true" />

  if (own) {
    return (
      <p className="flex items-center gap-1.5 text-[13px] text-muted">
        <InfinityIcon aria-hidden="true" className="size-4 text-ok" />
        Unlimited breakdowns with your {AI_PROVIDER_INFO[own.provider].label} key.
      </p>
    )
  }
  if (!quota) return <p className="h-5" aria-hidden="true" />
  if (!quota.live) {
    return (
      <p className="text-[13px] text-muted">
        Samples work right away.{' '}
        <Link href="/settings#ai" className="font-medium text-accent-text hover:underline">
          Add your own AI key
        </Link>{' '}
        for live breakdowns.
      </p>
    )
  }
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-[13px] text-muted">
      <Sparkles aria-hidden="true" className="size-3.5 text-accent-text" />
      {quota.left > 0 ? (
        <span>
          <span className="font-medium text-ink tabular-nums">
            {quota.left} of {quota.limit}
          </span>{' '}
          free AI breakdowns left this hour.
        </span>
      ) : (
        <span>
          Free breakdowns are back in {minutesUntil(quota.resetsInSeconds)}. Links others opened
          stay free.
        </span>
      )}
      <Link href="/settings#ai" className="font-medium text-accent-text hover:underline">
        Unlimited with your own key
      </Link>
    </p>
  )
}
