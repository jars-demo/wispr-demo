import type { Breakdown } from '../breakdown'
import type { FeedItem } from '../feed'

import { BACKOFF_BREAKDOWN } from './backoff'
import { DEBOUNCE_BREAKDOWN } from './debounce'
import { BACKOFF_DIFF, DEBOUNCE_DIFF, PAGINATION_DIFF, RATE_LIMIT_DIFF } from './diffs'
import { PAGINATION_BREAKDOWN } from './pagination'
import { RATE_LIMIT_BREAKDOWN } from './rate-limit'

// Demo mode: four ready-made breakdowns of sample changes. They need no AI key and no network,
// and play the same way every time, so a demo never depends on a live model.

export type Sample = {
  id: string
  item: Omit<FeedItem, 'at'> & { minutesAgo: number }
  diff: string
  breakdown: Breakdown
}

const sample = (
  id: string,
  kind: FeedItem['kind'],
  repo: string,
  title: string,
  minutesAgo: number,
  diff: string,
  breakdown: Breakdown,
): Sample => ({
  id,
  item: {
    id: `sample:${id}`,
    kind,
    repo,
    title,
    author: 'your agent',
    url: null,
    additions: null,
    deletions: null,
    source: { kind: 'sample', id },
    minutesAgo,
  },
  diff,
  breakdown,
})

export const SAMPLES: readonly Sample[] = [
  sample(
    'pagination',
    'pr',
    'sample/blog-api',
    'feat(api): paginate /posts with cursors',
    4,
    PAGINATION_DIFF,
    PAGINATION_BREAKDOWN,
  ),
  sample(
    'backoff',
    'commit',
    'sample/billing-sync',
    'fix(sync): retry flaky invoice webhooks with backoff',
    38,
    BACKOFF_DIFF,
    BACKOFF_BREAKDOWN,
  ),
  sample(
    'debounce',
    'pr',
    'sample/storefront',
    'perf(search): debounce queries and cancel stale requests',
    95,
    DEBOUNCE_DIFF,
    DEBOUNCE_BREAKDOWN,
  ),
  sample(
    'rate-limit',
    'commit',
    'sample/blog-api',
    'feat(api): token bucket rate limiting',
    260,
    RATE_LIMIT_DIFF,
    RATE_LIMIT_BREAKDOWN,
  ),
]

export function sampleById(id: string): Sample | undefined {
  return SAMPLES.find((s) => s.id === id)
}
