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

const blockers = [
  /sin repetir preguntas recientes/i,
  /sin repetir propuestas recientes/i,
  /no quedan audios nuevos sin repetir/i,
  /vuelve .* prueba de nuevo más tarde/i,
]
const failures = []
for (const file of sessions) {
  if (!fs.existsSync(file)) { failures.push(`${file}:missing`); continue }
  const source = fs.readFileSync(file, 'utf8')
  for (const blocker of blockers) if (blocker.test(source)) failures.push(`${file}:recent-history-can-block-play`)
  const historyMatch = source.match(/(?:RECENT_PROMPT_WINDOW|HISTORY)\s*=\s*(\d+)/)
  if (!historyMatch) failures.push(`${file}:missing_recent_history_window`)
  if (!source.includes('prompt_snapshot')) failures.push(`${file}:recent_history_not_backed_by_attempts`)
}

if (failures.length) {
  console.error('Course-long practice continuity audit failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log(`Course-long continuity passed for ${sessions.length} practice modes: recent history never blocks play.`)
