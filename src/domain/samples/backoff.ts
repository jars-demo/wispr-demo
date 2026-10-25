import type { Breakdown } from '../breakdown'

export const BACKOFF_BREAKDOWN: Breakdown = {
  title: 'Retry invoice webhooks with backoff and jitter',
  gist: 'Your agent wrapped the invoice webhook in a retry helper: temporary failures are retried with growing, randomised waits, and an idempotency key stops the receiver from billing twice.',
  kind: 'fix',
  difficulty: 'intermediate',
  steps: [
    {
      title: 'Added a reusable withRetry helper',
      detail:
        'withRetry runs a task, and on failure tries again up to 5 times. It returns the first success or throws the last error.',
      refs: ['F1.L11', 'F1.L13', 'F1.L15', 'F1.L17', 'F1.L19'],
    },
    {
      title: 'Retried only failures that can pass',
      detail:
        'Network errors, 429 (too many requests) and 5xx server errors are retried. A 400 or 404 will fail the same way every time, so it is thrown right away.',
      refs: ['F1.L5', 'F1.L6', 'F1.L8', 'F1.L19'],
    },
    {
      title: 'Waited longer after each failure',
      detail:
        'The wait ceiling doubles each attempt (200, 400, 800 ms) and never passes maxMs, giving a struggling server room to recover.',
      refs: ['F1.L20', 'F1.L21'],
    },
    {
      title: 'Randomised each wait',
      detail:
        'Math.random() * ceiling picks a wait anywhere up to the ceiling, so thousands of clients that failed together do not all retry at the same instant.',
      refs: ['F1.L22', 'F1.L23'],
    },
    {
      title: 'Made retries safe with an idempotency key',
      detail:
        'Every attempt sends the same Idempotency-Key, the invoice id. If an attempt actually succeeded but the answer was lost, the receiver can see the repeat and ignore it.',
      refs: ['F2.L13', 'F2.L18', 'F2.L19', 'F2.L23'],
    },
  ],
  concepts: [
    {
      name: 'Exponential backoff',
      oneLiner: 'Each retry waits about twice as long as the last.',
      explain:
        'Quick retries hammer a service that is already in trouble. Doubling the wait gives it time to recover while still retrying fast for short blips.',
      whyHere:
        'Webhook receivers go down or rate limit. Retrying instantly five times would just fail five times.',
      analogy: 'Knocking on a door, then waiting a little longer each time before knocking again.',
      refs: ['F1.L20', 'F1.L21'],
    },
    {
      name: 'Jitter',
      oneLiner: 'Add randomness so clients do not retry in lockstep.',
      explain:
        'If many clients fail at the same moment and use the same delays, they retry at the same moment too, and the spike repeats. Random waits spread them out. This is called the thundering herd problem.',
      whyHere: 'An outage fails every pending invoice webhook at once.',
      analogy:
        'After a fire drill, people leave the building at slightly different times instead of all hitting the door together.',
      refs: ['F1.L22', 'F1.L23'],
    },
    {
      name: 'Idempotency',
      oneLiner: 'Doing it twice has the same effect as doing it once.',
      explain:
        'Retries can duplicate work when a request succeeded but the response was lost. A unique key per operation lets the receiver recognise the repeat and skip it.',
      whyHere: 'Charging or recording an invoice twice is a real money bug.',
      analogy: 'Pressing a lift button five times still calls one lift.',
      refs: ['F2.L18', 'F2.L19'],
    },
  ],
  quiz: [
    {
      question: 'The webhook URL answers 404 Not Found. What happens?',
      options: [
        'It retries 5 times with backoff',
        'It throws right away without retrying',
        'It waits maxMs and tries once more',
        'It silently succeeds',
      ],
      answer: 1,
      why: 'isRetryable only allows network errors, 429 and 5xx. A 404 will not fix itself.',
      refs: ['F1.L8', 'F1.L19'],
    },
    {
      question: 'What is the longest single wait between two attempts?',
      options: ['200 ms', '800 ms', '5000 ms', 'There is no limit'],
      answer: 2,
      why: 'The ceiling is Math.min(maxMs, ...) and maxMs defaults to 5000, and jitter only picks a wait up to that ceiling.',
      refs: ['F1.L13', 'F1.L21', 'F1.L23'],
    },
    {
      question: 'Why does every attempt send the same Idempotency-Key?',
      options: [
        'To authenticate the request',
        'So the receiver can ignore repeats of an attempt that already worked',
        'To make the request faster',
        'GitHub requires it',
      ],
      answer: 1,
      why: 'A retry may repeat a request that already succeeded. The same key lets the receiver drop the duplicate.',
      refs: ['F2.L18', 'F2.L19'],
    },
  ],
  explainBack: {
    prompt:
      'Explain what happens now when the webhook receiver is briefly down, and why it will not bill twice.',
    keyPoints: [
      {
        point: 'It retries temporary failures a limited number of times',
        keywords: ['retry', 'retries', 'try again', 'attempts'],
      },
      {
        point: 'The wait grows after each failure',
        keywords: ['backoff', 'exponential', 'longer', 'doubles', 'wait'],
      },
      {
        point: 'The waits are randomised to avoid everyone retrying at once',
        keywords: ['jitter', 'random', 'spread', 'thundering herd'],
      },
      {
        point: 'The same idempotency key prevents duplicates',
        keywords: ['idempotency', 'idempotent', 'same key', 'duplicate', 'twice'],
      },
    ],
  },
  explore: ['Circuit breakers', 'Dead letter queues', 'Retry budgets in service meshes'],
}
