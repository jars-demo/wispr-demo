import type { Breakdown } from '../breakdown'

export const DEBOUNCE_BREAKDOWN: Breakdown = {
  title: 'Debounced search that cancels stale requests',
  gist: 'Your agent stopped the search box from calling the API on every keystroke: it now waits until typing pauses for 300 ms, and cancels the previous request so an old, slow answer can never overwrite a newer one.',
  kind: 'performance',
  difficulty: 'starter',
  steps: [
    {
      title: 'Wrote a useDebouncedValue hook',
      detail:
        'The hook starts a timer each time the value changes and only updates its output when the timer finishes. A new keystroke clears the old timer first.',
      refs: ['F1.L4', 'F1.L7', 'F1.L8', 'F1.L9'],
    },
    {
      title: 'Searched the settled value, not every keystroke',
      detail:
        'The effect now depends on debounced instead of query, so typing "react" sends one request instead of five.',
      refs: ['F2.L8', 'F2.L22', 'F2.L27'],
    },
    {
      title: 'Cleared results for an empty box',
      detail: 'Deleting the text now empties the list instead of leaving old results on screen.',
      refs: ['F2.L13', 'F2.L14', 'F2.L15'],
    },
    {
      title: 'Cancelled the previous request',
      detail:
        'Each effect run creates an AbortController and its cleanup aborts it. When the query changes, the old fetch is cancelled before the new one starts.',
      refs: ['F2.L17', 'F2.L18', 'F2.L19', 'F2.L26'],
    },
    {
      title: 'Ignored the expected abort error',
      detail:
        'An aborted fetch rejects with AbortError. That is normal here, so it is swallowed; any other error is still thrown.',
      refs: ['F2.L23', 'F2.L24'],
    },
  ],
  concepts: [
    {
      name: 'Debouncing',
      oneLiner: 'Wait for the input to stop changing, then act once.',
      explain:
        'A debounce restarts a timer on every change and only fires when the timer completes. Rapid bursts collapse into a single action at the end.',
      whyHere: 'Search fired a request per keystroke, wasting server work and flickering results.',
      analogy: 'A lift door that waits until people stop walking in before it closes.',
      refs: ['F1.L7', 'F1.L8', 'F2.L8'],
    },
    {
      name: 'Race conditions in the UI',
      oneLiner: 'Answers can arrive in a different order than requests.',
      explain:
        'If "rea" takes 900 ms and "react" takes 100 ms, the older answer lands last and overwrites the right one. Cancelling the old request removes the race.',
      whyHere: 'Search APIs answer short queries slower because they match more rows.',
      analogy: 'Two letters posted on different days can arrive in the wrong order.',
      refs: ['F2.L17', 'F2.L19', 'F2.L26'],
    },
    {
      name: 'Effect cleanup',
      oneLiner: 'What a useEffect returns runs before the next run.',
      explain:
        'React calls the cleanup function before re-running an effect and when the component unmounts. It is the right place to clear timers and abort requests.',
      whyHere:
        'Both the timer in the hook and the fetch in the search box are cleaned up this way.',
      analogy: 'Washing your cup before making the next coffee.',
      refs: ['F1.L8', 'F2.L26'],
    },
  ],
  quiz: [
    {
      question:
        'You type "hello" quickly, one letter every 50 ms. How many search requests are sent?',
      options: ['5', '1', '0', '2'],
      answer: 1,
      why: 'Every keystroke restarts the 300 ms timer, so only the final value "hello" settles and is searched.',
      refs: ['F1.L7', 'F1.L8', 'F2.L8'],
    },
    {
      question: 'What stops an old, slow response from replacing newer results?',
      options: [
        'The 300 ms delay',
        'query.trim()',
        'Aborting the previous fetch in the effect cleanup',
        'ResultList ignores old data',
      ],
      answer: 2,
      why: 'The cleanup calls controller.abort(), so the earlier request is cancelled before the new one starts.',
      refs: ['F2.L18', 'F2.L26'],
    },
    {
      question: 'Why is AbortError caught and ignored?',
      options: [
        'Aborting is expected here, so it is not a real failure',
        'It hides all network errors',
        'Fetch never throws',
        'To retry the request',
      ],
      answer: 0,
      why: 'Aborts happen on purpose every time the query changes. Other errors are still rethrown.',
      refs: ['F2.L23', 'F2.L24'],
    },
  ],
  explainBack: {
    prompt: 'Explain why the new search box sends fewer requests and never shows stale results.',
    keyPoints: [
      {
        point: 'It waits until typing pauses before searching',
        keywords: ['debounce', 'debounced', 'wait', 'pause', 'stop typing', 'timer'],
      },
      {
        point: 'Each keystroke resets the timer',
        keywords: ['reset', 'restart', 'clear', 'cleartimeout'],
      },
      {
        point: 'The previous request is cancelled',
        keywords: ['abort', 'cancel', 'abortcontroller'],
      },
      {
        point: 'This prevents an old answer from overwriting a new one',
        keywords: ['stale', 'race', 'out of order', 'old answer', 'overwrite'],
      },
    ],
  },
  explore: [
    'Throttling versus debouncing',
    'React Query or SWR request deduping',
    'Server-side search indexes',
  ],
}
