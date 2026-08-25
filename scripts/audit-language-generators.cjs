const fs = require('node:fs')
const ts = require('typescript')

function load(path, extras = {}) {
  const source = fs.readFileSync(path, 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const mod = { exports: {} }
  const localRequire = (id) => extras[id] ?? require(id)
  new Function('exports','module','require',compiled)(mod.exports, mod, localRequire)
  return mod.exports
}

const subjects = load('lib/subjects.ts')
const curricula = load('lib/subjectCurricula.ts', { './subjects': subjects })
const first = load('lib/firstEvaluationGenerators.ts')
const language = load('lib/languageSubjectGenerators.ts', { './firstEvaluationGenerators': first })
const failures = []
let generated = 0
const keys = new Set(language.languageGeneratorKeys())

for (const subjectId of ['spanish','english']) {
  for (const unit of curricula.SUBJECT_CURRICULA[subjectId]) {
    for (const definition of unit.skills) {
      if (!keys.has(definition.generatorKey)) failures.push(`${definition.id}:missing_key:${definition.generatorKey}`)
      const skill = { id: definition.id, name: definition.name, generator_key: definition.generatorKey }
      for (const difficulty of [1,2,3]) {
        for (const seed of [1,2,17,101,997]) {
          const q = language.generateLanguageSubjectQuestion(skill, difficulty, seed)
          generated += 1
          if (!q) { failures.push(`${definition.id}:null_question`); continue }
          if (q.options.length !== 4 || new Set(q.options).size !== 4) failures.push(`${definition.id}:bad_options`)
          if (q.answerIndex < 0 || q.answerIndex > 3) failures.push(`${definition.id}:bad_answer_index`)
          if (!q.prompt || !q.solution) failures.push(`${definition.id}:missing_text`)
          if (q.skillId !== definition.id) failures.push(`${definition.id}:skill_mismatch`)
        }
      }
    }
  }
}

console.log(JSON.stringify({ skills: 48, generated, generatorKeys: keys.size, failures }, null, 2))
if (failures.length) process.exitCode = 1
