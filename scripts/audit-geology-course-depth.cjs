const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function compileModule(file, requireMap = {}) {
  const source = fs.readFileSync(file, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const moduleBox = { exports: {} }
  const localRequire = (id) => Object.prototype.hasOwnProperty.call(requireMap, id) ? requireMap[id] : require(id)
  vm.runInNewContext(compiled, { module: moduleBox, exports: moduleBox.exports, require: localRequire, console }, { filename: `${file}.js` })
  return moduleBox.exports
}

const supplement = compileModule('lib/geologyCourseDepthSupplement.ts')
const geology = compileModule('lib/geologyLongTermVariants.ts', {
  './geologyCourseDepthSupplement': supplement,
})
const { generateGeologyLongTermVariant } = geology
const expected = ['B02S01','B02S02','B02S03','B02S04']
const stats = []

for (const skillId of expected) {
  const byDifficulty = {}
  const all = new Set()
  for (let difficulty = 1; difficulty <= 5; difficulty += 1) {
    const prompts = new Set()
    for (let seed = 0; seed < 12000; seed += 1) {
      const item = generateGeologyLongTermVariant({ id: skillId, name: skillId, generator_key: `test_${skillId}` }, difficulty, seed)
      if (!item) throw new Error(`${skillId} returned no question at difficulty ${difficulty}`)
      if (!Array.isArray(item.options) || item.options.length !== 4 || new Set(item.options).size !== 4) throw new Error(`${skillId} has invalid options`)
      if (item.answerIndex < 0 || item.answerIndex > 3) throw new Error(`${skillId} has invalid answer index`)
      if (!item.solution || item.solution.trim().length < 20) throw new Error(`${skillId} has an insufficient explanation`)
      prompts.add(item.prompt)
      all.add(item.prompt)
    }
    byDifficulty[difficulty] = prompts.size
  }
  if (byDifficulty[1] < 16) throw new Error(`${skillId} only exposes ${byDifficulty[1]} prompts to a fresh player`)
  if (byDifficulty[2] < 23) throw new Error(`${skillId} only exposes ${byDifficulty[2]} prompts at difficulty 2`)
  if (all.size < 28) throw new Error(`${skillId} only exposes ${all.size} authored geology prompts overall`)
  stats.push(`${skillId}:d1=${byDifficulty[1]},d2=${byDifficulty[2]},all=${all.size}`)
}

const observatory = fs.readFileSync('components/ScienceObservatorySession.tsx', 'utf8')
if (!observatory.includes('if (!generated) { const fallback = candidates[')) throw new Error('Observatory no longer has a non-blocking repeat fallback')
if (observatory.includes('No se encontró una observación geológica nueva')) throw new Error('Old novelty blocker has returned')

console.log(`Geology course depth OK: ${stats.join(', ')}`)
