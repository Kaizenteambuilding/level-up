const fs = require('node:fs')

const file = 'lib/spanishWritingTasks.ts'
let source = fs.readFileSync(file, 'utf8')

const oldFunction = `export function generateSpanishWritingTask(skillId: string, seed: number): SpanishWritingTask {
  const candidates = TASKS[skillId]
  if (!candidates?.length) throw new Error(\`No writing task bank for \${skillId}\`)
  const index = Math.abs((seed ^ (skillId.charCodeAt(skillId.length - 1) * 2654435761)) >>> 0) % candidates.length
  return candidates[index]
}`

const replacement = `const WRITING_CONTEXTS = [
  'Contexto: prepara el texto para el periódico escolar.',
  'Contexto: escribe como parte de tu diario de aprendizaje.',
  'Contexto: el texto se publicará en el blog de aula.',
  'Contexto: imagina que formará parte de una exposición en el pasillo del centro.',
  'Contexto: prepara esta versión para tu portfolio del trimestre.',
  'Contexto: escribe para que lo lea un compañero de otro grupo.',
  'Contexto: imagina que aparecerá en la revista de la biblioteca escolar.',
  'Contexto: redacta la versión que guardarías para revisarla al final del curso.',
  'Contexto: escribe para un mural temático de la clase.',
  'Contexto: imagina que lo leerá un alumno que no estuvo en la actividad.',
  'Contexto: prepara una versión clara para compartirla con tu familia.',
  'Contexto: escribe como si fuera una entrada breve de la web del colegio.',
] as const

export function generateSpanishWritingTask(skillId: string, seed: number): SpanishWritingTask {
  const candidates = TASKS[skillId]
  if (!candidates?.length) throw new Error(\`No writing task bank for \${skillId}\`)
  const normalizedSeed = seed >>> 0
  const baseIndex = normalizedSeed % candidates.length
  const contextIndex = Math.floor(normalizedSeed / candidates.length) % WRITING_CONTEXTS.length
  const task = candidates[baseIndex]
  return {
    ...task,
    id: \`\${task.id}-context-\${contextIndex + 1}\`,
    prompt: \`\${task.prompt} \${WRITING_CONTEXTS[contextIndex]}\`,
  }
}`

if (!source.includes(oldFunction)) throw new Error('Spanish writing generator function did not match expected source')
source = source.replace(oldFunction, replacement)
fs.writeFileSync(file, source)

fs.unlinkSync('scripts/apply-spanish-writing-depth.cjs')
if (fs.existsSync('.github/workflows/spanish-writing-depth.yml')) fs.unlinkSync('.github/workflows/spanish-writing-depth.yml')
