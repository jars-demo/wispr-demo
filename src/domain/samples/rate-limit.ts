import type { Breakdown } from '../breakdown'

export const RATE_LIMIT_BREAKDOWN: Breakdown = {
  title: 'Token bucket rate limiting for the API',
  gist: 'Your agent added middleware that gives every client a bucket of 10 tokens refilled at 2 per second. Each request spends one; an empty bucket gets 429 Too Many Requests with a Retry-After hint.',
  kind: 'feature',
  difficulty: 'advanced',
  steps: [
    {
      title: 'Gave each client a bucket',
      detail:
        'Buckets are kept in a Map keyed by IP address. A new client starts with a full bucket of CAPACITY tokens.',
      refs: ['F1.L3', 'F1.L7', 'F1.L9', 'F1.L12', 'F1.L14'],
    },
    {
      title: 'Refilled lazily on each request',
      detail:
        'There is no timer. On every request it works out how much time passed and adds that many tokens, never above CAPACITY.',
      refs: ['F1.L16', 'F1.L17', 'F1.L18', 'F1.L19'],
    },
    {
      title: 'Rejected with 429 and Retry-After',
      detail:
        'With less than one token left, the client gets 429 and a Retry-After header saying how many seconds until a token is back.',
      refs: ['F1.L21', 'F1.L22', 'F1.L23', 'F1.L25'],
    },
    {
      title: 'Spent a token and let the request through',
      detail: 'Otherwise one token is taken and next() passes the request on to the route.',
      refs: ['F1.L28', 'F1.L30'],
    },
    {
      title: 'Mounted it before the routes',
      detail:
        "app.use('/api', rateLimit) comes before the posts router, so every /api request is checked first.",
      refs: ['F2.L2', 'F2.L8', 'F2.L9'],
    },
  ],
  concepts: [
    {
      name: 'Token bucket',
      oneLiner: 'Allow bursts, enforce an average rate.',
      explain:
        'A bucket holds up to N tokens and refills at a steady rate. Requests spend tokens. A quiet client can burst up to N at once, but over time nobody can beat the refill rate.',
      whyHere:
        'Real users click in bursts. A strict one-per-half-second rule would block normal use; the bucket allows bursts of 10.',
      analogy: 'An arcade card topped up with 2 credits a second, holding at most 10.',
      refs: ['F1.L5', 'F1.L6', 'F1.L7', 'F1.L8'],
    },
    {
      name: 'Lazy refill',
      oneLiner: 'Compute the refill when needed instead of running a timer.',
      explain:
        'Storing the last update time lets you calculate how many tokens have accrued at the moment a request arrives. No background job, and idle clients cost nothing.',
      whyHere: 'A timer per client would waste CPU for clients that never come back.',
      analogy: 'Working out interest when you check your balance, not every second.',
      refs: ['F1.L16', 'F1.L17', 'F1.L18'],
    },
    {
      name: 'In-process state does not scale out',
      oneLiner: 'A Map lives in one server, not all of them.',
      explain:
        'With two servers behind a load balancer, each has its own Map, so a client effectively gets double the limit. Shared stores like Redis fix this.',
      whyHere: 'The agent left a note about it, which is the honest limit of this change.',
      analogy: 'Two bouncers at two doors, each counting guests separately.',
      refs: ['F1.L9', 'F1.L33'],
    },
  ],
  quiz: [
    {
      question:
        'A client that has been idle for a minute sends 15 requests at once. How many succeed?',
      options: ['15', '10', '2', '1'],
      answer: 1,
      why: 'The bucket is full at CAPACITY (10). Each request spends one token, and the burst arrives faster than the refill.',
      refs: ['F1.L7', 'F1.L18', 'F1.L28'],
    },
    {
      question: 'What does a rejected client receive?',
      options: [
        '500 and a stack trace',
        '429 with a Retry-After header',
        '403 Forbidden',
        'The request waits until a token is free',
      ],
      answer: 1,
      why: 'The middleware sets Retry-After and responds with status 429.',
      refs: ['F1.L23', 'F1.L25'],
    },
    {
      question: 'The app runs on 3 servers. What is the real burst limit per client?',
      options: ['10', 'Up to 30', '2', 'Unlimited'],
      answer: 1,
      why: 'Each server keeps its own Map of buckets, so a client spread across 3 servers could get 10 on each.',
      refs: ['F1.L9', 'F1.L33'],
    },
  ],
  explainBack: {
    prompt: 'Explain how this rate limiter decides whether a request goes through.',
    keyPoints: [
      { point: 'Each client has a bucket of tokens', keywords: ['bucket', 'tokens', 'token'] },
      {
        point: 'Tokens refill over time based on elapsed seconds',
        keywords: ['refill', 'elapsed', 'over time', 'per second'],
      },
      {
        point: 'A request spends a token, and with none left it gets 429',
        keywords: ['429', 'too many', 'reject', 'spend', 'empty'],
      },
      {
        point: 'Bursts are allowed up to the capacity',
        keywords: ['burst', 'capacity', 'ten', '10'],
      },
    ],
  },
  explore: [
    'Sliding window counters',
    'Redis-based distributed rate limits',
    'Leaky bucket algorithm',
  ],
}
