const fs = require('node:fs')
const ts = require('typescript')

const catalogueSql = fs.readFileSync('database/catalog/active_curriculum.sql', 'utf8')
const catalogueMatch = catalogueSql.match(/\$levelup_skills\$\n([\s\S]*?)\n\$levelup_skills\$/)
if (!catalogueMatch) throw new Error('No se pudo leer el catálogo versionado de habilidades.')

const skills = JSON.parse(catalogueMatch[1])
const source = fs.readFileSync('lib/firstEvaluationGenerators.ts', 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText
const generatedModule = { exports: {} }
new Function('exports', 'module', 'require', compiled)(generatedModule.exports, generatedModule, require)
const generate = generatedModule.exports.generateFirstEvaluationQuestion

const SEEDS = 250
const failures = []
let checked = 0
let minimumPromptVariants = Infinity
let minimumFamilyVariants = Infinity
let worstAnswerPositionShare = 1

for (const skill of skills) {
  for (let difficulty = 1; difficulty <= 5; difficulty += 1) {
    const prompts = new Set()
    const families = new Set()
    const positions = [0, 0, 0, 0]

    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const question = generate(skill, difficulty, seed)
      const repeated = generate(skill, difficulty, seed)
      checked += 1
      prompts.add(question.prompt.trim())
      positions[question.answerIndex] += 1

      const familyTags = question.tags.filter((tag) => tag.startsWith('family:'))
      familyTags.forEach((tag) => families.add(tag))

      if (JSON.stringify(question) !== JSON.stringify(repeated)) {
        failures.push({ skill: skill.id, difficulty, seed, reason: 'non_deterministic' })
      }
      if (familyTags.length !== 1) {
        failures.push({ skill: skill.id, difficulty, seed, reason: 'family_tag_count' })
      }
      if (question.tags.length < 2 || new Set(question.tags).size !== question.tags.length) {
        failures.push({ skill: skill.id, difficulty, seed, reason: 'invalid_tags' })
      }
      if (question.prompt.length > 500 || question.solution.length > 700) {
        failures.push({ skill: skill.id, difficulty, seed, reason: 'excessive_text_length' })
      }
      if (question.options.some((option) => option.trim().length === 0 || option.length > 300)) {
        failures.push({ skill: skill.id, difficulty, seed, reason: 'invalid_option_length' })
      }
    }

    const leastUsedPosition = Math.min(...positions) / SEEDS
    minimumPromptVariants = Math.min(minimumPromptVariants, prompts.size)
    minimumFamilyVariants = Math.min(minimumFamilyVariants, families.size)
    worstAnswerPositionShare = Math.min(worstAnswerPositionShare, leastUsedPosition)

    if (prompts.size < 5) {
      failures.push({ skill: skill.id, difficulty, reason: 'low_prompt_diversity', variants: prompts.size })
    }
    if (families.size < 3) {
      failures.push({ skill: skill.id, difficulty, reason: 'low_family_diversity', variants: families.size })
    }
    if (leastUsedPosition < 0.14) {
      failures.push({ skill: skill.id, difficulty, reason: 'answer_position_bias', positions })
    }
  }
}

const result = {
  skills: skills.length,
  questions: checked,
  minimumPromptVariants,
  minimumFamilyVariants,
  worstAnswerPositionShare: Number(worstAnswerPositionShare.toFixed(3)),
  qualityFailures: failures.length,
  failuresByReason: failures.reduce((counts, failure) => {
    counts[failure.reason] = (counts[failure.reason] ?? 0) + 1
    return counts
  }, {}),
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) {
  console.error(JSON.stringify([...failures].sort((a, b) => a.reason.localeCompare(b.reason)).slice(0, 80), null, 2))
  process.exitCode = 1
}
