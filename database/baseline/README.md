# LEVEL UP database baseline

`20260824101316_public_schema.sql` is a schema-only recovery snapshot taken at the migration cutoff `20260824101316`. It contains the public application schema, RLS policies, RPC functions, triggers, least-privilege grants, the hourly abandoned-session job, and the non-personal curriculum and game-item catalogues.

It deliberately excludes Auth users, families, players, attempts, sessions, progress and product events. Never use it as a personal-data backup.

## Restore rehearsal

1. Create a separate empty Supabase project. Never rehearse against production.
2. Apply this baseline once with `psql --single-transaction --variable ON_ERROR_STOP=1 --file database/baseline/20260824101316_public_schema.sql "$NEW_DB_URL"`.
3. Do not replay the 26 historical migrations at or before the cutoff; their final state is already represented by the baseline.
4. Run `database/tests/baseline_parity.sql` on the new project.
5. Regenerate `lib/database.types.ts`, run `npm run verify`, then complete setup, onboarding and one ten-question mission using disposable test data.
6. Only after that rehearsal may the baseline be considered restore-certified.

Future schema changes continue as timestamped files in `database/migrations/`. A later baseline must use a new cutoff and pass the same parity audit.
