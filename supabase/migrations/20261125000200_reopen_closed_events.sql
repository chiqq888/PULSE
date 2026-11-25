create or replace function pulse_private.validate_event_write()
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
      (old.status = 'published' and new.status = 'closed') or
      (old.status = 'closed' and new.status = 'published')
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
