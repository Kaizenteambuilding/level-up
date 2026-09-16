import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }

function rotate<T>(items: T[], shift: number) {
  const offset = ((shift % items.length) + items.length) % items.length
  return items.slice(offset).concat(items.slice(0, offset))
}

function q(
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
    tags: [skill.generator_key, 'math', 'sampling_laplace_recurrence_depth'],
  }
}

function sampling(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion {
  const family = (seed >>> 1) % 22
  const population = 300 + 50 * (seed % 9)
  const sample = 30 + 10 * ((seed >>> 4) % 6)
  const contextIndex = (seed >>> 6) % 6
  const contexts = [
    ['un instituto', 'estudiantes'],
    ['un municipio', 'hogares'],
    ['una biblioteca', 'personas usuarias'],
    ['un club deportivo', 'socios'],
    ['una academia', 'alumnos'],
    ['una asociación vecinal', 'miembros'],
  ] as const
  const [place, people] = contexts[contextIndex]

  if (family === 0) return q(skill, difficulty, seed,
    `${place} tiene ${population} ${people} y se encuesta a ${sample}. ¿Cuál es la población del estudio?`,
    `Los ${population} ${people}`, [`Los ${sample} encuestados`, 'Solo quienes respondieron primero', 'El equipo que organiza el estudio'],
    'La población es el conjunto completo sobre el que se quieren sacar conclusiones.')
  if (family === 1) return q(skill, difficulty, seed,
    `De una población de ${population} ${people} se eligen ${sample} mediante sorteo. ¿Qué son esas ${sample} personas?`,
    'La muestra', ['La población', 'La variable', 'La frecuencia relativa'],
    'La muestra es el subconjunto observado de la población.')
  if (family === 2) {
    const biasedFrames = [
      'Para estudiar hábitos de sueño de todo un instituto, se pregunta solo al alumnado que llega antes de las 8:00.',
      'Para estudiar hábitos de compra de un barrio, se pregunta solo a clientes de una tienda ecológica.',
      'Para estudiar el uso del transporte en una ciudad, se encuesta solo a personas que esperan el autobús.',
      'Para estudiar la actividad física de una población, se pregunta solo a personas que salen de un gimnasio.',
      'Para estudiar lectura entre adolescentes, se pregunta solo a quienes entran en una biblioteca.',
      'Para estudiar videojuegos entre estudiantes, se encuesta solo a miembros de un club de e-sports.',
    ]
    return q(skill, difficulty, seed,
      `${biasedFrames[contextIndex]} ¿Qué problema principal aparece?`,
      'Sesgo de selección', ['Error de cálculo', 'Ausencia de variable', 'Exceso de población'],
      'El método favorece a un perfil concreto y puede no representar al conjunto de interés.')
  }
  if (family === 3) {
    const channels = ['una web', 'una app', 'un canal de mensajería', 'una red social', 'un foro', 'un correo voluntario']
    return q(skill, difficulty, seed,
      `Una encuesta voluntaria difundida por ${channels[contextIndex]} recibe muchas respuestas. ¿Por qué puede seguir sin ser representativa?`,
      'Porque quienes deciden responder pueden diferir sistemáticamente del resto',
      ['Porque una muestra grande siempre es representativa', 'Porque las encuestas voluntarias no contienen variables', 'Porque los voluntarios pasan a ser la población'],
      'La autoselección puede introducir sesgo aunque el número de respuestas sea grande.')
  }
  if (family === 4) {
    const strata = ['cursos', 'barrios', 'grupos de edad', 'turnos', 'sedes', 'categorías de socios']
    return q(skill, difficulty, seed,
      `La población está dividida en varios ${strata[contextIndex]} de tamaños distintos. ¿Qué diseño ayuda a que todos estén representados?`,
      'Seleccionar personas de cada grupo de forma proporcional o planificada',
      ['Elegir solo del grupo más grande', 'Elegir solo a quienes respondan antes', 'Tomar únicamente el primer grupo disponible'],
      'Un muestreo estratificado o proporcional evita dejar grupos relevantes fuera.')
  }
  if (family === 5) {
    const step = 5 + contextIndex * 3
    return q(skill, difficulty, seed,
      `Se selecciona cada ${step}.º nombre de una lista después de elegir al azar el punto de inicio. ¿Qué método se está usando?`,
      'Muestreo sistemático', ['Censo', 'Muestreo por conveniencia', 'Autoselección'],
      'Elegir elementos a intervalos regulares tras un inicio aleatorio es muestreo sistemático.')
  }
  if (family === 6) return q(skill, difficulty, seed,
    `Se quiere conocer la opinión exacta de las ${population} personas de ${place} y se pregunta a todas. ¿Qué se está realizando?`,
    'Un censo', ['Una muestra aleatoria', 'Una frecuencia relativa', 'Un muestreo estratificado'],
    'Un censo estudia a todos los individuos de la población.')
  if (family === 7) return q(skill, difficulty, seed,
    `Dos muestras aleatorias de ${sample} personas tomadas de la misma población dan resultados ligeramente distintos. ¿Es necesariamente un error?`,
    'No; puede deberse a variabilidad muestral aleatoria',
    ['Sí; dos muestras correctas deben coincidir exactamente', 'Sí; una de ellas deja de ser muestra', 'No; porque el tamaño nunca influye'],
    'Muestras distintas pueden producir estimaciones distintas por azar.')
  if (family === 8) return q(skill, difficulty, seed,
    `Una muestra aleatoria de ${sample} personas se amplía a ${sample * 2} manteniendo el mismo método. ¿Qué suele mejorar?`,
    'La precisión de la estimación', ['La garantía de eliminar todo sesgo', 'La definición de la población', 'La naturaleza de la variable'],
    'Aumentar el tamaño suele reducir la variabilidad muestral, aunque no corrige un método sesgado.')
  if (family === 9) return q(skill, difficulty, seed,
    `En un estudio de ${place}, ¿qué diferencia esencial hay entre un individuo y la muestra?`,
    'Un individuo es una unidad de la población; la muestra es un conjunto de individuos observados',
    ['Son exactamente lo mismo', 'La muestra contiene siempre a toda la población', 'Un individuo es una variable estadística'],
    'La muestra está formada por varios individuos seleccionados de la población.')
  if (family === 10) {
    const frames = [
      ['la alimentación de las familias de un barrio', 'un gimnasio', 'los hogares del barrio'],
      ['el uso de internet de una ciudad', 'una tienda de informática', 'residentes de zonas diversas'],
      ['los hábitos de lectura de adolescentes', 'una biblioteca', 'centros educativos diversos'],
      ['la movilidad de trabajadores', 'un aparcamiento', 'centros de trabajo y transportes diversos'],
      ['el ocio de estudiantes', 'un club deportivo', 'grupos y centros diversos'],
      ['la satisfacción de vecinos', 'una reunión vecinal', 'hogares de distintas calles'],
    ] as const
    const [topic, badPlace, betterFrame] = frames[contextIndex]
    return q(skill, difficulty, seed,
      `Se estudia ${topic} preguntando solo en ${badPlace}. ¿Qué mejora el diseño?`,
      `Seleccionar participantes desde un marco que incluya ${betterFrame}`,
      ['Preguntar a más personas del mismo lugar únicamente', 'Eliminar respuestas poco comunes', 'Usar solo a quienes acudan con más frecuencia'],
      'Ampliar el marco de selección reduce el sesgo asociado al lugar de reclutamiento.')
  }
  if (family === 11) return q(skill, difficulty, seed,
    `En ${place}, se obtiene una muestra muy grande pero seleccionada solo entre voluntarios. ¿Qué afirmación es correcta?`,
    'Una muestra puede ser grande y aun así estar sesgada si se selecciona mal',
    ['Toda muestra grande es representativa', 'Toda muestra pequeña está sesgada', 'Representatividad y tamaño son exactamente lo mismo'],
    'El tamaño mejora precisión; la representatividad depende también del método de selección.')
  if (family === 12) {
    const strata = ['edades', 'cursos', 'barrios', 'turnos', 'sedes', 'tipos de usuario']
    return q(skill, difficulty, seed,
      `Un estudio separa la población por ${strata[contextIndex]} y selecciona al azar dentro de cada grupo. ¿Qué ventaja busca?`,
      'Representar adecuadamente grupos relevantes de la población',
      ['Convertir una muestra en censo', 'Eliminar todas las diferencias entre grupos', 'Evitar calcular frecuencias'],
      'Dividir por estratos y muestrear dentro de ellos ayuda a cubrir grupos importantes.')
  }
  if (family === 13) return q(skill, difficulty, seed,
    `Si el objetivo es inferir resultados de ${sample} encuestados a los ${population} ${people} de ${place}, ¿qué condición es especialmente importante?`,
    'Que la selección reduzca sesgos y refleje razonablemente la población',
    ['Que todos los encuestados den la misma respuesta', 'Que la muestra sea mayor que la población', 'Que no exista ninguna variable cuantitativa'],
    'La calidad de la inferencia depende de cómo representa la muestra al conjunto de interés.')
  if (family === 14) return q(skill, difficulty, seed,
    `Para estudiar a los ${people} de ${place}, se usa como lista de selección un registro que deja fuera a quienes se incorporaron este año. ¿Qué problema tiene ese marco muestral?`,
    'Tiene cobertura insuficiente: parte de la población no puede ser seleccionada',
    ['Es necesariamente un censo', 'Tiene demasiadas variables', 'Convierte el estudio en experimental'],
    'Un marco muestral debe cubrir razonablemente a la población objetivo; excluir un grupo crea infracobertura.')
  if (family === 15) return q(skill, difficulty, seed,
    `Se seleccionan ${sample} personas al azar, pero solo responde aproximadamente la mitad. ¿Qué conviene revisar antes de generalizar el resultado?`,
    'Si quienes no responden difieren de quienes sí responden',
    ['Solo si el número de preguntas es par', 'Si la población tiene exactamente el doble de tamaño', 'Nada: la no respuesta nunca produce sesgo'],
    'La no respuesta puede sesgar el resultado si está relacionada con la variable estudiada.')
  if (family === 16) {
    const clusters = ['aulas', 'edificios', 'manzanas', 'equipos', 'sucursales', 'grupos']
    return q(skill, difficulty, seed,
      `La población está organizada en ${clusters[contextIndex]}. Se sortean algunos grupos completos y se estudia a todas las personas de los grupos elegidos. ¿Qué tipo de diseño describe mejor?`,
      'Muestreo por conglomerados', ['Muestreo sistemático', 'Censo de toda la población', 'Autoselección'],
      'En el muestreo por conglomerados se seleccionan grupos naturales completos o unidades agrupadas.')
  }
  if (family === 17) return q(skill, difficulty, seed,
    `En ${place}, un grupo representa el 60 % de la población y otro el 40 %. Si se toma una muestra estratificada proporcional de ${sample} personas, ¿qué idea debe respetarse?`,
    'Asignar aproximadamente el 60 % de la muestra al primer grupo y el 40 % al segundo',
    ['Tomar el mismo número de ambos grupos siempre', 'Elegir solo el grupo mayor', 'Asignar el 60 % al grupo menor y el 40 % al mayor'],
    'La estratificación proporcional conserva aproximadamente el peso de cada estrato en la población.')
  if (family === 18) return q(skill, difficulty, seed,
    `Dos diseños estudian ${place}: A elige ${sample} personas al azar de un registro completo; B elige ${sample * 2} voluntarios desde un único punto de encuentro. ¿Cuál ofrece mejor base para representar a la población?`,
    'A, porque el método de selección reduce mejor el sesgo aunque la muestra sea menor',
    ['B, solo porque tiene más personas', 'Ambos son siempre equivalentes', 'B, porque los voluntarios garantizan aleatoriedad'],
    'Un tamaño mayor no compensa necesariamente un mecanismo de selección sesgado.')
  if (family === 19) return q(skill, difficulty, seed,
    `Se quiere estimar el tiempo medio de desplazamiento de los ${people} de ${place}. ¿Cuál es la unidad de observación más natural?`,
    'Cada persona de la población estudiada', ['El tiempo medio final', 'El cuestionario completo', 'El número total de respuestas'],
    'La unidad de observación es el individuo sobre el que se mide la variable.')
  if (family === 20) return q(skill, difficulty, seed,
    `Una encuesta de ${sample} personas se diseña con selección aleatoria, pero el cuestionario formula una pregunta de manera muy tendenciosa. ¿Qué conclusión es correcta?`,
    'Una buena selección muestral no corrige un sesgo introducido por la medición',
    ['La aleatoriedad elimina cualquier sesgo posible', 'El tamaño de la muestra hace irrelevante la redacción', 'Una pregunta tendenciosa mejora la representatividad'],
    'El diseño de muestreo y la calidad de la medición son fuentes de error distintas.')
  return q(skill, difficulty, seed,
    `En ${place}, se dispone de un registro completo de ${population} ${people}. ¿Qué procedimiento se acerca más a una muestra aleatoria simple de ${sample}?`,
    'Numerar a todos y sortear los identificadores sin favorecer ningún grupo',
    ['Elegir a los primeros de la lista', 'Preguntar solo a quienes se ofrezcan', 'Seleccionar a quienes estén más cerca del encuestador'],
    'Una muestra aleatoria simple da a cada individuo una oportunidad comparable de ser seleccionado.')
}

function fraction(numerator: number, denominator: number) {
  return `${numerator}/${denominator}`
}

function laplace(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion {
  const family = (seed >>> 1) % 14
  const sides = 6
  const favorable = 1 + (seed % 5)

  if (family === 0) return q(skill, difficulty, seed,
    'En una moneda equilibrada, ¿cuál es la probabilidad de obtener cara?', '1/2', ['1', '1/4', '2'],
    'Hay 1 resultado favorable de 2 resultados equiprobables.')
  if (family === 1) return q(skill, difficulty, seed,
    `En un dado equilibrado, un suceso tiene ${favorable} casos favorables de ${sides} posibles. ¿Cuál es su probabilidad por la regla de Laplace?`,
    fraction(favorable, sides), [fraction(sides, favorable), fraction(Math.max(1, favorable - 1), sides), String(favorable)],
    `Probabilidad = favorables/posibles = ${favorable}/${sides}.`)
  if (family === 2) return q(skill, difficulty, seed,
    'Al lanzar un dado, ¿cuál es la probabilidad de obtener un número par?', '3/6 = 1/2', ['2/6', '4/6', '3/3'],
    'Los casos favorables son 2, 4 y 6: 3 de 6 resultados posibles.')
  if (family === 3) return q(skill, difficulty, seed,
    'En una ruleta con 8 sectores iguales, 3 son verdes. ¿Cuál es la probabilidad de caer en verde?', '3/8', ['5/8', '8/3', '3/5'],
    'Hay 3 sectores favorables entre 8 equiprobables.')
  if (family === 4) return q(skill, difficulty, seed,
    'Un suceso imposible tiene 0 casos favorables. ¿Cuál es su probabilidad?', '0', ['1', '1/2', 'No se puede definir'],
    'Con 0 casos favorables, la razón favorables/posibles vale 0.')
  if (family === 5) return q(skill, difficulty, seed,
    'Un suceso seguro incluye todos los resultados posibles. ¿Cuál es su probabilidad?', '1', ['0', '1/2', 'Depende del número de resultados'],
    'Si todos los casos posibles son favorables, favorables/posibles = 1.')
  if (family === 6) return q(skill, difficulty, seed,
    'En una bolsa hay 4 bolas rojas y 6 azules, todas igual de probables al extraer una. ¿Cuál es P(roja)?', '4/10 = 2/5', ['6/10', '4/6', '1/4'],
    'Hay 4 casos favorables entre 10 bolas posibles.')
  if (family === 7) return q(skill, difficulty, seed,
    'Si P(A)=3/10, ¿cuál es la probabilidad del suceso contrario “no A”?', '7/10', ['3/7', '1/10', '13/10'],
    'Las probabilidades de un suceso y su complementario suman 1: 1 - 3/10 = 7/10.')
  if (family === 8) return q(skill, difficulty, seed,
    'Dos sucesos tienen probabilidades 2/5 y 4/5. ¿Cuál es más probable?', 'El de probabilidad 4/5', ['El de 2/5', 'Son igual de probables', 'No se pueden comparar fracciones'],
    'Con el mismo denominador, 4/5 es mayor que 2/5.')
  if (family === 9) return q(skill, difficulty, seed,
    '¿Cuándo puede aplicarse directamente la regla de Laplace “favorables/posibles”?',
    'Cuando los resultados elementales considerados son equiprobables',
    ['Siempre, aunque los resultados tengan probabilidades distintas', 'Solo cuando hay exactamente dos resultados', 'Únicamente con dados'],
    'La regla clásica de Laplace presupone resultados elementales equiprobables.')
  if (family === 10) return q(skill, difficulty, seed,
    'Una ruleta tiene sectores de tamaños distintos. ¿Por qué no basta contar sectores para aplicar Laplace?',
    'Porque los sectores no son equiprobables si tienen tamaños distintos',
    ['Porque una ruleta nunca permite calcular probabilidades', 'Porque solo sirven números enteros', 'Porque todos los sectores tienen probabilidad cero'],
    'Contar casos solo funciona directamente cuando cada resultado elemental tiene la misma probabilidad.')
  if (family === 11) return q(skill, difficulty, seed,
    'En una baraja de 12 cartas equiprobables, 5 cumplen un suceso. ¿Qué probabilidad tiene?', '5/12', ['7/12', '12/5', '5/7'],
    'Se divide el número de cartas favorables, 5, entre las 12 posibles.')
  if (family === 12) return q(skill, difficulty, seed,
    'Si una probabilidad calculada da 7/5, ¿qué indica?',
    'Que hay un error, porque una probabilidad no puede ser mayor que 1',
    ['Que el suceso es muy probable y el valor es válido', 'Que la probabilidad es exactamente 0', 'Que faltan casos favorables'],
    'Toda probabilidad está entre 0 y 1.')
  return q(skill, difficulty, seed,
    '¿Qué expresa conceptualmente una probabilidad de 1/4 en un experimento equiprobable?',
    'Que los casos favorables representan una cuarta parte de los posibles',
    ['Que hay exactamente cuatro casos favorables', 'Que el suceso es seguro', 'Que hay un solo resultado posible'],
    'La fracción compara la cantidad de resultados favorables con el total posible.')
}

export function generateMathSamplingLaplaceRecurrenceDepth(
  skill: SkillMeta,
  difficulty: number,
  seed: number,
): GeneratedQuestion | null {
  const normalized = seed >>> 0
  if ((normalized & 1) === 1) return null
  if (skill.id === 'M14S01') return sampling(skill, difficulty, normalized)
  if (skill.id === 'M15S04') return laplace(skill, difficulty, normalized)
  return null
}
