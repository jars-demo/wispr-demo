// Sample changes for demo mode. Written for this app as teaching material; the repositories are
// fictional and every screen that shows them carries a "Sample" label.

export const PAGINATION_DIFF = `diff --git a/src/routes/posts.ts b/src/routes/posts.ts
index 3f2a1c0..9b7e4d2 100644
--- a/src/routes/posts.ts
+++ b/src/routes/posts.ts
@@ -1,12 +1,36 @@
 import { Router } from 'express'
 import { db } from '../db'
+import { decodeCursor, encodeCursor } from '../lib/cursor'

 export const posts = Router()

+const DEFAULT_LIMIT = 20
+const MAX_LIMIT = 100
+
 posts.get('/posts', async (req, res) => {
-  const page = Number(req.query.page ?? 1)
-  const rows = await db.query(
-    'select id, title, created_at from posts order by created_at desc limit 20 offset $1',
-    [(page - 1) * 20],
-  )
-  res.json(rows)
+  const limit = Math.min(Number(req.query.limit ?? DEFAULT_LIMIT), MAX_LIMIT)
+  const cursor = req.query.cursor ? decodeCursor(String(req.query.cursor)) : null
+
+  // Fetch one extra row to learn whether another page exists.
+  const rows = await db.query(
+    'select id, title, created_at from posts ' +
+      'where ($1::timestamptz is null or (created_at, id) < ($1, $2)) ' +
+      'order by created_at desc, id desc limit $3',
+    [cursor?.createdAt ?? null, cursor?.id ?? null, limit + 1],
+  )
+
+  const hasMore = rows.length > limit
+  const page = hasMore ? rows.slice(0, limit) : rows
+  const last = page.at(-1)
+
+  res.json({
+    items: page,
+    nextCursor: hasMore && last ? encodeCursor({ createdAt: last.created_at, id: last.id }) : null,
+  })
 })
diff --git a/src/lib/cursor.ts b/src/lib/cursor.ts
new file mode 100644
index 0000000..a41c9e2
--- /dev/null
+++ b/src/lib/cursor.ts
@@ -0,0 +1,17 @@
+// Cursors are opaque to clients: base64url JSON of the last row's sort keys.
+export type Cursor = { createdAt: string; id: number }
+
+export function encodeCursor(cursor: Cursor): string {
+  return Buffer.from(JSON.stringify(cursor)).toString('base64url')
+}
+
+export function decodeCursor(value: string): Cursor | null {
+  try {
+    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
+    if (typeof parsed.createdAt !== 'string' || typeof parsed.id !== 'number') return null
+    return parsed
+  } catch {
+    return null
+  }
+}
+
`

export const BACKOFF_DIFF = `diff --git a/src/lib/retry.ts b/src/lib/retry.ts
new file mode 100644
index 0000000..5d1e7b3
--- /dev/null
+++ b/src/lib/retry.ts
@@ -0,0 +1,30 @@
+type RetryOptions = { attempts?: number; baseMs?: number; maxMs?: number }
+
+const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
+
+// Only failures that may pass on their own are worth another try.
+function isRetryable(error: unknown): boolean {
+  const status = (error as { status?: number }).status
+  return status === undefined || status === 429 || status >= 500
+}
+
+export async function withRetry<T>(
+  task: () => Promise<T>,
+  { attempts = 5, baseMs = 200, maxMs = 5000 }: RetryOptions = {},
+): Promise<T> {
+  for (let attempt = 1; ; attempt++) {
+    try {
+      return await task()
+    } catch (error) {
+      if (attempt >= attempts || !isRetryable(error)) throw error
+      // Exponential backoff: 200ms, 400ms, 800ms... capped at maxMs.
+      const ceiling = Math.min(maxMs, baseMs * 2 ** (attempt - 1))
+      // Full jitter spreads retries out so clients do not all retry at once.
+      await sleep(Math.random() * ceiling)
+    }
+  }
+}
+
+export class HttpError extends Error {
+  constructor(readonly status: number) { super('HTTP ' + status) }
+}
diff --git a/src/sync/webhook.ts b/src/sync/webhook.ts
index 81c03aa..e47b2f1 100644
--- a/src/sync/webhook.ts
+++ b/src/sync/webhook.ts
@@ -1,15 +1,19 @@
 import type { Invoice } from '../types'
+import { HttpError, withRetry } from '../lib/retry'

 export async function sendInvoiceWebhook(url: string, invoice: Invoice) {
-  const response = await fetch(url, {
-    method: 'POST',
-    headers: { 'Content-Type': 'application/json' },
-    body: JSON.stringify(invoice),
-  })
-  if (!response.ok) {
-    throw new Error('Webhook failed with ' + response.status)
-  }
+  await withRetry(async () => {
+    const response = await fetch(url, {
+      method: 'POST',
+      headers: {
+        'Content-Type': 'application/json',
+        // Same key on every attempt, so the receiver can drop duplicates.
+        'Idempotency-Key': invoice.id,
+      },
+      body: JSON.stringify(invoice),
+    })
+    if (!response.ok) throw new HttpError(response.status)
+  })
 }
`

export const DEBOUNCE_DIFF = `diff --git a/src/hooks/useDebouncedValue.ts b/src/hooks/useDebouncedValue.ts
new file mode 100644
index 0000000..c2d4f18
--- /dev/null
+++ b/src/hooks/useDebouncedValue.ts
@@ -0,0 +1,11 @@
+import { useEffect, useState } from 'react'
+
+// Returns the value only after it has stopped changing for delayMs.
+export function useDebouncedValue<T>(value: T, delayMs = 300): T {
+  const [settled, setSettled] = useState(value)
+  useEffect(() => {
+    const timer = setTimeout(() => setSettled(value), delayMs)
+    return () => clearTimeout(timer)
+  }, [value, delayMs])
+  return settled
+}
diff --git a/src/components/SearchBox.tsx b/src/components/SearchBox.tsx
index 0b9a2e1..7f3c5d0 100644
--- a/src/components/SearchBox.tsx
+++ b/src/components/SearchBox.tsx
@@ -1,22 +1,32 @@
 import { useEffect, useState } from 'react'
+import { useDebouncedValue } from '../hooks/useDebouncedValue'
 import { ResultList } from './ResultList'

 export function SearchBox() {
   const [query, setQuery] = useState('')
   const [results, setResults] = useState<string[]>([])
+  const debounced = useDebouncedValue(query.trim(), 300)

   useEffect(() => {
-    if (!query) return
-    fetch('/api/search?q=' + encodeURIComponent(query))
+    if (!debounced) {
+      setResults([])
+      return
+    }
+    // Cancel the previous request so a slow, stale answer can never win.
+    const controller = new AbortController()
+    fetch('/api/search?q=' + encodeURIComponent(debounced), { signal: controller.signal })
       .then((res) => res.json())
       .then(setResults)
-  }, [query])
+      .catch((error) => {
+        if (error.name !== 'AbortError') throw error
+      })
+    return () => controller.abort()
+  }, [debounced])

   return (
     <div>
       <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" />
       <ResultList items={results} />
     </div>
   )
 }
`

export const RATE_LIMIT_DIFF = `diff --git a/src/middleware/rateLimit.ts b/src/middleware/rateLimit.ts
new file mode 100644
index 0000000..9e8a0f4
--- /dev/null
+++ b/src/middleware/rateLimit.ts
@@ -0,0 +1,33 @@
+import type { NextFunction, Request, Response } from 'express'
+
+type Bucket = { tokens: number; updatedAt: number }
+
+// Token bucket: each client holds up to CAPACITY tokens, refilled at REFILL_PER_SEC.
+// Bursts are allowed up to the capacity; the long-run rate is the refill rate.
+const CAPACITY = 10
+const REFILL_PER_SEC = 2
+const buckets = new Map<string, Bucket>()
+
+export function rateLimit(req: Request, res: Response, next: NextFunction) {
+  const key = req.ip ?? 'unknown'
+  const now = Date.now()
+  const bucket = buckets.get(key) ?? { tokens: CAPACITY, updatedAt: now }
+
+  // Refill lazily for the time that passed since the last request.
+  const elapsedSec = (now - bucket.updatedAt) / 1000
+  bucket.tokens = Math.min(CAPACITY, bucket.tokens + elapsedSec * REFILL_PER_SEC)
+  bucket.updatedAt = now
+
+  if (bucket.tokens < 1) {
+    const waitSec = Math.ceil((1 - bucket.tokens) / REFILL_PER_SEC)
+    res.set('Retry-After', String(waitSec))
+    buckets.set(key, bucket)
+    return res.status(429).json({ error: 'Too many requests' })
+  }
+
+  bucket.tokens -= 1
+  buckets.set(key, bucket)
+  next()
+}
+
+// Note: this Map lives in one process. Several servers would need a shared store like Redis.
diff --git a/src/server.ts b/src/server.ts
index 2c7e1b9..d0f3a65 100644
--- a/src/server.ts
+++ b/src/server.ts
@@ -1,9 +1,11 @@
 import express from 'express'
+import { rateLimit } from './middleware/rateLimit'
 import { posts } from './routes/posts'

 const app = express()

 app.use(express.json())
+app.use('/api', rateLimit)
 app.use('/api', posts)

 app.listen(3000)
`
