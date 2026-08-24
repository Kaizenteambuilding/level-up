const assert = require('node:assert/strict')
const fs = require('node:fs')

const cutoff = '20260824101316'
const source = fs.readFileSync(`database/baseline/${cutoff}_public_schema.sql`, 'utf8')
const migrationFiles = fs.readdirSync('database/migrations').filter((name) => name.endsWith('.sql')).sort()

const count = (pattern) => (source.match(pattern) || []).length
assert.equal(migrationFiles.at(-1).slice(0, 14), cutoff, 'Baseline cutoff differs from the latest captured migration')
assert.equal(count(/^create table public\./gm), 13, 'Baseline table count mismatch')
assert.equal(count(/^alter table only public\..* add constraint/gm), 46, 'Baseline constraint count mismatch')
assert.equal(count(/^CREATE (?:UNIQUE )?INDEX /gm), 14, 'Baseline non-constraint index count mismatch')
assert.equal(count(/^CREATE OR REPLACE FUNCTION public\./gm), 15, 'Baseline function count mismatch')
assert.equal(count(/^CREATE TRIGGER /gm), 2, 'Baseline trigger count mismatch')
assert.equal(count(/^create policy /gm), 13, 'Baseline policy count mismatch')
assert.equal(count(/^alter table public\..* enable row level security;$/gm), 13, 'Not every exposed table enables RLS')
assert.ok(source.includes('create extension if not exists pgcrypto with schema extensions;'))
assert.ok(source.includes('create extension if not exists pg_cron with schema pg_catalog;'))
assert.ok(!/create extension[^;]+version/i.test(source), 'Extension versions must not be pinned')
assert.ok(source.includes("select cron.schedule('levelup-expire-abandoned-sessions'"), 'Cleanup job missing')
assert.ok(source.includes('LEVEL UP baseline requires an empty public application schema'), 'Existing-project guard missing')
assert.ok(source.includes('$levelup_units$') && source.includes('$levelup_skills$'), 'Curriculum catalogue missing')
const seedSection = source.split('-- Non-personal game catalogue')[1]?.split('-- Data API least privilege')[0] || ''
assert.ok(!/insert into public\.(families|parent_profiles|players|study_sessions|attempts|player_skill_state|product_events)/i.test(seedSection), 'Personal rows must not appear in the baseline catalogue')
assert.ok(/^begin;/m.test(source) && /commit;\s*$/.test(source), 'Baseline is not transactional')
assert.ok(!source.includes('\\n'), 'Baseline contains escaped line breaks')

console.log('Database baseline audit passed (13 tables, 15 RPC/functions, 13 RLS policies).')
