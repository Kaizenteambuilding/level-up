const fs=require('node:fs')
const paths=['components/GeographyMapsSession.tsx','components/ScienceLifeSession.tsx','components/ScienceInvestigationSession.tsx','components/ScienceObservatorySession.tsx','components/MathDistrictSession.tsx','components/SpanishReadingSession.tsx','components/SpanishWordsSession.tsx','components/SpanishWritingSession.tsx','components/EnglishTerminalSession.tsx','components/EnglishConversationSession.tsx','components/EnglishListeningSession.tsx','components/MultiSubjectDailySession.tsx','components/HistoryAncientSession.tsx','components/GeographyPhysicalSession.tsx']
const failures=[]
for(const path of paths){
  const source=fs.readFileSync(path,'utf8')
  if(/fallbackSkill[\s\S]{0,700}recentTemplates|recentTemplates[\s\S]{0,700}fallbackSkill/.test(source))failures.push(path+': repeat-permitting fallback remains')
  if(path!=='components/EnglishListeningSession.tsx'&&!source.includes('sin repetir contenido reciente'))failures.push(path+': fail-closed message missing')
  const window=(source.match(/(?:HISTORY|RECENT_PROMPT_WINDOW)\s*=\s*(\d+)/)||[])[1]
  if(window&&Number(window)<400)failures.push(path+': history window below 400')
}
const scoped=[
 ['components/GeographyMapsSession.tsx','Array.from(SKILL_IDS)'],
 ['components/GeographyPhysicalSession.tsx','Array.from(SKILL_IDS)'],
 ['components/HistoryAncientSession.tsx','Array.from(SKILL_IDS)'],
 ['components/ScienceInvestigationSession.tsx','Array.from(SKILL_IDS)'],
 ['components/ScienceLifeSession.tsx','Array.from(LIFE_SKILL_IDS)'],
 ['components/ScienceObservatorySession.tsx','Array.from(OBSERVATORY_SKILL_IDS)'],
 ['components/SpanishReadingSession.tsx','Array.from(READING_SKILL_IDS)'],
 ['components/SpanishWordsSession.tsx','Array.from(WORD_SKILL_IDS)'],
 ['components/SpanishWritingSession.tsx','Array.from(WRITING_SKILL_IDS)'],
 ['components/EnglishConversationSession.tsx','Array.from(CONVERSATION_SKILL_IDS)'],
]
for(const [path,marker] of scoped){const source=fs.readFileSync(path,'utf8');if(!source.includes(".in('skill_id',")||!source.includes(marker))failures.push(path+': history is not scoped to the mode skills')}
const semanticPaths=['components/MathDistrictSession.tsx','components/ScienceInvestigationSession.tsx','components/ScienceLifeSession.tsx','components/ScienceObservatorySession.tsx','components/HistoryAncientSession.tsx','components/SpanishWordsSession.tsx','components/SpanishWritingSession.tsx','components/EnglishTerminalSession.tsx','components/EnglishConversationSession.tsx','components/MultiSubjectDailySession.tsx']
for(const path of semanticPaths){const source=fs.readFileSync(path,'utf8');if(!source.includes("semanticQuestionSignature"))failures.push(path+': shared semantic signature missing')}
const maps=fs.readFileSync('components/GeographyMapsSession.tsx','utf8')
if(!maps.includes('recentMapSignatures'))failures.push('GeographyMapsSession: semantic history missing')
if(!maps.includes('mapSignature(next.prompt)'))failures.push('GeographyMapsSession: semantic repeat guard missing')
if(!maps.includes("normalize('NFD')"))failures.push('GeographyMapsSession: semantic signature not accent-folded')
const reading=fs.readFileSync('components/SpanishReadingSession.tsx','utf8')
if(!reading.includes('recentReadingSignatures')||!reading.includes('readingSignature(nextQuestion.prompt)'))failures.push('SpanishReadingSession: semantic passage guard missing')
const science=fs.readFileSync('components/ScienceInvestigationSession.tsx','utf8')
if(science.includes('fallbackSkill'))failures.push('ScienceInvestigationSession: duplicate fallback still present')
const observatory=fs.readFileSync('components/ScienceObservatorySession.tsx','utf8')
if(observatory.includes('const fallback = candidates'))failures.push('ScienceObservatorySession: duplicate fallback still present')
console.log(JSON.stringify({checked:paths.length,modeScoped:scoped.length,minimumHistory:400,failures},null,2))
if(failures.length)throw new Error('Cross-session anti-repeat audit failed: '+failures.join('; '))
