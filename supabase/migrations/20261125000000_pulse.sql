create schema pulse_private;
revoke all on schema pulse_private from public, anon, authenticated;
grant usage on schema pulse_private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'user' check (role in ('user', 'organizer', 'staff'))
);

create table public.categories (
  id text primary key,
  name text not null
);

create table public.events (
  id text primary key,
  owner_id uuid not null default auth.uid() references public.profiles (id),
  title text not null check (length(btrim(title)) > 0),
  description text not null default '',
  "eventType" text not null check ("eventType" in ('event', 'concert')),
  "categoryId" text references public.categories (id),
  "organizerName" text not null default '',
  venue text not null default '',
  "startsAt" timestamptz,
  "endsAt" timestamptz,
  "posterUrl" text not null default '' check ("posterUrl" ~ '^(https?://|/images/|$)'),
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  "registrationMode" text not null check ("registrationMode" in ('unlimited', 'limited', 'seated')),
  capacity integer check (capacity > 0),
  "seatTemplateId" text,
  seats jsonb not null default '[]' check (jsonb_typeof(seats) = 'array'),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  check ("endsAt" > "startsAt"),
  check ("registrationMode" = 'limited' or capacity is null),
  check ("registrationMode" = 'seated' or ("seatTemplateId" is null and seats = '[]')),
  constraint published_event_is_complete check (
    status = 'draft' or (
      length(btrim(description)) > 0 and "categoryId" is not null
      and length(btrim("organizerName")) > 0 and length(btrim(venue)) > 0
      and "startsAt" is not null and "endsAt" is not null
      and ("registrationMode" <> 'limited' or capacity is not null)
      and ("registrationMode" <> 'seated' or seats <> '[]')
    )
  )
);

create table public.staff_event_assignments (
  event_id text not null references public.events (id) on delete cascade,
  staff_id uuid not null references public.profiles (id) on delete cascade,
  primary key (event_id, staff_id)
);

create table public.tickets (
  id text primary key,
  "eventId" text not null references public.events (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete cascade,
  "attendeeName" text not null check (length("attendeeName") between 2 and 120),
  "attendeeEmail" text not null,
  "seatId" text,
  status text not null default 'valid' check (status in ('valid', 'used', 'cancelled')),
  "createdAt" timestamptz not null default now(),
  "checkedInAt" timestamptz,
  "cancelledAt" timestamptz,
  check ((status = 'used') = ("checkedInAt" is not null)),
  check ((status = 'cancelled') = ("cancelledAt" is not null))
);

create index events_owner_idx on public.events (owner_id);
create index assignments_staff_idx on public.staff_event_assignments (staff_id, event_id);
create index tickets_event_idx on public.tickets ("eventId");
create index tickets_user_idx on public.tickets (user_id);
create unique index tickets_active_user_idx on public.tickets ("eventId", user_id)
  where status in ('valid', 'used');
create unique index tickets_active_email_idx on public.tickets ("eventId", "attendeeEmail")
  where status in ('valid', 'used');
create unique index tickets_active_seat_idx on public.tickets ("eventId", "seatId")
  where status in ('valid', 'used') and "seatId" is not null;

insert into public.categories (id, name) values
  ('CAT-MUSIC', 'Music & Concerts'),
  ('CAT-TECH', 'Technology & Innovation'),
  ('CAT-ART', 'Art & Design'),
  ('CAT-WORKSHOP', 'Workshop & Seminar'),
  ('CAT-COMMUNITY', 'Community & Lifestyle');

create function pulse_private.create_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 120));
  return new;
end;
$$;

create trigger pulse_create_profile
after insert on auth.users
for each row execute function pulse_private.create_profile();

insert into public.profiles (id, full_name)
select id, left(btrim(coalesce(raw_user_meta_data ->> 'full_name', '')), 120)
from auth.users
on conflict (id) do nothing;

create function pulse_private.current_app_role()
returns text
language sql
stable
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create function pulse_private.validate_event_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status not in ('draft', 'published') then
      raise exception 'INVALID_STATUS';
    end if;
    new."createdAt" := clock_timestamp();
  else
    if new.id is distinct from old.id or new.owner_id is distinct from old.owner_id then
      raise exception 'EVENT_IDENTITY_LOCKED';
    end if;

    if new.status is distinct from old.status and not (
      (old.status = 'draft' and new.status = 'published') or
      (old.status = 'published' and new.status = 'closed')
    ) then
      raise exception 'INVALID_STATUS';
    end if;

    if old.status <> 'draft' and (
      new."eventType", new."categoryId", new."organizerName", new.venue,
      new."startsAt", new."endsAt", new."registrationMode", new.capacity,
      new."seatTemplateId", new.seats
    ) is distinct from (
      old."eventType", old."categoryId", old."organizerName", old.venue,
      old."startsAt", old."endsAt", old."registrationMode", old.capacity,
      old."seatTemplateId", old.seats
    ) then
      raise exception 'PUBLISHED_FIELDS_LOCKED';
    end if;
    new."createdAt" := old."createdAt";
  end if;

  if new."registrationMode" = 'seated' and jsonb_typeof(new.seats) = 'array' and (
    exists (
      select 1 from jsonb_array_elements(new.seats) as item(seat)
      where jsonb_typeof(seat -> 'id') is distinct from 'string'
        or btrim(seat ->> 'id') = ''
        or jsonb_typeof(seat -> 'label') is distinct from 'string'
        or jsonb_typeof(seat -> 'row') is distinct from 'string'
        or jsonb_typeof(seat -> 'zone') is distinct from 'string'
        or jsonb_typeof(seat -> 'x') is distinct from 'number'
        or jsonb_typeof(seat -> 'y') is distinct from 'number'
    ) or exists (
      select 1 from jsonb_array_elements(new.seats) as item(seat)
      group by seat ->> 'id'
      having count(*) > 1
    )
  ) then
    raise exception 'INVALID_SEATS';
  end if;

  new."updatedAt" := clock_timestamp();
  return new;
end;
$$;

create trigger pulse_validate_event_write
before insert or update on public.events
for each row execute function pulse_private.validate_event_write();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.events enable row level security;
alter table public.tickets enable row level security;
alter table public.staff_event_assignments enable row level security;

create policy profiles_read_own on public.profiles
for select to authenticated using (id = (select auth.uid()));

create policy categories_read on public.categories
for select to anon, authenticated using (true);

create policy events_read_public on public.events
for select to anon, authenticated using (status in ('published', 'closed'));

create policy events_read_own on public.events
for select to authenticated
using (owner_id = (select auth.uid()) and (select pulse_private.current_app_role()) = 'organizer');

create policy events_insert_own on public.events
for insert to authenticated
with check (
  owner_id = (select auth.uid()) and status in ('draft', 'published')
  and (select pulse_private.current_app_role()) = 'organizer'
);

create policy events_update_own on public.events
for update to authenticated
using (owner_id = (select auth.uid()) and (select pulse_private.current_app_role()) = 'organizer')
with check (owner_id = (select auth.uid()) and (select pulse_private.current_app_role()) = 'organizer');

create policy events_delete_own_draft on public.events
for delete to authenticated
using (
  owner_id = (select auth.uid()) and status = 'draft'
  and (select pulse_private.current_app_role()) = 'organizer'
);

create policy staff_assignments_read_own on public.staff_event_assignments
for select to authenticated
using (staff_id = (select auth.uid()) and (select pulse_private.current_app_role()) = 'staff');

create policy tickets_read_own on public.tickets
for select to authenticated using (user_id = (select auth.uid()));

create policy tickets_read_for_owned_event on public.tickets
for select to authenticated
using (
  (select pulse_private.current_app_role()) = 'organizer'
  and exists (
    select 1 from public.events
    where events.id = tickets."eventId" and events.owner_id = (select auth.uid())
  )
);

create function public.event_availability(p_event_id text default null)
returns table ("eventId" text, "activeCount" integer, "occupiedSeatIds" text[])
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, count(t.id)::integer,
    coalesce(array_agg(t."seatId" order by t."seatId") filter (where t."seatId" is not null), '{}')
  from public.events e
  left join public.tickets t on t."eventId" = e.id and t.status in ('valid', 'used')
  where e.status in ('published', 'closed') and (p_event_id is null or e.id = p_event_id)
  group by e.id
  order by e.id;
$$;

create function public.staff_event_stats(p_event_id text default null)
returns table (
  "eventId" text, "activeCount" integer, "occupiedSeatIds" text[],
  "validCount" integer, "usedCount" integer, "cancelledCount" integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, count(t.id) filter (where t.status in ('valid', 'used'))::integer,
    coalesce(array_agg(t."seatId" order by t."seatId")
      filter (where t.status in ('valid', 'used') and t."seatId" is not null), '{}'),
    count(t.id) filter (where t.status = 'valid')::integer,
    count(t.id) filter (where t.status = 'used')::integer,
    count(t.id) filter (where t.status = 'cancelled')::integer
  from public.staff_event_assignments a
  join public.events e on e.id = a.event_id
  left join public.tickets t on t."eventId" = e.id
  where a.staff_id = (select auth.uid()) and (select pulse_private.current_app_role()) = 'staff'
    and e.status in ('published', 'closed') and (p_event_id is null or e.id = p_event_id)
  group by e.id
  order by e.id;
$$;

create function public.register_for_event(
  p_ticket_id text,
  p_event_id text,
  p_attendee_name text,
  p_seat_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  attendee_name text := btrim(p_attendee_name);
  attendee_email text;
  event_row public.events%rowtype;
  ticket_row public.tickets%rowtype;
  seat_id text;
  active_count integer;
begin
  if caller_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  if p_ticket_id is null or p_ticket_id !~ '^TKT-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'INVALID_TICKET_ID';
  end if;

  -- Serialize ticket and status changes for an event before checking availability.
  select * into event_row from public.events
  where id = p_event_id and status in ('published', 'closed')
  for update;
  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  select * into ticket_row from public.tickets where id = p_ticket_id;
  if found then
    if ticket_row.user_id = caller_id and ticket_row."eventId" = p_event_id then
      return jsonb_build_object('ticket', to_jsonb(ticket_row), 'recovered', true);
    end if;
    raise exception 'TICKET_ID_CONFLICT';
  end if;

  if event_row.status <> 'published' then
    raise exception 'EVENT_NOT_OPEN';
  end if;
  if clock_timestamp() >= event_row."startsAt" then
    raise exception 'EVENT_STARTED';
  end if;
  if attendee_name is null or length(attendee_name) not between 2 and 120 then
    raise exception 'INVALID_ATTENDEE_NAME';
  end if;

  select lower(btrim(email)) into attendee_email from auth.users
  where id = caller_id and email_confirmed_at is not null;
  if attendee_email is null or attendee_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'INVALID_ACCOUNT_EMAIL';
  end if;

  if exists (
    select 1 from public.tickets where "eventId" = p_event_id
      and user_id = caller_id and status in ('valid', 'used')
  ) then
    raise exception 'DUPLICATE_REGISTRATION';
  end if;
  if exists (
    select 1 from public.tickets where "eventId" = p_event_id
      and "attendeeEmail" = attendee_email and status in ('valid', 'used')
  ) then
    raise exception 'DUPLICATE_EMAIL';
  end if;

  if event_row."registrationMode" = 'limited' then
    select count(*) into active_count from public.tickets
    where "eventId" = p_event_id and status in ('valid', 'used');
    if active_count >= event_row.capacity then
      raise exception 'EVENT_FULL';
    end if;
  elsif event_row."registrationMode" = 'seated' then
    seat_id := p_seat_id;
    if seat_id is null or not exists (
      select 1 from jsonb_array_elements(event_row.seats) as item(seat)
      where seat ->> 'id' = seat_id
    ) then
      raise exception 'INVALID_SEAT';
    end if;
    if exists (
      select 1 from public.tickets where "eventId" = p_event_id
        and "seatId" = seat_id and status in ('valid', 'used')
    ) then
      raise exception 'SEAT_TAKEN';
    end if;
  end if;

  insert into public.tickets (id, "eventId", user_id, "attendeeName", "attendeeEmail", "seatId")
  values (p_ticket_id, p_event_id, caller_id, attendee_name, attendee_email, seat_id)
  on conflict (id) do nothing
  returning * into ticket_row;
  if not found then
    raise exception 'TICKET_ID_CONFLICT';
  end if;
  return jsonb_build_object('ticket', to_jsonb(ticket_row), 'recovered', false);
end;
$$;

create function public.cancel_ticket(p_ticket_id text)
returns public.tickets
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  ticket_row public.tickets%rowtype;
  starts_at timestamptz;
begin
  if caller_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select * into ticket_row from public.tickets where id = p_ticket_id and user_id = caller_id;
  if not found then
    raise exception 'NOT_FOUND';
  end if;

  select "startsAt" into starts_at from public.events where id = ticket_row."eventId" for update;
  select * into ticket_row from public.tickets where id = p_ticket_id and user_id = caller_id for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  if ticket_row.status = 'cancelled' then
    raise exception 'ALREADY_CANCELLED';
  end if;
  if ticket_row.status = 'used' then
    raise exception 'TICKET_ALREADY_USED';
  end if;
  if clock_timestamp() >= starts_at then
    raise exception 'EVENT_ALREADY_STARTED';
  end if;

  update public.tickets set status = 'cancelled', "cancelledAt" = clock_timestamp()
  where id = p_ticket_id returning * into ticket_row;
  return ticket_row;
end;
$$;

create function pulse_private.check_ticket(p_ticket_id text, p_event_id text, p_confirm boolean)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_role text := pulse_private.current_app_role();
  event_row public.events%rowtype;
  ticket_row public.tickets%rowtype;
  outcome text;
begin
  select * into event_row from public.events where id = p_event_id;
  if not found or caller_id is null or not coalesce(
    (caller_role = 'organizer' and event_row.owner_id = caller_id)
    or (caller_role = 'staff' and exists (
      select 1 from public.staff_event_assignments
      where event_id = p_event_id and staff_id = caller_id
    )), false
  ) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if p_confirm then
    select * into event_row from public.events where id = p_event_id for update;
    if not found then
      raise exception 'EVENT_NOT_FOUND';
    end if;
  end if;

  select * into ticket_row from public.tickets where id = p_ticket_id;
  if not found then
    return jsonb_build_object('outcome', 'NOT_FOUND', 'ticket', null);
  end if;
  if ticket_row."eventId" <> event_row.id then
    return jsonb_build_object('outcome', 'WRONG_EVENT', 'ticket', null);
  end if;

  if ticket_row.status = 'cancelled' then
    outcome := 'CANCELLED';
  elsif ticket_row.status = 'used' then
    outcome := 'ALREADY_USED';
  elsif event_row.status = 'draft' then
    outcome := 'EVENT_NOT_OPEN';
  elsif clock_timestamp() > event_row."endsAt" then
    outcome := 'EVENT_ENDED';
  elsif p_confirm then
    update public.tickets set status = 'used', "checkedInAt" = clock_timestamp()
    where id = ticket_row.id returning * into ticket_row;
    outcome := 'CHECKED_IN_SUCCESS';
  else
    outcome := 'READY';
  end if;

  return jsonb_build_object('outcome', outcome, 'ticket', to_jsonb(ticket_row) - 'user_id');
end;
$$;

create function public.verify_ticket_for_check_in(p_ticket_id text, p_event_id text)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select pulse_private.check_ticket(p_ticket_id, p_event_id, false);
$$;

create function public.confirm_check_in(p_ticket_id text, p_event_id text)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select pulse_private.check_ticket(p_ticket_id, p_event_id, true);
$$;

revoke all on public.profiles, public.categories, public.events, public.tickets,
  public.staff_event_assignments from public, anon, authenticated;
revoke all on all functions in schema pulse_private from public, anon, authenticated;
revoke all on function public.event_availability(text), public.staff_event_stats(text),
  public.register_for_event(text, text, text, text), public.cancel_ticket(text),
  public.verify_ticket_for_check_in(text, text), public.confirm_check_in(text, text)
  from public, anon, authenticated;

grant select on public.categories, public.events to anon, authenticated;
grant select on public.profiles, public.tickets, public.staff_event_assignments to authenticated;
grant insert, update, delete on public.events to authenticated;
grant all on public.profiles, public.categories, public.events, public.tickets,
  public.staff_event_assignments to service_role;
grant execute on function pulse_private.current_app_role() to authenticated;
grant execute on function public.event_availability(text) to anon, authenticated;
grant execute on function public.staff_event_stats(text), public.register_for_event(text, text, text, text),
  public.cancel_ticket(text), public.verify_ticket_for_check_in(text, text), public.confirm_check_in(text, text)
  to authenticated;
