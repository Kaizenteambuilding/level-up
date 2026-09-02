const fs=require('fs')
function assert(ok,msg){if(!ok)throw new Error(msg)}
const bank=fs.readFileSync('lib/historyAncientQuestionGenerators.ts','utf8')
const router=fs.readFileSync('lib/curriculumQuestionGenerator.ts','utf8')
const session=fs.readFileSync('components/HistoryAncientSession.tsx','utf8')
for(const id of ['G04S01','G04S02','G04S03','G04S04','G05S01','G05S02','G05S03','G05S04','G06S01','G06S02','G06S03','G06S04']){
 const block=bank.match(new RegExp(`${id}:\\[(.*?)\\],\\n(?:G|})`,'s'))
 assert(block,`Missing bank for ${id}`)
 const prompts=(block[1].match(/c\('/g)||[]).length
 assert(prompts>=8,`${id} needs at least 8 prompt structures; found ${prompts}`)
}
assert(router.includes('generateHistoryAncientQuestion'),'Curriculum router must use history generator')
assert(router.includes("skill.id.startsWith('G04') || skill.id.startsWith('G05') || skill.id.startsWith('G06')"),'G04/G05/G06 must route to history generator')
assert(session.includes('recentTemplates.current.includes(template(next.prompt))'),'History Archive must reject recently used prompt templates')
assert(session.includes('limit(HISTORY)'),'History Archive must load recent geography/history attempts')
assert(session.includes('<strong>Por qué:</strong> {question.solution}'),'History Archive must expose pedagogical explanation')
console.log('History variety audit passed: 8+ structures per skill, anti-repeat and pedagogical explanation.')
