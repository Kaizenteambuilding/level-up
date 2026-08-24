const assert = require('node:assert/strict')
const fs = require('node:fs')

const shell = fs.readFileSync('components/DemoGameShell.tsx', 'utf8')
const mission = fs.readFileSync('components/CurriculumDailySession.tsx', 'utf8')
const consumers = [
  'MissionBriefing.tsx', 'GameOnboarding.tsx', 'DemoShop.tsx', 'DemoAchievements.tsx',
  'DemoBase.tsx', 'ZonePreview.tsx', 'MathCity.tsx', 'DemoWorld.tsx',
]

assert.ok(shell.includes('export function DemoGameError'), 'Shared game error recovery is missing')
assert.ok(shell.includes('window.location.reload()'), 'Game error recovery cannot retry')
assert.ok(shell.includes('Tu progreso ya guardado sigue a salvo.'), 'Recovery does not reassure the player about saved progress')
assert.match(shell, /role="status" aria-live="polite"/, 'Game loading state is not announced politely')
assert.match(shell, /role="alert" aria-live="assertive"/, 'Game failure is not announced assertively')

for (const filename of consumers) {
  const source = fs.readFileSync(`components/${filename}`, 'utf8')
  assert.ok(source.includes('DemoGameError'), `${filename} does not use shared recovery`)
}

assert.ok(mission.includes('window.location.reload()'), 'Mission load failure cannot retry')
assert.ok(mission.includes('Tu progreso ya guardado sigue a salvo.'), 'Mission recovery does not protect user confidence')

console.log('Product resilience audit passed (8 game routes and mission recovery).')
