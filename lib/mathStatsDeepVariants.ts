import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }

function rotate<T>(items: T[], shift: number) {
  const offset = ((shift % items.length) + items.length) % items.length
  return items.slice(offset).concat(items.slice(0, offset))
}

function question(
  skill: SkillMeta,
  difficulty: number,
  seed: number,
  prompt: string,
  answer: string,
  distractors: [string, string, string],
  solution: string,
): GeneratedQuestion {
  const options = rotate([answer, ...distractors], seed + difficulty)
  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt,
    options,
    answerIndex: options.indexOf(answer),
    solution,
    tags: [skill.generator_key, 'math', 'statistics_deep_variant'],
  }
}

const NAMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elena', 'Farid', 'Gema', 'Hugo', 'Inés', 'Jorge', 'Lucía', 'Mario']
const CONTEXTS = ['libros leídos', 'minutos de lectura', 'puntos en un torneo', 'vasos reciclados', 'kilómetros recorridos', 'ejercicios resueltos']
const COLORS = ['rojo', 'azul', 'verde', 'amarillo', 'violeta', 'naranja']
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

function pick<T>(items: T[], seed: number, offset = 0) {
  return items[(seed + offset) % items.length]
}

function meanVariant(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion {
  const family = seed % 8
  const a = 4 + (seed % 7)
  const b = a + 2 + ((seed >>> 3) % 4)
  const c = b + 2 + ((seed >>> 6) % 4)
  const d = c + 2 + ((seed >>> 9) % 4)
  const name = pick(NAMES, seed)
  const context = pick(CONTEXTS, seed, 2)

  if (family === 0) {
    const total = a + b + c
    const mean = total / 3
    return question(skill, difficulty, seed,
      `${name} registró ${a}, ${b} y ${c} ${context}. ¿Cuál es la media?`,
      String(Number(mean.toFixed(2))).replace('.', ','),
      [String(b), String(total), String(Math.round(mean + 2))],
      `La media es (${a} + ${b} + ${c}) / 3 = ${Number(mean.toFixed(2))}.`)
  }
  if (family === 1) {
    const mean = 8 + (seed % 8)
    const n = 4 + (seed % 3)
    const total = mean * n
    return question(skill, difficulty, seed,
      `La media de ${n} resultados es ${mean}. ¿Cuál es la suma total de los resultados?`,
      String(total),
      [String(mean + n), String(total - mean), String(mean)],
      `Suma = media × número de datos = ${mean} × ${n} = ${total}.`)
  }
  if (family === 2) {
    const target = 7 + (seed % 6)
    const x = target - 2
    const y = target
    const z = target + 1
    const missing = target * 4 - x - y - z
    return question(skill, difficulty, seed,
      `Cuatro valores tienen media ${target}. Tres de ellos son ${x}, ${y} y ${z}. ¿Cuál es el cuarto valor?`,
      String(missing),
      [String(target), String(missing + 2), String(missing - 2)],
      `La suma debe ser ${target} × 4 = ${target * 4}; el valor que falta es ${missing}.`)
  }
  if (family === 3) {
    const oldMean = 6 + (seed % 5)
    const n = 3 + (seed % 3)
    const extra = oldMean + 4
    const newMean = (oldMean * n + extra) / (n + 1)
    const answer = String(Number(newMean.toFixed(2))).replace('.', ',')
    return question(skill, difficulty, seed,
      `${n} notas tienen media ${oldMean}. Se añade una nota ${extra}. ¿Cuál es la nueva media?`,
      answer,
      [String(oldMean), String(extra), String(oldMean + 1)],
      `La suma inicial es ${oldMean * n}; al añadir ${extra}, la nueva media es ${(oldMean * n + extra)} / ${n + 1} = ${Number(newMean.toFixed(2))}.`)
  }
  if (family === 4) {
    return question(skill, difficulty, seed,
      `Un grupo obtiene casi todos sus valores entre ${a} y ${b}, pero aparece un valor extremo de ${d * 8}. ¿Qué medida de centro será más sensible a ese extremo?`,
      'La media',
      ['La mediana', 'La moda siempre', 'Ninguna medida cambia'],
      'La media utiliza todos los valores y los extremos pueden desplazarla de forma importante.')
  }
  if (family === 5) {
    return question(skill, difficulty, seed,
      `Dos clases tienen la misma media de ${10 + (seed % 5)} puntos. Una tiene resultados muy agrupados y la otra muy dispersos. ¿Qué conclusión es correcta?`,
      'Tener la misma media no implica tener la misma distribución',
      ['Las dos clases tienen exactamente los mismos resultados', 'Las dos clases tienen la misma mediana necesariamente', 'La clase más dispersa debe tener mayor media'],
      'La media resume el centro, pero no determina la dispersión ni la forma de los datos.')
  }
  if (family === 6) {
    const base = 10 + (seed % 6)
    const values = [base - 2, base - 1, base, base + 1]
    const extra = base + 10
    const before = values.reduce((sum, value) => sum + value, 0) / values.length
    const after = (values.reduce((sum, value) => sum + value, 0) + extra) / 5
    return question(skill, difficulty, seed,
      `Los datos son ${values.join(', ')}. Se añade ${extra}. ¿Qué ocurre con la media?`,
      'Aumenta',
      ['Disminuye', 'Permanece igual', 'Se convierte en la mediana'],
      `La media pasa de ${Number(before.toFixed(2))} a ${Number(after.toFixed(2))}; por tanto, aumenta.`)
  }
  const m1 = 8 + (seed % 5)
  const n1 = 3 + (seed % 4)
  const m2 = 12 + ((seed >>> 4) % 5)
  const n2 = 2 + ((seed >>> 7) % 4)
  const combined = (m1 * n1 + m2 * n2) / (n1 + n2)
  return question(skill, difficulty, seed,
    `Un grupo de ${n1} estudiantes tiene media ${m1} y otro de ${n2} tiene media ${m2}. ¿Cuál es la media conjunta?`,
    String(Number(combined.toFixed(2))).replace('.', ','),
    [String(Number(((m1 + m2) / 2).toFixed(2))).replace('.', ','), String(m1), String(m2)],
    `Hay que ponderar por el tamaño de cada grupo: (${m1}×${n1} + ${m2}×${n2}) / ${n1 + n2} = ${Number(combined.toFixed(2))}.`)
}

function medianVariant(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion {
  const family = seed % 7
  const base = 2 + (seed % 8)
  const name = pick(NAMES, seed, 3)

  if (family === 0) {
    const values = [base, base + 2, base + 5, base + 7, base + 11]
    return question(skill, difficulty, seed,
      `Ordenados los datos ${values.join(', ')}, ¿cuál es la mediana?`,
      String(values[2]),
      [String(values[1]), String(values[3]), String(Number((values.reduce((a,b)=>a+b,0)/5).toFixed(1)))],
      `Con cinco datos ordenados, la mediana es el tercero: ${values[2]}.`)
  }
  if (family === 1) {
    const values = [base, base + 3, base + 6, base + 10]
    const med = (values[1] + values[2]) / 2
    return question(skill, difficulty, seed,
      `${name} obtuvo ${values.join(', ')} puntos. ¿Cuál es la mediana?`,
      String(Number(med.toFixed(1))).replace('.', ','),
      [String(values[1]), String(values[2]), String(values.reduce((a,b)=>a+b,0))],
      `Con cuatro datos, se promedian los dos centrales: (${values[1]} + ${values[2]}) / 2 = ${med}.`)
  }
  if (family === 2) {
    const n = 7 + 2 * (seed % 4)
    const pos = (n + 1) / 2
    return question(skill, difficulty, seed,
      `En una lista ordenada de ${n} datos, ¿en qué posición está la mediana?`,
      `${pos}.ª`,
      [`${pos - 1}.ª`, `${pos + 1}.ª`, `${n}.ª`],
      `Para un número impar de datos, la posición central es (${n}+1)/2 = ${pos}.`)
  }
  if (family === 3) {
    return question(skill, difficulty, seed,
      `A un conjunto de salarios se añade un sueldo extremadamente alto. ¿Qué medida suele cambiar menos?`,
      'La mediana',
      ['La media', 'La suma', 'El máximo'],
      'La mediana depende de la posición central y es mucho menos sensible a valores extremos.')
  }
  if (family === 4) {
    const med = 6 + (seed % 8)
    return question(skill, difficulty, seed,
      `Los datos ordenados son ${med - 5}, ${med - 2}, x, ${med + 3}, ${med + 7} y la mediana es ${med}. ¿Cuánto vale x?`,
      String(med),
      [String(med - 2), String(med + 3), String(med + 1)],
      `Con cinco datos ordenados, el tercero es la mediana; por tanto x = ${med}.`)
  }
  if (family === 5) {
    return question(skill, difficulty, seed,
      `Dos conjuntos tienen la misma mediana de ${base + 6}. ¿Pueden tener medias diferentes?`,
      'Sí, si difieren los valores alejados del centro',
      ['No, la mediana fija también la media', 'Solo si tienen distinto número de datos', 'No, si están ordenados'],
      'La mediana fija la posición central, pero no determina los valores extremos ni la media.')
  }
  return question(skill, difficulty, seed,
    `Antes de calcular la mediana de ${base + 6}, ${base}, ${base + 3}, ${base + 1}, ${base + 9}, ¿qué paso es imprescindible?`,
    'Ordenar los datos',
    ['Sumarlos', 'Calcular primero la moda', 'Convertirlos en porcentajes'],
    'La mediana depende de la posición central, por lo que primero hay que ordenar los datos.')
}

function modeVariant(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion {
  const family = seed % 10
  const base = 2 + (seed % 9)
  const color = pick(COLORS, seed)
  const otherColor = pick(COLORS, seed, 2)
  const size = pick(SIZES, seed)
  const otherSize = pick(SIZES, seed, 3)

  if (family === 0) {
    const values = [base, base + 1, base + 1, base + 3, base + 5]
    return question(skill, difficulty, seed,
      `¿Cuál es la moda de ${values.join(', ')}?`,
      String(base + 1),
      [String(base), String(base + 3), String(base + 5)],
      `${base + 1} aparece dos veces y los demás valores una sola vez.`)
  }
  if (family === 1) {
    return question(skill, difficulty, seed,
      `En la lista ${color}, ${otherColor}, ${color}, verde, ${color}, ¿cuál es la moda?`,
      color,
      [otherColor, 'verde', 'No hay moda'],
      `${color} es la categoría que aparece más veces.`)
  }
  if (family === 2) {
    const a = base
    const b = base + 2
    return question(skill, difficulty, seed,
      `En ${a}, ${a}, ${b}, ${b}, ${base + 5}, ¿cómo se describe la moda?`,
      `Hay dos modas: ${a} y ${b}`,
      [`La moda es ${base + 5}`, `La moda es ${(a + b) / 2}`, 'No hay ninguna moda'],
      `${a} y ${b} comparten la frecuencia máxima; la distribución es bimodal.`)
  }
  if (family === 3) {
    const values = [base, base + 1, base + 2, base + 3]
    return question(skill, difficulty, seed,
      `En ${values.join(', ')}, todos los valores aparecen una vez. ¿Qué afirmación es correcta?`,
      'No hay una moda única',
      [`La moda es ${base}`, `La moda es ${base + 3}`, `La moda es ${(base * 2 + 3) / 2}`],
      'Ningún valor tiene una frecuencia superior a los demás.')
  }
  if (family === 4) {
    return question(skill, difficulty, seed,
      `Una tienda registra tallas vendidas: ${size}, ${size}, ${otherSize}, ${size}, ${otherSize}. ¿Qué medida indica la talla más demandada?`,
      'La moda',
      ['La media', 'La mediana numérica', 'El rango'],
      'La moda identifica la categoría que aparece con mayor frecuencia.')
  }
  if (family === 5) {
    return question(skill, difficulty, seed,
      `¿Por qué puede calcularse la moda de colores como ${color} o ${otherColor} aunque no sean números?`,
      'Porque basta comparar las frecuencias de las categorías',
      ['Porque los colores pueden sumarse', 'Porque la moda exige ordenar de menor a mayor', 'Porque cada color tiene una media propia'],
      'La moda depende de frecuencias, no de operaciones aritméticas.')
  }
  if (family === 6) {
    const a = base
    const b = base + 2
    const c = base + 4
    return question(skill, difficulty, seed,
      `Los valores ${a}, ${b} y ${c} aparecen exactamente tres veces cada uno y el resto menos. ¿Cuántas modas hay?`,
      'Tres',
      ['Una', 'Dos', 'Ninguna'],
      'Los tres valores comparten la frecuencia máxima, así que la distribución tiene tres modas.')
  }
  if (family === 7) {
    return question(skill, difficulty, seed,
      `Un conjunto tiene moda ${base}, pero casi todos los demás datos están muy alejados de ${base}. ¿Qué limitación muestra esto?`,
      'La moda por sí sola no describe toda la distribución',
      ['La moda siempre coincide con la media', 'La moda deja de existir si hay valores alejados', 'La moda solo puede usarse con dos datos'],
      'Conocer el valor más frecuente no informa de cómo se reparten todos los demás datos.')
  }
  if (family === 8) {
    const oldMode = base
    const challenger = base + 4
    return question(skill, difficulty, seed,
      `En ${oldMode}, ${oldMode}, ${oldMode}, ${challenger}, ${challenger}, se añade otro ${challenger}. ¿Qué ocurre con la moda?`,
      `Pasa a haber dos modas: ${oldMode} y ${challenger}`,
      [`La moda sigue siendo solo ${oldMode}`, `La moda pasa a ser solo ${challenger}`, 'Desaparece la moda'],
      `Tras añadir el dato, ${oldMode} y ${challenger} aparecen tres veces cada uno.`)
  }
  return question(skill, difficulty, seed,
    `Una encuesta de preferencias da: ${color} 12 votos, ${otherColor} 9 votos y verde 7 votos. ¿Cuál es la moda?`,
    color,
    [otherColor, 'verde', 'No puede saberse sin calcular la media'],
    `${color} tiene la mayor frecuencia: 12 votos.`)
}

function samplingVariant(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion {
  const family = seed % 6
  const schoolSize = 400 + 50 * (seed % 8)
  const sample = 40 + 10 * (seed % 5)
  const name = pick(NAMES, seed, 1)

  if (family === 0) return question(skill, difficulty, seed,
    `En un instituto de ${schoolSize} estudiantes se eligen ${sample} al azar para una encuesta. ¿Cuál es la población?`,
    `Los ${schoolSize} estudiantes`,
    [`Los ${sample} seleccionados`, 'Solo quienes respondan', 'El profesorado'],
    'La población es el conjunto completo sobre el que se quiere obtener información.')
  if (family === 1) return question(skill, difficulty, seed,
    `De ${schoolSize} estudiantes se estudian ${sample} elegidos al azar. ¿Qué representan esos ${sample}?`,
    'Una muestra',
    ['La población completa', 'Una variable', 'Una frecuencia'],
    'La muestra es el subconjunto de la población que se observa directamente.')
  if (family === 2) return question(skill, difficulty, seed,
    `${name} quiere estudiar hábitos deportivos del centro y pregunta solo al equipo de fútbol. ¿Qué problema principal tiene la muestra?`,
    'Está sesgada',
    ['Es demasiado aleatoria', 'Se ha convertido en población', 'No contiene ninguna variable'],
    'Elegir solo al equipo de fútbol favorece sistemáticamente un perfil concreto.')
  if (family === 3) return question(skill, difficulty, seed,
    `Para representar un centro con varios cursos, ¿qué muestra suele ser mejor?`,
    'Una selección aleatoria de estudiantes de distintos cursos',
    ['Los primeros de una sola clase', 'Solo voluntarios de una actividad', 'Solo alumnado con notas altas'],
    'Una selección que cubre distintos grupos reduce el sesgo de representación.')
  if (family === 4) return question(skill, difficulty, seed,
    `Si una muestra de ${sample} personas está sesgada por el método de selección, ¿duplicar su tamaño elimina necesariamente el sesgo?`,
    'No, porque el método de selección sigue siendo sesgado',
    ['Sí, cualquier muestra grande deja de tener sesgo', 'Sí, si supera 50 personas', 'No, porque el tamaño nunca importa'],
    'Aumentar el tamaño mejora precisión, pero no corrige una selección sistemáticamente sesgada.')
  return question(skill, difficulty, seed,
    `Dos muestras de ${sample} personas: una se elige al azar y otra con voluntarios. ¿Cuál suele reducir mejor el sesgo de selección?`,
    'La muestra aleatoria',
    ['La de voluntarios', 'Las dos garantizan el mismo resultado', 'Ninguna puede representar una población'],
    'La selección aleatoria reduce la influencia de quién decide participar.')
}

function variableVariant(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion {
  const family = seed % 7
  const contexts = ['número de hermanos', 'número de libros', 'goles marcados', 'mascotas en casa']
  const continuous = ['estatura', 'masa corporal', 'temperatura', 'tiempo de espera']
  const qualitative = ['color de ojos', 'medio de transporte', 'tipo de música preferida', 'provincia de nacimiento']

  if (family === 0) return question(skill, difficulty, seed,
    `La variable “${pick(qualitative, seed)}” es…`,
    'Cualitativa',
    ['Cuantitativa discreta', 'Cuantitativa continua', 'Una frecuencia acumulada'],
    'Describe categorías, no cantidades numéricas medibles.')
  if (family === 1) return question(skill, difficulty, seed,
    `La variable “${pick(contexts, seed)}” es…`,
    'Cuantitativa discreta',
    ['Cualitativa', 'Cuantitativa continua', 'Ordinal no numérica'],
    'Es una cantidad que se cuenta mediante valores separados, normalmente enteros.')
  if (family === 2) return question(skill, difficulty, seed,
    `La variable “${pick(continuous, seed)}”, medida con decimales, es…`,
    'Cuantitativa continua',
    ['Cualitativa', 'Cuantitativa discreta', 'Nominal'],
    'Puede tomar muchos valores dentro de un intervalo continuo.')
  if (family === 3) return question(skill, difficulty, seed,
    `La satisfacción se registra como baja, media o alta. ¿Qué tipo de variable es?`,
    'Cualitativa ordinal',
    ['Cuantitativa continua', 'Cuantitativa discreta', 'Cualitativa sin orden'],
    'Las categorías no son cantidades, pero sí tienen un orden natural.')
  if (family === 4) return question(skill, difficulty, seed,
    `Un código de alumno como “${1000 + (seed % 8000)}” usa números. ¿Por qué no es una variable cuantitativa?`,
    'Porque los números actúan como etiquetas',
    ['Porque tiene demasiadas cifras', 'Porque toda variable numérica es continua', 'Porque solo existe un código'],
    'No tiene sentido sumar o promediar códigos como si fueran cantidades.')
  if (family === 5) return question(skill, difficulty, seed,
    `El tiempo se anota redondeado a minutos enteros. Conceptualmente, ¿qué tipo de variable es el tiempo?`,
    'Cuantitativa continua',
    ['Cualitativa', 'Discreta por naturaleza', 'Una frecuencia'],
    'El redondeo afecta al registro; el tiempo en sí puede variar continuamente.')
  return question(skill, difficulty, seed,
    `Los cursos 1.º, 2.º, 3.º y 4.º se escriben con números. ¿Por qué pueden tratarse como categorías ordinales?`,
    'Porque expresan categorías con orden, no una medida aritmética',
    ['Porque no existe orden entre cursos', 'Porque todo ordinal es continuo', 'Porque los cursos son frecuencias'],
    'Hay orden entre categorías, pero las diferencias numéricas no se interpretan como una medida física.')
}

export function generateMathStatsDeepVariant(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  const normalized = seed >>> 0
  if (skill.id === 'M14S01') return samplingVariant(skill, difficulty, normalized)
  if (skill.id === 'M14S02') return variableVariant(skill, difficulty, normalized)
  if (skill.id === 'M14S05') return meanVariant(skill, difficulty, normalized)
  if (skill.id === 'M14S06') return medianVariant(skill, difficulty, normalized)
  if (skill.id === 'M14S07') return modeVariant(skill, difficulty, normalized)
  return null
}
