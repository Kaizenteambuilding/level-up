const fs=require('node:fs')
const vm=require('node:vm')
const ts=require('typescript')

const source=fs.readFileSync('lib/englishTerminalCourseDepth.ts','utf8')
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
const box={exports:{}}
vm.runInNewContext(compiled,{module:box,exports:box.exports,require,console},{filename:'englishTerminalCourseDepth.js'})
const {generateEnglishTerminalCourseDepth,englishTerminalCourseDepthSkillIds}=box.exports
const ids=[
  'E01S01','E01S02','E01S03','E01S04','E02S01','E02S02','E02S03','E02S04',
  'E03S01','E03S02','E03S03','E03S04','E04S01','E04S02','E04S03','E04S04',
  'E05S01','E05S02','E05S03','E05S04','E06S01','E06S02','E06S03','E06S04',
]
const actual=[...englishTerminalCourseDepthSkillIds()].sort()
if(JSON.stringify(actual)!==JSON.stringify([...ids].sort()))throw new Error(`Unexpected skill coverage: ${actual.join(',')}`)

let minExact=Infinity,minNormalized=Infinity,totalExact=0
const stats=[]
for(const id of ids){
  const exact=new Set(),normalized=new Set()
  for(let seed=0;seed<720;seed+=1){
    const q=generateEnglishTerminalCourseDepth({id,name:id,generator_key:`test_${id}`},2,seed)
    if(!q)throw new Error(`${id} returned no question for seed ${seed}`)
    if(!Array.isArray(q.options)||q.options.length!==4||new Set(q.options).size!==4)throw new Error(`${id} seed ${seed} has invalid/duplicate options: ${JSON.stringify(q.options)}`)
    if(q.answerIndex<0||q.answerIndex>3)throw new Error(`${id} seed ${seed} has invalid answer index`)
    if(!q.solution||q.solution.trim().length<12)throw new Error(`${id} seed ${seed} has weak explanation`)
    const answer=String(q.options[q.answerIndex])
    for(const bad of [/can playing\b/i,/often get ups\b/i,/\bplaied\b/i,/\bdoes you\b/i,/\bmust to\b/i]) if(bad.test(answer)) throw new Error(`${id} seed ${seed} malformed correct answer: ${answer}`)
    exact.add(q.prompt.trim())
    normalized.add(q.prompt.toLowerCase().replace(/\d+(?:[.,]\d+)?/g,'#').replace(/\s+/g,' ').trim())
  }
  if(exact.size<36)throw new Error(`${id} only exposes ${exact.size} exact course-depth prompts`)
  if(normalized.size<30)throw new Error(`${id} collapses to only ${normalized.size} normalized prompt patterns`)
  minExact=Math.min(minExact,exact.size);minNormalized=Math.min(minNormalized,normalized.size);totalExact+=exact.size
  stats.push(`${id}:${exact.size}/${normalized.size}`)
}

const session=fs.readFileSync('components/EnglishTerminalSession.tsx','utf8')
if(!session.includes("import { generateEnglishTerminalCourseDepth } from '@/lib/englishTerminalCourseDepth'"))throw new Error('English Terminal is not wired to the course-depth bank')
if(!session.includes('const courseQuestion = generateEnglishTerminalCourseDepth(candidate, difficulty, seed)'))throw new Error('English Terminal does not prioritize course-depth questions')
if(session.includes('generated = generateEnglishTerminalCourseDepth(fallbackSkill'))throw new Error('English Terminal repeat fallback must not bypass recent-history protection')
if(!session.includes('No quedan retos nuevos disponibles sin repetir contenido reciente.'))throw new Error('English Terminal must fail closed when fresh content is exhausted')


console.log(JSON.stringify({skills:ids.length,totalExactAcrossSkills:totalExact,minimumExactPrompts:minExact,minimumNormalizedPrompts:minNormalized,stats},null,2))
