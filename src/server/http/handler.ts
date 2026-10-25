import 'server-only'

import { ConfigError } from '@/server/config'
import { devErrorMessage, errorKind, log } from '@/server/log'

import { HttpError, problem } from './problem'

// Wraps a route handler: maps HttpError to its response and turns anything unexpected into a
// generic 500 with a request id. Logs ids, codes and durations only.

export type HandlerContext = { requestId: string; clientKey: string }

/** A short hash of the caller's address, for rate limits. The address itself is never stored. */
async function clientKeyFor(request: Request): Promise<string> {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const address = forwarded || request.headers.get('x-real-ip') || 'local'
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(address))
  return Buffer.from(digest).toString('hex').slice(0, 24)
}

export function withErrors<Args extends unknown[]>(
  route: string,
  handler: (request: Request, context: HandlerContext, ...args: Args) => Promise<Response>,
) {
  return async (request: Request, ...args: Args): Promise<Response> => {
    const requestId = crypto.randomUUID()
    const started = performance.now()
    let response: Response
    try {
      response = await handler(
        request,
        { requestId, clientKey: await clientKeyFor(request) },
        ...args,
      )
    } catch (error) {
      if (error instanceof HttpError) {
        response = error.response
      } else if (error instanceof ConfigError) {
        // The message lists variable names only, never values.
        log.error('config.invalid', { route, requestId, detail: error.message })
        response = problem(503, 'This service is not set up yet. Please try again later.', {
          requestId,
        })
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
