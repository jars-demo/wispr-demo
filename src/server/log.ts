import 'server-only'

import { getConfig } from '@/server/config'

// JSON lines on stdout/stderr. Fields are primitives only, so whole objects (requests, specs,
// transcripts) cannot be logged by accident. Log ids, counts, codes and durations; never content.

type Level = 'debug' | 'info' | 'warn' | 'error'
type Field = string | number | boolean | null | undefined

const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 }

function threshold(): number {
  try {
    return ORDER[getConfig().logLevel]
  } catch {
    // Config errors are reported by instrumentation; logging must still work meanwhile.
    return ORDER.info
  }
}

function write(level: Level, event: string, fields: Record<string, Field> = {}) {
  if (ORDER[level] < threshold()) return
  const line = JSON.stringify({ time: new Date().toISOString(), level, event, ...fields })
  if (level === 'error' || level === 'warn') console.error(line)
  else console.log(line)
}

export const log = {
  debug: (event: string, fields?: Record<string, Field>) => write('debug', event, fields),
  info: (event: string, fields?: Record<string, Field>) => write('info', event, fields),
  warn: (event: string, fields?: Record<string, Field>) => write('warn', event, fields),
  error: (event: string, fields?: Record<string, Field>) => write('error', event, fields),
}

/** The error class name only. Messages can contain user data, so they are not logged. */
export function errorKind(error: unknown): string {
  return error instanceof Error ? error.name : typeof error
}

/** Error message for local debugging. Always undefined in production, where it is never logged. */
export function devErrorMessage(error: unknown): string | undefined {
  if (process.env.NODE_ENV === 'production' || !(error instanceof Error)) return undefined
  return error.message.slice(0, 300)
}
