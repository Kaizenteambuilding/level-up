const fs=require('node:fs'),ts=require('typescript')
function load(path,extras={}){const src=fs.readFileSync(path,'utf8');const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const mod={exports:{}};new Function('exports','module','require',js)(mod.exports,mod,(id)=>extras[id]??require(id));return mod.exports}
const first=load('lib/firstEvaluationGenerators.ts')
const langBase=load('lib/languageSubjectGenerators.ts',{'./firstEvaluationGenerators':first})
const knowBase=load('lib/knowledgeSubjectGenerators.ts',{'./firstEvaluationGenerators':first})
const lang=load('lib/languageCriticalVariants.ts',{'./firstEvaluationGenerators':first,'./languageSubjectGenerators':langBase})
const know=load('lib/knowledgeCriticalVariants.ts',{'./firstEvaluationGenerators':first,'./knowledgeSubjectGenerators':knowBase})
const failures=[]
function audit(ids,generate,prefix){for(const id of ids){const skill={id,name:id,generator_key:'audit'};const prompts=new Set();for(const seed of [1,2,3,4,5,6]){try{prompts.add(generate(skill,2,seed).prompt)}catch(e){failures.push(`${id}:generation:${e.message}`)}}if(prompts.size<2)failures.push(`${id}:insufficient_prompt_diversity:${prompts.size}`)}}
audit(lang.languageCriticalVariantSkillIds(),lang.generateLanguageQuestionWithCriticalVariants,'language')
audit(know.criticalVariantSkillIds(),know.generateKnowledgeQuestionWithCriticalVariants,'knowledge')
console.log(JSON.stringify({languageCritical:lang.languageCriticalVariantSkillIds().length,knowledgeCritical:know.criticalVariantSkillIds().length,failures},null,2));if(failures.length)process.exitCode=1
