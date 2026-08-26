# SECURITY DEFINER review

Reviewed 2026-08-26 against the production Supabase project.

The authenticated RPCs below intentionally remain `SECURITY DEFINER` because the client calls them through the Data API and each function performs an explicit `auth.uid()` check plus account/player ownership validation before privileged writes or reads:

- `complete_levelup_onboarding`
- `complete_levelup_session`
- `create_levelup_player`
- `equip_levelup_item`
- `get_levelup_game_summary`
- `open_levelup_session`
- `purchase_levelup_item`
- `report_levelup_product_event`
- `set_levelup_avatar`
- `set_levelup_game_preferences`
- `set_player_curriculum_plan`
- `setup_parent_family`
- `submit_levelup_attempt`

All reviewed public RPCs use an empty `search_path` and reference application relations with explicit schema qualification.

Two trigger-only functions do not need direct API execution. Migration `20260826134908_harden_internal_security_definer_triggers.sql` revokes direct `EXECUTE` from API roles for both and changes `abandon_expired_levelup_sessions_on_insert()` from `search_path=public` to an empty `search_path`.

Supabase's generic `authenticated_security_definer_function_executable` advisor will continue to warn on the intentionally exposed authenticated RPCs. Those warnings should be treated as review prompts, not blindly removed, because revoking `authenticated` execution would break the application RPC contract.

The separate Auth advisor warning for leaked-password protection requires an Auth project setting change rather than a database migration and is tracked separately.
