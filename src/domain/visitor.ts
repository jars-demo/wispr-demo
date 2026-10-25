// A random id each browser keeps for itself, so free breakdowns are counted per browser, not per
// network: people sharing one WiFi or mobile gateway each get their own. It identifies nothing
// about the person and is never shown or logged.

export const VISITOR_HEADER = 'x-breakdown-visitor'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function visitorFrom(headers: Headers): string | null {
  const id = headers.get(VISITOR_HEADER)?.trim() ?? ''
  return UUID.test(id) ? id.toLowerCase() : null
}
