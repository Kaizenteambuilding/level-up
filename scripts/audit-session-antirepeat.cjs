const fs=require('node:fs')
const paths=['components/GeographyMapsSession.tsx','components/ScienceLifeSession.tsx','components/MathDistrictSession.tsx','components/SpanishReadingSession.tsx','components/SpanishWordsSession.tsx','components/SpanishWritingSession.tsx','components/EnglishTerminalSession.tsx','components/EnglishConversationSession.tsx','components/MultiSubjectDailySession.tsx','components/HistoryAncientSession.tsx','components/GeographyPhysicalSession.tsx']
const failures=[]
for(const path of paths){const source=fs.readFileSync(path,'utf8');if(/fallbackSkill[\s\S]{0,700}recentTemplates|recentTemplates[\s\S]{0,700}fallbackSkill/.test(source))failures.push(path+': repeat-permitting fallback remains');if(!source.includes('sin repetir contenido reciente'))failures.push(path+': fail-closed message missing')}
console.log(JSON.stringify({checked:paths.length,failures},null,2))
if(failures.length)throw new Error('Cross-session anti-repeat audit failed: '+failures.join('; '))
