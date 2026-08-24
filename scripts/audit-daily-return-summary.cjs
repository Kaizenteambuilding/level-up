const assert = require('node:assert/strict')
const fs = require('node:fs')

const helper = fs.readFileSync('lib/dailyReturnSummary.ts', 'utf8')
const world = fs.readFileSync('components/DemoWorld.tsx', 'utf8')

assert.ok(helper.includes('game.missionHistory'), 'summary must use persisted mission history')
assert.ok(helper.includes('latest.correct'), 'summary must show the latest mission result')
assert.ok(helper.includes('latest.xp'), 'summary must show persisted XP earned')
assert.ok(helper.includes('latest.reward'), 'summary must show persisted reward when present')
assert.ok(helper.includes('streakDays'), 'summary must use the authoritative streak')
assert.ok(world.includes('buildDailyReturnSummary(game, returnLoop.completedToday, player.streakDays)'), 'world must derive one coherent daily summary')
assert.ok(world.includes('aria-label="Resumen de regreso"'), 'world must surface the return summary accessibly')

console.log('Daily return summary audit passed.')
