// Numbered, forward-only migrations. Never edit an applied migration: add a new one.
// Kept as TypeScript strings so they ship inside the serverless bundle without file lookups.

export type Migration = { version: string; sql: string }

export const MIGRATIONS: readonly Migration[] = [
  {
    version: '0001_specs',
    sql: `
      create table specs (
        id uuid primary key,
        owner_id text not null,
        client_id uuid not null,
        title text not null check (char_length(title) between 1 and 120),
        current_version integer not null default 1 check (current_version >= 1),
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        unique (owner_id, client_id)
      );
      create index specs_owner_updated_idx on specs (owner_id, updated_at desc);

      create table spec_versions (
        id uuid primary key,
        spec_id uuid not null references specs (id) on delete cascade,
        version integer not null check (version >= 1),
        transcript text not null default '' check (char_length(transcript) <= 8000),
        engine text not null check (engine in ('rules', 'model')),
        created_at timestamptz not null default now(),
        unique (spec_id, version)
      );

      create table spec_items (
        spec_version_id uuid not null references spec_versions (id) on delete cascade,
        position integer not null check (position >= 0),
        code text not null,
        kind text not null check (kind in ('requirement', 'non_goal', 'open_question')),
        text text not null check (char_length(text) between 1 and 500),
        acceptance text check (char_length(acceptance) <= 300),
        source_quote text check (char_length(source_quote) <= 500),
        note text check (char_length(note) <= 200),
        primary key (spec_version_id, position)
      );

      create table rate_limits (
        key text not null,
        window_start timestamptz not null,
        count integer not null,
        primary key (key, window_start)
      );
    `,
  },
  {
    version: '0002_checks',
    sql: `
      create table checks (
        id uuid primary key,
        spec_id uuid not null references specs (id) on delete cascade,
        owner_id text not null,
        spec_version integer not null,
        sources text[] not null,
        source_label text,
        result jsonb not null,
        created_at timestamptz not null default now()
      );
      create index checks_spec_created_idx on checks (spec_id, created_at desc);
    `,
  },
  {
    version: '0003_sent',
    sql: `
      alter table specs
        add column sent_at timestamptz,
        add column sent_via text check (char_length(sent_via) <= 40),
        add column sent_ref text check (char_length(sent_ref) <= 300);
    `,
  },
]
