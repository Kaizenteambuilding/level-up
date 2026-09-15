import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }

function rotate<T>(items:T[], shift:number) {
  const offset = ((shift % items.length) + items.length) % items.length
  return items.slice(offset).concat(items.slice(0, offset))
}

function q(skill:SkillMeta,difficulty:number,seed:number,prompt:string,answer:string,distractors:[string,string,string],solution:string):GeneratedQuestion {
  const options = rotate([answer,...distractors], seed + difficulty)
  return { skillId:skill.id,label:skill.name,difficulty,seed,prompt,options,answerIndex:options.indexOf(answer),solution,tags:[skill.generator_key,'math','repeat_hotspot_depth'] }
}

function sumRest(skill:SkillMeta,difficulty:number,seed:number) {
  const family = seed % 12
  const a = 120 + (seed % 700)
  const b = 80 + ((seed >>> 4) % 500)
  if (family===0) return q(skill,difficulty,seed,`Calcula ${a} + ${b}.`,String(a+b),[String(a+b+10),String(a+b-10),String(Math.abs(a-b))],`${a} + ${b} = ${a+b}.`)
  if (family===1) return q(skill,difficulty,seed,`Calcula ${a+b} - ${b}.`,String(a),[String(b),String(a+10),String(a-10)],`${a+b} - ${b} = ${a}.`)
  if (family===2) return q(skill,difficulty,seed,`Una tienda tenía ${a} unidades y recibió ${b}. ¿Cuántas tiene ahora?`,String(a+b),[String(a-b),String(a+b+100),String(b)],`Se suman las existencias: ${a}+${b}=${a+b}.`)
  if (family===3) return q(skill,difficulty,seed,`De ${a+b} entradas disponibles se vendieron ${b}. ¿Cuántas quedan?`,String(a),[String(b),String(a+20),String(a-20)],`Quedan ${a+b}-${b}=${a}.`)
  if (family===4) return q(skill,difficulty,seed,`Completa: ${a} + x = ${a+b}.`,String(b),[String(a),String(b+10),String(b-10)],`x=${a+b}-${a}=${b}.`)
  if (family===5) return q(skill,difficulty,seed,`Completa: x - ${b} = ${a}.`,String(a+b),[String(a-b),String(a),String(b)],`x=${a}+${b}=${a+b}.`)
  if (family===6) return q(skill,difficulty,seed,`¿Qué operación comprueba que ${a+b} - ${b} = ${a}?`,` ${a} + ${b} = ${a+b}`.trim(),[`${a+b} + ${b} = ${a}`,`${a} - ${b} = ${a+b}`,`${b} - ${a} = ${a+b}`],'La suma inversa recupera el total inicial.')
  if (family===7) return q(skill,difficulty,seed,`Redondea ${a} y ${b} a la centena más cercana para estimar ${a}+${b}.`,'Una estimación cercana a la suma exacta',['Exactamente el mismo resultado siempre','Una resta aproximada','No se puede estimar'],'Redondear sirve para comprobar si el resultado exacto tiene un orden de magnitud razonable.')
  if (family===8) return q(skill,difficulty,seed,`Si a ${a} le sumas ${b} y luego restas ${b}, ¿qué obtienes?`,String(a),[String(a+b),String(b),String(a-b)],'Sumar y restar la misma cantidad son operaciones inversas.')
  if (family===9) return q(skill,difficulty,seed,`Dos cantidades suman ${a+b}. Una vale ${a}. ¿Cuánto vale la otra?`,String(b),[String(a),String(a-b),String(a+b)],`La parte que falta es ${a+b}-${a}=${b}.`)
  if (family===10) return q(skill,difficulty,seed,`Un marcador pasa de ${a} a ${a+b}. ¿Cuánto aumentó?`,String(b),[String(a),String(a+b),String(Math.abs(a-b))],`El aumento es ${a+b}-${a}=${b}.`)
  return q(skill,difficulty,seed,`¿Cuál es mayor: ${a}+${b} o ${a+b-1}?`,`${a}+${b}`,[String(a+b-1),'Son iguales','No se puede saber'],`${a}+${b}=${a+b}, que es una unidad mayor que ${a+b-1}.`)
}

function simplify(skill:SkillMeta,difficulty:number,seed:number) {
  const family = seed % 12
  const k = 2 + (seed % 7)
  const p = 2 + ((seed>>>3)%7)
  const qv = p + 1 + ((seed>>>6)%5)
  const n = p*k, d = qv*k
  if (family===0) return q(skill,difficulty,seed,`Simplifica ${n}/${d}.`,`${p}/${qv}`,[`${p+1}/${qv}`,`${p}/${qv+1}`,`${n-1}/${d}`],`Dividimos numerador y denominador entre ${k}.`)
  if (family===1) return q(skill,difficulty,seed,`¿Qué número divide a ${n} y ${d} para obtener ${p}/${qv}?`,String(k),[String(k+1),String(p),String(qv)],`Ambos términos se dividen entre ${k}.`)
  if (family===2) return q(skill,difficulty,seed,`¿Son equivalentes ${p}/${qv} y ${n}/${d}?`,'Sí, representan la misma fracción',['No, porque cambian los números','Solo si los denominadores coinciden','Solo si los numeradores coinciden'],`Multiplicar ambos términos por ${k} conserva el valor.`)
  if (family===3) return q(skill,difficulty,seed,`Para simplificar una fracción, ¿qué debe hacerse?`,'Dividir numerador y denominador por un divisor común',['Restar el mismo número a ambos','Sumar ambos términos','Cambiar solo el denominador'],'La división por un factor común mantiene el valor de la fracción.')
  if (family===4) return q(skill,difficulty,seed,`La fracción ${p}/${qv} está en forma irreducible cuando…`,'numerador y denominador no tienen divisores comunes mayores que 1',['el numerador es menor','el denominador es par','la fracción es menor que 1'],'Una fracción irreducible tiene mcd 1.')
  if (family===5) return q(skill,difficulty,seed,`Si multiplicas numerador y denominador de ${p}/${qv} por ${k}, obtienes…`,`${n}/${d}`,[`${p+k}/${qv+k}`,`${n}/${qv}`,`${p}/${d}`],'Multiplicar ambos términos por la misma cantidad genera una fracción equivalente.')
  if (family===6) return q(skill,difficulty,seed,`¿Cuál es el mcd de ${n} y ${d} si ${p} y ${qv} son coprimos?`,String(k),[String(p),String(qv),String(k*2)],`Al ser ${p} y ${qv} coprimos, el factor común máximo introducido es ${k}.`)
  if (family===7) return q(skill,difficulty,seed,`¿Qué paso confirma que ${n}/${d} se simplifica a ${p}/${qv}?`,`Comprobar que ${n}÷${k}=${p} y ${d}÷${k}=${qv}`,[`Sumar ${k} a ambos términos`,`Restar ${p} al denominador`,'Comparar solo numeradores'],'La misma división debe aplicarse a numerador y denominador.')
  if (family===8) return q(skill,difficulty,seed,`Una receta usa ${n}/${d} de una medida. ¿Qué fracción equivalente más simple representa lo mismo?`,`${p}/${qv}`,[`${p+1}/${qv}`,`${p}/${qv+1}`,`${n}/${qv}`],`Se simplifica dividiendo entre ${k}.`)
  if (family===9) return q(skill,difficulty,seed,`¿Simplificar cambia el valor de una fracción?`,'No, solo cambia su escritura',['Sí, siempre la hace menor','Sí, siempre la hace mayor','Solo si el denominador es par'],'Las fracciones equivalentes representan la misma cantidad.')
  if (family===10) return q(skill,difficulty,seed,`¿Cuál de estas operaciones conserva el valor de ${n}/${d}?`,`Dividir ambos términos entre ${k}`,[`Dividir solo ${n}`,`Restar ${k} a ambos`,`Sumar ${k} solo al denominador`],'Aplicar la misma división a numerador y denominador conserva la razón.')
  return q(skill,difficulty,seed,`Si ${n}/${d} = ${p}/${qv}, ¿qué relación se cumple?`,`${n}×${qv} = ${d}×${p}`,[`${n}+${qv} = ${d}+${p}`,`${n}-${qv} = ${d}-${p}`,`${n}×${d} = ${p}×${qv}`],'Las fracciones equivalentes cumplen igualdad de productos cruzados.')
}

function frequency(skill:SkillMeta,difficulty:number,seed:number) {
  const family = seed % 12
  const a = 3 + (seed%8), b = 2 + ((seed>>>3)%7), c = 1 + ((seed>>>6)%6)
  const total = a+b+c
  if (family===0) return q(skill,difficulty,seed,`En una tabla, A aparece ${a} veces. ¿Cuál es su frecuencia absoluta?`,String(a),[String(total),String(b),String(c)],'La frecuencia absoluta es el número de apariciones.')
  if (family===1) return q(skill,difficulty,seed,`Las frecuencias son A=${a}, B=${b}, C=${c}. ¿Cuántos datos hay en total?`,String(total),[String(a),String(b),String(a+b)],`Total=${a}+${b}+${c}=${total}.`)
  if (family===2) return q(skill,difficulty,seed,`Con ${total} datos, A aparece ${a} veces. ¿Cuál es su frecuencia relativa?`,`${a}/${total}`,[`${total}/${a}`,`${b}/${total}`,`${a}/${b}`],'Frecuencia relativa = frecuencia absoluta / total.')
  if (family===3) return q(skill,difficulty,seed,`¿Qué categoría es la más frecuente si A=${a+5}, B=${b}, C=${c}?`,'A',['B','C','No puede saberse'],'A tiene la mayor frecuencia absoluta.')
  if (family===4) return q(skill,difficulty,seed,`Si una categoría tiene frecuencia relativa 0,25 en 40 datos, ¿cuál es su frecuencia absoluta?`,'10',['4','15','25'],'0,25 × 40 = 10.')
  if (family===5) return q(skill,difficulty,seed,`¿Qué debe sumar el conjunto de frecuencias relativas de todas las categorías?`,'1',['0','El número de categorías','100 datos'],'Las frecuencias relativas representan partes del total y suman 1.')
  if (family===6) return q(skill,difficulty,seed,`Una tabla tiene frecuencias 4, 7, 5 y x; el total es 20. ¿Cuánto vale x?`,'4',['3','5','8'],'x = 20 - (4+7+5) = 4.')
  if (family===7) return q(skill,difficulty,seed,`Si duplicas todos los datos manteniendo las mismas proporciones, ¿qué ocurre con las frecuencias relativas?`,'Permanecen iguales',['Se duplican','Se reducen a la mitad','Todas pasan a 1'],'Las proporciones no cambian al duplicar todos los conteos.')
  if (family===8) return q(skill,difficulty,seed,`¿Qué columna permite comprobar rápidamente el tamaño total de la muestra?`,'La suma de las frecuencias absolutas',['Una sola categoría','Solo la frecuencia máxima','El nombre de la variable'],'La suma de todos los conteos da el número total de observaciones.')
  if (family===9) return q(skill,difficulty,seed,`En 50 respuestas, una opción tiene frecuencia relativa 0,3. ¿Cuántas respuestas son?`,'15',['10','20','30'],'0,3 × 50 = 15.')
  if (family===10) return q(skill,difficulty,seed,`Una frecuencia relativa de 0,4 equivale a…`,'40 %',['4 %','0,4 %','400 %'],'0,4 × 100 = 40 %.')
  return q(skill,difficulty,seed,`Si A tiene frecuencia ${a} y B frecuencia ${b}, ¿qué expresa ${a}-${b}?`,'La diferencia entre sus frecuencias absolutas',['La frecuencia relativa de A','El total de datos','La moda necesariamente'],'Restar los conteos compara cuántas observaciones más tiene una categoría que otra.')
}

export function generateMathRepeatHotspotVariant(skill:SkillMeta,difficulty:number,seed:number):GeneratedQuestion|null {
  const normalized = seed >>> 0
  if (skill.id==='M01S03') return sumRest(skill,difficulty,normalized)
  if (skill.id==='M07S03') return simplify(skill,difficulty,normalized)
  if (skill.id==='M14S03') return frequency(skill,difficulty,normalized)
  return null
}
