begin;

alter policy staff_assignments_read_own on public.staff_event_assignments
using (staff_id = (select auth.uid()) and (select pulse_private.current_app_role()) = 'staff');

create or replace function public.list_event_staff(p_event_id text)
returns table (id uuid, full_name text, email text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform pulse_private.require_owned_event(p_event_id);

  return query
  select p.id, p.full_name, u.email::text
  from public.staff_event_assignments a
  join public.profiles p on p.id = a.staff_id
  join auth.users u on u.id = a.staff_id
  where a.event_id = p_event_id and p.role = 'staff';
end;
$$;

create or replace function public.add_event_staff(p_event_id text, p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  staff_email text := lower(btrim(p_email));
  target_id uuid;
begin
  perform pulse_private.require_owned_event(p_event_id);

  if staff_email is null or length(staff_email) > 254
    or staff_email !~ '^[^@[:space:]]+@[^@[:space:]]+$' then
    raise exception 'INVALID_STAFF_EMAIL';
  end if;

  begin
    select p.id into strict target_id
    from auth.users u
    join public.profiles p on p.id = u.id
    where lower(u.email) = staff_email and p.role = 'staff'
    for share of u, p;
  exception
    when no_data_found then raise exception 'STAFF_ACCOUNT_NOT_FOUND';
    when too_many_rows then raise exception 'STAFF_EMAIL_AMBIGUOUS';
  end;

  insert into public.staff_event_assignments (event_id, staff_id)
  values (p_event_id, target_id)
  on conflict (event_id, staff_id) do nothing;
end;
$$;

create or replace function public.staff_event_stats(p_event_id text default null)
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
  from public.events e
  left join public.staff_event_assignments a on a.event_id = e.id and a.staff_id = (select auth.uid())
  left join public.tickets t on t."eventId" = e.id
  where (
    (a.staff_id is not null and (select pulse_private.current_app_role()) = 'staff')
    or (e.owner_id = (select auth.uid()) and (select pulse_private.current_app_role()) = 'organizer')
  ) and e.status in ('published', 'closed') and (p_event_id is null or e.id = p_event_id)
  group by e.id
  order by e.id;
$$;

create or replace function pulse_private.check_ticket(p_ticket_id text, p_event_id text, p_confirm boolean)
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

commit;
