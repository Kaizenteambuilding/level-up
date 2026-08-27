const fs = require('node:fs')
const ts = require('typescript')

function load(path, extras = {}) {
  const source = fs.readFileSync(path, 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const mod = { exports: {} }
  new Function('exports','module','require',compiled)(mod.exports, mod, (id) => extras[id] ?? require(id))
  return mod.exports
}

const subjects = load('lib/subjects.ts')
const curricula = load('lib/subjectCurricula.ts', { './subjects': subjects })
const first = load('lib/firstEvaluationGenerators.ts')
const languageBase = load('lib/languageSubjectGenerators.ts', { './firstEvaluationGenerators': first })
const expanded = load('lib/englishExpandedGenerators.ts', {
  './firstEvaluationGenerators': first,
  './languageSubjectGenerators': languageBase,
})
const bonus = load('lib/englishBonusVariants.ts', { './firstEvaluationGenerators': first })
const language = load('lib/languageCriticalVariants.ts', {
  './firstEvaluationGenerators': first,
  './languageSubjectGenerators': languageBase,
  './englishExpandedGenerators': expanded,
  './englishBonusVariants': bonus,
})

const failures = []
let generated = 0
let minimumUniquePrompts = Infinity
const seeds = Array.from({ length: 240 }, (_, index) => index + 1)
const expandedKeys = new Set(expanded.expandedEnglishGeneratorKeys())
const bonusKeys = new Set(bonus.englishBonusGeneratorKeys())

for (const unit of curricula.SUBJECT_CURRICULA.english) {
  for (const definition of unit.skills) {
    const skill = { id: definition.id, name: definition.name, generator_key: definition.generatorKey }
    if (!expandedKeys.has(definition.generatorKey)) failures.push(`${definition.id}:missing_expanded_bank:${definition.generatorKey}`)
    if (!bonusKeys.has(definition.generatorKey)) failures.push(`${definition.id}:missing_bonus_variant:${definition.generatorKey}`)
    const prompts = new Set()
    for (const difficulty of [1, 2, 3, 4, 5]) {
      for (const seed of seeds) {
        const question = language.generateLanguageQuestionWithCriticalVariants(skill, difficulty, seed)
        generated += 1
        prompts.add(question.prompt.trim().toLowerCase())
        if (question.options.length !== 4 || new Set(question.options).size !== 4) failures.push(`${definition.id}:invalid_options`)
        if (question.answerIndex < 0 || question.answerIndex > 3) failures.push(`${definition.id}:invalid_answer_index`)
      }
    }
    minimumUniquePrompts = Math.min(minimumUniquePrompts, prompts.size)
    if (prompts.size < 6) failures.push(`${definition.id}:only_${prompts.size}_unique_prompts`)
  }
}

const terminalSource = fs.readFileSync('components/EnglishTerminalSession.tsx', 'utf8')
for (const marker of [
  'RECENT_PROMPT_WINDOW = 80',
  ".eq('player_id', id).like('skill_id', 'E%')",
  'recentTemplates.current.includes(template(nextQuestion.prompt))',
  'const candidates = [primarySkill, ...alternatives]',
]) {
  if (!terminalSource.includes(marker)) failures.push(`terminal_missing:${marker}`)
}

console.log(JSON.stringify({
  englishSkills: curricula.SUBJECT_CURRICULA.english.flatMap((unit) => unit.skills).length,
  expandedBanks: expandedKeys.size,
  bonusVariants: bonusKeys.size,
  generated,
  minimumUniquePrompts,
  failures,
}, null, 2))
if (failures.length) process.exitCode = 1
