const fs=require('node:fs')
const generated=fs.readFileSync('lib/spanishUpperLongTermVariants.ts','utf8')
const router=fs.readFileSync('lib/curriculumQuestionGenerator.ts','utf8')
const skillIds=['L04S01','L04S02','L04S03','L04S04','L05S01','L05S02','L05S03','L05S04','L06S01','L06S02','L06S03','L06S04']
const failures=[]
for(const skillId of skillIds){
 const marker=`${skillId}:[`
 const start=generated.indexOf(marker)
 if(start<0){failures.push(`${skillId}:missing-bank`);continue}
 const starts=skillIds.map(id=>generated.indexOf(`${id}:[`,start+marker.length)).filter(i=>i>start)
 const end=starts.length?Math.min(...starts):generated.indexOf('\n}\n\nconst FRAMES',start)
 const section=generated.slice(start,end)
 const cards=(section.match(/\nc\(/g)||[]).length
 if(cards<8)failures.push(`${skillId}:only-${cards}-conceptual-cards`)
 for(const level of [1,2,3,4])if(!section.includes(`c(${level},`))failures.push(`${skillId}:missing-level-${level}`)
}
const total=(generated.match(/\nc\(/g)||[]).length
if(total<96)failures.push(`total-conceptual-cards:${total}`)
if(!generated.includes('spanishUpperVariantCount'))failures.push('count-helper-missing')
if(!router.includes("import { generateSpanishUpperLongTermVariant } from './spanishUpperLongTermVariants'"))failures.push('router-import-missing')
if(!router.includes("skill.id.startsWith('L04') || skill.id.startsWith('L05') || skill.id.startsWith('L06')"))failures.push('router-scope-missing')
if(!router.includes('generateSpanishUpperLongTermVariant(skill, difficulty, seed)'))failures.push('router-call-missing')
if(failures.length){console.error('Upper Spanish course depth audit failed:');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log(JSON.stringify({skills:skillIds.length,conceptualCards:total,framedVariants:total*4,levels:[1,2,3,4]},null,2))
