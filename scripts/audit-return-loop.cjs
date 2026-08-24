const assert = require('node:assert/strict')
const fs = require('node:fs')

const helper = fs.readFileSync('lib/returnLoop.ts', 'utf8')
const world = fs.readFileSync('components/DemoWorld.tsx', 'utf8')

assert.ok(helper.includes('history: DemoMissionRecord[]'), 'return loop must derive from persisted mission history')
assert.ok(helper.includes('completedToday'), 'return loop must distinguish today completion')
assert.ok(helper.includes('Racha protegida'), 'completed day must confirm protected streak')
assert.ok(helper.includes('Mañana habrá una nueva expedición'), 'completed day must set a clear next-day expectation')
assert.ok(world.includes('buildReturnLoop(game.missionHistory)'), 'world must use persisted mission history for return guidance')
assert.ok(world.includes('HACER MISIÓN DE HOY'), 'returning player must get a direct daily mission CTA')
assert.ok(world.includes('!returnLoop.completedToday'), 'daily CTA must disappear once today is complete')

console.log('Return loop audit passed.')
