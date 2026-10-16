import { NextResponse, type NextRequest } from 'next/server'

import { configProblem, getConfig } from '@/server/config'
import {
  newOwnerId,
  OWNER_COOKIE,
  OWNER_COOKIE_MAX_AGE,
  signOwner,
  verifyOwner,
} from '@/server/owner'

// Gives every visitor an anonymous owner cookie on first contact, and forwards it on the same
// request so the page being rendered already sees it. Handlers still verify it themselves.

export async function proxy(request: NextRequest) {
  // Without valid config no cookie can be signed. Let the request through so static pages still
  // render; routes that need an owner answer 503 on their own.
  if (configProblem()) return NextResponse.next()
  const { sessionSecret, environment } = getConfig()
  const current = request.cookies.get(OWNER_COOKIE)?.value
  if (await verifyOwner(current, sessionSecret)) return NextResponse.next()

  const value = await signOwner(newOwnerId(), sessionSecret)
  request.cookies.set(OWNER_COOKIE, value)
  const response = NextResponse.next({ request: { headers: request.headers } })
  response.cookies.set(OWNER_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: environment === 'production',
    path: '/',
    maxAge: OWNER_COOKIE_MAX_AGE,
  })
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|api/health).*)'],
}
