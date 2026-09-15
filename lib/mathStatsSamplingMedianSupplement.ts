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
    tags: [skill.generator_key, 'math', 'sampling_median_supplement'],
  }
}

const PLACES = ['instituto', 'barrio', 'biblioteca', 'club deportivo', 'centro cultural', 'campus']
const TOPICS = ['uso del transporte', 'hábitos de lectura', 'actividad física', 'consumo de agua', 'tiempo de estudio', 'uso de la biblioteca']

function pick<T>(items: T[], seed: number, offset = 0) {
  return items[(seed + offset) % items.length]
}

function sampling(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion {
  const family = seed % 12
  const population = 300 + 50 * (seed % 10)
  const sample = 30 + 10 * (seed % 7)
  const place = pick(PLACES, seed)
  const topic = pick(TOPICS, seed, 2)

  if (family === 0) return q(skill, difficulty, seed,
    `En un ${place} con ${population} personas se estudia ${topic} preguntando a ${sample} elegidas al azar. ¿Cuál es la muestra?`,
    `Las ${sample} personas elegidas`,
    [`Las ${population} personas`, 'Solo quienes dan una respuesta concreta', 'El tema de la encuesta'],
    'La muestra es el subconjunto de la población que se observa directamente.')
  if (family === 1) return q(skill, difficulty, seed,
    `Se quiere estimar ${topic} en todo un ${place}. ¿Qué diseño reduce mejor el sesgo?`,
    'Elegir participantes al azar de distintas zonas o grupos',
    ['Preguntar solo a amistades', 'Preguntar solo a quienes llegan primero', 'Elegir solo un grupo muy concreto'],
    'Una selección aleatoria y repartida entre grupos suele representar mejor a la población.')
  if (family === 2) return q(skill, difficulty, seed,
    `Una encuesta sobre ${topic} se publica en redes y responde quien quiere. ¿Qué riesgo estadístico destaca?`,
    'Sesgo de autoselección',
    ['Error de suma', 'Que la población desaparezca', 'Que todas las respuestas sean idénticas'],
    'Quienes deciden responder voluntariamente pueden diferir sistemáticamente del resto.')
  if (family === 3) return q(skill, difficulty, seed,
    `De una población de ${population} personas se toma una muestra aleatoria de ${sample}. Si se repite el muestreo, ¿debe salir exactamente el mismo resultado?`,
    'No, distintas muestras pueden dar resultados algo diferentes',
    ['Sí, si la muestra es aleatoria', 'Sí, mientras el tamaño sea el mismo', 'No, porque una muestra nunca sirve para estimar'],
    'La variabilidad muestral hace que diferentes muestras aleatorias no coincidan exactamente.')
  if (family === 4) return q(skill, difficulty, seed,
    `Dos muestras se obtienen de la misma población: una de ${sample} personas y otra de ${sample * 3}, ambas bien seleccionadas al azar. ¿Cuál suele dar una estimación más estable?`,
    `La de ${sample * 3} personas`,
    [`La de ${sample} personas`, 'Las dos son necesariamente idénticas', 'La más pequeña, por tener menos datos'],
    'Con el mismo método de selección, una muestra mayor suele reducir la variabilidad de la estimación.')
  if (family === 5) return q(skill, difficulty, seed,
    `Se estudia ${topic} en un centro con varios cursos, pero solo se encuesta a 1.º. ¿Qué problema aparece?`,
    'Falta de representatividad',
    ['Exceso de aleatoriedad', 'La muestra se vuelve población', 'La variable deja de existir'],
    'Un único curso puede no representar al conjunto de cursos del centro.')
  if (family === 6) return q(skill, difficulty, seed,
    `Una muestra tiene muchas personas pero todas proceden del mismo club. ¿Puede seguir estando sesgada?`,
    'Sí, el tamaño no corrige una selección sesgada',
    ['No, una muestra grande nunca está sesgada', 'Solo si tiene menos de 100 personas', 'No, si todos contestan'],
    'El sesgo depende del método de selección, no solo del tamaño de la muestra.')
  if (family === 7) return q(skill, difficulty, seed,
    `Para estudiar ${topic}, se divide la población por cursos y se eligen personas al azar dentro de cada curso. ¿Qué ventaja tiene?`,
    'Asegura representación de varios subgrupos',
    ['Elimina cualquier error posible', 'Convierte la muestra en censo', 'Hace innecesario elegir al azar'],
    'Seleccionar dentro de varios estratos ayuda a representar subgrupos relevantes.')
  if (family === 8) return q(skill, difficulty, seed,
    `Se entrevista a cada 20.ª persona de una lista ordenada tras elegir al azar el punto de inicio. ¿Qué tipo de idea de muestreo se está usando?`,
    'Muestreo sistemático',
    ['Muestreo por conveniencia', 'Censo completo', 'Autoselección'],
    'Elegir elementos con un intervalo fijo desde un inicio aleatorio es muestreo sistemático.')
  if (family === 9) return q(skill, difficulty, seed,
    `Si toda la población de ${population} personas responde a la encuesta, ¿cómo se llama el estudio?`,
    'Censo',
    ['Muestra aleatoria simple', 'Muestra estratificada', 'Estimación muestral'],
    'Un censo recoge datos de todos los individuos de la población.')
  if (family === 10) return q(skill, difficulty, seed,
    `Una muestra aleatoria de ${sample} personas da un 60 % a favor de una opción. ¿Qué interpretación es razonable?`,
    'Es una estimación de la proporción en la población',
    ['Significa que exactamente el 60 % de toda la población piensa igual', 'La muestra deja de ser necesaria', 'La proporción poblacional no puede diferir'],
    'La muestra se usa para estimar a la población, con cierto margen de variación.')
  return q(skill, difficulty, seed,
    `Dos encuestas sobre ${topic} usan el mismo tamaño muestral. Una selecciona al azar y otra solo a voluntarios. ¿Cuál suele ser más fiable para representar a la población?`,
    'La selección aleatoria',
    ['La de voluntarios', 'Ambas garantizan la misma representatividad', 'Ninguna, porque las muestras nunca sirven'],
    'La selección aleatoria suele reducir el sesgo de selección frente a la autoselección.')
}

function median(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion {
  const family = seed % 12
  const base = 5 + (seed % 10)
  const valuesOdd = [base, base + 2, base + 5, base + 8, base + 12]
  const valuesEven = [base, base + 3, base + 7, base + 11, base + 15, base + 18]

  if (family === 0) return q(skill, difficulty, seed,
    `Los datos ${valuesOdd.slice().reverse().join(', ')} están desordenados. ¿Cuál es la mediana?`,
    String(valuesOdd[2]),
    [String(valuesOdd[1]), String(valuesOdd[3]), String(valuesOdd.reduce((a, b) => a + b, 0))],
    `Al ordenar los cinco datos, el tercero es ${valuesOdd[2]}.`)
  if (family === 1) {
    const med = (valuesEven[2] + valuesEven[3]) / 2
    return q(skill, difficulty, seed,
      `¿Cuál es la mediana de ${valuesEven.join(', ')}?`,
      String(med).replace('.', ','),
      [String(valuesEven[2]), String(valuesEven[3]), String(base + 9)],
      `Con seis datos, la mediana es la media de los dos centrales: (${valuesEven[2]} + ${valuesEven[3]}) / 2 = ${med}.`)
  }
  if (family === 2) return q(skill, difficulty, seed,
    `En un conjunto ordenado de 9 datos, ¿qué posición ocupa la mediana?`,
    'La 5.ª',
    ['La 4.ª', 'La 6.ª', 'La 9.ª'],
    'Con 9 datos, quedan cuatro a cada lado del quinto valor.')
  if (family === 3) return q(skill, difficulty, seed,
    `En un conjunto ordenado de 10 datos, ¿cómo se calcula la mediana?`,
    'Promediando el 5.º y el 6.º valor',
    ['Tomando solo el 5.º', 'Tomando solo el 6.º', 'Promediando el 1.º y el 10.º'],
    'Con un número par de datos, se promedian los dos valores centrales.')
  if (family === 4) return q(skill, difficulty, seed,
    `Los datos tienen mediana ${base + 6}. Se aumenta muchísimo solo el valor máximo. ¿Qué suele ocurrir con la mediana?`,
    'Permanece igual si no cambia la posición central',
    ['Aumenta tanto como el máximo', 'Se convierte en la media', 'Desaparece'],
    'Cambiar un extremo no altera la mediana mientras los valores centrales mantengan su posición.')
  if (family === 5) return q(skill, difficulty, seed,
    `En ${base}, ${base + 2}, ${base + 4}, x, ${base + 10}, ${base + 14}, la mediana es ${base + 6}. ¿Qué valor debe tomar x?`,
    String(base + 8),
    [String(base + 6), String(base + 10), String(base + 4)],
    `La mediana es el promedio del 3.º y 4.º valores: (${base + 4} + x) / 2 = ${base + 6}; por tanto x = ${base + 8}.`)
  if (family === 6) return q(skill, difficulty, seed,
    `Una distribución de ingresos tiene unos pocos valores extremadamente altos. ¿Por qué puede preferirse la mediana a la media?`,
    'Porque es menos sensible a valores extremos',
    ['Porque siempre es mayor que la media', 'Porque usa solo el valor máximo', 'Porque no requiere ordenar los datos'],
    'La mediana depende de la posición central y resiste mejor la influencia de valores extremos.')
  if (family === 7) return q(skill, difficulty, seed,
    `Se añade un nuevo valor muy pequeño a un conjunto con número impar de datos. ¿Puede cambiar la mediana?`,
    'Sí, porque cambian el número de datos y las posiciones centrales',
    ['No, nunca cambia al añadir extremos', 'Solo cambia la media', 'No, si el nuevo valor es pequeño'],
    'Añadir un dato cambia la cantidad total y puede desplazar qué posiciones determinan la mediana.')
  if (family === 8) return q(skill, difficulty, seed,
    `Dos conjuntos tienen la misma mediana de ${base + 5}. ¿Qué puede ser diferente entre ellos?`,
    'La dispersión y los valores extremos',
    ['Nada, deben ser idénticos', 'El número de datos no puede cambiar', 'La media debe ser la misma'],
    'Compartir mediana no obliga a compartir forma, dispersión ni media.')
  if (family === 9) return q(skill, difficulty, seed,
    `Los datos son ${base}, ${base + 1}, ${base + 2}, ${base + 20}, ${base + 21}. ¿Qué valor es la mediana?`,
    String(base + 2),
    [String(base + 20), String(base + 21), String(base + 1)],
    'Con cinco datos ordenados, la mediana es siempre el tercero, aunque haya un salto grande después.')
  if (family === 10) return q(skill, difficulty, seed,
    `Una lista ordenada tiene 7 datos y mediana ${base + 4}. ¿Cuántos datos quedan a cada lado de la mediana?`,
    '3 a cada lado',
    ['2 a cada lado', '4 a cada lado', '6 a cada lado'],
    'En 7 datos, el cuarto es la mediana y quedan tres valores a cada lado.')
  return q(skill, difficulty, seed,
    `Para comparar el centro de dos grupos con valores extremos muy distintos, ¿qué medida es especialmente útil?`,
    'La mediana',
    ['El máximo', 'La suma', 'El rango únicamente'],
    'La mediana resume el centro y es resistente frente a valores extremos.')
}

export function generateMathStatsSamplingMedianSupplement(
  skill: SkillMeta,
  difficulty: number,
  seed: number,
): GeneratedQuestion | null {
  const normalized = seed >>> 0
  if (normalized % 4 !== 0) return null
  if (skill.id === 'M14S01') return sampling(skill, difficulty, normalized)
  if (skill.id === 'M14S06') return median(skill, difficulty, normalized)
  return null
}
