const fs = require('node:fs')
const ts = require('typescript')

const catalogueSql = fs.readFileSync(
  'database/catalog/active_curriculum.sql',
  'utf8'
)
const catalogueMatch = catalogueSql.match(
  /\$levelup_skills\$\n([\s\S]*?)\n\$levelup_skills\$/
)

if (!catalogueMatch) {
  throw new Error('No se pudo leer el catálogo versionado de habilidades.')
}

const skills = JSON.parse(catalogueMatch[1])
const source = fs.readFileSync('lib/firstEvaluationGenerators.ts', 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText

const generatedModule = { exports: {} }
new Function('exports', 'module', 'require', compiled)(
  generatedModule.exports,
  generatedModule,
  require
)

const generate = generatedModule.exports.generateFirstEvaluationQuestion
const failures = []
let checked = 0
let fallbackQuestions = 0
let fillerOptions = 0
let invalidTokens = 0

for (const skill of skills) {
  for (let difficulty = 1; difficulty <= 5; difficulty += 1) {
    for (let seed = 1; seed <= 250; seed += 1) {
      const question = generate(skill, difficulty, seed)
      checked += 1

      const structurallyValid =
        question.skillId === skill.id &&
        question.difficulty === difficulty &&
        question.prompt.trim().length > 0 &&
        question.solution.trim().length > 0 &&
        question.options.length === 4 &&
        new Set(question.options).size === 4 &&
        question.answerIndex >= 0 &&
        question.answerIndex < 4

      if (!structurallyValid) {
        failures.push({ skill: skill.id, difficulty, seed })
      }

      if (question.tags.includes('fallback_generator')) fallbackQuestions += 1
      if (question.options.some((option) => option.startsWith('Otra opción'))) {
        fillerOptions += 1
      }
      if (
        [question.prompt, question.solution, ...question.options].some((value) =>
          /NaN|undefined|Infinity/.test(String(value))
        )
      ) {
        invalidTokens += 1
      }
    }
  }
}

const result = {
  skills: skills.length,
  questions: checked,
  structuralFailures: failures.length,
  fallbackQuestions,
  fillerOptions,
  invalidTokens,
}

console.log(JSON.stringify(result, null, 2))

if (
  skills.length !== 91 ||
  failures.length > 0 ||
  fallbackQuestions > 0 ||
  fillerOptions > 0 ||
  invalidTokens > 0
) {
  if (failures.length > 0) console.error(failures.slice(0, 20))
  process.exitCode = 1
}
