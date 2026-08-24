const fs=require('node:fs'),ts=require('typescript')
function load(path,extras={}){const src=fs.readFileSync(path,'utf8');const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const mod={exports:{}};new Function('exports','module','require',js)(mod.exports,mod,(id)=>extras[id]??require(id));return mod.exports}
const subjects=load('lib/subjects.ts')
const curricula=load('lib/subjectCurricula.ts',{'./subjects':subjects})
const first=load('lib/firstEvaluationGenerators.ts')
const knowledge=load('lib/knowledgeSubjectGenerators.ts',{'./firstEvaluationGenerators':first})
const keys=new Set(knowledge.knowledgeGeneratorKeys()), failures=[];let generated=0
for(const subjectId of ['geography_history','biology_geology']) for(const unit of curricula.SUBJECT_CURRICULA[subjectId]) for(const def of unit.skills){
 if(!keys.has(def.generatorKey)) failures.push(`${def.id}:missing_key:${def.generatorKey}`)
 const skill={id:def.id,name:def.name,generator_key:def.generatorKey}
 for(const difficulty of [1,2,3]) for(const seed of [1,2,17,101,997]){const q=knowledge.generateKnowledgeSubjectQuestion(skill,difficulty,seed);generated++
  if(!q){failures.push(`${def.id}:null`);continue}
  if(q.options.length!==4||new Set(q.options).size!==4) failures.push(`${def.id}:bad_options`)
  if(q.answerIndex<0||q.answerIndex>3) failures.push(`${def.id}:bad_answer`)
  if(!q.prompt||!q.solution) failures.push(`${def.id}:missing_text`)
 }
}
console.log(JSON.stringify({skills:48,generated,generatorKeys:keys.size,failures},null,2));if(failures.length)process.exitCode=1
