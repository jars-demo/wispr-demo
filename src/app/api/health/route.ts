import { connection } from 'next/server'

// Liveness only. It reveals no versions, hosts or dependency state.
export async function GET() {
  await connection()
  return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } })
}
