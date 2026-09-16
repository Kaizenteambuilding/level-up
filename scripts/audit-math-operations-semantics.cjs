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

const { generateMathNaturalOperationsDepthVariant } = loadTsModule('lib/mathNaturalOperationsDepthVariants.ts')
if (typeof generateMathNaturalOperationsDepthVariant !== 'function') {
  throw new Error('No se pudo cargar generateMathNaturalOperationsDepthVariant.')
}

const skill = { id: 'M01S04', name: 'Multiplicación y división', generator_key: 'math_natural_operations' }
const failures = []
let checked = 0
let quotientCases = 0
let remainderCases = 0
let exactDivisionCases = 0

function correctAnswer(question) {
  return question.options[question.answerIndex]
}

function assertUniqueOptions(question, seed) {
  if (new Set(question.options).size !== question.options.length) {
    failures.push(`seed ${seed}: opciones duplicadas: ${JSON.stringify(question.options)}`)
  }
}

for (let seed = 0; seed < 18000; seed += 1) {
  const family = seed % 18
  if (![11, 12, 13].includes(family)) continue
  const question = generateMathNaturalOperationsDepthVariant(skill, 3, seed)
  if (!question) {
    failures.push(`seed ${seed}: el generador devolvió null`)
    continue
  }
  checked += 1
  assertUniqueOptions(question, seed)

  if (family === 11) {
    quotientCases += 1
    const match = question.prompt.match(/^Al dividir (\d+) entre (\d+), ¿cuál es el cociente entero\?$/)
    if (!match) {
      failures.push(`seed ${seed}: prompt de cociente no parseable: ${question.prompt}`)
      continue
    }
    const dividend = Number(match[1])
    const divisor = Number(match[2])
    const expected = String(Math.floor(dividend / divisor))
    const remainder = dividend % divisor
    if (remainder <= 0 || remainder >= divisor) failures.push(`seed ${seed}: resto inválido ${remainder} para divisor ${divisor}`)
    if (correctAnswer(question) !== expected) failures.push(`seed ${seed}: cociente esperado ${expected}, obtenido ${correctAnswer(question)}`)
  } else if (family === 12) {
    remainderCases += 1
    const match = question.prompt.match(/^Al dividir (\d+) entre (\d+), ¿cuál es el resto\?$/)
    if (!match) {
      failures.push(`seed ${seed}: prompt de resto no parseable: ${question.prompt}`)
      continue
    }
    const dividend = Number(match[1])
    const divisor = Number(match[2])
    const expected = String(dividend % divisor)
    const remainder = Number(expected)
    if (remainder <= 0 || remainder >= divisor) failures.push(`seed ${seed}: resto inválido ${remainder} para divisor ${divisor}`)
    if (correctAnswer(question) !== expected) failures.push(`seed ${seed}: resto esperado ${expected}, obtenido ${correctAnswer(question)}`)
  } else {
    exactDivisionCases += 1
    const parsed = question.options.map((option) => {
      const match = option.match(/^(\d+) ÷ (\d+)$/)
      return match ? { dividend: Number(match[1]), divisor: Number(match[2]) } : null
    })
    if (parsed.some((value) => !value)) {
      failures.push(`seed ${seed}: opción de división exacta no parseable: ${JSON.stringify(question.options)}`)
      continue
    }
    const exactOptions = parsed.filter(({ dividend, divisor }) => dividend % divisor === 0)
    if (exactOptions.length !== 1) failures.push(`seed ${seed}: se esperaban exactamente 1 divisiones exactas y hay ${exactOptions.length}: ${JSON.stringify(question.options)}`)
    const answer = correctAnswer(question)
    const answerMatch = answer.match(/^(\d+) ÷ (\d+)$/)
    if (!answerMatch || Number(answerMatch[1]) % Number(answerMatch[2]) !== 0) {
      failures.push(`seed ${seed}: la respuesta marcada no es exacta: ${answer}`)
    }
  }
}

if (quotientCases < 900 || remainderCases < 900 || exactDivisionCases < 900) {
  failures.push(`cobertura insuficiente: cociente=${quotientCases}, resto=${remainderCases}, exacta=${exactDivisionCases}`)
}

console.log(JSON.stringify({ checked, quotientCases, remainderCases, exactDivisionCases, failures: failures.slice(0, 20) }, null, 2))
if (failures.length) throw new Error(`Math operations semantics audit failed with ${failures.length} issue(s).`)
