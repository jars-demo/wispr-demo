import { mkdir } from 'node:fs/promises'

import { PGlite, type Transaction } from '@electric-sql/pglite'

import type { Db, Row } from './types'

type Queryable = Pick<PGlite | Transaction, 'query' | 'exec'>

function wrap(target: Queryable, root: PGlite): Db {
  const db: Db = {
    async query<T extends Row>(text: string, params: readonly unknown[] = []) {
      const result = await target.query<T>(text, [...params])
      return result.rows
    },
    async exec(sql: string) {
      await target.exec(sql)
    },
    transaction(fn) {
      // PGlite has no nested transactions; inside one, keep using the same transaction.
      if (target !== root) return fn(db)
      return root.transaction((tx) => fn(wrap(tx, root)))
    },
  }
  return db
}

/** `dataDir` undefined means in-memory, which tests use. */
export async function createPgliteDb(
  dataDir?: string,
): Promise<{ db: Db; close: () => Promise<void> }> {
  // PGlite creates its own directory but not missing parents such as `.data/`.
  if (dataDir) await mkdir(dataDir, { recursive: true })
  const pg = await PGlite.create(dataDir)
  return { db: wrap(pg, pg), close: () => pg.close() }
}
