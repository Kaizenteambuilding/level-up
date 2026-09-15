const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const ROOT = process.cwd()
const moduleCache = new Map()

function resolveLocal(fromFile, request) {
  const base = path.resolve(path.dirname(fromFile), request)
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.cjs`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
    path.join(base, 'index.js'),
  ]
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())
}

function loadTsModule(file) {
  const absolute = path.resolve(ROOT, file)
  if (moduleCache.has(absolute)) return moduleCache.get(absolute).exports

  const source = fs.readFileSync(absolute, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: absolute,
  }).outputText

  const mod = { exports: {} }
  moduleCache.set(absolute, mod)

  function localRequire(request) {
    if (!request.startsWith('.')) return require(request)
    const resolved = resolveLocal(absolute, request)
    if (!resolved) throw new Error(`Cannot resolve ${request} from ${absolute}`)
    if (resolved.endsWith('.ts') || resolved.endsWith('.tsx')) return loadTsModule(resolved)
    return require(resolved)
  }

  new Function('exports', 'module', 'require', '__filename', '__dirname', compiled)(
    mod.exports,
    mod,
    localRequire,
    absolute,
    path.dirname(absolute),
  )
  return mod.exports
}

const catalogueSql = fs.readFileSync('database/catalog/active_curriculum.sql', 'utf8')
const catalogueMatch = catalogueSql.match(/\$levelup_skills\$\n([\s\S]*?)\n\$levelup_skills\$/)
if (!catalogueMatch) throw new Error('No se pudo leer el catálogo versionado de habilidades.')
const skills = JSON.parse(catalogueMatch[1])

const { generateCurriculumQuestion } = loadTsModule('lib/curriculumQuestionGenerator.ts')
if (typeof generateCurriculumQuestion !== 'function') throw new Error('No se pudo cargar generateCurriculumQuestion.')

const SCHOOL_DAYS = 180
const QUESTIONS_PER_DAY = 20
const TOTAL_QUESTIONS = SCHOOL_DAYS * QUESTIONS_PER_DAY
const PER_SKILL_STRESS = 180
const MIN_EXACT_PROMPTS = 24
const MIN_NORMALIZED_TEMPLATES = 12

function normalizedTemplate(prompt) {
  return String(prompt)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/-?\d+(?:[.,]\d+)?/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
}

function seedFor(skillIndex, attempt) {
  let x = (0x9e3779b9 ^ Math.imul(skillIndex + 1, 0x85ebca6b) ^ Math.imul(attempt + 1, 0xc2b2ae35)) >>> 0
  x ^= x >>> 16
  x = Math.imul(x, 0x7feb352d) >>> 0
  x ^= x >>> 15
  x = Math.imul(x, 0x846ca68b) >>> 0
  x ^= x >>> 16
  return x >>> 0
}

const bySkill = new Map(skills.map((skill) => [skill.id, {
  skill,
  exact: new Set(),
  templates: new Set(),
  lastPrompt: null,
  immediateRepeats: 0,
  generated: 0,
  repeatDistances: [],
  lastSeenAt: new Map(),
}]))

const failures = []
let generated = 0
let hardStops = 0

// Stress every curriculum skill independently. This measures generator depth; raw
// seed adjacency is diagnostic only because real sessions apply history-aware selection.
for (let skillIndex = 0; skillIndex < skills.length; skillIndex += 1) {
  const skill = skills[skillIndex]
  const stats = bySkill.get(skill.id)
  for (let attempt = 0; attempt < PER_SKILL_STRESS; attempt += 1) {
    const difficulty = 1 + (attempt % 5)
    const seed = seedFor(skillIndex, attempt)
    let question
    try {
      question = generateCurriculumQuestion(skill, difficulty, seed)
    } catch (error) {
      hardStops += 1
      failures.push(`${skill.id}: generation threw at sample ${attempt}: ${error instanceof Error ? error.message : String(error)}`)
      continue
    }

    generated += 1
    stats.generated += 1
    const prompt = String(question.prompt || '').trim()
    if (!prompt) {
      failures.push(`${skill.id}: empty prompt at sample ${attempt}`)
      continue
    }
    if (stats.lastPrompt === prompt) stats.immediateRepeats += 1
    const previous = stats.lastSeenAt.get(prompt)
    if (previous != null) stats.repeatDistances.push(attempt - previous)
    stats.lastSeenAt.set(prompt, attempt)
    stats.lastPrompt = prompt
    stats.exact.add(prompt)
    stats.templates.add(normalizedTemplate(prompt))
  }
}

// Simulate realistic mixed daily use with persistent history across a full school year.
let mixedImmediateRepeats = 0
let previousMixedPrompt = null
for (let index = 0; index < TOTAL_QUESTIONS; index += 1) {
  const day = Math.floor(index / QUESTIONS_PER_DAY)
  const slot = index % QUESTIONS_PER_DAY
  const skillIndex = (day * 7 + slot * 13 + Math.floor(day / 5)) % skills.length
  const skill = skills[skillIndex]
  const difficulty = 1 + ((day + slot) % 5)
  const seed = seedFor(skillIndex, SCHOOL_DAYS + index)
  try {
    const question = generateCurriculumQuestion(skill, difficulty, seed)
    const prompt = String(question.prompt || '').trim()
    if (!prompt) {
      failures.push(`mixed-day-${day + 1}:${skill.id}: empty prompt`)
      continue
    }
    if (prompt === previousMixedPrompt) mixedImmediateRepeats += 1
    previousMixedPrompt = prompt
  } catch (error) {
    hardStops += 1
    failures.push(`mixed-day-${day + 1}:${skill.id}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

const shallow = []
for (const stats of bySkill.values()) {
  if (stats.generated !== PER_SKILL_STRESS) failures.push(`${stats.skill.id}: generated ${stats.generated}/${PER_SKILL_STRESS}`)
  if (stats.exact.size < MIN_EXACT_PROMPTS || stats.templates.size < MIN_NORMALIZED_TEMPLATES) {
    shallow.push({
      id: stats.skill.id,
      name: stats.skill.name,
      exactPrompts: stats.exact.size,
      normalizedTemplates: stats.templates.size,
      shortestRepeatDistance: stats.repeatDistances.length ? Math.min(...stats.repeatDistances) : null,
    })
  }
}

if (mixedImmediateRepeats > 0) failures.push(`mixed-course: ${mixedImmediateRepeats} immediate exact repeats`)
if (hardStops > 0) failures.push(`hard-stops:${hardStops}`)
if (shallow.length) failures.push(`shallow-skills:${shallow.length}`)

const exactCounts = [...bySkill.values()].map((stats) => stats.exact.size).sort((a,b) => a-b)
const templateCounts = [...bySkill.values()].map((stats) => stats.templates.size).sort((a,b) => a-b)
const stressRepeatRows = [...bySkill.values()]
  .filter((stats) => stats.immediateRepeats > 0)
  .map((stats) => ({ id: stats.skill.id, immediateRepeats: stats.immediateRepeats }))
  .sort((a,b) => b.immediateRepeats - a.immediateRepeats)
const stressImmediateRepeats = stressRepeatRows.reduce((sum, row) => sum + row.immediateRepeats, 0)
const median = (values) => values[Math.floor(values.length / 2)]

const result = {
  schoolDays: SCHOOL_DAYS,
  mixedQuestions: TOTAL_QUESTIONS,
  skills: skills.length,
  stressSamplesPerSkill: PER_SKILL_STRESS,
  generated,
  hardStops,
  mixedImmediateRepeats,
  stressImmediateRepeats,
  worstStressImmediateRepeatSkills: stressRepeatRows.slice(0, 10),
  minimumExactPromptsPerSkill: exactCounts[0],
  medianExactPromptsPerSkill: median(exactCounts),
  minimumNormalizedTemplatesPerSkill: templateCounts[0],
  medianNormalizedTemplatesPerSkill: median(templateCounts),
  thresholds: { exactPrompts: MIN_EXACT_PROMPTS, normalizedTemplates: MIN_NORMALIZED_TEMPLATES },
  shallowSkills: shallow,
}
console.log(JSON.stringify(result, null, 2))

if (failures.length) {
  console.error('Course-year simulation audit failed:')
  for (const failure of failures.slice(0, 60)) console.error(`- ${failure}`)
  process.exit(1)
}
