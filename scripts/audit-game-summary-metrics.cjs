const assert = require('node:assert/strict')
const fs = require('node:fs')

const files = fs.readdirSync('database/migrations').sort()
const name = files.find((file) => file.includes('fix_game_summary_metrics'))
assert.ok(name, 'Game summary metrics migration must exist')
const sql = fs.readFileSync(`database/migrations/${name}`, 'utf8')

assert.ok(sql.includes("'total_missions', coalesce(v_total_activities, 0)"), 'Backward-compatible total_missions must count activities')
assert.ok(sql.includes("'total_activities', coalesce(v_total_activities, 0)"), 'Summary must expose total activities')
assert.ok(sql.includes("'total_daily_expeditions', coalesce(v_total_daily_expeditions, 0)"), 'Summary must expose daily expeditions separately')
assert.ok(sql.includes("'active_days', coalesce(v_active_days, 0)"), 'Summary must expose active days separately')
assert.ok(sql.includes("ss.completed = true") && sql.includes("ss.phase = 'done'"), 'Summary metrics must only use completed done sessions')
assert.ok(sql.includes("count(*) filter (where ss.mode = 'daily')"), 'Daily expedition count must be mode-specific')
assert.ok(sql.includes("count(distinct (ss.ended_at at time zone 'Europe/Madrid')::date)"), 'Active days must be distinct Madrid calendar days')

console.log('Game summary metrics audit passed.')