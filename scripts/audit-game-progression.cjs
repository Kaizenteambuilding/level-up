const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')

const source = fs.readFileSync('lib/gameProgression.ts', 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const loaded = { exports: {} }
new Function('exports', 'module', 'require', compiled)(loaded.exports, loaded, require)
const { xpForLevel, levelFromXp, levelProgress, gameRank, unlockedGameFeatures, nextGameUnlock } = loaded.exports

assert.equal(xpForLevel(1), 0)
assert.equal(xpForLevel(2), 300)
assert.equal(xpForLevel(3), 750)
assert.equal(xpForLevel(5), 2100)
assert.equal(levelFromXp(0), 1)
assert.equal(levelFromXp(299), 1)
assert.equal(levelFromXp(300), 2)
assert.equal(levelFromXp(749), 2)
assert.equal(levelFromXp(750), 3)
assert.deepEqual(levelProgress(450), { level: 2, current: 150, required: 450, percent: 33 })
assert.deepEqual(levelProgress(450, 1), { level: 1, current: 450, required: 300, percent: 100 })
assert.equal(gameRank(1), 'Recluta de LEVEL UP')
assert.equal(gameRank(7), 'Aventurero avanzado')
assert.equal(unlockedGameFeatures(1).length, 1)
assert.equal(unlockedGameFeatures(5).length, 4)
assert.equal(nextGameUnlock(1).id, 'shop')
assert.equal(nextGameUnlock(50), null)

for (let level = 2; level <= 50; level += 1) {
  assert.ok(xpForLevel(level) > xpForLevel(level - 1), `threshold ${level}`)
  assert.equal(levelFromXp(xpForLevel(level)), level)
}

console.log(JSON.stringify({ levelsChecked: 50, level2Xp: xpForLevel(2), level5Xp: xpForLevel(5), failures: [] }, null, 2))
