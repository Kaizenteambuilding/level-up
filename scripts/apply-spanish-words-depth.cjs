const fs = require('node:fs')

const file = 'components/SpanishWordsSession.tsx'
let source = fs.readFileSync(file, 'utf8')

const importNeedle = "import { generateCurriculumQuestion } from '@/lib/curriculumQuestionGenerator'\n"
if (!source.includes(importNeedle)) throw new Error('Spanish words curriculum import not found')
source = source.replace(importNeedle, importNeedle + "import { generateSpanishWordsVariant } from '@/lib/spanishWordsGenerated'\n")

const oldLoop = `      for (let attempt = 0; attempt < 64; attempt += 1) {
        const nextQuestion = generateCurriculumQuestion(candidate, states[candidate.id]?.difficulty ?? 1, seed)
        if (!recentTemplates.current.includes(template(nextQuestion.prompt))) { generated = nextQuestion; break }
        seed = (seed + 2654435761) >>> 0
      }`

const newLoop = `      for (let attempt = 0; attempt < 64; attempt += 1) {
        const difficulty = states[candidate.id]?.difficulty ?? 1
        const courseQuestion = generateSpanishWordsVariant(candidate, difficulty, seed)
        const curriculumQuestion = generateCurriculumQuestion(candidate, difficulty, seed)
        for (const nextQuestion of [courseQuestion, curriculumQuestion]) {
          if (nextQuestion && !recentTemplates.current.includes(template(nextQuestion.prompt))) {
            generated = nextQuestion
            break
          }
        }
        if (generated) break
        seed = (seed + 2654435761) >>> 0
      }`

if (!source.includes(oldLoop)) throw new Error('Spanish words generation loop not found')
source = source.replace(oldLoop, newLoop)

const oldFallback = `      generated = generateCurriculumQuestion(fallbackSkill, states[fallbackSkill.id]?.difficulty ?? 1, fallbackSeed)`
const newFallback = `      generated = generateSpanishWordsVariant(fallbackSkill, states[fallbackSkill.id]?.difficulty ?? 1, fallbackSeed)
        ?? generateCurriculumQuestion(fallbackSkill, states[fallbackSkill.id]?.difficulty ?? 1, fallbackSeed)`
if (!source.includes(oldFallback)) throw new Error('Spanish words fallback not found')
source = source.replace(oldFallback, newFallback)

fs.writeFileSync(file, source)
