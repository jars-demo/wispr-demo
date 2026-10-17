import type { SpecDraft, SpecItemInput, StructuringEngine } from '@/domain/spec'

// Browser-side calls to the spec API. Errors carry the server's user-facing message.

export class ApiError extends Error {
  override name = 'ApiError'
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors: { path: string; message: string }[] = [],
  ) {
    super(message)
  }
}

async function send<T>(url: string, init: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    })
  } catch {
    throw new ApiError('You seem to be offline. Check your connection and try again.', 0)
  }
  if (response.status === 204) return undefined as T
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const problem = (body ?? {}) as { title?: string; errors?: ApiError['fieldErrors'] }
    throw new ApiError(
      problem.title ?? 'Something went wrong. Please try again.',
      response.status,
      problem.errors,
    )
  }
  return body as T
}

export type StructureResponse = {
  engine: StructuringEngine
  title: string
  items: SpecItemInput[]
  notices: string[]
}

export function structure(transcript: string): Promise<StructureResponse> {
  return send('/api/specs/structure', { method: 'POST', body: JSON.stringify({ transcript }) })
}

export function createSpec(clientId: string, draft: SpecDraft): Promise<{ id: string }> {
  return send('/api/specs', { method: 'POST', body: JSON.stringify({ clientId, ...draft }) })
}

export function updateSpec(
  id: string,
  expectedVersion: number,
  draft: SpecDraft,
): Promise<{ id: string; version: number }> {
  return send(`/api/specs/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ expectedVersion, ...draft }),
  })
}

export function deleteSpec(id: string): Promise<void> {
  return send(`/api/specs/${id}`, { method: 'DELETE' })
}

export type CheckRequest = { diff: string; link: string; summary: string; testOutput: string }

export function createCheck(specId: string, body: CheckRequest): Promise<{ id: string }> {
  return send(`/api/specs/${specId}/checks`, { method: 'POST', body: JSON.stringify(body) })
}

export function markSent(specId: string, via: string, ref?: string): Promise<{ sentAt: string }> {
  return send(`/api/specs/${specId}/sent`, {
    method: 'POST',
    body: JSON.stringify({ via, ref: ref ?? null }),
  })
}
