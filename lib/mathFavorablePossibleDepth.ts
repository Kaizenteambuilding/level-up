import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Item = { prompt:string; answer:string; distractors:[string,string,string]; solution:string }

function rotate<T>(items:T[], shift:number){ const n=((shift%items.length)+items.length)%items.length; return items.slice(n).concat(items.slice(0,n)) }
function distinctDistractors(answer:string, distractors:string[], seed:number):[string,string,string]{
  const out:string[]=[]
  for(const value of [...distractors, `${Number(answer)+1}`, `${Number(answer)+2}`, `${Number(answer)+3}`, 'Ninguna de las anteriores']){
    if(value!==answer && !out.includes(value)) out.push(value)
    if(out.length===3) break
  }
  if(out.length!==3) throw new Error(`Could not build distinct M15S03 distractors for seed ${seed}`)
  return out as [string,string,string]
}
function finish(skill:SkillMeta,difficulty:number,seed:number,item:Item):GeneratedQuestion{
  const distractors=distinctDistractors(item.answer,item.distractors,seed)
  const raw=[item.answer,...distractors]
  if(new Set(raw).size!==4) throw new Error(`Duplicate M15S03 options for seed ${seed}`)
  const options=rotate(raw,seed+difficulty)
  return {skillId:skill.id,label:skill.name,difficulty,seed,prompt:item.prompt,options,answerIndex:options.indexOf(item.answer),solution:item.solution,tags:[skill.generator_key,'math','favorable_possible_depth_v2']}
}
function item(seed:number):Item{
  const family=(seed>>>2)%22
  const red=2+((seed>>>7)%7), blue=2+((seed>>>11)%6), green=1+((seed>>>15)%5), total=red+blue+green
  const sides=[6,8,10,12][(seed>>>19)%4]
  const threshold=2+((seed>>>22)%Math.max(2,sides-3))
  const even=Math.floor(sides/2)
  const multiples3=Math.floor(sides/3)
  const numbered=8+((seed>>>25)%8)
  if(family===0)return{prompt:`Una bolsa contiene ${red} bolas rojas, ${blue} azules y ${green} verdes. ¿Cuántos casos posibles hay al sacar una bola si cada bola es un resultado elemental?`,answer:String(total),distractors:[String(red+blue),'3',String(total+1)],solution:`Hay ${total} bolas y cada una cuenta como resultado posible.`}
  if(family===1)return{prompt:`En esa bolsa hay ${red} rojas, ${blue} azules y ${green} verdes. ¿Cuántos casos favorables tiene “sacar roja”?`,answer:String(red),distractors:[String(total),String(blue),String(green)],solution:`Las ${red} bolas rojas son exactamente los casos favorables.`}
  if(family===2)return{prompt:`Una bolsa tiene ${red} rojas, ${blue} azules y ${green} verdes. ¿Cuántos casos favorables tiene “no sacar verde”?`,answer:String(red+blue),distractors:[String(green),String(total),String(red)],solution:'Son favorables todas las bolas rojas o azules.'}
  if(family===3){const fav=sides-threshold;return{prompt:`En un dado de ${sides} caras numeradas del 1 al ${sides}, ¿cuántos casos favorables hay para obtener un número mayor que ${threshold}?`,answer:String(fav),distractors:[String(threshold),String(sides),String(Math.max(0,fav-1))],solution:`Hay ${sides-threshold} enteros mayores que ${threshold} hasta ${sides}.`}}
  if(family===4)return{prompt:`En un dado de ${sides} caras, ¿cuántos casos favorables tiene “obtener un número par”?`,answer:String(even),distractors:[String(sides),String(Math.max(1,even-1)),String(Math.min(sides,even+2))],solution:`La mitad de los números del 1 al ${sides} son pares.`}
  if(family===5)return{prompt:`En una ruleta con ${sides} sectores iguales numerados del 1 al ${sides}, ¿cuántos casos favorables tiene “múltiplo de 3”?`,answer:String(multiples3),distractors:[String(sides),String(Math.max(1,multiples3+1)),String(3)],solution:`Los múltiplos de 3 hasta ${sides} son ${multiples3}.`}
  if(family===6)return{prompt:`Una caja tiene ${total} fichas, de las que ${red} llevan estrella. Para “sacar estrella”, ¿qué conteo es correcto?`,answer:`${red} favorables y ${total} posibles`,distractors:[`${total} favorables y ${red} posibles`,`${blue} favorables y ${green} posibles`,`${red+blue} favorables y ${red} posibles`],solution:'Favorables cuenta las fichas con estrella; posibles cuenta todas las fichas.'}
  if(family===7)return{prompt:'¿Puede haber más casos favorables que posibles en un mismo experimento?',answer:'No, los favorables son un subconjunto de los posibles',distractors:['Sí, si el suceso es muy probable','Sí, cuando hay reemplazamiento','Solo en experimentos con dados'],solution:'Todo caso favorable debe ser también un resultado posible.'}
  if(family===8)return{prompt:`En un dado de ${sides} caras, el suceso “obtener ${sides+1}” es imposible. ¿Cuántos casos favorables tiene?`,answer:'0',distractors:['1',String(sides),String(sides+1)],solution:'Ese resultado no pertenece al espacio muestral.'}
  if(family===9)return{prompt:`En un dado de ${sides} caras, “obtener un número entre 1 y ${sides}” es seguro. ¿Cuántos casos favorables tiene?`,answer:String(sides),distractors:['0','1',String(even)],solution:'Todos los resultados posibles cumplen el suceso.'}
  if(family===10){const fav=numbered-5;return{prompt:`Hay ${numbered} tarjetas numeradas del 1 al ${numbered}. ¿Cuántos casos favorables tiene “número mayor que 5”?`,answer:String(fav),distractors:['5',String(numbered),String(Math.max(1,fav-1))],solution:`Los números 6 a ${numbered} forman ${fav} casos favorables.`}}
  if(family===11)return{prompt:'Al lanzar dos monedas, los posibles son CC, CX, XC y XX. ¿Cuántos favorecen “exactamente una cara”?',answer:'2',distractors:['1','3','4'],solution:'CX y XC contienen exactamente una cara.'}
  if(family===12)return{prompt:'Al lanzar dos monedas, ¿cuántos casos posibles elementales hay si importa el resultado de cada moneda?',answer:'4',distractors:['2','3','8'],solution:'Los resultados son CC, CX, XC y XX.'}
  if(family===13)return{prompt:'Al lanzar dos monedas, ¿cuántos casos favorables tiene “al menos una cara”?',answer:'3',distractors:['1','2','4'],solution:'CC, CX y XC contienen al menos una cara.'}
  if(family===14)return{prompt:`Una urna tiene ${total} bolas y el suceso A contiene ${red+green} de ellas. ¿Cuál es el número de casos posibles de A?`,answer:String(total),distractors:[String(red+green),String(red),String(green)],solution:'Los casos posibles pertenecen al experimento completo, no solo al suceso A.'}
  if(family===15)return{prompt:`Una urna tiene ${total} bolas y ${blue} cumplen el suceso B. ¿Cuál es el número de casos favorables de B?`,answer:String(blue),distractors:[String(total),String(red+green),String(Math.max(1,blue-1))],solution:'Los favorables son exactamente los resultados que cumplen B.'}
  if(family===16)return{prompt:`En un dado de ${sides} caras, ¿cuántos casos favorables tiene “resultado menor o igual que ${threshold}”?`,answer:String(threshold),distractors:[String(sides-threshold),String(sides),String(Math.max(1,threshold-1))],solution:`Los resultados 1 a ${threshold} son favorables.`}
  if(family===17){const fav=sides-threshold+1;return{prompt:`En un dado de ${sides} caras, ¿cuántos casos favorables tiene “resultado mayor o igual que ${threshold}”?`,answer:String(fav),distractors:[String(threshold),String(sides-threshold),String(sides)],solution:`Desde ${threshold} hasta ${sides}, ambos incluidos, hay ${fav} resultados.`}}
  if(family===18)return{prompt:`Una ruleta tiene ${sides} sectores iguales y ${even} están marcados. ¿Qué números forman el conteo “favorables / posibles”?`,answer:`${even} / ${sides}`,distractors:[`${sides} / ${even}`,`${even} / ${even}`,`${sides} / ${sides}`],solution:'El numerador cuenta sectores marcados y el denominador todos los sectores.'}
  if(family===19)return{prompt:'¿Qué debe hacerse antes de contar casos favorables?',answer:'Definir el experimento y todos sus resultados posibles',distractors:['Elegir solo los resultados deseados','Eliminar los resultados desfavorables','Suponer que favorable y posible significan lo mismo'],solution:'El espacio de resultados posibles permite identificar después el subconjunto favorable.'}
  if(family===20)return{prompt:`En una bolsa con ${red} rojas y ${blue} azules, ¿cuántos casos favorables tiene “roja o azul”?`,answer:String(red+blue),distractors:[String(red),String(blue),'2'],solution:'Como todas las bolas son rojas o azules, todos los resultados son favorables.'}
  return{prompt:`En una bolsa con ${red} rojas, ${blue} azules y ${green} verdes, ¿cuántos casos favorables tiene “ni roja ni azul”?`,answer:String(green),distractors:[String(red+blue),String(total),String(red)],solution:'La única categoría que no es roja ni azul es verde.'}
}
export function generateMathFavorablePossibleDepth(skill:SkillMeta,difficulty:number,seed:number):GeneratedQuestion|null{
  if(skill.id!=='M15S03')return null
  const n=seed>>>0
  if((n&3)===3)return null
  return finish(skill,difficulty,n,item(n))
}
