import 'server-only'

import { getConfig } from '@/server/config'
import { devErrorMessage, errorKind, log } from '@/server/log'
import { OWNER_COOKIE, verifyOwner } from '@/server/owner'

import { HttpError, problem } from './problem'

// Wraps a route handler: verifies the owner cookie, maps HttpError to its response, and turns
// anything unexpected into a generic 500 with a request id. Logs ids and codes only.

export type HandlerContext = { ownerId: string; requestId: string }

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie')
  if (!header) return undefined
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return undefined
}

export function withOwner<Args extends unknown[]>(
  route: string,
  handler: (request: Request, context: HandlerContext, ...args: Args) => Promise<Response>,
) {
  return async (request: Request, ...args: Args): Promise<Response> => {
    const requestId = crypto.randomUUID()
    const started = performance.now()
    let response: Response
    try {
      const ownerId = await verifyOwner(
        readCookie(request, OWNER_COOKIE),
        getConfig().sessionSecret,
      )
      response = ownerId
        ? await handler(request, { ownerId, requestId }, ...args)
        : problem(401, 'Your session is missing. Reload the page and try again.')
    } catch (error) {
      if (error instanceof HttpError) {
        response = error.response
      } else {
        log.error('http.unhandled', {
          route,
          requestId,
          error: errorKind(error),
          devMessage: devErrorMessage(error),
        })
        response = problem(500, 'Something went wrong on our side. Please try again.', {
          requestId,
        })
      }
    }
    response.headers.set('X-Request-Id', requestId)
    log.info('http.request', {
      route,
      method: request.method,
      status: response.status,
      requestId,
      ms: Math.round(performance.now() - started),
    })
    return response
  }
}
