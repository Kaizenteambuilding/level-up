const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const ts = require('typescript')

const root = path.resolve(__dirname, '..')
const componentPath = path.join(root, 'components', 'EnglishListeningSession.tsx')
const authoredPath = path.join(root, 'lib', 'englishListeningAuthored.ts')
const generatedPath = path.join(root, 'lib', 'englishListeningGenerated.ts')

const component = fs.readFileSync(componentPath, 'utf8')
const authored = fs.readFileSync(authoredPath, 'utf8')

function loadTsModule(file, cache = new Map()) {
  const absolute = path.resolve(file)
  if (cache.has(absolute)) return cache.get(absolute).exports
  const source = fs.readFileSync(absolute, 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const mod = { exports: {} }
  cache.set(absolute, mod)
  function localRequire(request) {
    if (!request.startsWith('.')) return require(request)
    const base = path.resolve(path.dirname(absolute), request)
    const candidate = [base, `${base}.ts`, `${base}.js`, `${base}.cjs`].find((entry) => fs.existsSync(entry))
    if (!candidate) throw new Error(`Cannot resolve ${request} from ${absolute}`)
    if (candidate.endsWith('.ts')) return loadTsModule(candidate, cache)
    return require(candidate)
  }
  new Function('exports','module','require',compiled)(mod.exports, mod, localRequire)
  return mod.exports
}

function loadGeneratedBank() {
  return loadTsModule(generatedPath).buildEnglishListeningGeneratedBank()
}

function sliceArray(source, marker) {
  const markerIndex = source.indexOf(marker)
  assert(markerIndex >= 0, `Missing array marker: ${marker}`)
  const assignment = source.indexOf('=', markerIndex)
  assert(assignment >= 0, `Missing assignment after: ${marker}`)
  const start = source.indexOf('[', assignment)
  assert(start >= 0, `Missing opening bracket after: ${marker}`)
  let depth = 0
  let quote = null
  let escaped = false
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i]
    if (quote) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === quote) quote = null
      continue
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue }
    if (ch === '[') depth += 1
    if (ch === ']') {
      depth -= 1
      if (depth === 0) return source.slice(start + 1, i)
    }
  }
  throw new Error(`Unclosed array after: ${marker}`)
}

function objectBlocks(arraySource) {
  const blocks = []
  let depth = 0
  let start = -1
  let quote = null
  let escaped = false
  for (let i = 0; i < arraySource.length; i += 1) {
    const ch = arraySource[i]
    if (quote) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === quote) quote = null
      continue
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue }
    if (ch === '{') {
      if (depth === 0) start = i
      depth += 1
    } else if (ch === '}') {
      depth -= 1
      if (depth === 0 && start >= 0) {
        blocks.push(arraySource.slice(start, i + 1))
        start = -1
      }
    }
  }
  return blocks
}

function stringField(block, field) {
  const match = block.match(new RegExp(`${field}\\s*:\\s*(['\"])((?:\\\\.|(?!\\1).)*)\\1`, 's'))
  return match ? match[2].replace(/\\(['"\\])/g, '$1') : null
}

function numberField(block, field) {
  const match = block.match(new RegExp(`${field}\\s*:\\s*(\\d+)`))
  return match ? Number(match[1]) : null
}

function optionsField(block) {
  const match = block.match(/options\s*:\s*\[([\s\S]*?)\]\s*,\s*answerIndex/)
  if (!match) return null
  const values = []
  const re = /(['"])((?:\\.|(?!\1).)*)\1/gs
  let found
  while ((found = re.exec(match[1]))) values.push(found[2].replace(/\\(['"\\])/g, '$1'))
  return values
}

function parseItems(source, marker, origin) {
  return objectBlocks(sliceArray(source, marker)).map((block, index) => ({
    origin,
    index,
    skillId: stringField(block, 'skillId'),
    difficulty: numberField(block, 'difficulty'),
    spoken: stringField(block, 'spoken'),
    question: stringField(block, 'question'),
    options: optionsField(block),
    answerIndex: numberField(block, 'answerIndex'),
    solution: stringField(block, 'solution'),
  }))
}

const core = parseItems(component, 'const CORE_BANK', 'core')
const handAuthored = parseItems(authored, 'export const ENGLISH_LISTENING_AUTHORED', 'authored')
const generated = loadGeneratedBank().map((entry, index) => ({ ...entry, origin: 'generated', index }))
const items = [...core, ...handAuthored, ...generated]

assert(core.length >= 30, `Expected at least 30 core listening items, found ${core.length}`)
assert(handAuthored.length >= 24, `Expected at least 24 authored listening items, found ${handAuthored.length}`)
assert(generated.length >= 616, `Expected at least 616 generated listening items, found ${generated.length}`)
assert(items.length >= 670, `Expected at least 670 listening items, found ${items.length}`)

const spokenSeen = new Map()
const questionSeen = new Map()
const stemCounts = new Map()
const generatedBySkill = new Map()

for (const item of items) {
  const where = `${item.origin}[${item.index}]`
  assert(item.skillId && /^E\d{2}S\d{2}$/.test(item.skillId), `${where}: invalid skillId`)
  assert(Number.isInteger(item.difficulty) && item.difficulty >= 1 && item.difficulty <= 5, `${where}: invalid difficulty`)
  assert(item.spoken && item.spoken.trim().length >= 12, `${where}: missing/short spoken text`)
  assert(item.question && item.question.trim().endsWith('?'), `${where}: question must end in ?`)
  assert(item.solution && item.solution.trim().length >= 12, `${where}: missing/short solution`)
  assert(Array.isArray(item.options) && item.options.length === 4, `${where}: expected exactly four options`)
  assert(new Set(item.options.map((value) => value.trim().toLowerCase())).size === 4, `${where}: duplicate options`)
  assert(Number.isInteger(item.answerIndex) && item.answerIndex >= 0 && item.answerIndex < 4, `${where}: invalid answerIndex`)

  const spokenKey = item.spoken.trim().toLowerCase()
  assert(!spokenSeen.has(spokenKey), `${where}: duplicate spoken text also used by ${spokenSeen.get(spokenKey)}`)
  spokenSeen.set(spokenKey, where)

  const questionKey = item.question.trim().toLowerCase()
  if (item.origin !== 'generated') assert(!questionSeen.has(questionKey), `${where}: duplicate exact question also used by ${questionSeen.get(questionKey)}`)
  questionSeen.set(questionKey, where)

  const stem = questionKey.replace(/[^a-z0-9\s]/g, '').split(/\s+/).slice(0, 4).join(' ')
  stemCounts.set(stem, (stemCounts.get(stem) ?? 0) + 1)
  if (item.origin === 'generated') generatedBySkill.set(item.skillId, (generatedBySkill.get(item.skillId) ?? 0) + 1)
}

for (const skillId of ['E01S01','E01S04','E02S04','E03S03','E04S04','E05S01','E05S02','E05S03','E05S04','E06S02','E06S04']) {
  assert((generatedBySkill.get(skillId) ?? 0) >= 56, `${skillId}: expected at least 56 generated listening scenarios`)
}
assert(questionSeen.size >= 300, `Expected at least 300 unique exact listening questions, found ${questionSeen.size}`)

const repeatedStems = [...stemCounts.entries()]
  .filter(([, count]) => count >= 5)
  .sort((a, b) => b[1] - a[1])

console.log(`Listening quality audit: ${items.length} items (${core.length} core + ${handAuthored.length} authored + ${generated.length} generated)`)
console.log(`Unique spoken prompts: ${spokenSeen.size}`)
console.log(`Unique exact questions: ${questionSeen.size}`)
console.log(`Minimum generated scenarios per covered listening skill: ${Math.min(...generatedBySkill.values())}`)
if (repeatedStems.length) {
  console.log('Repeated question stems to review manually:')
  for (const [stem, count] of repeatedStems.slice(0, 20)) console.log(`- ${count}x: ${stem}`)
} else {
  console.log('No question stem appears five or more times.')
}
console.log('English listening quality audit passed.')
