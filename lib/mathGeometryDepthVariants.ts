import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }

function rotate<T>(items:T[], shift:number) {
  const offset=((shift%items.length)+items.length)%items.length
  return items.slice(offset).concat(items.slice(0,offset))
}

function pointName(seed:number, offset=0) {
  return String.fromCharCode(65 + ((seed + offset) % 20))
}

export function generateMathGeometryDepthVariant(skill:SkillMeta, difficulty:number, seed:number):GeneratedQuestion|null {
  if (skill.id !== 'M10S01') return null
  const n=seed>>>0
  const family=n%18
  const A=pointName(n), B=pointName(n,3), C=pointName(n,6), D=pointName(n,9)
  const x1=1+(n%5), x2=x1+3+((n>>>3)%5)
  let prompt=''
  let answer=''
  let distractors:[string,string,string]
  let solution=''

  if (family===0) { prompt=`El punto ${A} marca una posición exacta en un plano. ¿Qué dimensión tiene un punto ideal?`; answer='Ninguna: solo indica posición'; distractors=['Una longitud','Una longitud y una anchura','Un área']; solution='En geometría ideal, un punto no tiene longitud, anchura ni área.' }
  else if (family===1) { prompt=`La recta que pasa por ${A} y ${B} se prolonga…`; answer='Indefinidamente en los dos sentidos'; distractors=['Solo desde A hacia B','Solo entre A y B','Hasta un tercer punto']; solution='Una recta no tiene extremos y se extiende indefinidamente en ambas direcciones.' }
  else if (family===2) { prompt=`La parte de la recta comprendida entre ${A} y ${B}, incluidos ambos extremos, es…`; answer=`El segmento ${A}${B}`; distractors=[`La recta ${A}${B}`,`La semirrecta ${A}${B}`,'Un punto']; solution='Un segmento está limitado por dos extremos.' }
  else if (family===3) { prompt=`Una figura empieza en ${A}, pasa por ${B} y continúa sin fin más allá de ${B}. ¿Qué es?`; answer=`Una semirrecta de origen ${A}`; distractors=[`Un segmento ${A}${B}`,`Una recta ${A}${B}`,`Una semirrecta de origen ${B}`]; solution='Una semirrecta tiene un único origen y se prolonga indefinidamente en una dirección.' }
  else if (family===4) { prompt=`Los puntos ${A}, ${B} y ${C} están sobre una misma recta. ¿Cómo se describen?`; answer='Colineales'; distractors=['Paralelos','Perpendiculares','Equidistantes necesariamente']; solution='Puntos que pertenecen a una misma recta son colineales.' }
  else if (family===5) { prompt=`Dos rectas distintas no se cortan aunque se prolonguen indefinidamente en el plano. ¿Qué relación tienen?`; answer='Son paralelas'; distractors=['Son secantes','Son perpendiculares','Son coincidentes']; solution='En el plano, rectas paralelas distintas no tienen puntos comunes.' }
  else if (family===6) { prompt=`Dos rectas se cortan formando cuatro ángulos rectos. ¿Cómo son?`; answer='Perpendiculares'; distractors=['Paralelas','Coincidentes','Colineales']; solution='Las rectas perpendiculares se cortan formando ángulos de 90°.' }
  else if (family===7) { prompt=`Las rectas r y s tienen exactamente un punto en común, ${A}. ¿Cómo se llaman?`; answer='Secantes'; distractors=['Paralelas','Coincidentes','Segmentos']; solution='Dos rectas secantes se cortan en un único punto.' }
  else if (family===8) { prompt=`Las rectas r y s comparten todos sus puntos. ¿Qué relación existe entre ellas?`; answer='Son coincidentes'; distractors=['Son paralelas distintas','Son perpendiculares','Son secantes en un solo punto']; solution='Si dos rectas comparten todos sus puntos, representan la misma recta.' }
  else if (family===9) { const mid=(x1+x2)/2; prompt=`En una recta numérica, ${A} está en ${x1} y ${B} en ${x2}. ¿En qué coordenada está el punto medio de ${A}${B}?`; answer=String(Number(mid.toFixed(1))).replace('.',','); distractors=[String(x2-x1),String(x1+x2),String(x1)]; solution=`El punto medio está en (${x1}+${x2})/2 = ${Number(mid.toFixed(1))}.` }
  else if (family===10) { const dist=x2-x1; prompt=`En una recta numérica, ${A} está en ${x1} y ${B} en ${x2}. ¿Cuál es la longitud del segmento ${A}${B}?`; answer=String(dist); distractors=[String(x1+x2),String(x2),String(dist+1)]; solution=`La distancia es |${x2}-${x1}| = ${dist}.` }
  else if (family===11) { prompt=`Si ${B} está entre ${A} y ${C} sobre la misma recta, ¿qué relación es correcta?`; answer=`${A}${C} = ${A}${B} + ${B}${C}`; distractors=[`${A}${B} = ${A}${C} + ${B}${C}`,`${B}${C} = ${A}${B} + ${A}${C}`,`${A}${C} = ${A}${B} - ${B}${C}`]; solution='Cuando un punto está entre otros dos, las longitudes de los subsegmentos suman la longitud total.' }
  else if (family===12) { const ab=3+(n%6), bc=2+((n>>>4)%5); prompt=`Los puntos ${A}, ${B}, ${C} son colineales y ${B} está entre ${A} y ${C}. Si ${A}${B}=${ab} cm y ${B}${C}=${bc} cm, ¿cuánto mide ${A}${C}?`; answer=`${ab+bc} cm`; distractors=[`${Math.abs(ab-bc)} cm`,`${ab*bc} cm`,`${ab+bc+1} cm`]; solution=`${A}${C}=${A}${B}+${B}${C}=${ab}+${bc}=${ab+bc} cm.` }
  else if (family===13) { const ac=9+(n%8), ab=3+((n>>>3)%4); const bc=ac-ab; prompt=`${B} está entre ${A} y ${C}. Si ${A}${C}=${ac} cm y ${A}${B}=${ab} cm, ¿cuánto mide ${B}${C}?`; answer=`${bc} cm`; distractors=[`${ac+ab} cm`,`${ab} cm`,`${bc+1} cm`]; solution=`${B}${C}=${A}${C}-${A}${B}=${ac}-${ab}=${bc} cm.` }
  else if (family===14) { prompt=`Desde el punto ${A} parten dos semirrectas: una pasa por ${B} y otra por ${C}. ¿Qué tienen necesariamente en común?`; answer=`El origen ${A}`; distractors=[`El punto ${B}`,`El punto ${C}`,'Todos sus puntos']; solution='Dos semirrectas con el mismo origen comparten al menos ese punto, aunque sigan direcciones distintas.' }
  else if (family===15) { prompt=`¿Cuántas rectas distintas pasan exactamente por dos puntos diferentes ${A} y ${B}?`; answer='Una'; distractors=['Ninguna','Dos','Infinitas']; solution='Por dos puntos distintos pasa una única recta.' }
  else if (family===16) { prompt=`Si ${A} y ${B} son puntos distintos de una recta, ¿son iguales los segmentos ${A}${B} y ${B}${A}?`; answer='Sí, tienen los mismos extremos y la misma longitud'; distractors=['No, el orden cambia la longitud','Solo si A es el punto medio','Solo si la recta es horizontal']; solution='Un segmento queda determinado por sus dos extremos; nombrarlos en orden inverso no cambia el segmento.' }
  else { prompt=`El punto ${D} no pertenece a la recta que pasa por ${A} y ${B}. ¿Qué puede afirmarse?`; answer=`${A}, ${B} y ${D} no son colineales`; distractors=[`${A}, ${B} y ${D} son paralelos`,`${D} es punto medio de ${A}${B}`,`${A}${B} y ${D} forman un segmento único`]; solution='Tres puntos son colineales solo si todos pertenecen a una misma recta.' }

  const options=rotate([answer,...distractors],n+difficulty)
  return {skillId:skill.id,label:skill.name,difficulty,seed,prompt,options,answerIndex:options.indexOf(answer),solution,tags:[skill.generator_key,'math','geometry_course_depth']}
}
