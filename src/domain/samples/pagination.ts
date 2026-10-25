import type { Breakdown } from '../breakdown'

export const PAGINATION_BREAKDOWN: Breakdown = {
  title: 'Cursor pagination for GET /posts',
  gist: 'Your agent replaced page numbers with cursors: the API now returns a page of posts plus a nextCursor that says exactly where the next page starts, so pages stay correct while new posts arrive.',
  kind: 'feature',
  difficulty: 'intermediate',
  steps: [
    {
      title: 'Removed offset paging',
      detail:
        'The old query skipped (page - 1) * 20 rows with OFFSET. The database still reads every skipped row, and a new post shifts everything down by one.',
      refs: ['F1.L11', 'F1.L13', 'F1.L14'],
    },
    {
      title: 'Capped the page size',
      detail:
        'Clients may ask for a limit, but never more than MAX_LIMIT (100), so one request cannot pull the whole table.',
      refs: ['F1.L7', 'F1.L8', 'F1.L17'],
    },
    {
      title: 'Seeked past the last row instead of skipping',
      detail:
        'The WHERE clause compares (created_at, id) with the cursor, so Postgres jumps straight to the right spot using the sort order. The id breaks ties when two posts share a timestamp.',
      refs: ['F1.L18', 'F1.L23', 'F1.L24', 'F1.L25'],
    },
    {
      title: 'Fetched one extra row to detect the end',
      detail:
        'Asking for limit + 1 rows answers "is there another page?" without a second COUNT query. The extra row is sliced off before responding.',
      refs: ['F1.L20', 'F1.L25', 'F1.L28', 'F1.L29'],
    },
    {
      title: 'Made the cursor opaque',
      detail:
        'The cursor is base64url JSON of the last row, so clients pass it back without depending on its shape. Bad input decodes to null instead of crashing.',
      refs: ['F2.L1', 'F2.L5', 'F2.L10', 'F2.L11', 'F1.L34'],
    },
  ],
  concepts: [
    {
      name: 'Cursor (keyset) pagination',
      oneLiner: 'Remember where you stopped, not how many you skipped.',
      explain:
        'Instead of OFFSET n, each page starts after the last row of the previous page. The database uses the index to seek there directly, so page 500 is as fast as page 1.',
      whyHere:
        'Posts are sorted newest first and new ones keep arriving. With offsets, a new post pushes an old one onto the next page and the reader sees it twice.',
      analogy:
        'A bookmark in a book versus counting pages from the start every time you sit down to read.',
      refs: ['F1.L18', 'F1.L23', 'F1.L24'],
    },
    {
      name: 'Tie-breaker sort key',
      oneLiner: 'Sort by something unique, or pages can skip rows.',
      explain:
        'created_at alone is not unique. Sorting and comparing by (created_at, id) gives every row one exact position, so the cursor never lands between two rows with the same time.',
      whyHere:
        'Two posts saved in the same millisecond would otherwise be split unpredictably across pages.',
      analogy: 'Ranking runners by finish time, then by bib number when two finish together.',
      refs: ['F1.L23', 'F1.L24', 'F1.L34'],
    },
    {
      name: 'The limit + 1 trick',
      oneLiner: 'Fetch one more than you need to know if there is more.',
      explain:
        'If the query returns limit + 1 rows, another page exists. You trim the extra row and set nextCursor. When fewer come back, this is the last page and nextCursor is null.',
      whyHere: 'It avoids a separate COUNT(*) query, which gets slow on big tables.',
      analogy: 'Peeking at whether there is one more cookie in the jar without counting them all.',
      refs: ['F1.L25', 'F1.L28', 'F1.L29', 'F1.L34'],
    },
  ],
  quiz: [
    {
      question: 'A client is on the last page. What does the response contain?',
      options: [
        'The posts and nextCursor: null',
        'An empty list and an error',
        'The posts and a cursor that points back to page 1',
        'Exactly 21 posts',
      ],
      answer: 0,
      why: 'Fewer than limit + 1 rows came back, so hasMore is false and nextCursor is null.',
      refs: ['F1.L28', 'F1.L34'],
    },
    {
      question: 'Why does the query compare (created_at, id) instead of only created_at?',
      options: [
        'It makes the SQL shorter',
        'Two posts can share a timestamp, so id gives each row a unique position',
        'Postgres cannot compare timestamps alone',
        'The id is needed to encrypt the cursor',
      ],
      answer: 1,
      why: 'Without the tie-breaker, rows with equal timestamps could be skipped or repeated between pages.',
      refs: ['F1.L23', 'F1.L24'],
    },
    {
      question: 'Someone sends ?limit=5000. How many rows does the database return at most?',
      options: ['5000', '5001', '101', '20'],
      answer: 2,
      why: 'limit is capped at MAX_LIMIT (100), and the query asks for limit + 1 = 101 rows.',
      refs: ['F1.L8', 'F1.L17', 'F1.L25'],
    },
  ],
  explainBack: {
    prompt:
      'In your own words: how does a client get page two now, and why is it better than page numbers?',
    keyPoints: [
      {
        point: 'The client sends back nextCursor from the previous response',
        keywords: ['cursor', 'next cursor', 'nextcursor'],
      },
      {
        point: 'The query starts after the last row instead of skipping rows with OFFSET',
        keywords: ['offset', 'skip', 'after the last', 'seek', 'where'],
      },
      {
        point: 'Results stay correct when new posts arrive',
        keywords: ['new post', 'duplicate', 'shift', 'consistent', 'stable'],
      },
      {
        point: 'One extra row tells whether another page exists',
        keywords: ['extra row', 'limit + 1', 'one more', 'has more', 'hasmore'],
      },
    ],
  },
  explore: [
    'Indexes for keyset pagination',
    'GraphQL Relay connections',
    'Infinite scroll on the client',
  ],
}
