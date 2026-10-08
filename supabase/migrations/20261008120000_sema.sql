-- =====================================================================
--  Lični blog / RPG dnevnik — šema baze (Supabase, PostgreSQL 15+)
--
--  Kako: Supabase → SQL Editor → New query → nalepi CEO fajl → Run.
--  Fajl je bezbedno pokrenuti ponovo (sve je "if not exists" / "or replace").
--
--  Zašto toliko GRANT naredbi: od 2026. Supabase više ne izlaže automatski
--  nove tabele iz "public" šeme preko Data API-ja (supabase-js). Zato svaka
--  tabela ovde eksplicitno dobija prava, a RLS politike odlučuju koje redove
--  sme da vidi ili menja posetilac (anon), vlasnik (authenticated) i server
--  (service_role).
--
--  Model pristupa:
--    * Prvi korisnik koga napraviš u Auth-u postaje vlasnik sajta.
--    * Samo vlasnik može da upisuje bilo šta (čak i ako se neko drugi
--      registruje, ne može ništa da doda).
--    * Posetioci vide samo redove sa is_public = true.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) Tipovi
-- ---------------------------------------------------------------------
do $$ begin
  create type public.entry_kind as enum
    ('post', 'place', 'workout', 'session', 'practice', 'journal', 'milestone');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.rpg_attribute as enum
    ('snaga', 'intelekt', 'kreativnost', 'avantura', 'duh');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.book_status as enum ('zelim', 'citam', 'procitano', 'odustao');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.game_status as enum ('zelim', 'igram', 'presao', 'odustao');
exception when duplicate_object then null; end $$;

do $$ begin
  -- Iste vrednosti koje koristi MyAnimeList API.
  create type public.anime_status as enum
    ('watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch');
exception when duplicate_object then null; end $$;


-- ---------------------------------------------------------------------
-- 2) Pomoćne funkcije
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 3) Profili (jedan red po korisniku; prvi korisnik je vlasnik)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  is_owner            boolean not null default false,
  display_name        text not null default '' check (char_length(display_name) <= 80),
  headline            text check (char_length(headline) <= 160),
  bio                 text check (char_length(bio) <= 2000),
  avatar_path         text check (char_length(avatar_path) <= 300),
  show_stats_publicly boolean not null default true,
  timezone            text not null default 'Europe/Belgrade',
  reminder_enabled    boolean not null default true,
  reminder_hour       smallint not null default 22 check (reminder_hour between 0 and 23),
  mal_username        text check (mal_username ~ '^[A-Za-z0-9_-]{2,16}$'),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Najviše jedan vlasnik.
create unique index if not exists profiles_single_owner
  on public.profiles (is_owner) where is_owner;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Novi korisnik u Auth-u → novi profil. Prvi postaje vlasnik.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, is_owner, display_name)
  values (
    new.id,
    not exists (select 1 from public.profiles p where p.is_owner),
    coalesce(new.raw_user_meta_data ->> 'display_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Da li je trenutni korisnik vlasnik sajta? Koriste ga RLS politike.
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_owner from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;

revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to anon, authenticated, service_role;

alter table public.profiles enable row level security;

drop policy if exists "profili: svi čitaju" on public.profiles;
create policy "profili: svi čitaju"
  on public.profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "profili: vlasnik menja svoj" on public.profiles;
create policy "profili: vlasnik menja svoj"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

grant select on public.profiles to anon, authenticated;
-- Namerno bez is_owner: niko ne može sam sebe da proglasi vlasnikom.
grant update (display_name, headline, bio, avatar_path, show_stats_publicly,
              timezone, reminder_enabled, reminder_hour, mal_username)
  on public.profiles to authenticated;
grant all on public.profiles to service_role;


-- ---------------------------------------------------------------------
-- 4) Grane (stablo veština)
-- ---------------------------------------------------------------------
create table if not exists public.branches (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  parent_id   uuid references public.branches (id) on delete cascade,
  slug        text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name        text not null check (char_length(name) between 1 and 60),
  description text check (char_length(description) <= 500),
  icon        text not null default '🌱' check (char_length(icon) between 1 and 16),
  -- null = nasleđuje atribut od roditelja
  attribute   public.rpg_attribute,
  -- koji formular se otvara kad upisuješ u ovu granu
  entry_kind  public.entry_kind not null default 'post',
  -- posebne grane: biblioteka knjiga/igara/anime i dnevnik
  role        text check (role in ('books', 'games', 'anime', 'journal')),
  -- "Gde sam stao" za projekte
  focus_note  text check (char_length(focus_note) <= 1000),
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint branches_owner_slug_key unique (owner_id, slug),
  constraint branches_not_own_parent check (parent_id is distinct from id)
);

create unique index if not exists branches_owner_role
  on public.branches (owner_id, role) where role is not null;
create index if not exists branches_owner_parent
  on public.branches (owner_id, parent_id, position);

drop trigger if exists branches_set_updated_at on public.branches;
create trigger branches_set_updated_at
  before update on public.branches
  for each row execute function public.set_updated_at();

-- Sprečava petlje u stablu (A → B → A).
create or replace function public.branches_prevent_cycle()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  current_id uuid := new.parent_id;
  depth int := 0;
begin
  while current_id is not null loop
    if current_id = new.id then
      raise exception 'Grana ne može biti sama sebi predak.';
    end if;
    depth := depth + 1;
    if depth > 20 then
      raise exception 'Stablo grana je preduboko (najviše 20 nivoa).';
    end if;
    select b.parent_id into current_id from public.branches b where b.id = current_id;
  end loop;
  return new;
end;
$$;

drop trigger if exists branches_prevent_cycle on public.branches;
create trigger branches_prevent_cycle
  before insert or update of parent_id on public.branches
  for each row execute function public.branches_prevent_cycle();

alter table public.branches enable row level security;

drop policy if exists "grane: svi čitaju" on public.branches;
create policy "grane: svi čitaju"
  on public.branches for select
  to anon, authenticated
  using (true);

drop policy if exists "grane: vlasnik dodaje" on public.branches;
create policy "grane: vlasnik dodaje"
  on public.branches for insert
  to authenticated
  with check (owner_id = (select auth.uid()) and (select public.is_owner()));

drop policy if exists "grane: vlasnik menja" on public.branches;
create policy "grane: vlasnik menja"
  on public.branches for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and (select public.is_owner()));

drop policy if exists "grane: vlasnik briše" on public.branches;
create policy "grane: vlasnik briše"
  on public.branches for delete
  to authenticated
  using (owner_id = (select auth.uid()) and (select public.is_owner()));

grant select on public.branches to anon, authenticated;
grant insert, update, delete on public.branches to authenticated;
grant all on public.branches to service_role;


-- ---------------------------------------------------------------------
-- 5) Biblioteka: knjige, igre, anime
-- ---------------------------------------------------------------------
create table if not exists public.books (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slug            text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  title           text not null check (char_length(title) between 1 and 300),
  authors         text[] not null default '{}',
  cover_url       text check (cover_url ~ '^https://' and char_length(cover_url) <= 500),
  openlibrary_key text check (char_length(openlibrary_key) <= 100),
  isbn            text check (char_length(isbn) <= 20),
  pages           integer check (pages between 1 and 50000),
  first_published smallint,
  status          public.book_status not null default 'citam',
  rating          smallint check (rating between 1 and 10),
  started_on      date,
  finished_on     date,
  is_public       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint books_owner_slug_key unique (owner_id, slug),
  constraint books_owner_openlibrary_key unique (owner_id, openlibrary_key)
);

create table if not exists public.games (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slug         text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  name         text not null check (char_length(name) between 1 and 300),
  cover_url    text check (cover_url ~ '^https://' and char_length(cover_url) <= 500),
  released     date,
  platforms    text[] not null default '{}',
  source       text not null default 'rawg' check (source in ('rawg', 'rucno')),
  external_id  text check (char_length(external_id) <= 50),
  status       public.game_status not null default 'igram',
  rating       smallint check (rating between 1 and 10),
  hours_played numeric(7, 1) check (hours_played >= 0),
  started_on   date,
  finished_on  date,
  is_public    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint games_owner_slug_key unique (owner_id, slug),
  constraint games_owner_external_key unique (owner_id, source, external_id)
);

create table if not exists public.anime (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slug             text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  mal_id           integer,
  title            text not null check (char_length(title) between 1 and 300),
  image_url        text check (image_url ~ '^https://' and char_length(image_url) <= 500),
  status           public.anime_status not null default 'plan_to_watch',
  score            smallint check (score between 0 and 10),
  episodes_watched integer not null default 0 check (episodes_watched >= 0),
  episodes_total   integer check (episodes_total >= 0),
  mal_updated_at   timestamptz,
  is_public        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint anime_owner_slug_key unique (owner_id, slug),
  constraint anime_owner_mal_key unique (owner_id, mal_id)
);

create index if not exists books_owner_status on public.books (owner_id, status);
create index if not exists games_owner_status on public.games (owner_id, status);
create index if not exists anime_owner_status on public.anime (owner_id, status);

do $$
declare t text;
begin
  foreach t in array array['books', 'games', 'anime'] loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    execute format(
      'create trigger %I_set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t, t);

    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "biblioteka: javno ili svoje" on public.%I', t);
    execute format(
      'create policy "biblioteka: javno ili svoje" on public.%I for select
         to anon, authenticated
         using (is_public or owner_id = (select auth.uid()))', t);

    execute format('drop policy if exists "biblioteka: vlasnik dodaje" on public.%I', t);
    execute format(
      'create policy "biblioteka: vlasnik dodaje" on public.%I for insert
         to authenticated
         with check (owner_id = (select auth.uid()) and (select public.is_owner()))', t);

    execute format('drop policy if exists "biblioteka: vlasnik menja" on public.%I', t);
    execute format(
      'create policy "biblioteka: vlasnik menja" on public.%I for update
         to authenticated
         using (owner_id = (select auth.uid()))
         with check (owner_id = (select auth.uid()) and (select public.is_owner()))', t);

    execute format('drop policy if exists "biblioteka: vlasnik briše" on public.%I', t);
    execute format(
      'create policy "biblioteka: vlasnik briše" on public.%I for delete
         to authenticated
         using (owner_id = (select auth.uid()) and (select public.is_owner()))', t);

    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;


-- ---------------------------------------------------------------------
-- 6) Upisi (sve što donosi XP: objave, treninzi, dnevnik, beleške...)
-- ---------------------------------------------------------------------
create table if not exists public.entries (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  branch_id    uuid not null references public.branches (id) on delete restrict,
  kind         public.entry_kind not null default 'post',
  title        text not null check (char_length(title) between 1 and 160),
  slug         text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  -- Tiptap dokument (JSON); prikazuje ga naš renderer, nikad kao sirov HTML.
  content      jsonb check (content is null or (jsonb_typeof(content) = 'object'
                            and pg_column_size(content) <= 262144)),
  excerpt      text check (char_length(excerpt) <= 400),
  -- polja specifična za vrstu upisa (serije sklekova, lokacija, trajanje...)
  metadata     jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  video_urls   text[] not null default '{}' check (cardinality(video_urls) <= 10),
  is_public    boolean not null default false,
  xp           integer not null default 0 check (xp between 0 and 5000),
  occurred_on  date not null default current_date,
  book_id      uuid references public.books (id) on delete cascade,
  game_id      uuid references public.games (id) on delete cascade,
  anime_id     uuid references public.anime (id) on delete cascade,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint entries_owner_slug_key unique (owner_id, slug),
  constraint entries_single_subject check (num_nonnulls(book_id, game_id, anime_id) <= 1)
);

-- Najviše jedan dnevnički upis po danu.
create unique index if not exists entries_one_journal_per_day
  on public.entries (owner_id, occurred_on) where kind = 'journal';
create index if not exists entries_public_feed
  on public.entries (occurred_on desc, created_at desc) where is_public;
create index if not exists entries_owner_feed
  on public.entries (owner_id, occurred_on desc, created_at desc);
create index if not exists entries_branch
  on public.entries (branch_id, occurred_on desc);
create index if not exists entries_book on public.entries (book_id) where book_id is not null;
create index if not exists entries_game on public.entries (game_id) where game_id is not null;
create index if not exists entries_anime on public.entries (anime_id) where anime_id is not null;

create or replace function public.entries_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_public and new.published_at is null then
    new.published_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists entries_before_write on public.entries;
create trigger entries_before_write
  before insert or update on public.entries
  for each row execute function public.entries_before_write();

alter table public.entries enable row level security;

drop policy if exists "upisi: javni ili svoji" on public.entries;
create policy "upisi: javni ili svoji"
  on public.entries for select
  to anon, authenticated
  using (is_public or owner_id = (select auth.uid()));

drop policy if exists "upisi: vlasnik dodaje" on public.entries;
create policy "upisi: vlasnik dodaje"
  on public.entries for insert
  to authenticated
  with check (owner_id = (select auth.uid()) and (select public.is_owner()));

drop policy if exists "upisi: vlasnik menja" on public.entries;
create policy "upisi: vlasnik menja"
  on public.entries for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and (select public.is_owner()));

drop policy if exists "upisi: vlasnik briše" on public.entries;
create policy "upisi: vlasnik briše"
  on public.entries for delete
  to authenticated
  using (owner_id = (select auth.uid()) and (select public.is_owner()));

grant select on public.entries to anon, authenticated;
grant insert, update, delete on public.entries to authenticated;
grant all on public.entries to service_role;


-- ---------------------------------------------------------------------
-- 7) Slike (fajlovi su u Storage-u, ovde su podaci o njima)
-- ---------------------------------------------------------------------
create table if not exists public.media (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- null dok se upis ne sačuva (slika je tek okačena)
  entry_id   uuid references public.entries (id) on delete cascade,
  bucket     text not null check (bucket in ('media-public', 'media-private')),
  path       text not null check (char_length(path) <= 300),
  thumb_path text not null check (char_length(thumb_path) <= 300),
  width      integer not null check (width between 1 and 10000),
  height     integer not null check (height between 1 and 10000),
  bytes      integer not null check (bytes between 1 and 10485760),
  alt        text check (char_length(alt) <= 300),
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  constraint media_path_key unique (path)
);

create index if not exists media_entry on public.media (entry_id, position);
create index if not exists media_orphans on public.media (owner_id, created_at) where entry_id is null;

alter table public.media enable row level security;

drop policy if exists "slike: javne ili svoje" on public.media;
create policy "slike: javne ili svoje"
  on public.media for select
  to anon, authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1 from public.entries e
      where e.id = media.entry_id and e.is_public
    )
  );

drop policy if exists "slike: vlasnik dodaje" on public.media;
create policy "slike: vlasnik dodaje"
  on public.media for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and split_part(path, '/', 1) = (select auth.uid())::text
    and split_part(thumb_path, '/', 1) = (select auth.uid())::text
    and (select public.is_owner())
  );

drop policy if exists "slike: vlasnik menja" on public.media;
create policy "slike: vlasnik menja"
  on public.media for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and (select public.is_owner()));

drop policy if exists "slike: vlasnik briše" on public.media;
create policy "slike: vlasnik briše"
  on public.media for delete
  to authenticated
  using (owner_id = (select auth.uid()) and (select public.is_owner()));

grant select on public.media to anon, authenticated;
grant insert, update, delete on public.media to authenticated;
grant all on public.media to service_role;


-- ---------------------------------------------------------------------
-- 8) Push pretplate (podsetnik u 22:00 na telefonu)
-- ---------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint     text not null check (endpoint ~ '^https://' and char_length(endpoint) <= 1000),
  p256dh       text not null check (char_length(p256dh) <= 200),
  auth         text not null check (char_length(auth) <= 100),
  user_agent   text check (char_length(user_agent) <= 300),
  created_at   timestamptz not null default now(),
  last_sent_at timestamptz,
  constraint push_subscriptions_endpoint_key unique (endpoint)
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push: vlasnik čita svoje" on public.push_subscriptions;
create policy "push: vlasnik čita svoje"
  on public.push_subscriptions for select
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "push: vlasnik dodaje" on public.push_subscriptions;
create policy "push: vlasnik dodaje"
  on public.push_subscriptions for insert
  to authenticated
  with check (owner_id = (select auth.uid()) and (select public.is_owner()));

drop policy if exists "push: vlasnik menja" on public.push_subscriptions;
create policy "push: vlasnik menja"
  on public.push_subscriptions for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "push: vlasnik briše" on public.push_subscriptions;
create policy "push: vlasnik briše"
  on public.push_subscriptions for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- Namerno bez anon prava.
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant all on public.push_subscriptions to service_role;


-- ---------------------------------------------------------------------
-- 9) Statistika: XP po grani
--    Sabira i privatne upise, ali vraća samo zbirove (ne sadržaj).
--    Posetioci dobijaju podatke samo ako je "show_stats_publicly" uključeno.
-- ---------------------------------------------------------------------
create or replace function public.xp_by_branch()
returns table (branch_id uuid, xp bigint, entry_count bigint, last_on date)
language sql
stable
security definer
set search_path = ''
as $$
  select e.branch_id,
         sum(e.xp)::bigint,
         count(*)::bigint,
         max(e.occurred_on)
  from public.entries e
  join public.profiles p on p.id = e.owner_id and p.is_owner
  where p.show_stats_publicly or p.id = (select auth.uid())
  group by e.branch_id;
$$;

revoke all on function public.xp_by_branch() from public;
grant execute on function public.xp_by_branch() to anon, authenticated, service_role;


-- ---------------------------------------------------------------------
-- 10) Storage: javni i privatni bucket za slike
--     Putanja fajla je uvek "<id-vlasnika>/<ime>.webp".
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media-public',  'media-public',  true,  5242880, array['image/webp', 'image/jpeg', 'image/png']),
  ('media-private', 'media-private', false, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "storage slike: vlasnik čita" on storage.objects;
create policy "storage slike: vlasnik čita"
  on storage.objects for select
  to authenticated
  using (
    bucket_id in ('media-public', 'media-private')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "storage slike: vlasnik dodaje" on storage.objects;
create policy "storage slike: vlasnik dodaje"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('media-public', 'media-private')
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_owner())
  );

drop policy if exists "storage slike: vlasnik menja" on storage.objects;
create policy "storage slike: vlasnik menja"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('media-public', 'media-private')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id in ('media-public', 'media-private')
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_owner())
  );

drop policy if exists "storage slike: vlasnik briše" on storage.objects;
create policy "storage slike: vlasnik briše"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('media-public', 'media-private')
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_owner())
  );


-- ---------------------------------------------------------------------
-- 11) Ako si korisnika napravio PRE pokretanja ovog fajla:
--     napravi mu profil i proglasi najstarijeg korisnika vlasnikom.
-- ---------------------------------------------------------------------
insert into public.profiles (id)
select u.id from auth.users u
on conflict (id) do nothing;

update public.profiles
set is_owner = true
where id = (select u.id from auth.users u order by u.created_at limit 1)
  and not exists (select 1 from public.profiles p where p.is_owner);
