const assert = require('node:assert/strict')
const fs = require('node:fs')

const shell = fs.readFileSync('components/DemoGameShell.tsx', 'utf8')
for (const route of ['/world', '/mission/briefing', '/base', '/shop']) {
  assert.ok(shell.includes(`href="${route}"`), `Missing game dock route ${route}`)
}

const screens = {
  'components/DemoWorld.tsx': 'active="world"',
  'components/MathCity.tsx': 'active="world"',
  'components/MissionBriefing.tsx': 'active="mission"',
  'components/DemoBase.tsx': 'active="base"',
  'components/DemoShop.tsx': 'active="shop"',
  'components/DemoAchievements.tsx': '<DemoGameDock',
}
for (const [path, marker] of Object.entries(screens)) {
  const source = fs.readFileSync(path, 'utf8')
  assert.ok(source.includes('<DemoGameDock'), `${path} has no shared game dock`)
  assert.ok(source.includes(marker), `${path} has incorrect active navigation`)
  assert.equal((source.match(/className="game-dock"/g) ?? []).length, 0, `${path} duplicates the dock markup`)
}

console.log('Demo navigation audit passed.')
