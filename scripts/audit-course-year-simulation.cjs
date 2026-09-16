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
const STRESS_WINDOWS = [7, 30, 120]
const MIXED_DAY_WINDOWS = [7, 30, 120]

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

function emptyWindowCounts(windows) {
  return Object.fromEntries(windows.map((window) => [window, 0]))
}

function recordDistance(distance, windows, counts) {
  for (const window of windows) {
    if (distance <= window) counts[window] += 1
  }
}

function rate(count, denominator) {
  return denominator > 0 ? Number((count / denominator).toFixed(3)) : 0
}

const bySkill = new Map(skills.map((skill) => [skill.id, {
  skill,
  exact: new Set(),
  templates: new Set(),
  lastPrompt: null,
  immediateRepeats: 0,
  generated: 0,
  repeatDistances: [],
  templateRepeatDistances: [],
  lastSeenAt: new Map(),
  lastTemplateSeenAt: new Map(),
  exactWindowRepeats: emptyWindowCounts(STRESS_WINDOWS),
  templateWindowRepeats: emptyWindowCounts(STRESS_WINDOWS),
  exactRepeatEvents: 0,
  templateRepeatEvents: 0,
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
    const template = normalizedTemplate(prompt)
    if (stats.lastPrompt === prompt) stats.immediateRepeats += 1

    const previous = stats.lastSeenAt.get(prompt)
    if (previous != null) {
      const distance = attempt - previous
      stats.repeatDistances.push(distance)
      stats.exactRepeatEvents += 1
      recordDistance(distance, STRESS_WINDOWS, stats.exactWindowRepeats)
    }
    stats.lastSeenAt.set(prompt, attempt)

    const previousTemplate = stats.lastTemplateSeenAt.get(template)
    if (previousTemplate != null) {
      const distance = attempt - previousTemplate
      stats.templateRepeatDistances.push(distance)
      stats.templateRepeatEvents += 1
      recordDistance(distance, STRESS_WINDOWS, stats.templateWindowRepeats)
    }
    stats.lastTemplateSeenAt.set(template, attempt)

    stats.lastPrompt = prompt
    stats.exact.add(prompt)
    stats.templates.add(template)
  }
}

// Simulate mixed daily generator use across a full school year. These recurrence
// diagnostics use calendar-day distance within each skill. They do not replace the
// separate UI-mode continuity audit, which verifies recent history never blocks play.
let mixedImmediateRepeats = 0
let previousMixedPrompt = null
const mixedBySkill = new Map(skills.map((skill) => [skill.id, {
  generated: 0,
  exactRepeatEvents: 0,
  templateRepeatEvents: 0,
  exactDayWindows: emptyWindowCounts(MIXED_DAY_WINDOWS),
  templateDayWindows: emptyWindowCounts(MIXED_DAY_WINDOWS),
  lastExactDay: new Map(),
  lastTemplateDay: new Map(),
  shortestExactDayDistance: null,
  shortestTemplateDayDistance: null,
}]))

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

    const stats = mixedBySkill.get(skill.id)
    stats.generated += 1
    const template = normalizedTemplate(prompt)

    const previousExactDay = stats.lastExactDay.get(prompt)
    if (previousExactDay != null) {
      const distance = day - previousExactDay
      stats.exactRepeatEvents += 1
      recordDistance(distance, MIXED_DAY_WINDOWS, stats.exactDayWindows)
      if (stats.shortestExactDayDistance == null || distance < stats.shortestExactDayDistance) {
        stats.shortestExactDayDistance = distance
      }
    }
    stats.lastExactDay.set(prompt, day)

    const previousTemplateDay = stats.lastTemplateDay.get(template)
    if (previousTemplateDay != null) {
      const distance = day - previousTemplateDay
      stats.templateRepeatEvents += 1
      recordDistance(distance, MIXED_DAY_WINDOWS, stats.templateDayWindows)
      if (stats.shortestTemplateDayDistance == null || distance < stats.shortestTemplateDayDistance) {
        stats.shortestTemplateDayDistance = distance
      }
    }
    stats.lastTemplateDay.set(template, day)
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

const stressRecurrenceRows = [...bySkill.values()].map((stats) => ({
  id: stats.skill.id,
  exactRepeatEvents: stats.exactRepeatEvents,
  exactWithin7: stats.exactWindowRepeats[7],
  exactWithin30: stats.exactWindowRepeats[30],
  exactWithin120: stats.exactWindowRepeats[120],
  exactWithin30Rate: rate(stats.exactWindowRepeats[30], Math.max(1, stats.generated - 1)),
  templateRepeatEvents: stats.templateRepeatEvents,
  templateWithin7: stats.templateWindowRepeats[7],
  templateWithin30: stats.templateWindowRepeats[30],
  templateWithin120: stats.templateWindowRepeats[120],
  templateWithin30Rate: rate(stats.templateWindowRepeats[30], Math.max(1, stats.generated - 1)),
  shortestExactDistance: stats.repeatDistances.length ? Math.min(...stats.repeatDistances) : null,
  shortestTemplateDistance: stats.templateRepeatDistances.length ? Math.min(...stats.templateRepeatDistances) : null,
}))

const mixedRecurrenceRows = [...mixedBySkill.entries()].map(([id, stats]) => ({
  id,
  generated: stats.generated,
  exactRepeatEvents: stats.exactRepeatEvents,
  exactWithin7Days: stats.exactDayWindows[7],
  exactWithin30Days: stats.exactDayWindows[30],
  exactWithin120Days: stats.exactDayWindows[120],
  exactWithin30DayRate: rate(stats.exactDayWindows[30], Math.max(1, stats.generated - 1)),
  templateRepeatEvents: stats.templateRepeatEvents,
  templateWithin7Days: stats.templateDayWindows[7],
  templateWithin30Days: stats.templateDayWindows[30],
  templateWithin120Days: stats.templateDayWindows[120],
  templateWithin30DayRate: rate(stats.templateDayWindows[30], Math.max(1, stats.generated - 1)),
  shortestExactDayDistance: stats.shortestExactDayDistance,
  shortestTemplateDayDistance: stats.shortestTemplateDayDistance,
}))

const aggregateWindows = (rows, prefix, windows) => Object.fromEntries(windows.map((window) => [
  window,
  rows.reduce((sum, row) => sum + row[`${prefix}${window}`], 0),
]))
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
  stressRecurrence: {
    exactRepeatsWithinSamples: aggregateWindows(stressRecurrenceRows, 'exactWithin', STRESS_WINDOWS),
    templateRepeatsWithinSamples: aggregateWindows(stressRecurrenceRows, 'templateWithin', STRESS_WINDOWS),
    worstExactWithin30: [...stressRecurrenceRows]
      .sort((a,b) => b.exactWithin30Rate - a.exactWithin30Rate || b.exactWithin30 - a.exactWithin30)
      .slice(0, 10),
    worstTemplateWithin30: [...stressRecurrenceRows]
      .sort((a,b) => b.templateWithin30Rate - a.templateWithin30Rate || b.templateWithin30 - a.templateWithin30)
      .slice(0, 10),
  },
  mixedRecurrence: {
    exactRepeatsWithinDays: aggregateWindows(mixedRecurrenceRows, 'exactWithin', MIXED_DAY_WINDOWS.map((window) => `${window}Days`)),
    templateRepeatsWithinDays: aggregateWindows(mixedRecurrenceRows, 'templateWithin', MIXED_DAY_WINDOWS.map((window) => `${window}Days`)),
    worstExactWithin30Days: [...mixedRecurrenceRows]
      .sort((a,b) => b.exactWithin30DayRate - a.exactWithin30DayRate || b.exactWithin30Days - a.exactWithin30Days)
      .slice(0, 10),
    worstTemplateWithin30Days: [...mixedRecurrenceRows]
      .sort((a,b) => b.templateWithin30DayRate - a.templateWithin30DayRate || b.templateWithin30Days - a.templateWithin30Days)
      .slice(0, 10),
  },
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
