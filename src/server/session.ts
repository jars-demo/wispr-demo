import 'server-only'
import { cookies } from 'next/headers'

import { getConfig } from '@/server/config'
import { OWNER_COOKIE, verifyOwner } from '@/server/owner'

// Resolves the current owner from the signed cookie. Never trusts the proxy alone.

export async function currentOwner(): Promise<string | null> {
  const store = await cookies()
  return verifyOwner(store.get(OWNER_COOKIE)?.value, getConfig().sessionSecret)
}
