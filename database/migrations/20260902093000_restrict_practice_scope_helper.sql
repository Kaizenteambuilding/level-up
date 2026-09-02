-- Internal helper: called by the SECURITY DEFINER attempt-scope trigger.
-- It is not part of the client RPC surface, so authenticated users do not
-- need direct EXECUTE permission.
revoke all on function public.levelup_practice_mode_allows_skill(text, text) from public;
revoke all on function public.levelup_practice_mode_allows_skill(text, text) from anon;
revoke all on function public.levelup_practice_mode_allows_skill(text, text) from authenticated;
