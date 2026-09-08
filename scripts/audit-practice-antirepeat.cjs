const fs = require('node:fs')

const sessions = [
  'components/MathDistrictSession.tsx',
  'components/SpanishReadingSession.tsx',
  'components/SpanishWordsSession.tsx',
  'components/SpanishWritingSession.tsx',
  'components/EnglishTerminalSession.tsx',
  'components/EnglishConversationSession.tsx',
  'components/EnglishListeningSession.tsx',
  'components/GeographyMapsSession.tsx',
  'components/GeographyPhysicalSession.tsx',
  'components/HistoryAncientSession.tsx',
  'components/ScienceInvestigationSession.tsx',
  'components/ScienceObservatorySession.tsx',
  'components/ScienceLifeSession.tsx',
]

const permissiveFallbacks = [
  /if\s*\(!generated\)\s*generated\s*=\s*generateCurriculumQuestion/,
  /if\s*\(!generated\)\s*\{[^}]*generated\s*=\s*generateCurriculumQuestion/s,
]

const failures = []
for (const file of sessions) {
  if (!fs.existsSync(file)) {
    failures.push(`${file}:missing`)
    continue
  }
  const source = fs.readFileSync(file, 'utf8')
  for (const pattern of permissiveFallbacks) {
    if (pattern.test(source)) failures.push(`${file}:permits_duplicate_fallback`)
  }
  const historyMatch = source.match(/(?:RECENT_PROMPT_WINDOW|HISTORY)\s*=\s*(\d+)/)
  if (historyMatch && Number(historyMatch[1]) < 120) failures.push(`${file}:history_window_${historyMatch[1]}_below_120`)
  if (source.includes('recentTemplates') && !source.includes('prompt_snapshot')) failures.push(`${file}:recent_history_not_backed_by_attempts`)
}

if (failures.length) {
  console.error('Practice anti-repeat audit failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Practice anti-repeat audit passed for ${sessions.length} practice sections.`)
