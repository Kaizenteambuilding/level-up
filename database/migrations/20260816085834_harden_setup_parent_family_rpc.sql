-- Recovered from the applied Supabase migration history.
-- Version: 20260816085834 · harden_setup_parent_family_rpc

create or replace function public.setup_parent_family(
  family_name text,
  parent_name text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  new_family_id uuid;
  clean_family_name text := btrim(family_name);
  clean_parent_name text := btrim(parent_name);
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  if clean_family_name is null
    or char_length(clean_family_name) = 0
    or char_length(clean_family_name) > 80
  then
    raise exception 'Family name must contain between 1 and 80 characters';
  end if;

  if clean_parent_name is null
    or char_length(clean_parent_name) = 0
    or char_length(clean_parent_name) > 80
  then
    raise exception 'Parent name must contain between 1 and 80 characters';
  end if;

  select pp.family_id
    into new_family_id
  from public.parent_profiles pp
  where pp.id = (select auth.uid());

  if new_family_id is not null then
    return new_family_id;
  end if;

  insert into public.families(name)
  values (clean_family_name)
  returning id into new_family_id;

  insert into public.parent_profiles(id, family_id, display_name)
  values ((select auth.uid()), new_family_id, clean_parent_name)
  on conflict (id) do update
    set family_id = excluded.family_id,
        display_name = excluded.display_name;

  return new_family_id;
end;
$function$;

revoke execute on function public.setup_parent_family(text, text) from public, anon;
grant execute on function public.setup_parent_family(text, text) to authenticated;

