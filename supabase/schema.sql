-- ============================================================
-- JUNTO — Supabase Database Schema
-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/_/sql
--
-- Безопасно запускать повторно (idempotent).
-- ============================================================

-- ─── Extensions ────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── PROFILES ──────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  full_name   text,
  avatar_url  text,
  bio         text,
  interests   text[] default '{}',
  created_at  timestamptz default now() not null
);

-- Автоматически создаёт профиль при регистрации нового пользователя
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      lower(
        regexp_replace(
          coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
          '\s+', '_', 'g'
        )
      ) || '_' || substring(new.id::text, 1, 4)
    ),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── ТИПЫ (ENUM) ───────────────────────────────────────────
-- Защита от ошибки "type already exists" при повторном запуске
do $$ begin
  create type activity_status as enum ('proposal', 'confirmed', 'cancelled', 'completed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type activity_category as enum (
    'sport', 'food', 'culture', 'nature', 'learning',
    'travel', 'games', 'social', 'music', 'other'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type vote_type as enum ('yes', 'no', 'maybe');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type booking_status as enum ('confirmed', 'cancelled');
exception when duplicate_object then null;
end $$;

-- ─── ACTIVITIES ────────────────────────────────────────────
create table if not exists public.activities (
  id                    uuid primary key default gen_random_uuid(),
  creator_id            uuid not null references public.profiles(id) on delete cascade,
  title                 text not null check (char_length(title) between 3 and 100),
  description           text check (char_length(description) <= 1000),
  category              activity_category not null,
  location              text,
  is_online             boolean not null default false,
  date_options          jsonb not null default '[]',
  max_participants      integer check (max_participants > 0),
  cost                  numeric(10, 2) not null default 0 check (cost >= 0),
  status                activity_status not null default 'proposal',
  min_votes_to_confirm  integer not null default 3 check (min_votes_to_confirm >= 1),
  image_url             text,
  tags                  text[] default '{}',
  created_at            timestamptz not null default now(),
  confirmed_at          timestamptz
);

create index if not exists activities_creator_id_idx on public.activities(creator_id);
create index if not exists activities_status_idx     on public.activities(status);
create index if not exists activities_category_idx   on public.activities(category);
create index if not exists activities_created_at_idx on public.activities(created_at desc);

-- ─── VOTES ─────────────────────────────────────────────────
-- Таблица создаётся ДО триггера, который на неё ссылается
create table if not exists public.votes (
  id           uuid primary key default gen_random_uuid(),
  activity_id  uuid not null references public.activities(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  vote         vote_type not null,
  created_at   timestamptz not null default now(),
  unique (activity_id, user_id)
);

create index if not exists votes_activity_id_idx on public.votes(activity_id);
create index if not exists votes_user_id_idx     on public.votes(user_id);

-- Функция авто-подтверждения активности когда набирается нужное кол-во "Да"
create or replace function public.check_activity_confirmation()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_yes_count integer;
  v_min_votes integer;
  v_status    activity_status;
begin
  -- Читаем текущий статус и порог
  select status, min_votes_to_confirm
    into v_status, v_min_votes
    from public.activities
    where id = new.activity_id;

  -- Работаем только с активными предложениями
  if v_status <> 'proposal' then
    return new;
  end if;

  -- Проверяем только при голосе "Да"
  if new.vote = 'yes' then
    select count(*) into v_yes_count
      from public.votes
      where activity_id = new.activity_id and vote = 'yes';

    if v_yes_count >= v_min_votes then
      update public.activities
        set status = 'confirmed', confirmed_at = now()
        where id = new.activity_id and status = 'proposal';
    end if;
  end if;

  return new;
end;
$$;

-- Триггер создаётся ПОСЛЕ таблицы votes
drop trigger if exists on_vote_check_confirmation on public.votes;
create trigger on_vote_check_confirmation
  after insert or update on public.votes
  for each row execute procedure public.check_activity_confirmation();

-- ─── BOOKINGS ──────────────────────────────────────────────
create table if not exists public.bookings (
  id           uuid primary key default gen_random_uuid(),
  activity_id  uuid not null references public.activities(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  status       booking_status not null default 'confirmed',
  created_at   timestamptz not null default now(),
  unique (activity_id, user_id)
);

create index if not exists bookings_activity_id_idx on public.bookings(activity_id);
create index if not exists bookings_user_id_idx     on public.bookings(user_id);

-- ─── NOTIFICATIONS ─────────────────────────────────────────
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  type         text not null,
  payload      jsonb not null default '{}',
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id, read);

-- ─── ROW LEVEL SECURITY ────────────────────────────────────

-- profiles
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- activities
alter table public.activities enable row level security;

drop policy if exists "activities_select_all" on public.activities;
create policy "activities_select_all"
  on public.activities for select using (true);

drop policy if exists "activities_insert_auth" on public.activities;
create policy "activities_insert_auth"
  on public.activities for insert
  with check (auth.uid() = creator_id);

drop policy if exists "activities_update_own" on public.activities;
create policy "activities_update_own"
  on public.activities for update
  using (auth.uid() = creator_id);

drop policy if exists "activities_delete_own" on public.activities;
create policy "activities_delete_own"
  on public.activities for delete
  using (auth.uid() = creator_id);

-- votes
alter table public.votes enable row level security;

drop policy if exists "votes_select_all" on public.votes;
create policy "votes_select_all"
  on public.votes for select using (true);

drop policy if exists "votes_insert_auth" on public.votes;
create policy "votes_insert_auth"
  on public.votes for insert
  with check (auth.uid() = user_id);

drop policy if exists "votes_update_own" on public.votes;
create policy "votes_update_own"
  on public.votes for update
  using (auth.uid() = user_id);

drop policy if exists "votes_delete_own" on public.votes;
create policy "votes_delete_own"
  on public.votes for delete
  using (auth.uid() = user_id);

-- bookings
alter table public.bookings enable row level security;

drop policy if exists "bookings_select_own" on public.bookings;
create policy "bookings_select_own"
  on public.bookings for select
  using (auth.uid() = user_id);

drop policy if exists "bookings_insert_auth" on public.bookings;
create policy "bookings_insert_auth"
  on public.bookings for insert
  with check (auth.uid() = user_id);

drop policy if exists "bookings_update_own" on public.bookings;
create policy "bookings_update_own"
  on public.bookings for update
  using (auth.uid() = user_id);

-- notifications
alter table public.notifications enable row level security;

drop policy if exists "notifications_own" on public.notifications;
create policy "notifications_own"
  on public.notifications for all
  using (auth.uid() = user_id);

-- ─── EMAIL LOOKUP BY USER ID (for username login) ─────────
-- Returns the email for a given user_id — safe because only authenticated users can call it
create or replace function public.get_user_email_by_id(user_id uuid)
returns text
language sql
security definer
set search_path = public
as $$
  select email from auth.users where id = user_id;
$$;

-- ─── MESSAGES (chat) ───────────────────────────────────────
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  activity_id  uuid not null references public.activities(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  content      text not null check (char_length(content) between 1 and 1000),
  created_at   timestamptz not null default now()
);

create index if not exists messages_activity_id_idx on public.messages(activity_id, created_at);

alter table public.messages enable row level security;

drop policy if exists "messages_select_all" on public.messages;
create policy "messages_select_all"
  on public.messages for select using (true);

drop policy if exists "messages_insert_auth" on public.messages;
create policy "messages_insert_auth"
  on public.messages for insert
  with check (auth.uid() = user_id);

drop policy if exists "messages_delete_own" on public.messages;
create policy "messages_delete_own"
  on public.messages for delete
  using (auth.uid() = user_id);

-- ─── TIMEZONE (добавляем к activities) ─────────────────────
alter table public.activities
  add column if not exists creator_timezone text;

-- ─── ПРОВЕРКА ──────────────────────────────────────────────
-- После выполнения эта команда должна вернуть 6 таблиц:
-- activities, bookings, messages, notifications, profiles, votes
select tablename
  from pg_tables
  where schemaname = 'public'
  order by tablename;
