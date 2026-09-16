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

const { generateMathFrequencyOrderDepth } = loadTsModule('lib/mathFrequencyOrderDepth.ts')
if (typeof generateMathFrequencyOrderDepth !== 'function') {
  throw new Error('No se pudo cargar generateMathFrequencyOrderDepth.')
}

const skill = { id: 'M01S05', name: 'Jerarquía de operaciones', generator_key: 'math_order_operations' }
const failures = []
let checked = 0

function evaluateExpression(expression) {
  const normalized = expression
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('[', '(')
    .replaceAll(']', ')')
  if (!/^[0-9+\-*/().\s]+$/.test(normalized)) throw new Error(`Expresión no segura: ${expression}`)
  return Function(`"use strict"; return (${normalized})`)()
}

for (let seed = 0; seed < 24000; seed += 1) {
  if ((seed & 1) === 1 || ((seed >>> 1) % 12) !== 7) continue
  const question = generateMathFrequencyOrderDepth(skill, 3, seed)
  if (!question) {
    failures.push(`seed ${seed}: el generador devolvió null`)
    continue
  }
  checked += 1
  if (new Set(question.options).size !== question.options.length) {
    failures.push(`seed ${seed}: opciones de texto duplicadas: ${JSON.stringify(question.options)}`)
    continue
  }
  const match = question.prompt.match(/^¿Cuál expresión vale (-?\d+)\?$/)
  if (!match) {
    failures.push(`seed ${seed}: prompt no parseable: ${question.prompt}`)
    continue
  }
  const target = Number(match[1])
  let values
  try {
    values = question.options.map(evaluateExpression)
  } catch (error) {
    failures.push(`seed ${seed}: ${error.message}`)
    continue
  }
  const matching = values.filter((value) => value === target)
  if (matching.length !== 1) {
    failures.push(`seed ${seed}: se esperaba exactamente una expresión con valor ${target}; valores=${JSON.stringify(values)} opciones=${JSON.stringify(question.options)}`)
  }
  if (values[question.answerIndex] !== target) {
    failures.push(`seed ${seed}: answerIndex apunta a ${values[question.answerIndex]}, no a ${target}`)
  }
  if (new Set(values).size !== values.length) {
    failures.push(`seed ${seed}: dos opciones tienen el mismo valor: ${JSON.stringify(values)} opciones=${JSON.stringify(question.options)}`)
  }
}

if (checked < 900) failures.push(`cobertura insuficiente: ${checked} casos`)
console.log(JSON.stringify({ checked, failures: failures.slice(0, 20) }, null, 2))
if (failures.length) throw new Error(`M01S05 order semantics audit failed with ${failures.length} issue(s).`)
