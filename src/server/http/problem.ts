import type { z } from 'zod'

// RFC 9457 problem details. Messages are written for users and never include internals.

export type ProblemBody = {
  type: string
  title: string
  status: number
  detail?: string
  errors?: { path: string; message: string }[]
  [extension: string]: unknown
}

export function problem(
  status: number,
  title: string,
  extra: Omit<Partial<ProblemBody>, 'status' | 'title'> = {},
  headers: HeadersInit = {},
): Response {
  const body: ProblemBody = { type: 'about:blank', title, status, ...extra }
  return Response.json(body, {
    status,
    headers: {
      'Content-Type': 'application/problem+json',
      'Cache-Control': 'no-store',
      ...headers,
    },
  })
}

export class HttpError extends Error {
  override name = 'HttpError'
  constructor(readonly response: Response) {
    super(`HTTP ${response.status}`)
  }
}

const MAX_BODY_BYTES = 64 * 1024

/** Reads and validates a JSON body. Throws HttpError with a ready-made problem response. */
export async function readJson<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
): Promise<z.infer<Schema>> {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    throw new HttpError(problem(415, 'Send JSON with Content-Type: application/json.'))
  }
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > MAX_BODY_BYTES) throw new HttpError(problem(413, 'That request is too large.'))

  const text = await request.text()
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    throw new HttpError(problem(413, 'That request is too large.'))
  }
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new HttpError(problem(400, 'The request body is not valid JSON.'))
  }
  const result = schema.safeParse(json)
  if (!result.success) {
    throw new HttpError(
      problem(422, 'Some fields need attention.', {
        errors: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      }),
    )
  }
  return result.data
}
