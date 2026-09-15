const fs=require('node:fs')
const file='components/EnglishTerminalSession.tsx'
let s=fs.readFileSync(file,'utf8')
const importNeedle="import { generateCurriculumQuestion } from '@/lib/curriculumQuestionGenerator'\n"
if(!s.includes(importNeedle))throw new Error('Terminal curriculum import not found')
s=s.replace(importNeedle,importNeedle+"import { generateEnglishTerminalCourseDepth } from '@/lib/englishTerminalCourseDepth'\n")
const oldLoop=`for (let candidateIndex = 0; candidateIndex < candidates.length && !generated; candidateIndex += 1) { const candidate = candidates[candidateIndex], difficulty = states[candidate.id]?.difficulty ?? 1; let seed = (baseSeed + Math.imul(candidateIndex, 0x85ebca6b)) >>> 0; for (let attempt = 0; attempt < 64; attempt += 1) { const nextQuestion = generateCurriculumQuestion(candidate, difficulty, seed); if (!recentTemplates.current.includes(template(nextQuestion.prompt))) { generated = nextQuestion; break } seed = (seed + 2654435761) >>> 0 } }`
const newLoop=`for (let candidateIndex = 0; candidateIndex < candidates.length && !generated; candidateIndex += 1) { const candidate = candidates[candidateIndex], difficulty = states[candidate.id]?.difficulty ?? 1; let seed = (baseSeed + Math.imul(candidateIndex, 0x85ebca6b)) >>> 0; for (let attempt = 0; attempt < 64; attempt += 1) { const courseQuestion = generateEnglishTerminalCourseDepth(candidate, difficulty, seed), curriculumQuestion = generateCurriculumQuestion(candidate, difficulty, seed); for (const nextQuestion of [courseQuestion, curriculumQuestion]) { if (nextQuestion && !recentTemplates.current.includes(template(nextQuestion.prompt))) { generated = nextQuestion; break } } if (generated) break; seed = (seed + 2654435761) >>> 0 } }`
if(!s.includes(oldLoop))throw new Error('Terminal generation loop not found')
s=s.replace(oldLoop,newLoop)
const oldFallback=`generated = generateCurriculumQuestion(fallbackSkill, states[fallbackSkill.id]?.difficulty ?? 1, fallbackSeed)`
const newFallback=`generated = generateEnglishTerminalCourseDepth(fallbackSkill, states[fallbackSkill.id]?.difficulty ?? 1, fallbackSeed) ?? generateCurriculumQuestion(fallbackSkill, states[fallbackSkill.id]?.difficulty ?? 1, fallbackSeed)`
if(!s.includes(oldFallback))throw new Error('Terminal fallback not found')
s=s.replace(oldFallback,newFallback)
fs.writeFileSync(file,s)
