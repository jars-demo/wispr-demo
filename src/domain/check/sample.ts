// A sample agent result for the built-in example request. Shown with a clear "sample" label so
// people can see a check without having an agent run of their own.

export const SAMPLE_REQUEST =
  'Add rate limiting to the login route, five attempts per minute per IP, and return a 429 with ' +
  'a Retry-After header. Do not touch the signup flow. Add tests for the limit and the reset. ' +
  'And maybe log the blocked attempts?'

export const SAMPLE_DIFF = `diff --git a/src/app/api/login/route.ts b/src/app/api/login/route.ts
index 3f1a2b4..9c0d7e1 100644
--- a/src/app/api/login/route.ts
+++ b/src/app/api/login/route.ts
@@ -1,9 +1,16 @@
 import { verifyPassword } from '@/server/auth'
+import { createRateLimiter } from '@/server/rate-limit'
+
+const limiter = createRateLimiter({ limit: 5, windowSeconds: 60 })

 export async function POST(request: Request) {
+  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
+  if (!limiter.allow(ip)) {
+    return tooManyRequests(limiter.retryAfter(ip))
+  }
   const { email, password } = await request.json()
   const ok = await verifyPassword(email, password)
   return Response.json({ ok }, { status: ok ? 200 : 401 })
 }
diff --git a/src/server/http/responses.ts b/src/server/http/responses.ts
index 1b2c3d4..5e6f7a8 100644
--- a/src/server/http/responses.ts
+++ b/src/server/http/responses.ts
@@ -12,3 +12,10 @@ export function badRequest(message: string) {
   return Response.json({ error: message }, { status: 400 })
 }
+
+export function tooManyRequests(seconds: number) {
+  return Response.json(
+    { error: 'Too many attempts' },
+    { status: 429, headers: { 'Retry-After': String(seconds) } },
+  )
+}
diff --git a/package-lock.json b/package-lock.json
index aaaaaaa..bbbbbbb 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -1,3 +1,4 @@
 {
+  "lockfileVersion": 3,
   "name": "shop-api"
 }
`

export const SAMPLE_SUMMARY = `Done! Added rate limiting to the login route (5 attempts per minute per IP) with a 429 and Retry-After header.
Added tests for the limiter.
All tests pass.
Didn't touch signup.`

export const SAMPLE_TEST_OUTPUT = ''
