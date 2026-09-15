const fs = require('node:fs')
const file = 'components/ScienceInvestigationSession.tsx'
let source = fs.readFileSync(file, 'utf8')
const before = "if (!generated) { setError('No se encontró un reto de investigación nuevo sin repetir preguntas recientes. Vuelve al laboratorio y prueba de nuevo más tarde.'); return } recentTemplates.current = [template(generated.prompt), ...recentTemplates.current].slice(0, HISTORY);"
const after = "if (!generated) { const fallbackSkill = candidates[(index + recentTemplates.current.length) % candidates.length]; const fallbackSeed = (base + Math.imul(recentTemplates.current.length + index + 1, 0x27d4eb2d)) >>> 0; generated = generateCurriculumQuestion(fallbackSkill, states[fallbackSkill.id]?.difficulty ?? 1, fallbackSeed) } recentTemplates.current = [template(generated.prompt), ...recentTemplates.current].slice(0, HISTORY);"
if (!source.includes(before)) throw new Error('science investigation blocking fallback not found')
source = source.replace(before, after)
fs.writeFileSync(file, source)
