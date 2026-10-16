import postgres from 'postgres'

import type { Db, Row } from './types'

type Sql = postgres.Sql | postgres.TransactionSql

function wrap(sql: Sql, root: postgres.Sql): Db {
  const db: Db = {
    async query<T extends Row>(text: string, params: readonly unknown[] = []) {
      const rows = await sql.unsafe(text, params as postgres.ParameterOrJSON<never>[])
      return rows as unknown as T[]
    },
    async exec(statements: string) {
      await sql.unsafe(statements)
    },
    async transaction(fn) {
      if (sql !== root) return fn(db)
      const result = await root.begin((tx) => fn(wrap(tx, root)))
      return result as Awaited<ReturnType<typeof fn>>
    },
  }
  return db
}

export function createPostgresDb(url: string): { db: Db; close: () => Promise<void> } {
  // prepare: false keeps it compatible with transaction-mode poolers used by serverless hosts.
  const sql = postgres(url, { max: 5, prepare: false, idle_timeout: 20, connect_timeout: 10 })
  return { db: wrap(sql, sql), close: () => sql.end({ timeout: 5 }) }
}
