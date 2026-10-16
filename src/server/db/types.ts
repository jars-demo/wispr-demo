// The narrow database surface the app uses. Two adapters implement it: embedded PGlite (local
// development and tests) and postgres.js (hosted Postgres). Both run real PostgreSQL SQL.

export type Row = Record<string, unknown>

export interface Db {
  /** One parameterised statement. Never interpolate values into `text`. */
  query<T extends Row = Row>(text: string, params?: readonly unknown[]): Promise<T[]>
  /** Several statements without parameters. Only for trusted SQL such as migrations. */
  exec(sql: string): Promise<void>
  transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T>
}
