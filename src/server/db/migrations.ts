// Numbered, forward-only migrations. Never edit an applied migration: add a new one.
// Kept as TypeScript strings so they ship inside the serverless bundle without file lookups.
// Versions start with "b" so they never collide with the Receipts migrations that may already be
// recorded in the same database. Receipts' old tables are left alone.

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
]
