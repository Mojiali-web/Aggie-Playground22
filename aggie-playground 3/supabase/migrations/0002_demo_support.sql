-- Aggie Playground — demo-data support (additive, safe to re-run)
-- Run in the Supabase SQL editor AFTER 0001_init.sql.
-- Adds nullable columns only; no existing data, table, or RLS policy is changed.

-- ── new nullable columns ──
alter table public.activities add column if not exists demo_key text;
alter table public.activities add column if not exists emoji text;
alter table public.activities add column if not exists meeting_instructions text;

alter table public.profiles add column if not exists demo_key text;
alter table public.profiles add column if not exists major text;
alter table public.profiles add column if not exists class_year text;

-- Defense in depth: the emoji column is rendered in the map, so keep it short.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'activities_emoji_len') then
    alter table public.activities add constraint activities_emoji_len check (emoji is null or char_length(emoji) <= 8);
  end if;
end $$;

-- Stable identifiers for the seed script (NULL for every real record).
-- (Plain unique indexes, not partial: PostgREST upserts need one, and Postgres allows many NULLs.)
create unique index if not exists activities_demo_key_uidx on public.activities (demo_key);
create unique index if not exists profiles_demo_key_uidx on public.profiles (demo_key);

-- ── views: recreate so they expose the new columns (views hold no data) ──
drop view if exists public.activity_feed;
drop view if exists public.public_profiles cascade;

create view public.public_profiles as
select
  id,
  display_name,
  avatar_emoji,
  avatar_color,
  is_demo,
  discoverable,
  case when discoverable then bio else '' end as bio,
  case when discoverable then favorite_categories else '{}' end as favorite_categories,
  case when discoverable then preferred_activities else '{}' end as preferred_activities,
  case when discoverable then major else null end as major,
  case when discoverable then class_year else null end as class_year
from public.profiles;
grant select on public.public_profiles to authenticated, anon;

create view public.activity_feed with (security_invoker = true) as
select
  a.*,
  coalesce(c.n, 0)::int as participant_count,
  greatest(a.max_participants - coalesce(c.n, 0), 0)::int as spots_remaining,
  hp.display_name as host_name,
  hp.avatar_emoji as host_emoji,
  hp.avatar_color as host_color,
  case
    when a.status = 'cancelled' then 'cancelled'
    when now() >= a.starts_at + make_interval(mins => a.duration_min) then 'ended'
    when now() >= a.starts_at then 'live'
    else 'upcoming'
  end as live_status
from public.activities a
left join (select activity_id, count(*) n from public.participants group by activity_id) c
  on c.activity_id = a.id
left join public.public_profiles hp on hp.id = a.host_id;
grant select on public.activity_feed to authenticated, anon;

-- ── don't spam real students with notifications for fictional demo activities ──
create or replace function public.notify_new_activity() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.is_demo then return new; end if;
  insert into public.notifications (user_id, kind, title, body, activity_id)
  select p.id, 'new_activity', 'New in ' || new.category, new.title || ' · ' || new.location_name, new.id
  from public.profiles p
  where new.category = any (p.favorite_categories) and p.id <> new.host_id;
  return new;
end $$;

-- Same for update/cancel notifications: re-basing demo times must never ping real students who joined.
create or replace function public.notify_activity_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.is_demo then return new; end if;
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    insert into public.notifications (user_id, kind, title, body, activity_id)
    select pt.user_id, 'activity_cancelled', 'Cancelled: ' || new.title, 'The host cancelled this activity.', new.id
    from public.participants pt where pt.activity_id = new.id and pt.user_id <> new.host_id;
  elsif new.status = 'active' and (
      new.starts_at is distinct from old.starts_at or
      new.location_key is distinct from old.location_key or
      new.title is distinct from old.title) then
    insert into public.notifications (user_id, kind, title, body, activity_id)
    select pt.user_id, 'activity_updated', 'Updated: ' || new.title, 'Time or place changed — check the details.', new.id
    from public.participants pt where pt.activity_id = new.id and pt.user_id <> new.host_id;
  end if;
  return new;
end $$;
