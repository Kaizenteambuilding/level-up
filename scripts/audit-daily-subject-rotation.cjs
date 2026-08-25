const fs=require('node:fs'),ts=require('typescript')
function load(path,extras={}){const src=fs.readFileSync(path,'utf8');const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const mod={exports:{}};new Function('exports','module','require',js)(mod.exports,mod,(id)=>extras[id]??require(id));return mod.exports}
const subjects=load('lib/subjects.ts')
const rotation=load('lib/dailySubjectRotation.ts',{'./subjects':subjects})
const failures=[]
const math={subjectId:'math',availableUnitIds:['M01'],focusUnitIds:['M01'],reviewUnitIds:[]}
const spanish={subjectId:'spanish',availableUnitIds:['L01'],focusUnitIds:['L01'],reviewUnitIds:[]}
const english={subjectId:'english',availableUnitIds:['E01'],focusUnitIds:['E01'],reviewUnitIds:[]}
let seq=Array.from({length:6},(_,i)=>rotation.subjectForQuestion([math,spanish,english],i,0)?.subjectId)
if(seq.join(',')!=='math,spanish,english,math,spanish,english') failures.push(`rotation:${seq}`)
seq=Array.from({length:4},(_,i)=>rotation.subjectForQuestion([math,spanish,english],i,1)?.subjectId)
if(seq[0]!=='spanish') failures.push(`seed_offset:${seq}`)
const inactive={subjectId:'biology_geology',availableUnitIds:[],focusUnitIds:[],reviewUnitIds:[]}
if(rotation.orderedActiveSubjects([inactive,math]).map(x=>x.subjectId).join(',')!=='math') failures.push('inactive_subject_selected')
if(rotation.subjectForQuestion([],0,0)!==null) failures.push('empty_should_be_null')
console.log(JSON.stringify({failures},null,2));if(failures.length)process.exitCode=1
