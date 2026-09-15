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

const blockingMessages = [
  /sin repetir preguntas recientes/i,
  /no quedan audios nuevos sin repetir/i,
  /sin repetir propuestas recientes/i,
]

const failures = []
for (const file of sessions) {
  if (!fs.existsSync(file)) {
    failures.push(`${file}:missing`)
    continue
  }
  const source = fs.readFileSync(file, 'utf8')
  for (const pattern of blockingMessages) {
    if (pattern.test(source)) failures.push(`${file}:blocks_when_recent_pool_is_exhausted`)
  }
  const historyMatch = source.match(/(?:RECENT_PROMPT_WINDOW|HISTORY)\s*=\s*(\d+)/)
  if (!historyMatch) failures.push(`${file}:missing_recent_history_window`)
  else if (Number(historyMatch[1]) < 20) failures.push(`${file}:history_window_${historyMatch[1]}_too_small`)
  if (!source.includes('prompt_snapshot')) failures.push(`${file}:recent_history_not_backed_by_attempts`)
}

if (failures.length) {
  console.error('Practice continuity audit failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Practice continuity audit passed for ${sessions.length} practice sections: recent-history filtering is advisory, never blocking.`)
