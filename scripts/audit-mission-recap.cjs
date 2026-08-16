const fs = require('node:fs')
const ts = require('typescript')

const source = fs.readFileSync('lib/missionRecap.ts', 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText
const loaded = { exports: {} }
new Function('exports', 'module', 'require', compiled)(loaded.exports, loaded, require)
const { buildMissionRecap } = loaded.exports

const failures = []
const recap = buildMissionRecap(
  {
    fractions: { attempts: 2, correct: 0 },
    equations: { attempts: 2, correct: 1 },
    integers: { attempts: 3, correct: 3 },
    geometry: { attempts: 1, correct: 1 },
  },
  {
    fractions: 'Fracciones',
    equations: 'Ecuaciones',
    integers: 'Números enteros',
    geometry: 'Geometría',
  }
)

if (recap.review.map((item) => item.skillId).join(',') !== 'fractions,equations') failures.push('review_order')
if (recap.resolved.map((item) => item.skillId).join(',') !== 'integers,geometry') failures.push('resolved_order')
if (recap.review.some((item) => recap.resolved.some((other) => other.skillId === item.skillId))) failures.push('overlapping_groups')

const perfect = buildMissionRecap(
  { algebra: { attempts: 1, correct: 1 } },
  { algebra: 'Álgebra' }
)
if (perfect.review.length !== 0 || perfect.resolved.length !== 1) failures.push('perfect_session')

const empty = buildMissionRecap({}, {})
if (empty.review.length !== 0 || empty.resolved.length !== 0) failures.push('empty_session')

console.log(JSON.stringify({
  scenarios: 3,
  review: recap.review.map((item) => item.label),
  resolved: recap.resolved.map((item) => item.label),
  failures,
}, null, 2))
if (failures.length) process.exitCode = 1
