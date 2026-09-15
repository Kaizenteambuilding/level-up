const fs = require('node:fs')
const files = [
  'components/MathDistrictSession.tsx','components/SpanishReadingSession.tsx','components/SpanishWordsSession.tsx',
  'components/SpanishWritingSession.tsx','components/EnglishTerminalSession.tsx','components/EnglishConversationSession.tsx',
  'components/EnglishListeningSession.tsx','components/GeographyMapsSession.tsx','components/GeographyPhysicalSession.tsx',
  'components/HistoryAncientSession.tsx','components/ScienceInvestigationSession.tsx','components/ScienceObservatorySession.tsx',
  'components/ScienceLifeSession.tsx','components/MultiSubjectDailySession.tsx'
]
const failures=[]
for (const file of files) {
  const source=fs.readFileSync(file,'utf8')
  if (/sin repetir (preguntas|propuestas) recientes|no quedan audios nuevos sin repetir|prueba de nuevo más tarde/i.test(source)) failures.push(file+':finite-pool-blocker')
}
const listening=fs.readFileSync('components/EnglishListeningSession.tsx','utf8')
if (!/ranked.lengths*?s*rankeds*:s*BANK/.test(listening)) failures.push('EnglishListeningSession:missing-spaced-review-pool')
const daily=fs.readFileSync('components/MultiSubjectDailySession.tsx','utf8')
if (!daily.includes('Course-long daily fallback')) failures.push('MultiSubjectDailySession:missing-course-long-fallback')
const geology=fs.readFileSync('components/ScienceObservatorySession.tsx','utf8')
if (!/generateds*=s*generateCurriculumQuestion/.test(geology)) failures.push('ScienceObservatorySession:missing-fallback')
if (failures.length) { console.error('180-day continuity contract failed:'); for(const failure of failures) console.error('- '+failure); process.exit(1) }
console.log('180-day continuity contract passed: finite recent-history pools cannot terminate any course practice path.')
