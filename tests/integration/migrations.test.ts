import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { runMigrations } from '@/server/db/migrate'
import { createPgliteDb } from '@/server/db/pglite'
import type { Db } from '@/server/db/types'

// The production database used to hold Receipts. Migrating must remove Receipts' tables and
// nothing else: Breakdown's tables, rows and the shared rate_limits table stay.

let db: Db
let close: () => Promise<void>

beforeEach(async () => {
  ;({ db, close } = await createPgliteDb())
})

afterEach(async () => {
  await close()
})

async function tables(): Promise<string[]> {
  const rows = await db.query<{ table_name: string }>(
    `select table_name from information_schema.tables where table_schema = 'public'
     order by table_name`,
  )
  return rows.map((r) => r.table_name)
}

describe('migrations on a database that still holds Receipts', () => {
  it('drops only the Receipts tables and keeps rate limit rows', async () => {
    // A trimmed copy of Receipts' schema, as it exists in production.
    await db.exec(`
      create table schema_migrations (version text primary key, applied_at timestamptz not null default now());
      insert into schema_migrations (version) values ('0001_specs'), ('0002_checks'), ('0003_sent');
      create table specs (id uuid primary key, owner_id text not null);
      create table spec_versions (id uuid primary key, spec_id uuid references specs (id) on delete cascade);
      create table spec_items (spec_version_id uuid references spec_versions (id) on delete cascade, position int);
      create table rate_limits (key text not null, window_start timestamptz not null, count integer not null, primary key (key, window_start));
      create table checks (id uuid primary key, spec_id uuid references specs (id) on delete cascade);
      insert into rate_limits values ('kept', now(), 1);
    `)

    await runMigrations(db)

    expect(await tables()).toEqual([
      'breakdown_cache',
      'player_events',
      'players',
      'rate_limits',
      'schema_migrations',
    ])
    expect(await db.query('select key from rate_limits')).toEqual([{ key: 'kept' }])
    const versions = await db.query<{ version: string }>(
      'select version from schema_migrations order by version',
    )
    expect(versions.map((v) => v.version)).toEqual([
      'b0001_players',
      'b0002_drop_receipts',
      'b0003_unique_names',
      'b0004_breakdown_cache',
    ])
  })

  it('runs on an empty database too', async () => {
    await runMigrations(db)
    expect(await tables()).toContain('players')
  })
})
