import { MIGRATIONS, type Migration } from './migrations'
import type { Db } from './types'

// Applies pending migrations in one transaction under an advisory lock, so two server
// instances starting together cannot apply the same migration twice.

const MIGRATION_LOCK_ID = 7_224_101

export async function runMigrations(
  db: Db,
  migrations: readonly Migration[] = MIGRATIONS,
): Promise<string[]> {
  await db.exec(
    'create table if not exists schema_migrations (version text primary key, applied_at timestamptz not null default now())',
  )
  return db.transaction(async (tx) => {
    await tx.query('select pg_advisory_xact_lock($1)', [MIGRATION_LOCK_ID])
    const rows = await tx.query<{ version: string }>('select version from schema_migrations')
    const applied = new Set(rows.map((row) => row.version))
    const pending = migrations.filter((migration) => !applied.has(migration.version))
    for (const migration of pending) {
      await tx.exec(migration.sql)
      await tx.query('insert into schema_migrations (version) values ($1)', [migration.version])
    }
    return pending.map((migration) => migration.version)
  })
}
