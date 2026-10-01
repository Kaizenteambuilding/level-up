const fs=require('node:fs')
const vm=require('node:vm')

const source=fs.readFileSync('lib/questionAntiRepeat.ts','utf8')
  .replace(/export /g,'')
  .replace(/: string\[\]/g,'')
  .replace(/: string/g,'')
  .replace(/: number/g,'')
  .replace(/\nexport[^\n]*/g,'')
const sandbox={}
vm.createContext(sandbox)
vm.runInContext(source+'\nthis.semanticQuestionSignature=semanticQuestionSignature;this.normalizeQuestionTemplate=normalizeQuestionTemplate;',sandbox)
const sig=sandbox.semanticQuestionSignature

const cases=[
  {
    name:'cartography exact production report',
    a:'Reto geográfico: En dos mapas del mismo territorio, uno a escala 1:10 000 y otro a 1:100 000, ¿cuál muestra más detalle?',
    b:'Reto geografico: En dos mapas del mismo territorio, uno a escala 1:10 000 y otro a 1:100 000, ¿cuál muestra más detalle?',
  },
  {
    name:'reading passage survives changed comprehension frame',
    a:'Lee: «La plaza despertó poco a poco. Los toldos de colores se abrieron como flores y el murmullo de las conversaciones llenó el aire». ¿Qué efecto produce el recurso expresivo?',
    b:'Lee: «La plaza despertó poco a poco. Los toldos de colores se abrieron como flores y el murmullo de las conversaciones llenó el aire». ¿Cómo contribuye el lenguaje figurado al texto?',
    expectSame:true,
  },
]
const failures=[]
for(const c of cases){
  const sa=sig(c.a),sb=sig(c.b)
  const same=sa===sb
  if(c.expectSame!==false&&!same)failures.push(c.name+': semantic signatures differ\n  '+sa+'\n  '+sb)
}
console.log(JSON.stringify({cases:cases.length,failures},null,2))
if(failures.length)throw new Error('Real anti-repeat regression audit failed')
