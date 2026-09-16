const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const ROOT = process.cwd()
const moduleCache = new Map()

function resolveLocal(fromFile, request) {
  const base = path.resolve(path.dirname(fromFile), request)
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.cjs`, path.join(base, 'index.ts')]
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

const catalogueSql = fs.readFileSync('database/catalog/active_curriculum.sql', 'utf8')
const catalogueMatch = catalogueSql.match(/\$levelup_skills\$\n([\s\S]*?)\n\$levelup_skills\$/)
if (!catalogueMatch) throw new Error('No se pudo leer el catálogo de habilidades.')
const skills = JSON.parse(catalogueMatch[1])
const skillIndex = skills.findIndex((skill) => skill.id === 'M14S01')
if (skillIndex < 0) throw new Error('M14S01 no existe en el catálogo activo.')
const skill = skills[skillIndex]

const { generateCurriculumQuestion } = loadTsModule('lib/curriculumQuestionGenerator.ts')
if (typeof generateCurriculumQuestion !== 'function') throw new Error('No se pudo cargar generateCurriculumQuestion.')

const exact = new Set()
const templates = new Set()
const lastExact = new Map()
const lastTemplate = new Map()
const exactWithin = { 7: 0, 30: 0, 120: 0 }
const templateWithin = { 7: 0, 30: 0, 120: 0 }
let immediateRepeats = 0
let previousPrompt = null
let generated = 0
const failures = []

function record(distance, target) {
  for (const window of [7, 30, 120]) if (distance <= window) target[window] += 1
}

for (let attempt = 0; attempt < 180; attempt += 1) {
  const difficulty = 1 + (attempt % 5)
  const seed = seedFor(skillIndex, attempt)
  const question = generateCurriculumQuestion(skill, difficulty, seed)
  generated += 1
  const prompt = String(question.prompt || '').trim()
  if (!prompt) {
    failures.push(`sample ${attempt}: empty prompt`)
    continue
  }
  if (question.options.length !== 4 || new Set(question.options).size !== 4) {
    failures.push(`sample ${attempt}: expected four unique options`)
  }
  if (question.answerIndex < 0 || question.answerIndex >= question.options.length) {
    failures.push(`sample ${attempt}: invalid answer index ${question.answerIndex}`)
  }

  const template = normalizedTemplate(prompt)
  if (prompt === previousPrompt) immediateRepeats += 1
  const previousExact = lastExact.get(prompt)
  if (previousExact != null) record(attempt - previousExact, exactWithin)
  const previousTemplate = lastTemplate.get(template)
  if (previousTemplate != null) record(attempt - previousTemplate, templateWithin)

  lastExact.set(prompt, attempt)
  lastTemplate.set(template, attempt)
  exact.add(prompt)
  templates.add(template)
  previousPrompt = prompt
}

if (generated !== 180) failures.push(`generated ${generated}/180`)
if (exact.size < 80) failures.push(`only ${exact.size} exact prompts; expected at least 80`)
if (templates.size < 20) failures.push(`only ${templates.size} normalized templates; expected at least 20`)
if (immediateRepeats > 6) failures.push(`${immediateRepeats} immediate repeats; expected at most 6`)

const result = {
  skill: skill.id,
  generated,
  exactPrompts: exact.size,
  normalizedTemplates: templates.size,
  immediateRepeats,
  exactRepeatsWithinSamples: exactWithin,
  templateRepeatsWithinSamples: templateWithin,
  failures: failures.slice(0, 20),
}

console.log(JSON.stringify(result, null, 2))
if (failures.length) throw new Error(`M14S01 sampling recurrence audit failed with ${failures.length} issue(s).`)
