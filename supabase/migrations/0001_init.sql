-- ════════════════════════════════════════════════════════════════════════
--  MasjidOS 26 — initial schema, RLS, device pairing, realtime broadcast
-- ════════════════════════════════════════════════════════════════════════
--  Multi-tenant model: ONE mosque = one tenant.
--    • Admin phones authenticate with Google OAuth and get a `profiles` row.
--    • TV displays authenticate ANONYMOUSLY (signInAnonymously) after pairing
--      and get a `devices` row — no Google login on the TV.
--
--  Realtime is two-lane (per research):
--    • LOW-frequency shared state  → display_state row + AFTER-UPDATE trigger
--      that broadcasts onto the private channel  mosque:{mosque_id}.
--    • HIGH-frequency khutbah text → client-side Broadcast from the admin phone
--      on the same channel (NOT a row write per chunk — handled in app code).
--
--  Apply with:  supabase db push     (or paste into the SQL editor)
-- ════════════════════════════════════════════════════════════════════════

-- A private schema for SECURITY DEFINER helpers that must NOT be exposed via
-- the auto-generated API. RLS policies call these to resolve tenancy without
-- recursive policy evaluation.
create schema if not exists private;

-- ─────────────────────────────────────────────────────────────────────────
--  TABLES
-- ─────────────────────────────────────────────────────────────────────────

-- A mosque/surau — the tenant root.
create table if not exists public.mosques (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  jakim_zone   text not null default 'WLY01',   -- e-Solat zone code, e.g. SGR01
  city         text,
  state        text,
  logo_text    text not null default 'Masjid',   -- shown as the TV header badge
  accent_color text not null default '#e6bd55',  -- gold by default (brand)
  watermark    boolean not null default true,    -- show "MasjidOS 26" on TV
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

-- One profile per Google-authenticated admin user.
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  mosque_id  uuid references public.mosques (id) on delete set null,
  full_name  text,
  email      text,
  role       text not null default 'admin',       -- 'admin' | 'owner'
  created_at timestamptz not null default now()
);

-- A paired TV display. Created by the TV itself (anonymous auth) with a pairing
-- code; bound to a mosque when an admin claims the code.
create table if not exists public.devices (
  id             uuid primary key default gen_random_uuid(),
  mosque_id      uuid references public.mosques (id) on delete cascade,  -- null until claimed
  device_user_id uuid references auth.users (id) on delete cascade,      -- the anon auth user
  pairing_code   text not null,                  -- 6-char, uppercase, single-use
  name           text default 'TV Display',
  status         text not null default 'online', -- 'online' | 'offline'
  claimed_at     timestamptz,
  last_seen      timestamptz not null default now(),
  created_at     timestamptz not null default now()
);
create index if not exists devices_mosque_idx on public.devices (mosque_id);
create index if not exists devices_user_idx on public.devices (device_user_id);
create index if not exists devices_code_idx on public.devices (pairing_code);

-- The single source-of-truth display state per mosque. Low-frequency fields
-- only; the live khutbah TEXT stream is ephemeral Broadcast, not stored here.
create table if not exists public.display_state (
  mosque_id    uuid primary key references public.mosques (id) on delete cascade,
  announcement jsonb,                              -- { text, priority } | null
  khutbah_live boolean not null default false,
  khutbah_lang text not null default 'ms',         -- 'ms' | 'en' | 'ar'
  active_event jsonb,                              -- denormalised "now showing" event
  updated_at   timestamptz not null default now()
);

-- Upcoming kuliah / events.
create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  mosque_id  uuid not null references public.mosques (id) on delete cascade,
  name       text not null,
  time_label text,                                 -- human label e.g. "8:00 PM - 9:30 PM"
  speaker    text,
  location   text,
  starts_at  timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists events_mosque_idx on public.events (mosque_id);

-- Donations (one row per bill). Inserted by the ToyyibPay webhook (service
-- role); read by admin + TV for the live ticker.
create table if not exists public.donations (
  id             uuid primary key default gen_random_uuid(),
  mosque_id      uuid not null references public.mosques (id) on delete cascade,
  billcode       text unique,                      -- ToyyibPay bill code (idempotency key)
  display_name   text not null default 'Anonymous',
  amount         numeric(10,2) not null,
  anonymous      boolean not null default true,
  status         text not null default 'pending',  -- 'pending' | 'success' | 'failed'
  transaction_id text,
  created_at     timestamptz not null default now(),
  paid_at        timestamptz
);
create index if not exists donations_mosque_idx on public.donations (mosque_id);

-- Optional: a record of each live khutbah session (final transcript saved at end).
create table if not exists public.khutbah_sessions (
  id              uuid primary key default gen_random_uuid(),
  mosque_id       uuid not null references public.mosques (id) on delete cascade,
  lang            text not null default 'ms',
  full_transcript text,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz
);
create index if not exists khutbah_mosque_idx on public.khutbah_sessions (mosque_id);

-- Global reference table of Quranic verses for the khutbah display. These are
-- PINNED (never live-transcribed) because spontaneous Quran STT is unreliable.
create table if not exists public.quran_verses (
  id        uuid primary key default gen_random_uuid(),
  surah     int not null,
  ayah      int not null,
  reference text not null,                         -- e.g. "Al-Baqarah 2:255"
  arabic    text not null,
  trans_ms  text,
  trans_en  text,
  unique (surah, ayah)
);

-- ─────────────────────────────────────────────────────────────────────────
--  TENANCY HELPERS (SECURITY DEFINER — bypass RLS to avoid recursion)
-- ─────────────────────────────────────────────────────────────────────────

-- Mosque of the current ADMIN (profiles only). Used for WRITE authority — a
-- TV (which has no profile) resolves to null and therefore cannot write.
create or replace function private.admin_mosque_id()
returns uuid
language sql
security definer
stable
set search_path = ''
as $$
  select mosque_id from public.profiles where id = (select auth.uid());
$$;

-- Mosque of the current ADMIN *or* paired DEVICE. Used for READ authority and
-- realtime channel membership (both phone and TV may subscribe).
create or replace function private.resolve_mosque_id()
returns uuid
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(
    (select mosque_id from public.profiles where id = (select auth.uid())),
    (select mosque_id from public.devices  where device_user_id = (select auth.uid()))
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────
--  ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────

alter table public.mosques          enable row level security;
alter table public.profiles         enable row level security;
alter table public.devices          enable row level security;
alter table public.display_state    enable row level security;
alter table public.events           enable row level security;
alter table public.donations        enable row level security;
alter table public.khutbah_sessions enable row level security;
alter table public.quran_verses     enable row level security;

-- mosques: members (admin or device) can read; admins create + update their own.
create policy "read own mosque" on public.mosques
  for select to authenticated
  using (id = private.resolve_mosque_id());
create policy "create mosque" on public.mosques
  for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy "update own mosque" on public.mosques
  for update to authenticated
  using (id = private.admin_mosque_id())
  with check (id = private.admin_mosque_id());

-- profiles: a user reads/updates only their own row; may insert it on first login.
create policy "read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "insert own profile" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid()));

-- devices:
--   • A device (anon user) can create its own pending row and read/update it.
--   • An admin can read + manage devices belonging to their mosque.
create policy "device reads self" on public.devices
  for select to authenticated
  using (device_user_id = (select auth.uid()) or mosque_id = private.admin_mosque_id());
create policy "device inserts self" on public.devices
  for insert to authenticated
  with check (device_user_id = (select auth.uid()) and mosque_id is null);
create policy "device updates self" on public.devices
  for update to authenticated
  using (device_user_id = (select auth.uid()) or mosque_id = private.admin_mosque_id());
create policy "admin deletes device" on public.devices
  for delete to authenticated
  using (mosque_id = private.admin_mosque_id());

-- display_state: members read; only the ADMIN writes.
create policy "read display_state" on public.display_state
  for select to authenticated using (mosque_id = private.resolve_mosque_id());
create policy "admin upsert display_state" on public.display_state
  for insert to authenticated with check (mosque_id = private.admin_mosque_id());
create policy "admin update display_state" on public.display_state
  for update to authenticated
  using (mosque_id = private.admin_mosque_id())
  with check (mosque_id = private.admin_mosque_id());

-- events: members read; admin writes.
create policy "read events" on public.events
  for select to authenticated using (mosque_id = private.resolve_mosque_id());
create policy "admin writes events" on public.events
  for all to authenticated
  using (mosque_id = private.admin_mosque_id())
  with check (mosque_id = private.admin_mosque_id());

-- donations: members read (for the ticker). Inserts/updates come from the
-- webhook via the service role, which bypasses RLS — so no write policy here.
create policy "read donations" on public.donations
  for select to authenticated using (mosque_id = private.resolve_mosque_id());

-- khutbah_sessions: members read; admin writes.
create policy "read khutbah" on public.khutbah_sessions
  for select to authenticated using (mosque_id = private.resolve_mosque_id());
create policy "admin writes khutbah" on public.khutbah_sessions
  for all to authenticated
  using (mosque_id = private.admin_mosque_id())
  with check (mosque_id = private.admin_mosque_id());

-- quran_verses: world-readable reference data.
create policy "read verses" on public.quran_verses
  for select to authenticated using (true);

-- ─────────────────────────────────────────────────────────────────────────
--  DEVICE PAIRING RPC  (admin claims a TV's 6-digit code)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.claim_device(p_code text, p_name text default null)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mosque_id uuid;
  v_device    public.devices;
begin
  -- Caller must be a logged-in admin with a mosque.
  select mosque_id into v_mosque_id from public.profiles where id = (select auth.uid());
  if v_mosque_id is null then
    raise exception 'NO_MOSQUE: finish onboarding before pairing a screen';
  end if;

  -- Find an unclaimed, unexpired device by code (codes live 15 minutes).
  select * into v_device from public.devices
   where pairing_code = upper(trim(p_code))
     and mosque_id is null
     and created_at > now() - interval '15 minutes'
   order by created_at desc
   limit 1;

  if v_device.id is null then
    raise exception 'INVALID_CODE: code not found or expired';
  end if;

  update public.devices
     set mosque_id = v_mosque_id,
         claimed_at = now(),
         name = coalesce(nullif(trim(coalesce(p_name, '')), ''), name, 'TV Display')
   where id = v_device.id;

  -- Ensure a display_state row exists for this mosque so the TV has something
  -- to read immediately on its first subscribe.
  insert into public.display_state (mosque_id)
  values (v_mosque_id)
  on conflict (mosque_id) do nothing;

  return json_build_object('ok', true, 'device_id', v_device.id, 'mosque_id', v_mosque_id);
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
--  REALTIME BROADCAST  (DB → private channel mosque:{id})
-- ─────────────────────────────────────────────────────────────────────────
-- Low-frequency state changes fan out to every TV without per-subscriber RLS
-- cost (unlike Postgres Changes). The TV also SELECTs the row on mount, so a
-- refreshed/just-paired screen is instantly correct.

create or replace function public.tg_broadcast_display_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.broadcast_changes(
    'mosque:' || coalesce(new.mosque_id, old.mosque_id)::text, -- topic
    'display_state',                                           -- event name
    tg_op,                                                     -- operation
    tg_table_name,
    tg_table_schema,
    new,
    old
  );
  return null;
end;
$$;

drop trigger if exists broadcast_display_state on public.display_state;
create trigger broadcast_display_state
  after insert or update on public.display_state
  for each row execute function public.tg_broadcast_display_state();

-- Donations fan out to the live ticker on success.
create or replace function public.tg_broadcast_donation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'success' and (tg_op = 'INSERT' or old.status is distinct from 'success') then
    perform realtime.broadcast_changes(
      'mosque:' || new.mosque_id::text,
      'donation', tg_op, tg_table_name, tg_table_schema, new, old
    );
  end if;
  return null;
end;
$$;

drop trigger if exists broadcast_donation on public.donations;
create trigger broadcast_donation
  after insert or update on public.donations
  for each row execute function public.tg_broadcast_donation();

-- ─────────────────────────────────────────────────────────────────────────
--  REALTIME AUTHORIZATION  (who may receive/send on a private channel)
-- ─────────────────────────────────────────────────────────────────────────
-- Members of a mosque may RECEIVE messages on their own channel; only ADMINS
-- may SEND (e.g. the client-side live-khutbah Broadcast from the phone).

alter table realtime.messages enable row level security;

create policy "members receive on their channel" on realtime.messages
  for select to authenticated
  using (realtime.topic() = 'mosque:' || private.resolve_mosque_id()::text);

create policy "admins send on their channel" on realtime.messages
  for insert to authenticated
  with check (realtime.topic() = 'mosque:' || private.admin_mosque_id()::text);
