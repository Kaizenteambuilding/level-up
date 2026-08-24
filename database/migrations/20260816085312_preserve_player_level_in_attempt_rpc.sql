-- Recovered from the applied Supabase migration history.
-- Version: 20260816085312 · preserve_player_level_in_attempt_rpc

do $migration$
declare
  v_oid oid;
  v_definition text;
  v_updated_definition text;
  v_old_level_expression text := $old$level = least(
        50,
        greatest(
          coalesce(level, 1),
          1 + ((coalesce(xp, 0) + v_xp_awarded) / 500)
        )
      )$old$;
begin
  select p.oid
    into v_oid
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'submit_levelup_attempt'
    and pg_get_function_identity_arguments(p.oid) =
      'p_player_id uuid, p_skill_id text, p_correct boolean, p_response_ms integer, p_difficulty integer, p_seed bigint, p_prompt text, p_session_id uuid, p_diagnostic_tags text[]';

  if v_oid is null then
    raise exception 'submit_levelup_attempt signature not found';
  end if;

  v_definition := pg_get_functiondef(v_oid);
  v_updated_definition := replace(
    v_definition,
    v_old_level_expression,
    'level = coalesce(level, 1)'
  );

  if v_updated_definition = v_definition then
    raise exception 'Legacy 500 XP level expression not found';
  end if;

  execute v_updated_definition;
end
$migration$;

alter function public.submit_levelup_attempt(
  uuid, text, boolean, integer, integer, bigint, text, uuid, text[]
) set search_path = '';

-- Keep setup isolated to the public application schema. Its body currently
-- uses qualified ownership checks and is executable only by authenticated.
revoke execute on function public.setup_parent_family(text, text) from public, anon;
grant execute on function public.setup_parent_family(text, text) to authenticated;

revoke execute on function public.submit_levelup_attempt(
  uuid, text, boolean, integer, integer, bigint, text, uuid, text[]
) from public, anon;
grant execute on function public.submit_levelup_attempt(
  uuid, text, boolean, integer, integer, bigint, text, uuid, text[]
) to authenticated;

