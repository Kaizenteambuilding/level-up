const fs=require('node:fs'),ts=require('typescript')
function load(path,extras={}){const src=fs.readFileSync(path,'utf8');const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const mod={exports:{}};new Function('exports','module','require',js)(mod.exports,mod,(id)=>extras[id]??require(id));return mod.exports}
const subjects=load('lib/subjects.ts')
const plan=load('lib/curriculumPlan.ts')
const rotation=load('lib/dailySubjectRotation.ts',{'./subjects':subjects})
const active=load('lib/activeSubjectPlans.ts',{'./subjects':subjects,'./curriculumPlan':plan,'./dailySubjectRotation':rotation})
const units=[
  {id:'M01',subject_id:'math',sort_order:1},{id:'M02',subject_id:'math',sort_order:2},{id:'M03',subject_id:'math',sort_order:3},
  {id:'L01',subject_id:'spanish',sort_order:1},{id:'L02',subject_id:'spanish',sort_order:2},{id:'L03',subject_id:'spanish',sort_order:3},
  {id:'E01',subject_id:'english',sort_order:1},{id:'E02',subject_id:'english',sort_order:2},{id:'E03',subject_id:'english',sort_order:3},
]
const now=new Date('2026-09-15T12:00:00Z')
const plans=active.buildActiveSubjectPlans('player-1',units,[],now)
const failures=[]
if(plans.map(p=>p.subjectId).join(',')!=='math,spanish,english')failures.push('active subjects are not ordered correctly')
for(const p of plans){if(!p.availableUnitIds.length)failures.push(`${p.subjectId}: no available units`);if(p.availableUnitIds.some(id=>!units.some(u=>u.id===id&&u.subject_id===p.subjectId)))failures.push(`${p.subjectId}: leaked unit from another subject`)}
const sequence=Array.from({length:6},(_,i)=>rotation.subjectForQuestion(plans,i,0)?.subjectId)
if(sequence.join(',')!=='math,spanish,english,math,spanish,english')failures.push(`unexpected rotation ${sequence.join(',')}`)
const manual=[{player_id:'player-1',subject_id:'spanish',academic_year_start:2026,pacing_mode:'manual',current_term:1,focus_unit_ids:['L02']}]
const manualPlans=active.buildActiveSubjectPlans('player-1',units,manual,now)
const spanish=manualPlans.find(p=>p.subjectId==='spanish')
if(!spanish||spanish.focusUnitIds.join(',')!=='L02')failures.push('manual Spanish focus not preserved')
console.log(JSON.stringify({subjects:plans.map(p=>p.subjectId),sequence,failures},null,2));if(failures.length)process.exitCode=1
