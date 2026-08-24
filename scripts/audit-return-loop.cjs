const assert = require('node:assert/strict')
const fs = require('node:fs')

const helper = fs.readFileSync('lib/returnLoop.ts', 'utf8')
const world = fs.readFileSync('components/DemoWorld.tsx', 'utf8')
const shell = fs.readFileSync('components/DemoGameShell.tsx', 'utf8')

assert.ok(helper.includes('history: DemoMissionRecord[]'), 'return loop must derive today completion from persisted mission history')
assert.ok(helper.includes('authoritativeStreak'), 'return loop must accept the authoritative streak instead of rebuilding it from a limited history')
assert.ok(helper.includes('completedToday'), 'return loop must distinguish today completion')
assert.ok(helper.includes('Racha protegida'), 'completed day must confirm protected streak')
assert.ok(helper.includes('Mañana habrá una nueva expedición'), 'completed day must set a clear next-day expectation')
assert.ok(shell.includes("summary as { streak_days?: number }"), 'game shell must source streak from the server summary')
assert.ok(world.includes('buildReturnLoop(game.missionHistory, player.streakDays)'), 'world must combine persisted today state with the authoritative streak')
assert.ok(world.includes('HACER MISIÓN DE HOY'), 'returning player must get a direct daily mission CTA')
assert.ok(world.includes('!returnLoop.completedToday'), 'daily CTA must disappear once today is complete')

console.log('Return loop audit passed.')
