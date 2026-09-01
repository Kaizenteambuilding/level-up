create or replace function public.levelup_practice_mode_allows_skill(p_mode text, p_skill_id text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when p_mode = 'daily' then true
    when p_mode = 'math_numbers' then cu.id between 'M01' and 'M07'
    when p_mode = 'math_algebra' then cu.id in ('M08','M09')
    when p_mode = 'math_geometry_data' then cu.id between 'M10' and 'M15'
    when p_mode = 'science_investigation' then cu.id = 'B01'
    when p_mode = 'science_observatory' then cu.id = 'B02'
    when p_mode = 'science_life' then cu.id in ('B03','B04','B05')
    when p_mode = 'geography_maps' then cu.id = 'G01'
    when p_mode = 'geography_physical' then cu.id in ('G02','G03')
    when p_mode = 'history_ancient' then cu.id in ('G04','G05','G06')
    when p_mode in ('english_terminal','english_conversation','english_listening') then cu.subject_id = 'english'
    when p_mode in ('spanish_reading','spanish_words','spanish_writing') then cu.subject_id = 'spanish'
    else false
  end
  from public.skills s
  join public.curriculum_units cu on cu.id = s.unit_id
  where s.id = p_skill_id
    and s.active = true
    and s.generator_key is not null
    and cu.active = true;
$$;

revoke all on function public.levelup_practice_mode_allows_skill(text,text) from public;
grant execute on function public.levelup_practice_mode_allows_skill(text,text) to authenticated;

create or replace function public.enforce_levelup_attempt_practice_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mode text;
begin
  select ss.mode into v_mode
  from public.study_sessions ss
  where ss.id = new.session_id;

  if v_mode is null then
    raise exception 'Study session not found';
  end if;

  if not coalesce(public.levelup_practice_mode_allows_skill(v_mode, new.skill_id), false) then
    raise exception 'Skill is not available for this study session mode';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_levelup_attempt_practice_scope() from public;

 drop trigger if exists enforce_levelup_attempt_practice_scope on public.attempts;
create trigger enforce_levelup_attempt_practice_scope
before insert or update of session_id, skill_id on public.attempts
for each row execute function public.enforce_levelup_attempt_practice_scope();
