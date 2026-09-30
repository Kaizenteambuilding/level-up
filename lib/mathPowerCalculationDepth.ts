import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id:string; name:string; generator_key:string }

function rotate<T>(items:T[], shift:number) {
  const offset=((shift%items.length)+items.length)%items.length
  return items.slice(offset).concat(items.slice(0,offset))
}
function sup(n:number) {
  const m:Record<string,string>={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'}
  return String(n).split('').map(x=>m[x]??x).join('')
}
function q(skill:SkillMeta,difficulty:number,seed:number,prompt:string,answer:string,d:[string,string,string],solution:string):GeneratedQuestion {
  const options=rotate([answer,...d],seed+difficulty)
  return {skillId:skill.id,label:skill.name,difficulty,seed,prompt,options,answerIndex:options.indexOf(answer),solution,tags:[skill.generator_key,'math','power_calculation_depth']}
}
export function generateMathPowerCalculationDepth(skill:SkillMeta,difficulty:number,seed:number):GeneratedQuestion|null {
  if(skill.id!=='M02S02') return null
  const s=seed>>>0
  if((s&1)===1) return null
  const r=s>>>1, family=r%14, cycle=Math.floor(r/14)
  const base=2+((r+cycle*3)%7), exp=2+((r*3+cycle)%4), value=base**exp
  const notation=`${base}${sup(exp)}`
  const prev=base**(exp-1)
  if(family===0)return q(skill,difficulty,s,`Calcula ${notation}.`,String(value),[String(base*exp),String(prev),String(value+base)],`${notation}=${value}.`)
  if(family===1)return q(skill,difficulty,s,`¿Qué valor tiene ${base}${sup(exp-1)} × ${base}?`,String(value),[String(prev),String(value+base),String(base*exp)],`Añadir un factor ${base} produce ${notation}=${value}.`)
  if(family===2)return q(skill,difficulty,s,`Si ${base}${sup(exp-1)}=${prev}, ¿cuánto vale ${notation}?`,String(value),[String(prev+base),String(prev),String(value-base)],`${prev}×${base}=${value}.`)
  if(family===3)return q(skill,difficulty,s,`¿Cuál es mayor: ${notation} o ${base}${sup(exp-1)}?`,notation,[`${base}${sup(exp-1)}`,'Son iguales','No puede saberse'],`${value}>${prev}.`)
  if(family===4)return q(skill,difficulty,s,`Completa: ${notation} = ___ × ${base}.`,String(prev),[String(value),String(exp),String(base)],`Se separa uno de los ${exp} factores iguales.`)
  if(family===5)return q(skill,difficulty,s,`Un cuadrado de lado ${base} cm tiene área…`,`${base**2} cm²`,[`${base*2} cm²`,`${base**3} cm²`,`${base+2} cm²`],`Área=${base}²=${base**2} cm².`)
  if(family===6)return q(skill,difficulty,s,`Un cubo de arista ${base} cm tiene volumen…`,`${base**3} cm³`,[`${base*3} cm³`,`${base**2} cm³`,`${base+3} cm³`],`Volumen=${base}³=${base**3} cm³.`)
  if(family===7){const e=2+((r+cycle)%4);return q(skill,difficulty,s,`Calcula 10${sup(e)}.`,String(10**e),[String(10*e),String(10**(e-1)),String(10**(e+1))],`10${sup(e)} es 1 seguido de ${e} ceros.`)}
  if(family===8)return q(skill,difficulty,s,`¿Qué operación permite pasar de ${base}${sup(exp-1)} a ${notation}?`,`Multiplicar por ${base}`,[`Sumar ${base}`,'Multiplicar por el exponente','Sumar 1'],`Se añade un factor igual a la base: ×${base}.`)
  if(family===9)return q(skill,difficulty,s,`¿Cuál de estos resultados corresponde a ${notation}?`,String(value),[String(base*exp),String(base+exp),String(value+1)],`Multiplicando ${base} por sí mismo ${exp} veces se obtiene ${value}.`)
  if(family===10)return q(skill,difficulty,s,`Si ${notation}=${value}, ¿cuánto es ${value} ÷ ${base}?`,String(prev),[String(value-base),String(base),String(exp)],`Al dividir por un factor ${base} queda ${base}${sup(exp-1)}=${prev}.`)
  if(family===11){const b2=base+1;return q(skill,difficulty,s,`¿Cuál es mayor: ${base}² o ${b2}²?`,`${b2}²`,[`${base}²`,'Son iguales','Depende del orden'],`${b2}²=${b2**2} y ${base}²=${base**2}.`)}
  if(family===12)return q(skill,difficulty,s,`Calcula ${base}² + ${base}².`,String(2*base**2),[String(base**2),String((2*base)**2),String(2*base)],`Cada término vale ${base**2}; la suma es ${2*base**2}.`)
  return q(skill,difficulty,s,`Si ${base}²=${base**2}, ¿cuánto vale ${base}³?`,String(base**3),[String(base**2+base),String(base*3),String(base**2)],`${base}³=${base}²×${base}=${base**3}.`)
}
