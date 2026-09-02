const fs=require('fs')
function assert(ok,msg){if(!ok)throw new Error(msg)}
const bank=fs.readFileSync('lib/geographyPhysicalQuestionGenerators.ts','utf8')
const router=fs.readFileSync('lib/curriculumQuestionGenerator.ts','utf8')
const session=fs.readFileSync('components/GeographyPhysicalSession.tsx','utf8')
for(const id of ['G02S01','G02S02','G02S03','G02S04','G03S01','G03S02','G03S03','G03S04']){
 const block=bank.match(new RegExp(`${id}: \\[(.*?)\\n  \\],`,'s'))
 assert(block,`Missing bank for ${id}`)
 const prompts=(block[1].match(/prompt:/g)||[]).length
 assert(prompts>=8,`${id} needs at least 8 prompt structures; found ${prompts}`)
}
assert(router.includes("generateGeographyPhysicalQuestion"),'Curriculum router must use physical geography generator')
assert(router.includes("skill.id.startsWith('G02') || skill.id.startsWith('G03')"),'G02/G03 must route to physical geography generator')
assert(session.includes('recentTemplates.current.includes(template(next.prompt))'),'Territory session must reject recently used prompt templates')
assert(session.includes('limit(HISTORY)'),'Territory session must load recent geography history')
console.log('Geography physical variety audit passed: 8+ structures per skill with recent-template avoidance.')
