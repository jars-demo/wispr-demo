import { connection } from 'next/server'

import { configProblem } from '@/server/config'

// Liveness plus a configuration check. It reveals no versions, hosts or variable names; the
// server log says which variable is wrong.
export async function GET() {
  await connection()
  const misconfigured = configProblem() !== null
  return Response.json(
    { status: misconfigured ? 'misconfigured' : 'ok' },
    { status: misconfigured ? 503 : 200, headers: { 'Cache-Control': 'no-store' } },
  )
}
