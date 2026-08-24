-- Read-only structural parity check for production or a restored empty project.
do $baseline_parity$
declare
  v_failures text[] := '{}'::text[];
  v_actual integer;
begin
  select count(*) into v_actual from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p');
  if v_actual <> 13 then v_failures := array_append(v_failures, format('tables:%s',v_actual)); end if;

  select count(*) into v_actual from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public';
  if v_actual <> 46 then v_failures := array_append(v_failures, format('constraints:%s',v_actual)); end if;

  select count(*) into v_actual from pg_indexes i where schemaname='public' and not exists(select 1 from pg_class ic join pg_namespace inn on inn.oid=ic.relnamespace join pg_constraint con on con.conindid=ic.oid where inn.nspname='public' and ic.relname=i.indexname);
  if v_actual <> 14 then v_failures := array_append(v_failures, format('indexes:%s',v_actual)); end if;

  select count(*) into v_actual from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and not exists(select 1 from pg_depend d where d.objid=p.oid and d.classid='pg_proc'::regclass and d.deptype='e');
  if v_actual <> 15 then v_failures := array_append(v_failures, format('functions:%s',v_actual)); end if;

  select count(*) into v_actual from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname='public';
  if v_actual <> 2 then v_failures := array_append(v_failures, format('triggers:%s',v_actual)); end if;

  select count(*) into v_actual from pg_policies where schemaname='public';
  if v_actual <> 13 then v_failures := array_append(v_failures, format('policies:%s',v_actual)); end if;

  select count(*) into v_actual from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p') and c.relrowsecurity;
  if v_actual <> 13 then v_failures := array_append(v_failures, format('rls_tables:%s',v_actual)); end if;

  select count(*) into v_actual from public.curriculum_units where active;
  if v_actual <> 15 then v_failures := array_append(v_failures, format('active_units:%s',v_actual)); end if;
  select count(*) into v_actual from public.skills where active;
  if v_actual <> 91 then v_failures := array_append(v_failures, format('active_skills:%s',v_actual)); end if;
  select count(*) into v_actual from public.game_items where active;
  if v_actual <> 6 then v_failures := array_append(v_failures, format('active_game_items:%s',v_actual)); end if;
  select count(*) into v_actual from cron.job where jobname='levelup-expire-abandoned-sessions';
  if v_actual <> 1 then v_failures := array_append(v_failures, format('cleanup_jobs:%s',v_actual)); end if;

  if cardinality(v_failures) > 0 then raise exception 'LEVEL UP baseline parity failed: %', array_to_string(v_failures, ', '); end if;
  raise notice 'LEVEL UP baseline parity passed';
end
$baseline_parity$;
