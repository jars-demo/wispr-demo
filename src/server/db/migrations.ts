// Numbered, forward-only migrations. Never edit an applied migration: add a new one.
// Kept as TypeScript strings so they ship inside the serverless bundle without file lookups.
// Versions start with "b" so they never collide with the Receipts migrations that may already be
// recorded in the same database.

export type Migration = { version: string; sql: string }

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 'b0001_players',
    sql: `
      create table players (
        id uuid primary key,
        secret_hash text not null,
        name text not null check (char_length(name) between 1 and 24),
        avatar text not null check (char_length(avatar) between 1 and 24),
        xp integer not null default 0 check (xp between 0 and 10000000),
        breakdowns integer not null default 0 check (breakdowns >= 0),
        concepts integer not null default 0 check (concepts >= 0),
        achievements text[] not null default '{}',
        avatars text[] not null default '{}',
        -- The player's whole local profile, so a restore link can bring it to another device.
        profile jsonb not null default '{}',
        hidden boolean not null default false,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
      create index players_rank_idx on players (xp desc, updated_at asc);

      create table player_events (
        id bigint generated always as identity primary key,
        player_id uuid not null references players (id) on delete cascade,
        kind text not null check (kind in ('joined', 'level', 'achievement', 'avatar')),
        detail text not null check (char_length(detail) <= 40),
        created_at timestamptz not null default now()
      );
      create index player_events_created_idx on player_events (created_at desc);

      create table if not exists rate_limits (
        key text not null,
        window_start timestamptz not null,
        count integer not null,
        primary key (key, window_start)
      );
    `,
  },
  {
    // Receipts shared this database. Its tables and its migration rows go; Breakdown's tables and
    // rate_limits (created by Receipts, now used by Breakdown) stay.
    version: 'b0002_drop_receipts',
    sql: `
      drop table if exists checks;
      drop table if exists spec_items;
      drop table if exists spec_versions;
      drop table if exists specs;
      delete from schema_migrations where version in ('0001_specs', '0002_checks', '0003_sent');
    `,
  },
  {
    // One name per player across the board, ignoring case. Older duplicates keep their name with
    // a short suffix so the index can be built.
    version: 'b0003_unique_names',
    sql: `
      update players p set name = left(p.name, 19) || '-' || left(p.id::text, 4)
      where exists (
        select 1 from players q
        where lower(q.name) = lower(p.name)
          and (q.created_at, q.id) < (p.created_at, p.id)
      );
      create unique index players_name_key on players (lower(name));
    `,
  },
  {
    // Public links broken down once are kept so the next person gets them instantly and free.
    version: 'b0004_breakdown_cache',
    sql: `
      create table breakdown_cache (
        key text primary key check (char_length(key) <= 600),
        result jsonb not null,
        expires_at timestamptz not null,
        created_at timestamptz not null default now()
      );
      create index breakdown_cache_expires_idx on breakdown_cache (expires_at);
    `,
  },
  {
    // Breakdowns players chose to make public. A frozen copy, so a pull request that changes later
    // still plays as it was shared. Deleting the player deletes their shares.
    version: 'b0005_shared_breakdowns',
    sql: `
      create table shared_breakdowns (
        id uuid primary key,
        player_id uuid not null references players (id) on delete cascade,
        source_key text not null check (char_length(source_key) <= 600),
        url text not null check (char_length(url) <= 500),
        only_path text check (char_length(only_path) <= 400),
        repo text not null check (char_length(repo) <= 200),
        title text not null check (char_length(title) <= 300),
        result jsonb not null,
        created_at timestamptz not null default now(),
        unique (player_id, source_key)
      );
      create index shared_breakdowns_created_idx on shared_breakdowns (created_at desc);
      create index shared_breakdowns_source_idx on shared_breakdowns (source_key);

      alter table player_events drop constraint if exists player_events_kind_check;
      alter table player_events add constraint player_events_kind_check
        check (kind in ('joined', 'level', 'achievement', 'avatar', 'shared'));
    `,
  },
  {
    // When the player last renamed. Null until the first rename; claiming a name is not one.
    version: 'b0006_name_changes',
    sql: `alter table players add column name_changed_at timestamptz;`,
  },
]
