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
  if (family===6) return q(skill,difficulty,seed,`¿Qué operación comprueba que ${a+b} - ${b} = ${a}?`,`${a} + ${b} = ${a+b}`,[`${a+b} + ${b} = ${a}`,`${a} - ${b} = ${a+b}`,`${b} - ${a} = ${a+b}`],'La suma inversa recupera el total inicial.')
  if (family===7) return q(skill,difficulty,seed,`Al estimar ${a}+${b} redondeando, ¿para qué sirve la estimación?`,'Para comprobar si el resultado exacto es razonable',['Para sustituir siempre el cálculo exacto','Para convertir la suma en resta','Para eliminar las unidades'],'La estimación permite detectar resultados de orden de magnitud incorrecto.')
  if (family===8) return q(skill,difficulty,seed,`Si a ${a} le sumas ${b} y luego restas ${b}, ¿qué obtienes?`,String(a),[String(a+b),String(b),String(a-b)],'Sumar y restar la misma cantidad son operaciones inversas.')
  if (family===9) return q(skill,difficulty,seed,`Dos cantidades suman ${a+b}. Una vale ${a}. ¿Cuánto vale la otra?`,String(b),[String(a),String(a-b),String(a+b)],`La parte que falta es ${a+b}-${a}=${b}.`)
  if (family===10) return q(skill,difficulty,seed,`Un marcador pasa de ${a} a ${a+b}. ¿Cuánto aumentó?`,String(b),[String(a),String(a+b),String(Math.abs(a-b))],`El aumento es ${a+b}-${a}=${b}.`)
  return q(skill,difficulty,seed,`¿Cuál es mayor: ${a}+${b} o ${a+b-1}?`,`${a}+${b}`,[String(a+b-1),'Son iguales','No se puede saber'],`${a}+${b}=${a+b}, una unidad más que ${a+b-1}.`)
}

function simplify(skill:SkillMeta,difficulty:number,seed:number) {
  const family = seed % 12
  const k = 2 + (seed % 7)
  const p = 2 + ((seed>>>3)%7)
  const d0 = p + 1 + ((seed>>>6)%5)
  const n = p*k, d = d0*k
  if (family===0) return q(skill,difficulty,seed,`Simplifica ${n}/${d}.`,`${p}/${d0}`,[`${p+1}/${d0}`,`${p}/${d0+1}`,`${n-1}/${d}`],`Dividimos numerador y denominador entre ${k}.`)
  if (family===1) return q(skill,difficulty,seed,`¿Qué número divide a ${n} y ${d} para obtener ${p}/${d0}?`,String(k),[String(k+1),String(p),String(d0)],`Ambos términos se dividen entre ${k}.`)
  if (family===2) return q(skill,difficulty,seed,`¿Son equivalentes ${p}/${d0} y ${n}/${d}?`,'Sí, representan la misma fracción',['No, porque cambian los números','Solo si los denominadores coinciden','Solo si los numeradores coinciden'],`Multiplicar ambos términos por ${k} conserva el valor.`)
  if (family===3) return q(skill,difficulty,seed,'Para simplificar una fracción, ¿qué debe hacerse?','Dividir numerador y denominador por un divisor común',['Restar el mismo número a ambos','Sumar ambos términos','Cambiar solo el denominador'],'La misma división en ambos términos mantiene el valor.')
  if (family===4) return q(skill,difficulty,seed,`La fracción ${p}/${d0} está en forma irreducible cuando…`,'numerador y denominador no tienen divisores comunes mayores que 1',['el numerador es menor','el denominador es par','la fracción es menor que 1'],'Una fracción irreducible tiene mcd 1.')
  if (family===5) return q(skill,difficulty,seed,`Si multiplicas numerador y denominador de ${p}/${d0} por ${k}, obtienes…`,`${n}/${d}`,[`${p+k}/${d0+k}`,`${n}/${d0}`,`${p}/${d}`],'Multiplicar ambos términos por la misma cantidad genera una fracción equivalente.')
  if (family===6) return q(skill,difficulty,seed,`Si ${p} y ${d0} son coprimos, ¿cuál es el mcd de ${n} y ${d}?`,String(k),[String(p),String(d0),String(k*2)],`El factor común introducido es ${k}.`)
  if (family===7) return q(skill,difficulty,seed,`¿Qué paso confirma que ${n}/${d} se simplifica a ${p}/${d0}?`,`Comprobar que ${n}÷${k}=${p} y ${d}÷${k}=${d0}`,[`Sumar ${k} a ambos términos`,`Restar ${p} al denominador`,'Comparar solo numeradores'],'La misma división debe funcionar en ambos términos.')
  if (family===8) return q(skill,difficulty,seed,`Una receta usa ${n}/${d} de una medida. ¿Qué fracción equivalente más simple representa lo mismo?`,`${p}/${d0}`,[`${p+1}/${d0}`,`${p}/${d0+1}`,`${n}/${d0}`],`Se simplifica dividiendo entre ${k}.`)
  if (family===9) return q(skill,difficulty,seed,'¿Simplificar cambia el valor de una fracción?','No, solo cambia su escritura',['Sí, siempre la hace menor','Sí, siempre la hace mayor','Solo si el denominador es par'],'Las fracciones equivalentes representan la misma cantidad.')
  if (family===10) return q(skill,difficulty,seed,`¿Cuál de estas operaciones conserva el valor de ${n}/${d}?`,`Dividir ambos términos entre ${k}`,[`Dividir solo ${n}`,`Restar ${k} a ambos`,`Sumar ${k} solo al denominador`],'La misma división en ambos términos conserva la razón.')
  return q(skill,difficulty,seed,`Si ${n}/${d} = ${p}/${d0}, ¿qué relación se cumple?`,`${n}×${d0} = ${d}×${p}`,[`${n}+${d0} = ${d}+${p}`,`${n}-${d0} = ${d}-${p}`,`${n}×${d} = ${p}×${d0}`],'Las fracciones equivalentes cumplen igualdad de productos cruzados.')
}

function median(skill:SkillMeta,difficulty:number,seed:number) {
  const family = seed % 16
  const a = 4 + (seed % 10)
  const odd = [a,a+2,a+5,a+8,a+12]
  const even = [a,a+2,a+5,a+9,a+12,a+16]
  const medEven = (even[2]+even[3])/2
  if (family===0) return q(skill,difficulty,seed,`¿Cuál es la mediana de ${odd.join(', ')}?`,String(odd[2]),[String(odd[1]),String(odd[3]),String(a+6)],'Con cinco datos ordenados, la mediana es el tercero.')
  if (family===1) return q(skill,difficulty,seed,`¿Cuál es la mediana de ${even.join(', ')}?`,String(medEven).replace('.',','),[String(even[2]),String(even[3]),String(a+7)],'Con seis datos se promedian los dos centrales.')
  if (family===2) return q(skill,difficulty,seed,'En 11 datos ordenados, ¿qué posición ocupa la mediana?','La 6.ª',['La 5.ª','La 7.ª','La 11.ª'],'Quedan cinco datos a cada lado de la sexta posición.')
  if (family===3) return q(skill,difficulty,seed,'En 12 datos ordenados, ¿qué valores determinan la mediana?','El 6.º y el 7.º',['El 5.º y el 6.º','El 7.º y el 8.º','El 1.º y el 12.º'],'Con un número par se usan las dos posiciones centrales.')
  if (family===4) return q(skill,difficulty,seed,`Si solo aumenta mucho el máximo de ${odd.join(', ')}, ¿qué ocurre con la mediana?`,'Permanece igual',['Aumenta igual que el máximo','Se convierte en la media','Desaparece'],'Cambiar un extremo no altera la posición central.')
  if (family===5) return q(skill,difficulty,seed,`Los datos son ${a}, ${a+3}, x, ${a+10}, ${a+14} y la mediana es ${a+6}. ¿Cuánto vale x?`,String(a+6),[String(a+3),String(a+10),String(a+7)],'Con cinco datos ordenados, el tercer valor es la mediana.')
  if (family===6) return q(skill,difficulty,seed,'¿Por qué la mediana suele ser útil con ingresos muy desiguales?','Porque es resistente a valores extremos',['Porque siempre supera a la media','Porque usa el máximo','Porque no requiere ordenar'],'La posición central cambia poco ante extremos aislados.')
  if (family===7) return q(skill,difficulty,seed,'¿Puede cambiar la mediana al añadir un dato nuevo?','Sí, porque cambian el número de datos y las posiciones centrales',['No, nunca','Solo cambia la media','Solo si el dato es cero'],'Añadir un dato puede desplazar las posiciones centrales.')
  if (family===8) return q(skill,difficulty,seed,`Dos conjuntos tienen mediana ${a+5}. ¿Pueden tener distinta media?`,'Sí',['No','Solo si tienen el mismo máximo','Solo si ambos tienen cinco datos'],'La mediana no determina los valores alejados del centro.')
  if (family===9) return q(skill,difficulty,seed,`Ordena primero ${a+12}, ${a}, ${a+8}, ${a+2}, ${a+5}. ¿Cuál queda en el centro?`,String(a+5),[String(a+2),String(a+8),String(a+12)],'Tras ordenar, el tercer valor es el central.')
  if (family===10) return q(skill,difficulty,seed,'Una lista tiene 15 datos. ¿Cuántos quedan a cada lado de la mediana?','7',['6','8','14'],'La octava posición es central, con siete datos a cada lado.')
  if (family===11) return q(skill,difficulty,seed,`Si todos los valores de un conjunto aumentan en ${2+(seed%5)}, ¿qué ocurre con la mediana?`,'Aumenta en la misma cantidad',['No cambia','Se duplica siempre','Pasa a ser la media'],'Trasladar todos los datos desplaza también el valor central.')
  if (family===12) return q(skill,difficulty,seed,'Si todos los valores se multiplican por 2, ¿qué ocurre con la mediana?','Se multiplica por 2',['No cambia','Se suma 2','Se divide entre 2'],'Una transformación multiplicativa positiva conserva el orden y escala la posición central.')
  if (family===13) return q(skill,difficulty,seed,'¿Qué paso debe hacerse antes de localizar la mediana?','Ordenar los datos',['Sumarlos','Buscar la moda','Calcular el rango'],'La mediana depende de la posición, por eso hay que ordenar.')
  if (family===14) return q(skill,difficulty,seed,`Una lista ordenada tiene valores centrales ${a+4} y ${a+8}. ¿Cuál es su mediana?`,String(a+6),[String(a+4),String(a+8),String(a+12)],`La mediana es (${a+4}+${a+8})/2=${a+6}.`)
  return q(skill,difficulty,seed,'Para comparar el centro de dos grupos con valores extremos muy diferentes, ¿qué medida suele ser especialmente robusta?','La mediana',['El máximo','La suma','El rango'],'La mediana resume la posición central y resiste mejor los extremos.')
}

export function generateMathRepeatHotspotVariant(skill:SkillMeta,difficulty:number,seed:number):GeneratedQuestion|null {
  const normalized = seed >>> 0
  if (skill.id==='M01S03') return sumRest(skill,difficulty,normalized)
  if (skill.id==='M07S03') return simplify(skill,difficulty,normalized)
  if (skill.id==='M14S06') return median(skill,difficulty,normalized)
  return null
}
