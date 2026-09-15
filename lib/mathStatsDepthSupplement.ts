import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }

type Built = {
  prompt: string
  answer: string
  distractors: [string, string, string]
  solution: string
}

function rotate<T>(items: T[], shift: number) {
  const offset = ((shift % items.length) + items.length) % items.length
  return items.slice(offset).concat(items.slice(0, offset))
}

function finish(skill: SkillMeta, difficulty: number, seed: number, built: Built): GeneratedQuestion {
  const options = rotate([built.answer, ...built.distractors], seed + difficulty)
  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt: built.prompt,
    options,
    answerIndex: options.indexOf(built.answer),
    solution: built.solution,
    tags: [skill.generator_key, 'math', 'statistics_depth_supplement'],
  }
}

const PLACES = ['instituto', 'club deportivo', 'biblioteca', 'academia', 'centro juvenil', 'escuela de música', 'polideportivo', 'campamento']
const TOPICS = ['hábitos de lectura', 'uso del transporte', 'actividad física', 'tiempo de estudio', 'consumo de agua', 'preferencias culturales', 'uso de pantallas', 'hábitos de sueño']
const CONTINUOUS = ['estatura', 'temperatura corporal', 'tiempo de carrera', 'masa de una mochila', 'longitud de una hoja', 'volumen de agua', 'distancia recorrida', 'duración de una llamada']
const DISCRETE = ['número de hermanos', 'libros prestados', 'goles marcados', 'mascotas', 'mensajes recibidos', 'faltas cometidas', 'visitas al museo', 'piezas recicladas']
const QUALITATIVE = ['color favorito', 'medio de transporte', 'género musical preferido', 'tipo de desayuno', 'deporte favorito', 'idioma hablado en casa', 'mascota preferida', 'ruta habitual']

function pick<T>(items: T[], seed: number, offset = 0) {
  return items[(seed + offset) % items.length]
}

function sampling(seed: number): Built {
  const family = seed % 16
  const population = 300 + 50 * ((seed >>> 4) % 12)
  const sample = 30 + 10 * ((seed >>> 8) % 8)
  const place = pick(PLACES, seed)
  const topic = pick(TOPICS, seed, 3)

  if (family === 0) return { prompt:`En un ${place} hay ${population} personas y se estudia ${topic}. ¿Cuál es la población?`, answer:`Las ${population} personas del ${place}`, distractors:[`Las ${sample} encuestadas`,'Solo quienes responden primero','El equipo investigador'], solution:'La población es el conjunto completo sobre el que se quiere obtener información.' }
  if (family === 1) return { prompt:`Se eligen ${sample} personas al azar de un ${place} con ${population}. ¿Qué son esas ${sample} personas?`, answer:'Una muestra', distractors:['La población completa','Una variable','Una frecuencia'], solution:'La muestra es el subconjunto de la población que se observa directamente.' }
  if (family === 2) return { prompt:`Para estudiar ${topic}, se pregunta solo a quienes llegan antes de las ocho. ¿Qué riesgo aparece?`, answer:'Sesgo de selección', distractors:['Mayor aleatoriedad','Desaparición de la población','Error de cálculo de la media'], solution:'Seleccionar por una característica relacionada con disponibilidad puede excluir sistemáticamente a parte de la población.' }
  if (family === 3) return { prompt:`Un ${place} quiere una muestra representativa sobre ${topic}. ¿Qué opción es mejor?`, answer:'Elegir al azar personas de distintos grupos del centro', distractors:['Preguntar solo a un grupo de amigos','Usar solo voluntarios de una actividad','Escoger únicamente a quienes obtienen notas altas'], solution:'Una selección diversa y aleatoria reduce sesgos de representación.' }
  if (family === 4) return { prompt:`Una muestra de ${sample} personas está sesgada por cómo se eligió. Si pasa a ${sample * 2}, ¿se elimina necesariamente el sesgo?`, answer:'No, el método de selección sigue siendo sesgado', distractors:['Sí, cualquier muestra grande elimina el sesgo','Sí, si supera a 50 personas','No, porque el tamaño nunca influye'], solution:'Aumentar el tamaño mejora precisión, pero no corrige un procedimiento de selección sesgado.' }
  if (family === 5) return { prompt:`Dos estudios sobre ${topic} usan ${sample} participantes. Uno los elige al azar y otro acepta voluntarios. ¿Cuál suele reducir mejor el sesgo?`, answer:'El que selecciona al azar', distractors:['El de voluntarios','Ambos garantizan el mismo resultado','Ninguno puede estudiar una población'], solution:'La selección aleatoria reduce la influencia de quién decide participar.' }
  if (family === 6) return { prompt:`En un estudio del ${place}, ¿qué es un individuo estadístico?`, answer:'Cada persona o elemento de la población estudiada', distractors:['El conjunto completo de datos','La media de la muestra','La variable que se mide'], solution:'Un individuo es cada unidad concreta que forma parte de la población.' }
  if (family === 7) return { prompt:`Se quiere estimar ${topic} de todo un ${place}. Se observan ${sample} casos. ¿Por qué se usa una muestra?`, answer:'Porque permite estudiar una parte para inferir sobre el conjunto', distractors:['Porque una población nunca puede definirse','Porque la muestra elimina todo error','Porque una muestra siempre da el valor exacto'], solution:'Una muestra hace viable el estudio cuando observar toda la población es costoso o innecesario.' }
  if (family === 8) return { prompt:`Un estudio de ${topic} incluye solo a personas de un mismo curso. ¿Qué mejora el diseño?`, answer:'Incluir cursos distintos con un procedimiento de selección planificado', distractors:['Duplicar solo ese mismo curso','Eliminar respuestas minoritarias','Elegir a quienes contestan más rápido'], solution:'Cubrir los distintos grupos relevantes mejora la representatividad.' }
  if (family === 9) return { prompt:`En una encuesta del ${place}, ${sample} personas responden de un total de ${population}. ¿Qué número describe el tamaño de la muestra?`, answer:String(sample), distractors:[String(population),String(population-sample),String(Math.round(sample/population*100))], solution:`El tamaño de la muestra es el número de individuos observados: ${sample}.` }
  if (family === 10) return { prompt:`¿Qué diferencia esencial hay entre población y muestra al estudiar ${topic}?`, answer:'La población es el conjunto objetivo y la muestra es la parte observada', distractors:['La muestra siempre es mayor que la población','La población contiene solo quienes responden','Son dos nombres para el mismo conjunto'], solution:'La población es el universo de interés; la muestra es un subconjunto usado para estudiarlo.' }
  if (family === 11) return { prompt:`Se selecciona cada décima persona de una lista ordenada del ${place}, empezando desde una posición elegida al azar. ¿Qué tipo de idea representa?`, answer:'Un procedimiento sistemático de muestreo', distractors:['Un censo completo','Una selección por conveniencia','Una variable cualitativa'], solution:'Elegir a intervalos regulares desde un inicio aleatorio es una forma de muestreo sistemático.' }
  if (family === 12) return { prompt:`Para estudiar ${topic}, ¿cuál de estas situaciones describe un censo?`, answer:`Observar a las ${population} personas del ${place}`, distractors:[`Observar a ${sample} personas elegidas al azar`,'Preguntar solo a voluntarios','Usar únicamente datos de un curso'], solution:'Un censo observa a todos los individuos de la población.' }
  if (family === 13) return { prompt:`Una encuesta sobre ${topic} se hace solo por una app que no usa todo el mundo. ¿Qué problema puede introducir?`, answer:'Sesgo de cobertura', distractors:['Aumenta automáticamente la precisión','Convierte la muestra en censo','Elimina la necesidad de seleccionar participantes'], solution:'Parte de la población puede quedar fuera del marco de selección por no usar la app.' }
  if (family === 14) return { prompt:`¿Qué ventaja tiene estratificar una muestra por cursos antes de seleccionar participantes?`, answer:'Asegurar representación de grupos relevantes', distractors:['Garantizar que todas las respuestas sean iguales','Eliminar toda variabilidad aleatoria','Evitar tener que calcular el tamaño de la muestra'], solution:'La estratificación ayuda a incluir adecuadamente subgrupos importantes de la población.' }
  return { prompt:`En el ${place}, quienes no respondieron a una encuesta sobre ${topic} son muchos. ¿Qué conviene revisar?`, answer:'Si la no respuesta puede estar sesgando los resultados', distractors:['Si la media puede calcularse sin datos','Si la población debe reducirse a quienes contestaron','Si conviene borrar respuestas completas'], solution:'La no respuesta puede ser problemática si quienes no contestan difieren sistemáticamente de quienes sí lo hacen.' }
}

function variables(seed: number): Built {
  const family = seed % 16
  const q = pick(QUALITATIVE, seed)
  const d = pick(DISCRETE, seed, 2)
  const c = pick(CONTINUOUS, seed, 4)

  if (family === 0) return { prompt:`La variable “${q}” es…`, answer:'Cualitativa nominal', distractors:['Cuantitativa discreta','Cuantitativa continua','Frecuencia acumulada'], solution:'Describe categorías sin una magnitud numérica.' }
  if (family === 1) return { prompt:`La variable “${d}” es…`, answer:'Cuantitativa discreta', distractors:['Cualitativa nominal','Cuantitativa continua','Ordinal'], solution:'Es una cantidad obtenida por conteo y toma valores separados.' }
  if (family === 2) return { prompt:`La variable “${c}”, medida con decimales, es…`, answer:'Cuantitativa continua', distractors:['Cualitativa','Cuantitativa discreta','Nominal'], solution:'Puede tomar muchos valores dentro de un intervalo.' }
  if (family === 3) return { prompt:'La satisfacción se registra como baja, media o alta. ¿Cómo se clasifica?', answer:'Cualitativa ordinal', distractors:['Cuantitativa continua','Cuantitativa discreta','Cualitativa nominal sin orden'], solution:'Son categorías con un orden natural.' }
  if (family === 4) return { prompt:`Un dorsal deportivo “${10 + seed % 90}” usa números. ¿Por qué no representa una variable cuantitativa?`, answer:'Porque funciona como una etiqueta', distractors:['Porque tiene dos cifras','Porque todo número es continuo','Porque no puede repetirse'], solution:'El número identifica; no expresa una cantidad sobre la que tenga sentido operar aritméticamente.' }
  if (family === 5) return { prompt:`Si ${c} se redondea al entero más cercano, ¿cambia su naturaleza estadística?`, answer:'No, sigue siendo continua aunque el registro esté redondeado', distractors:['Sí, pasa a ser cualitativa','Sí, se vuelve discreta por naturaleza','Sí, deja de ser una variable'], solution:'El redondeo modifica el registro, no la naturaleza de la magnitud.' }
  if (family === 6) return { prompt:'Los niveles principiante, intermedio y avanzado forman una variable…', answer:'Cualitativa ordinal', distractors:['Cualitativa nominal','Cuantitativa continua','Cuantitativa discreta'], solution:'Son categorías con un orden definido.' }
  if (family === 7) return { prompt:`¿Cuál de estas variables se obtiene normalmente contando?`, answer:d, distractors:[c,q,'Temperatura con decimales'], solution:'Las variables discretas suelen proceder de conteos.' }
  if (family === 8) return { prompt:`¿Cuál de estas variables se obtiene normalmente midiendo sobre un continuo?`, answer:c, distractors:[d,q,'Número de aula'], solution:'Las variables continuas suelen proceder de mediciones.' }
  if (family === 9) return { prompt:`¿Cuál de estas variables describe una categoría y no una cantidad?`, answer:q, distractors:[d,c,'Número de páginas leídas'], solution:'Una variable cualitativa describe categorías.' }
  if (family === 10) return { prompt:'La posición en una carrera: 1.º, 2.º, 3.º… ¿cómo puede interpretarse?', answer:'Como ordinal: informa del orden, no de distancias iguales', distractors:['Como continua porque usa números','Como nominal sin orden','Como frecuencia relativa'], solution:'Los rangos indican orden, pero las diferencias entre posiciones no son una medida cuantitativa uniforme.' }
  if (family === 11) return { prompt:`Una variable toma valores 0, 1, 2, 3… para ${d}. ¿Qué propiedad sugiere?`, answer:'Es discreta porque los valores son contables', distractors:['Es continua porque usa números','Es cualitativa porque empieza en cero','Es ordinal exclusivamente'], solution:'Los conteos toman valores separados y constituyen variables discretas.' }
  if (family === 12) return { prompt:`Una báscula puede registrar ${c} con precisión creciente. ¿Qué idea apoya esto?`, answer:'Que la variable puede considerarse continua', distractors:['Que solo puede tomar enteros','Que es una categoría nominal','Que es una frecuencia'], solution:'Una medición puede tomar valores arbitrariamente finos dentro de un intervalo.' }
  if (family === 13) return { prompt:'El código postal parece numérico. ¿Qué criterio decide su tipo de variable?', answer:'Si los números representan cantidades o solo identificadores', distractors:['El número de dígitos','Si empieza por cero','Si se escribe con teclado numérico'], solution:'La interpretación de los valores, no su apariencia, determina el tipo de variable.' }
  if (family === 14) return { prompt:`Para resumir ${q}, ¿tiene sentido calcular una media aritmética?`, answer:'No, porque sus categorías no representan cantidades', distractors:['Sí, siempre que haya muchas respuestas','Sí, si se asignan números arbitrarios','No, porque una media solo usa dos datos'], solution:'La media requiere valores cuantitativos con significado aritmético.' }
  return { prompt:`Para ${d}, ¿tiene sentido hablar de valores intermedios como 2,37 individuos?`, answer:'No, el conteo produce valores discretos', distractors:['Sí, siempre es una variable continua','Sí, porque cualquier decimal es posible','No, porque es una variable cualitativa'], solution:'Un conteo de unidades indivisibles toma valores separados.' }
}

function mean(seed: number): Built {
  const family = seed % 16
  const a = 4 + ((seed >>> 4) % 8)
  const b = a + 2
  const c = a + 4
  const d = a + 6
  const total3 = a + b + c
  const avg3 = total3 / 3

  if (family === 0) return { prompt:`Calcula la media de ${a}, ${b} y ${c}.`, answer:String(avg3).replace('.',','), distractors:[String(b),String(total3),String(c)], solution:`(${a}+${b}+${c})/3 = ${avg3}.` }
  if (family === 1) return { prompt:`Tres medidas suman ${total3}. ¿Cuál es su media?`, answer:String(avg3).replace('.',','), distractors:[String(total3),String(total3-3),String(avg3+1)], solution:`La media es ${total3}/3 = ${avg3}.` }
  if (family === 2) { const m=7+(seed%6), n=4+(seed%3); return { prompt:`La media de ${n} valores es ${m}. ¿Cuál debe ser su suma?`, answer:String(m*n), distractors:[String(m+n),String(m),String(m*n-m)], solution:`Suma = media × cantidad = ${m} × ${n} = ${m*n}.` } }
  if (family === 3) { const m=8+(seed%5); const x=m-2,y=m,z=m+1,miss=m*4-x-y-z; return { prompt:`Cuatro datos tienen media ${m}; tres son ${x}, ${y} y ${z}. Halla el cuarto.`, answer:String(miss), distractors:[String(m),String(miss+2),String(miss-2)], solution:`La suma total es ${m*4}; el dato que falta es ${miss}.` } }
  if (family === 4) { const m=6+(seed%5),n=3+(seed%4),extra=m+5,newM=(m*n+extra)/(n+1); return { prompt:`${n} notas tienen media ${m}. Se añade una nota ${extra}. ¿Nueva media?`, answer:String(Number(newM.toFixed(2))).replace('.',','), distractors:[String(m),String(extra),String(m+1)], solution:`La suma inicial es ${m*n}; la nueva media es ${(m*n+extra)}/${n+1} = ${Number(newM.toFixed(2))}.` } }
  if (family === 5) return { prompt:`Los datos ${a}, ${b}, ${c}, ${d} reciben además un valor extremo de ${d*10}. ¿Qué medida de centro se ve especialmente afectada?`, answer:'La media', distractors:['La mediana','La moda necesariamente','Ninguna'], solution:'La media utiliza todos los valores y es sensible a extremos.' }
  if (family === 6) return { prompt:`Dos grupos tienen media ${10 + seed%5}. ¿Podemos concluir que distribuyen sus datos igual?`, answer:'No, pueden diferir en dispersión y forma', distractors:['Sí, necesariamente son iguales','Sí, si tienen el mismo tamaño','No, porque una media no puede compararse'], solution:'La misma media no determina cómo se distribuyen los datos.' }
  if (family === 7) { const extra=c+12; const before=(a+b+c)/3, after=(a+b+c+extra)/4; return { prompt:`A ${a}, ${b}, ${c} se añade ${extra}. ¿Qué sucede con la media?`, answer:'Aumenta', distractors:['Disminuye','No cambia','Se convierte en mediana'], solution:`Pasa de ${before} a ${after}; por tanto aumenta.` } }
  if (family === 8) { const m1=7+seed%5,n1=3+seed%4,m2=12+(seed>>>5)%5,n2=2+(seed>>>8)%4,comb=(m1*n1+m2*n2)/(n1+n2); return { prompt:`Un grupo de ${n1} personas tiene media ${m1} y otro de ${n2} media ${m2}. Calcula la media conjunta.`, answer:String(Number(comb.toFixed(2))).replace('.',','), distractors:[String(Number(((m1+m2)/2).toFixed(2))).replace('.',','),String(m1),String(m2)], solution:`Se pondera por tamaños: (${m1}×${n1}+${m2}×${n2})/${n1+n2} = ${Number(comb.toFixed(2))}.` } }
  if (family === 9) return { prompt:`La media de ${a}, ${b}, x es ${b}. ¿Cuánto vale x?`, answer:String(c), distractors:[String(a),String(b),String(d)], solution:`La suma debe ser ${b*3}; x = ${b*3-a-b} = ${c}.` }
  if (family === 10) { const k=3+(seed%5); return { prompt:`Todos los valores de un conjunto aumentan ${k}. ¿Qué ocurre con su media?`, answer:`Aumenta ${k}`, distractors:['No cambia',`Aumenta ${k*2}`,'Se divide entre dos'], solution:'Sumar la misma cantidad a todos los datos suma esa cantidad a la media.' } }
  if (family === 11) { const k=2+(seed%4); return { prompt:`Todos los datos se multiplican por ${k}. ¿Qué ocurre con la media?`, answer:`También se multiplica por ${k}`, distractors:['Permanece igual',`Se suma ${k}`,'Se divide por el número de datos'], solution:'La media cambia por el mismo factor cuando todos los datos se multiplican por una constante.' } }
  if (family === 12) return { prompt:`La media de ${a}, ${b}, ${c} es ${avg3}. Si sustituimos ${c} por ${c+3}, ¿cómo cambia la media?`, answer:'Aumenta en 1', distractors:['Aumenta en 3','No cambia','Disminuye en 1'], solution:'La suma aumenta 3 y hay tres datos, así que la media aumenta 1.' }
  if (family === 13) return { prompt:'¿Por qué una media puede no coincidir con ninguno de los datos observados?', answer:'Porque es un cociente entre la suma y el número de datos', distractors:['Porque siempre debe redondearse','Porque solo usa el valor central','Porque descarta los extremos'], solution:'La media es un valor calculado y no tiene por qué aparecer en el conjunto.' }
  if (family === 14) return { prompt:`Un conjunto tiene media ${b}. Si añadimos un dato exactamente igual a ${b}, ¿qué ocurre con la media?`, answer:'Permanece igual', distractors:['Aumenta','Disminuye','Se vuelve igual a la mediana'], solution:'Añadir un valor igual a la media existente mantiene la media.' }
  return { prompt:`¿Qué error hay en calcular la media de porcentajes de grupos de tamaños muy distintos sin ponderarlos?`, answer:'Cada grupo recibe el mismo peso aunque no tenga el mismo tamaño', distractors:['Los porcentajes nunca pueden promediarse','La media siempre debe ser un número entero','Ponderar solo sirve con variables cualitativas'], solution:'Cuando los grupos tienen tamaños diferentes, una media simple de porcentajes puede dar un peso indebido a los grupos pequeños.' }
}

export function generateMathStatsDepthSupplement(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  const normalized = seed >>> 0
  if (skill.id === 'M14S01') return finish(skill, difficulty, normalized, sampling(normalized))
  if (skill.id === 'M14S02') return finish(skill, difficulty, normalized, variables(normalized))
  if (skill.id === 'M14S05') return finish(skill, difficulty, normalized, mean(normalized))
  return null
}
