import 'server-only'

import { getConfig } from '@/server/config'
import { log } from '@/server/log'

import { runMigrations } from './migrate'
import type { Db } from './types'

export type { Db } from './types'

// One connection per server process. Kept on globalThis so hot reloads in development do not
// open a new PGlite instance (which would fail on the locked data directory).

const globalForDb = globalThis as typeof globalThis & { __breakdownDb?: Promise<Db> }

async function connect(): Promise<Db> {
  const { database } = getConfig()
  const { db } =
    database.kind === 'postgres'
      ? (await import('./postgres')).createPostgresDb(database.url)
      : await (await import('./pglite')).createPgliteDb(database.dir)
  const applied = await runMigrations(db)
  log.info('db.ready', { kind: database.kind, migrationsApplied: applied.length })
  return db
}

export function getDb(): Promise<Db> {
  globalForDb.__breakdownDb ??= connect().catch((error: unknown) => {
    globalForDb.__breakdownDb = undefined
    throw error
  })
  return globalForDb.__breakdownDb
}
