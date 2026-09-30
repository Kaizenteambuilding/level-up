import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }

function rotate<T>(items:T[], shift:number) {
  const offset = ((shift % items.length) + items.length) % items.length
  return items.slice(offset).concat(items.slice(0, offset))
}

function q(skill:SkillMeta,difficulty:number,seed:number,prompt:string,answer:string,distractors:[string,string,string],solution:string):GeneratedQuestion {
  const options = rotate([answer,...distractors], seed + difficulty)
  return { skillId:skill.id,label:skill.name,difficulty,seed,prompt,options,answerIndex:options.indexOf(answer),solution,tags:[skill.generator_key,'math','natural_order_depth'] }
}

export function generateMathNaturalOrderDepth(skill:SkillMeta,difficulty:number,seed:number):GeneratedQuestion|null {
  if (skill.id !== 'M01S02') return null
  const s = seed >>> 0
  if ((s & 1) === 1) return null
  const routed = s >>> 1
  const family = routed % 12
  const cycle = Math.floor(routed / 12)
  const a = 1200 + ((routed * 137 + cycle * 53) % 7600)
  const gap = 3 + ((routed * 11 + cycle * 7) % 90)
  const b = a + gap
  const c = b + 1 + ((routed * 5 + cycle * 3) % 70)
  const context = ['marcadores','habitantes','páginas','puntos'][(routed + cycle) % 4]

  if (family===0) return q(skill,difficulty,s,`¿Cuál es mayor: ${a} o ${b}?`,String(b),[String(a),'Son iguales','No se pueden comparar'],`${b} es ${gap} unidades mayor que ${a}.`)
  if (family===1) return q(skill,difficulty,s,`Ordena de menor a mayor: ${c}, ${a}, ${b}.`,`${a} < ${b} < ${c}`,[`${c} < ${b} < ${a}`,`${b} < ${a} < ${c}`,`${a} < ${c} < ${b}`],'Se comparan las cifras desde la posición de mayor valor.')
  if (family===2) return q(skill,difficulty,s,`Completa con el signo correcto: ${a} __ ${b}.`,'<',['>','=','≤'],`${a} es menor que ${b}.`)
  if (family===3) return q(skill,difficulty,s,`Entre ${a} y ${a+2}, ¿qué número natural queda en medio?`,String(a+1),[String(a-1),String(a+2),String(a+3)],`El consecutivo entre ambos es ${a+1}.`)
  if (family===4) return q(skill,difficulty,s,`Un registro tiene ${a} ${context} y otro ${b}. ¿Cuál tiene la cantidad menor?`,String(a),[String(b),String(c),'Tienen la misma cantidad'],`${a}<${b}.`)
  if (family===5) return q(skill,difficulty,s,`¿Cuántas unidades separan ${a} y ${b}?`,String(gap),[String(gap+1),String(gap+10),String(b)],`${b}-${a}=${gap}.`)
  if (family===6) return q(skill,difficulty,s,`Si N cumple ${a} < N < ${a+2}, ¿cuánto vale N?`,String(a+1),[String(a),String(a+2),String(a+3)],`El único natural estrictamente entre ambos es ${a+1}.`)
  if (family===7) return q(skill,difficulty,s,`Al ordenar ${a}, ${c}, ${b} de mayor a menor, ¿cuál queda primero?`,String(c),[String(a),String(b),'No puede saberse'],`${c}>${b}>${a}.`)
  if (family===8) return q(skill,difficulty,s,`¿Qué afirmación es cierta sobre ${a} y ${b}?`,`${b} es ${gap} unidades mayor que ${a}`,[`${a} es ${gap} unidades mayor que ${b}`,'Son consecutivos','Son iguales'],`La diferencia es ${b}-${a}=${gap}.`)
  if (family===9) {
    const lower = Math.floor(a/10)*10
    return q(skill,difficulty,s,`¿Cuál de estos números está entre ${lower} y ${lower+10}?`,String(lower+5),[String(lower),String(lower+10),String(lower+15)],`${lower}<${lower+5}<${lower+10}.`)
  }
  if (family===10) return q(skill,difficulty,s,`En una lista ordenada ${a}, ${b}, ${c}, ¿qué número ocupa la segunda posición?`,String(b),[String(a),String(c),String(gap)],`Como ${a}<${b}<${c}, ${b} ocupa la posición central.`)
  return q(skill,difficulty,s,`Para decidir cuál es mayor entre ${a} y ${b}, ¿qué estrategia es correcta?`,'Comparar las cifras desde la posición de mayor valor',['Comparar solo la última cifra','Sumar las cifras de cada número','Elegir el que se escribió primero'],'En números naturales, se comparan primero las posiciones de mayor valor.')
}
