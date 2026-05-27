-- =========================================================================
-- Iron Lifting Tracker — Initial Schema (DRAFT, not yet applied)
-- =========================================================================
-- Stage 3 will apply this migration via:
--   supabase db push          (Supabase CLI, recommended)
--   psql $DATABASE_URL -f .../001_initial_schema.sql
--
-- Conventions:
--   * Every table is user-scoped via owner_id -> auth.users(id).
--   * Row Level Security (RLS) is enabled and policies restrict rows to
--     auth.uid() = owner_id.
--   * Timestamps use timestamptz default now().
--   * Use uuid primary keys (gen_random_uuid()) — the pgcrypto extension
--     ships with Supabase by default.
-- =========================================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------------
-- profiles
--   One row per authenticated user. Created via trigger on auth.user signup.
-- -------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  unit_system   text not null default 'imperial' check (unit_system in ('imperial','metric')),
  bodyweight_lb numeric(6,2),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- workouts
--   One row per logged session.
-- -------------------------------------------------------------------------
create table if not exists public.workouts (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  performed_at  timestamptz not null default now(),
  duration_min  integer,
  notes         text,
  created_at    timestamptz not null default now()
);
create index if not exists workouts_owner_performed_idx
  on public.workouts (owner_id, performed_at desc);

-- -------------------------------------------------------------------------
-- workout_sets
--   Individual sets inside a workout. weight = NULL means bodyweight.
-- -------------------------------------------------------------------------
create table if not exists public.workout_sets (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  workout_id  uuid not null references public.workouts(id) on delete cascade,
  exercise    text not null,
  set_index   integer not null,
  reps        integer not null check (reps >= 0),
  weight_lb   numeric(6,2),
  rpe         numeric(3,1) check (rpe is null or (rpe >= 0 and rpe <= 10)),
  created_at  timestamptz not null default now()
);
create index if not exists workout_sets_workout_idx
  on public.workout_sets (workout_id, set_index);
create index if not exists workout_sets_owner_exercise_idx
  on public.workout_sets (owner_id, exercise);

-- -------------------------------------------------------------------------
-- goals
-- -------------------------------------------------------------------------
create table if not exists public.goals (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  metric      text not null,                    -- e.g. "Bench 1RM"
  target      numeric(8,2) not null,
  unit        text not null check (unit in ('lb','kg','reps')),
  current_val numeric(8,2) not null default 0,
  pinned      boolean not null default false,
  achieved_at timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists goals_owner_pinned_idx
  on public.goals (owner_id, pinned desc, created_at desc);

-- -------------------------------------------------------------------------
-- nutrition_entries
-- -------------------------------------------------------------------------
create table if not exists public.nutrition_entries (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  kcal       integer not null check (kcal >= 0),
  protein_g  numeric(6,1) not null default 0,
  carbs_g    numeric(6,1) not null default 0,
  fat_g      numeric(6,1) not null default 0,
  note       text,
  created_at timestamptz not null default now(),
  unique (owner_id, entry_date)
);

-- -------------------------------------------------------------------------
-- exercise_prs
--   Materialised PR per exercise. Stage 3 will populate via a trigger on
--   workout_sets, or a periodic job. Keep this denormalised for fast reads.
-- -------------------------------------------------------------------------
create table if not exists public.exercise_prs (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  exercise        text not null,
  one_rep_max_lb  numeric(7,2) not null,
  best_set_weight numeric(7,2),
  best_set_reps   integer not null,
  achieved_at     timestamptz not null,
  workout_id      uuid references public.workouts(id) on delete set null,
  unique (owner_id, exercise)
);

-- -------------------------------------------------------------------------
-- plans
--   A weekly template. days_json stores the per-day focus + exercise list
--   to keep the table shape simple in Stage 3.
-- -------------------------------------------------------------------------
create table if not exists public.plans (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  name       text not null default 'My weekly plan',
  active     boolean not null default true,
  days_json  jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- Row Level Security
-- =========================================================================
alter table public.profiles          enable row level security;
alter table public.workouts          enable row level security;
alter table public.workout_sets      enable row level security;
alter table public.goals             enable row level security;
alter table public.nutrition_entries enable row level security;
alter table public.exercise_prs      enable row level security;
alter table public.plans             enable row level security;

-- Helper: a single owner_id = auth.uid() policy pattern reused per table.
-- profiles uses id (the user's own auth id), not owner_id.
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_self_modify" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "workouts_owner_rw" on public.workouts
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "workout_sets_owner_rw" on public.workout_sets
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "goals_owner_rw" on public.goals
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "nutrition_entries_owner_rw" on public.nutrition_entries
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "exercise_prs_owner_rw" on public.exercise_prs
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "plans_owner_rw" on public.plans
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- =========================================================================
-- Auto-create a profile row when a new auth user signs up.
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- updated_at trigger (used by profiles; extend to other tables as needed).
-- =========================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
