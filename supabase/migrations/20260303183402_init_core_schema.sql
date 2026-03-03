-- Yomika MVP core schema derived from the technical report model.
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.content_versions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.jlpt_levels (
  id smallint primary key,
  code text not null unique check (code in ('N5', 'N4', 'N3', 'N2', 'N1')),
  sort_order smallint not null unique
);

insert into public.jlpt_levels (id, code, sort_order)
values
  (1, 'N5', 1),
  (2, 'N4', 2),
  (3, 'N3', 3),
  (4, 'N2', 4),
  (5, 'N1', 5)
on conflict (id) do nothing;

create table if not exists public.kanji (
  id uuid primary key default gen_random_uuid(),
  content_version_id uuid references public.content_versions (id) on delete set null,
  literal text not null unique,
  joyo_flag boolean not null default false,
  grade smallint,
  stroke_count smallint,
  created_at timestamptz not null default now()
);

create table if not exists public.kanji_readings (
  id uuid primary key default gen_random_uuid(),
  kanji_id uuid not null references public.kanji (id) on delete cascade,
  reading_kana text not null,
  reading_type text not null check (reading_type in ('on', 'kun')),
  is_common boolean not null default false,
  created_at timestamptz not null default now(),
  unique (kanji_id, reading_kana, reading_type)
);

create table if not exists public.vocab (
  id uuid primary key default gen_random_uuid(),
  content_version_id uuid references public.content_versions (id) on delete set null,
  lemma_kanji text,
  lemma_kana text not null,
  part_of_speech text,
  gloss text,
  frequency_rank integer,
  created_at timestamptz not null default now()
);

create table if not exists public.vocab_senses (
  id uuid primary key default gen_random_uuid(),
  vocab_id uuid not null references public.vocab (id) on delete cascade,
  sense_index smallint not null,
  gloss text not null,
  usage_notes text,
  created_at timestamptz not null default now(),
  unique (vocab_id, sense_index)
);

create table if not exists public.vocab_kanji_map (
  vocab_id uuid not null references public.vocab (id) on delete cascade,
  kanji_id uuid not null references public.kanji (id) on delete cascade,
  role text,
  primary key (vocab_id, kanji_id)
);

create table if not exists public.grammar_points (
  id uuid primary key default gen_random_uuid(),
  content_version_id uuid references public.content_versions (id) on delete set null,
  slug text not null unique,
  title text not null,
  explanation_md text not null,
  jlpt_level_id smallint references public.jlpt_levels (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.sentences (
  id uuid primary key default gen_random_uuid(),
  content_version_id uuid references public.content_versions (id) on delete set null,
  text_ja text not null,
  reading_kana text,
  translation_en text,
  license_code text not null default 'self-authored',
  created_at timestamptz not null default now()
);

create table if not exists public.sentence_tokens (
  sentence_id uuid not null references public.sentences (id) on delete cascade,
  token_index integer not null,
  surface text not null,
  lemma text,
  reading text,
  part_of_speech text,
  primary key (sentence_id, token_index)
);

create table if not exists public.audio_assets (
  id uuid primary key default gen_random_uuid(),
  sentence_id uuid references public.sentences (id) on delete set null,
  asset_type text not null check (asset_type in ('tts', 'human')),
  provider text not null,
  voice text,
  text_hash text,
  storage_url text not null,
  license_code text not null default 'self-authored',
  created_at timestamptz not null default now()
);

create table if not exists public.exercise_templates (
  id uuid primary key default gen_random_uuid(),
  template_type text not null,
  schema_json jsonb not null default '{}'::jsonb,
  render_hints jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.exercise_templates (id) on delete restrict,
  content_refs jsonb not null default '{}'::jsonb,
  jlpt_level_id smallint references public.jlpt_levels (id) on delete set null,
  difficulty smallint check (difficulty >= 1 and difficulty <= 10),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  locale text not null default 'en-US',
  time_zone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_item_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_type text not null,
  item_id uuid not null,
  skill_type text not null,
  due_at timestamptz not null default now(),
  stability numeric(8, 3) not null default 0,
  difficulty numeric(5, 2) not null default 0,
  interval_days integer not null default 0 check (interval_days >= 0),
  ease numeric(4, 2) not null default 2.50,
  repetitions integer not null default 0 check (repetitions >= 0),
  lapses integer not null default 0 check (lapses >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id, skill_type)
);

create table if not exists public.study_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  item_type text not null,
  item_id uuid not null,
  skill_type text not null,
  result text not null,
  latency_ms integer,
  device text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  furigana_mode text not null default 'partial' check (furigana_mode in ('full', 'partial', 'off')),
  romaji_mode boolean not null default false,
  srs_retention_target numeric(4, 2) not null default 0.85 check (srs_retention_target >= 0.50 and srs_retention_target <= 0.99),
  privacy_flags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_kanji_joyo_flag on public.kanji (joyo_flag);
create index if not exists idx_grammar_points_level on public.grammar_points (jlpt_level_id);
create index if not exists idx_exercises_level on public.exercises (jlpt_level_id);
create index if not exists idx_user_item_state_due_at on public.user_item_state (user_id, due_at);
create index if not exists idx_study_events_user_time on public.study_events (user_id, occurred_at desc);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_user_item_state_updated_at on public.user_item_state;
create trigger trg_user_item_state_updated_at
before update on public.user_item_state
for each row
execute function public.set_updated_at();

drop trigger if exists trg_user_settings_updated_at on public.user_settings;
create trigger trg_user_settings_updated_at
before update on public.user_settings
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', null))
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.content_versions enable row level security;
alter table public.jlpt_levels enable row level security;
alter table public.kanji enable row level security;
alter table public.kanji_readings enable row level security;
alter table public.vocab enable row level security;
alter table public.vocab_senses enable row level security;
alter table public.vocab_kanji_map enable row level security;
alter table public.grammar_points enable row level security;
alter table public.sentences enable row level security;
alter table public.sentence_tokens enable row level security;
alter table public.audio_assets enable row level security;
alter table public.exercise_templates enable row level security;
alter table public.exercises enable row level security;
alter table public.profiles enable row level security;
alter table public.user_item_state enable row level security;
alter table public.study_events enable row level security;
alter table public.user_settings enable row level security;

create policy "Read content_versions"
on public.content_versions for select to anon, authenticated
using (true);

create policy "Read jlpt_levels"
on public.jlpt_levels for select to anon, authenticated
using (true);

create policy "Read kanji"
on public.kanji for select to anon, authenticated
using (true);

create policy "Read kanji_readings"
on public.kanji_readings for select to anon, authenticated
using (true);

create policy "Read vocab"
on public.vocab for select to anon, authenticated
using (true);

create policy "Read vocab_senses"
on public.vocab_senses for select to anon, authenticated
using (true);

create policy "Read vocab_kanji_map"
on public.vocab_kanji_map for select to anon, authenticated
using (true);

create policy "Read grammar_points"
on public.grammar_points for select to anon, authenticated
using (true);

create policy "Read sentences"
on public.sentences for select to anon, authenticated
using (true);

create policy "Read sentence_tokens"
on public.sentence_tokens for select to anon, authenticated
using (true);

create policy "Read audio_assets"
on public.audio_assets for select to anon, authenticated
using (true);

create policy "Read exercise_templates"
on public.exercise_templates for select to anon, authenticated
using (true);

create policy "Read exercises"
on public.exercises for select to anon, authenticated
using (true);

create policy "Profiles are viewable by owner"
on public.profiles for select to authenticated
using (auth.uid() = id);

create policy "Profiles are insertable by owner"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

create policy "Profiles are updateable by owner"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "State is owned by user"
on public.user_item_state for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Events are owned by user"
on public.study_events for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Settings are owned by user"
on public.user_settings for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
