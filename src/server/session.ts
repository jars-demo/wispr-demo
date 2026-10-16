import 'server-only'
import { cookies } from 'next/headers'

import { configProblem, getConfig } from '@/server/config'
import { OWNER_COOKIE, verifyOwner } from '@/server/owner'

// Resolves the current owner from the signed cookie. Never trusts the proxy alone.
// Returns null when configuration is invalid, so pages render an empty state, not a crash.

export async function currentOwner(): Promise<string | null> {
  if (configProblem()) return null
  const store = await cookies()
  return verifyOwner(store.get(OWNER_COOKIE)?.value, getConfig().sessionSecret)
}
