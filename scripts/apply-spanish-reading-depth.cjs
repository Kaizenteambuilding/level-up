const fs = require('node:fs')
const file = 'components/SpanishReadingSession.tsx'
let source = fs.readFileSync(file, 'utf8')
if (!source.includes("@/lib/spanishReadingGenerated")) {
  source = source.replace(
    "import { generateSpanishReadingVariant } from '@/lib/spanishReadingVariants'",
    "import { generateSpanishReadingVariant } from '@/lib/spanishReadingVariants'\nimport { generateSpanishReadingGenerated } from '@/lib/spanishReadingGenerated'",
  )
}
source = source.replace(
  "        const galleryQuestion = generateSpanishReadingVariant(candidate, difficulty, seed)\n        const curriculumQuestion = generateCurriculumQuestion(candidate, difficulty, seed)\n        for (const nextQuestion of [galleryQuestion, curriculumQuestion]) {",
  "        const courseDepthQuestion = generateSpanishReadingGenerated(candidate, difficulty, seed)\n        const galleryQuestion = generateSpanishReadingVariant(candidate, difficulty, seed)\n        const curriculumQuestion = generateCurriculumQuestion(candidate, difficulty, seed)\n        for (const nextQuestion of [courseDepthQuestion, galleryQuestion, curriculumQuestion]) {",
)
fs.writeFileSync(file, source)
fs.unlinkSync('scripts/apply-spanish-reading-depth.cjs')
