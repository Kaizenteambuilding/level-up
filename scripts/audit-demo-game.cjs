const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const vm = require('node:vm')

const source = fs.readFileSync('lib/demoGame.ts', 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const moduleBox = { exports: {} }
vm.runInNewContext(compiled, { module: moduleBox, exports: moduleBox.exports })
const { INITIAL_DEMO_STATE, normalizeDemoState, buyDemoItem, equipDemoItem, awardDemoMission, setDemoBaseTheme, demoAchievements } = moduleBox.exports

assert.equal(normalizeDemoState(null).coins, 450)
assert.equal(normalizeDemoState({}).coins, 450)
assert.equal(normalizeDemoState({ coins: -50, owned: ['robot', 'fake', 'robot'], equipped: { companion: 'robot', head: 'robot' } }).coins, 0)
const safe = normalizeDemoState({ coins: 12000, owned: ['robot', 'robot'], equipped: { companion: 'robot', head: 'robot' } })
assert.equal(safe.coins, 9999)
assert.deepEqual(Array.from(safe.owned), ['robot'])
assert.equal(safe.equipped.companion, 'robot')
assert.equal(safe.equipped.head, undefined)

const bought = buyDemoItem(INITIAL_DEMO_STATE, 'robot')
assert.equal(bought.coins, 290)
assert.ok(bought.owned.includes('robot'))
assert.equal(bought.equipped.companion, 'robot')
assert.equal(buyDemoItem(bought, 'robot'), bought)
assert.equal(buyDemoItem({ ...INITIAL_DEMO_STATE, coins: 10 }, 'robot').coins, 10)
assert.equal(equipDemoItem(INITIAL_DEMO_STATE, 'robot'), INITIAL_DEMO_STATE)
const withFox = buyDemoItem(bought, 'fox')
assert.equal(withFox.equipped.companion, 'fox')
assert.equal(equipDemoItem(withFox, 'robot').equipped.companion, 'robot')
const missionAward = awardDemoMission(INITIAL_DEMO_STATE, 'session-1', 8)
assert.equal(missionAward.reward, 80)
assert.equal(missionAward.state.coins, 530)
assert.deepEqual(Array.from(missionAward.state.rewardedSessions), ['session-1'])
const duplicateAward = awardDemoMission(missionAward.state, 'session-1', 10)
assert.equal(duplicateAward.reward, 0)
assert.equal(duplicateAward.state, missionAward.state)
assert.equal(setDemoBaseTheme(INITIAL_DEMO_STATE, 'forest').baseTheme, 'forest')
assert.equal(setDemoBaseTheme(INITIAL_DEMO_STATE, 'invalid'), INITIAL_DEMO_STATE)
assert.equal(normalizeDemoState({ coins: 1, baseTheme: 'invalid' }).baseTheme, 'space')
const themed = setDemoBaseTheme(setDemoBaseTheme(setDemoBaseTheme(INITIAL_DEMO_STATE, 'space'), 'forest'), 'arcade')
assert.equal(themed.visitedThemes.length, 3)
assert.equal(demoAchievements(themed).find((item) => item.id === 'decorator').unlocked, true)
assert.equal(demoAchievements(missionAward.state).find((item) => item.id === 'first-mission').unlocked, true)

console.log('Demo game economy audit passed.')
