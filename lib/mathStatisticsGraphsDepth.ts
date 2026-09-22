import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Item = { prompt: string; answer: string; distractors: [string, string, string]; solution: string }

function rotate<T>(items: T[], shift: number) {
  const offset = ((shift % items.length) + items.length) % items.length
  return items.slice(offset).concat(items.slice(0, offset))
}

function finish(skill: SkillMeta, difficulty: number, seed: number, item: Item): GeneratedQuestion {
  const raw = [item.answer, ...item.distractors]
  if (new Set(raw).size !== 4) throw new Error(`Duplicate M14S04 options for seed ${seed}: ${JSON.stringify(raw)}`)
  const options = rotate(raw, seed + difficulty)
  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt: item.prompt,
    options,
    answerIndex: options.indexOf(item.answer),
    solution: item.solution,
    tags: [skill.generator_key, 'math', 'statistics_graphs_depth'],
  }
}

const CATEGORY_CONTEXTS = ['deportes preferidos', 'medio de transporte', 'color favorito', 'tipo de merienda', 'mascota preferida', 'actividad extraescolar']
const TIME_CONTEXTS = ['temperatura cada hora', 'ventas por mes', 'consumo de agua por día', 'distancia recorrida por minuto', 'nivel de batería por hora']
const CONTINUOUS = ['estatura', 'masa corporal', 'tiempo de espera', 'temperatura', 'longitud']

function graphQuestion(seed: number): Item {
  const family = (seed >>> 2) % 22
  const categories = CATEGORY_CONTEXTS[(seed >>> 5) % CATEGORY_CONTEXTS.length]
  const time = TIME_CONTEXTS[(seed >>> 9) % TIME_CONTEXTS.length]
  const continuous = CONTINUOUS[(seed >>> 13) % CONTINUOUS.length]
  const a = 2 + ((seed >>> 16) % 7)
  const b = a + 2 + ((seed >>> 20) % 5)
  const total = 20 + 5 * ((seed >>> 24) % 9)
  const part = 5 + 5 * ((seed >>> 28) % 3)
  const angle = Math.round((part / total) * 360)

  if (family === 0) return {
    prompt: `Se quieren comparar frecuencias de categorías de ${categories}. ¿Qué gráfico es adecuado?`,
    answer: 'Gráfico de barras',
    distractors: ['Histograma', 'Diagrama de dispersión', 'Gráfico de líneas temporal'],
    solution: 'Las barras separadas comparan bien categorías distintas.',
  }
  if (family === 1) return {
    prompt: `Se quiere mostrar cómo se reparte un total entre pocas categorías de ${categories}. ¿Qué gráfico puede ser útil?`,
    answer: 'Gráfico de sectores',
    distractors: ['Diagrama de dispersión', 'Histograma', 'Recta numérica'],
    solution: 'Los sectores representan partes de un total.',
  }
  if (family === 2) return {
    prompt: `Los datos de ${continuous} se agrupan en intervalos contiguos. ¿Qué gráfico es apropiado?`,
    answer: 'Histograma',
    distractors: ['Gráfico de barras categóricas', 'Diagrama de sectores', 'Pictograma sin intervalos'],
    solution: 'El histograma representa frecuencias de intervalos contiguos de una variable cuantitativa.',
  }
  if (family === 3) return {
    prompt: `Para mostrar la evolución de ${time}, ¿qué gráfico resulta especialmente útil?`,
    answer: 'Gráfico de líneas',
    distractors: ['Gráfico de sectores', 'Histograma de una sola distribución', 'Pictograma sin orden temporal'],
    solution: 'Las líneas permiten seguir cambios a lo largo de una secuencia ordenada.',
  }
  if (family === 4) return {
    prompt: `Se estudia la relación entre horas de estudio y nota obtenida. ¿Qué gráfico conviene?`,
    answer: 'Diagrama de dispersión',
    distractors: ['Gráfico de sectores', 'Histograma de una sola variable', 'Gráfico de barras de una categoría'],
    solution: 'Dos variables cuantitativas se comparan mediante pares de puntos.',
  }
  if (family === 5) return {
    prompt: `Dos barras tienen valores ${a} y ${b}. Si el eje vertical empieza cerca de ${a - 1} en vez de 0, ¿qué riesgo aparece?`,
    answer: 'Exagerar visualmente la diferencia',
    distractors: ['Cambiar los datos reales automáticamente', 'Convertir las categorías en continuas', 'Impedir siempre cualquier lectura numérica'],
    solution: 'Un eje truncado puede magnificar visualmente diferencias pequeñas.',
  }
  if (family === 6) return {
    prompt: `Un gráfico de sectores representa ${part} de ${total} casos. Aproximadamente, ¿qué ángulo debería ocupar ese sector?`,
    answer: `${angle}°`,
    distractors: [`${part}°`, `${total}°`, `${Math.max(1, 360 - angle)}°`],
    solution: 'El ángulo se obtiene multiplicando la proporción por 360°.',
  }
  if (family === 7) return {
    prompt: '¿Qué suma deben tener los ángulos de todos los sectores de un gráfico circular completo?',
    answer: '360°',
    distractors: ['100°', '180°', '270°'],
    solution: 'Un círculo completo suma 360°.',
  }
  if (family === 8) return {
    prompt: `Una barra representa frecuencia ${b}, pero llega a ${b + a}. ¿Qué debe corregirse?`,
    answer: 'La altura de la barra',
    distractors: ['El dato original para que coincida con el dibujo', 'Todas las demás barras para igualarlas', 'El nombre de la categoría únicamente'],
    solution: 'La gráfica debe ajustarse a los datos, no al revés.',
  }
  if (family === 9) return {
    prompt: `Un histograma de ${continuous} muestra huecos entre barras aunque los intervalos son consecutivos. ¿Qué detalle es sospechoso?`,
    answer: 'En un histograma los intervalos contiguos suelen representarse con barras contiguas',
    distractors: ['Todo histograma debe usar sectores', 'Las barras deben tener siempre igual altura', 'El eje horizontal debe eliminarse'],
    solution: 'La continuidad de los intervalos suele reflejarse con barras adyacentes.',
  }
  if (family === 10) return {
    prompt: `Para comparar ${categories} en dos grupos distintos, ¿qué diseño facilita la comparación?`,
    answer: 'Barras agrupadas con la misma escala',
    distractors: ['Dos gráficos con escalas incompatibles', 'Un único sector para todos los datos', 'Ocultar las etiquetas de categorías'],
    solution: 'Una escala común y barras agrupadas permiten comparar grupos de forma directa.',
  }
  if (family === 11) return {
    prompt: `Un gráfico de líneas de ${time} tiene los puntos desordenados en el eje horizontal. ¿Qué problema causa?`,
    answer: 'Puede distorsionar la evolución temporal o secuencial',
    distractors: ['Convierte los datos en cualitativos', 'Hace que todos los valores sean cero', 'Obliga a usar un gráfico de sectores'],
    solution: 'La secuencia horizontal debe conservar el orden relevante.',
  }
  if (family === 12) return {
    prompt: '¿Qué elemento ayuda a interpretar correctamente un eje numérico?',
    answer: 'Una escala uniforme y sus unidades',
    distractors: ['Cambiar la escala en cada marca sin avisar', 'Eliminar todos los números', 'Usar solo colores sin etiquetas'],
    solution: 'Escala y unidades permiten traducir posiciones gráficas a valores.',
  }
  if (family === 13) return {
    prompt: `En un gráfico de barras de ${categories}, todas las barras tienen la misma altura aunque las frecuencias son distintas. ¿Qué ocurre?`,
    answer: 'La representación no respeta los datos',
    distractors: ['La tabla original debe cambiarse', 'Es correcto si las categorías tienen nombres distintos', 'Solo falta añadir un título'],
    solution: 'Las alturas deben corresponder a las frecuencias.',
  }
  if (family === 14) return {
    prompt: `Para una distribución de ${continuous}, ¿qué diferencia principal hay entre histograma y gráfico de barras?`,
    answer: 'El histograma usa intervalos cuantitativos contiguos; las barras suelen representar categorías separadas',
    distractors: ['El histograma nunca usa frecuencias', 'Las barras no pueden tener eje vertical', 'Son exactamente el mismo gráfico en todos los casos'],
    solution: 'La naturaleza continua o categórica determina la forma de representación.',
  }
  if (family === 15) return {
    prompt: `Un sector circular ocupa 90°. ¿Qué fracción del total representa?`,
    answer: '1/4',
    distractors: ['1/2', '1/3', '3/4'],
    solution: '90°/360° = 1/4.',
  }
  if (family === 16) return {
    prompt: `Una categoría representa el 25% de ${total} observaciones. ¿Cuántas observaciones son?`,
    answer: String(total / 4),
    distractors: [String(total), String(total / 2), String(total / 5)],
    solution: 'El 25% equivale a una cuarta parte del total.',
  }
  if (family === 17) return {
    prompt: '¿Qué práctica puede hacer engañoso un gráfico aunque los datos sean correctos?',
    answer: 'Usar escalas o recortes que exageran visualmente diferencias',
    distractors: ['Indicar las unidades', 'Añadir un título descriptivo', 'Mantener la misma escala entre comparaciones'],
    solution: 'La presentación visual puede alterar la percepción sin cambiar los datos.',
  }
  if (family === 18) return {
    prompt: `Se representan dos variables cuantitativas y los puntos parecen ascender de izquierda a derecha. ¿Qué sugiere el diagrama de dispersión?`,
    answer: 'Una asociación positiva',
    distractors: ['Una asociación necesariamente causal', 'Ausencia total de relación', 'Que ambas variables son cualitativas'],
    solution: 'Una tendencia ascendente sugiere asociación positiva, no causalidad por sí sola.',
  }
  if (family === 19) return {
    prompt: `En un gráfico de barras, una categoría vale ${a} y otra ${b}. ¿Qué debe permitir la escala?`,
    answer: 'Leer ambos valores sin cambiar el tamaño de las unidades',
    distractors: ['Asignar una unidad distinta a cada barra', 'Ocultar el valor mayor', 'Hacer que ambas barras midan lo mismo'],
    solution: 'La escala debe ser consistente para que las alturas sean comparables.',
  }
  if (family === 20) return {
    prompt: '¿Qué comprobación conviene hacer antes de interpretar diferencias visuales entre dos gráficos?',
    answer: 'Revisar si usan la misma escala y el mismo rango',
    distractors: ['Comparar solo los colores', 'Ignorar los ejes', 'Suponer que todo gráfico empieza en cero'],
    solution: 'Escalas distintas pueden producir impresiones visuales no comparables.',
  }
  return {
    prompt: `Una tabla de ${categories} contiene frecuencias. ¿Qué debe conservar cualquier gráfico construido a partir de ella?`,
    answer: 'La correspondencia entre cada categoría y su frecuencia',
    distractors: ['El orden alfabético obligatorio', 'La misma altura para todas las categorías', 'La ausencia de etiquetas'],
    solution: 'La representación debe mantener fielmente la relación entre categorías y valores.',
  }
}

export function generateMathStatisticsGraphsDepth(
  skill: SkillMeta,
  difficulty: number,
  seed: number,
): GeneratedQuestion | null {
  if (skill.id !== 'M14S04') return null
  const normalized = seed >>> 0
  // Keep one in four seeds on established material for spaced review.
  if ((normalized & 3) === 3) return null
  return finish(skill, difficulty, normalized, graphQuestion(normalized))
}
