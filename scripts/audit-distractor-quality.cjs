const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const cache = new Map()
function loadTs(file) {
  const resolved = path.resolve(file)
  if (cache.has(resolved)) return cache.get(resolved).exports
  const source = fs.readFileSync(resolved, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: resolved,
  }).outputText
  const mod = { exports: {} }
  cache.set(resolved, mod)
  const localRequire = (id) => {
    if (id.startsWith('.')) {
      const target = path.resolve(path.dirname(resolved), id)
      for (const candidate of [target, `${target}.ts`, `${target}.tsx`, path.join(target, 'index.ts')]) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return loadTs(candidate)
      }
    }
    return require(id)
  }
  new Function('exports', 'module', 'require', '__filename', '__dirname', compiled)(
    mod.exports, mod, localRequire, resolved, path.dirname(resolved)
  )
  return mod.exports
}

const catalogueSql = fs.readFileSync('database/catalog/active_curriculum.sql', 'utf8')
const catalogueMatch = catalogueSql.match(/\$levelup_skills\$\n([\s\S]*?)\n\$levelup_skills\$/)
if (!catalogueMatch) throw new Error('No se pudo leer el catálogo versionado de habilidades.')
const skills = JSON.parse(catalogueMatch[1])
const curriculum = loadTs('lib/curriculumQuestionGenerator.ts')
const quality = loadTs('lib/distractorQuality.ts')

const failures = []
const bySubject = {}
let checked = 0
let severe = 0
let weakHighDifficulty = 0
let highDifficultyChecked = 0

for (const skill of skills) {
  const subject = String(skill.id).charAt(0)
  bySubject[subject] ??= { checked: 0, weak: 0, severe: 0 }
  for (let difficulty = 1; difficulty <= 5; difficulty += 1) {
    for (let seed = 1; seed <= 48; seed += 1) {
      const question = curriculum.generateCurriculumQuestion(skill, difficulty, seed)
      const assessment = quality.assessDistractorQuality(question)
      checked += 1
      bySubject[subject].checked += 1
      if (assessment.score > quality.acceptableDistractorScore(difficulty)) bySubject[subject].weak += 1
      if (assessment.score >= 6) {
        severe += 1
        bySubject[subject].severe += 1
        failures.push({ skill: skill.id, difficulty, seed, score: assessment.score, reasons: assessment.reasons, options: question.options })
      }
      if (difficulty >= 3) {
        highDifficultyChecked += 1
        if (assessment.score > 1) weakHighDifficulty += 1
      }
      if (question.options.some((option) => /^Otra opción(?:\s+\d+)?$/i.test(String(option).trim()))) {
        failures.push({ skill: skill.id, difficulty, seed, score: 10, reasons: ['generic_filler'], options: question.options })
      }
    }
  }
}

const result = {
  skills: skills.length,
  questions: checked,
  severeGiveaways: severe,
  highDifficultyWeakShare: Number((weakHighDifficulty / Math.max(1, highDifficultyChecked)).toFixed(3)),
  bySubject,
}
console.log(JSON.stringify(result, null, 2))

// Block only strong elimination giveaways. Milder findings remain visible in
// the report so old banks can be improved progressively without breaking play.
if (failures.length) {
  console.error(JSON.stringify(failures.slice(0, 60), null, 2))
  process.exitCode = 1
}
