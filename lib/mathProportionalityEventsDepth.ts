import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }

type Item = {
  prompt: string
  answer: string
  distractors: [string, string, string]
  solution: string
}

function rotate<T>(items: T[], shift: number) {
  const offset = ((shift % items.length) + items.length) % items.length
  return items.slice(offset).concat(items.slice(0, offset))
}

function finish(skill: SkillMeta, difficulty: number, seed: number, item: Item): GeneratedQuestion {
  const options = rotate([item.answer, ...item.distractors], seed + difficulty)
  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt: item.prompt,
    options,
    answerIndex: options.indexOf(item.answer),
    solution: item.solution,
    tags: [skill.generator_key, 'math', 'proportionality_events_depth'],
  }
}

function proportionality(seed: number): Item {
  const family = (seed >>> 1) % 14
  const a = 2 + (seed % 5)
  const k = 2 + ((seed >>> 3) % 5)
  const b = a * k
  const c = a + 2
  const d = c * k

  const items: Item[] = [
    {
      prompt: `Si ${a} cuadernos cuestan ${b} €, ¿qué coste corresponde a ${c} cuadernos al mismo precio por unidad?`,
      answer: `${d} €`, distractors: [`${b + 2} €`, `${d + k} €`, `${c + k} €`],
      solution: `El cociente coste/cantidad se mantiene: ${b}/${a} = ${k} € por cuaderno; ${c} × ${k} = ${d}.`,
    },
    {
      prompt: `En una relación directa, ${a} entradas cuestan ${b} €. ¿Qué dato confirma la proporcionalidad para ${c} entradas?`,
      answer: `${c} entradas cuestan ${d} €`, distractors: [`${c} entradas cuestan ${d + 1} €`, `${c} entradas cuestan ${b} €`, `${a} entradas cuestan ${d} €`],
      solution: 'En proporcionalidad directa, al multiplicar la cantidad por un factor, el coste se multiplica por el mismo factor.',
    },
    {
      prompt: '¿Cuál de estas situaciones describe mejor una proporcionalidad directa?',
      answer: 'A precio unitario fijo, duplicar los kilos duplica el coste', distractors: ['Duplicar trabajadores reduce siempre a la mitad el trabajo', 'Aumentar la edad aumenta siempre la altura en la misma proporción', 'Duplicar el lado de un cuadrado duplica su área'],
      solution: 'Con precio unitario fijo, coste y cantidad mantienen una razón constante.',
    },
    {
      prompt: 'Una tabla relaciona cantidad y coste. ¿Qué condición permite reconocer proporcionalidad directa?',
      answer: 'El cociente coste/cantidad es constante', distractors: ['La diferencia coste−cantidad es constante', 'Las dos columnas aumentan siempre en 1', 'Todos los valores son pares'],
      solution: 'En una relación directamente proporcional, y/x permanece constante.',
    },
    {
      prompt: `Una receta usa ${a} vasos de agua para ${b} medidas de harina. Si se escala manteniendo la proporción, ¿qué debe ocurrir?`,
      answer: 'Ambas cantidades deben multiplicarse por el mismo factor', distractors: ['Solo debe aumentar el agua', 'Las cantidades deben aumentar en la misma diferencia', 'Una cantidad debe aumentar y la otra disminuir'],
      solution: 'Escalar una proporción directa exige aplicar el mismo factor multiplicativo a ambas magnitudes.',
    },
    {
      prompt: '¿Qué ejemplo NO es proporcionalidad directa?',
      answer: 'Un taxi cobra una tarifa fija de salida más un precio por kilómetro', distractors: ['Kilogramos y coste con precio fijo por kilogramo', 'Horas y salario con pago fijo por hora', 'Litros y coste con precio fijo por litro'],
      solution: 'Una cantidad fija inicial rompe la forma y = kx.',
    },
    {
      prompt: `Si y es directamente proporcional a x y para x=${a} se tiene y=${b}, ¿cuál es la constante de proporcionalidad?`,
      answer: String(k), distractors: [String(a + b), String(Math.max(1, b - a)), String(a * b)],
      solution: `k = y/x = ${b}/${a} = ${k}.`,
    },
    {
      prompt: `En una tabla proporcional aparece el par (${a}, ${b}). ¿Qué par pertenece a la misma relación?`,
      answer: `(${c}, ${d})`, distractors: [`(${c}, ${d + 1})`, `(${a + 1}, ${b + 1})`, `(${b}, ${a})`],
      solution: `La relación es y=${k}x; para x=${c}, y=${d}.`,
    },
    {
      prompt: 'Si una gráfica de dos magnitudes es una recta que pasa por el origen, ¿qué sugiere en este contexto?',
      answer: 'Una relación de proporcionalidad directa', distractors: ['Una relación inversa necesariamente', 'Que ambas magnitudes son iguales', 'Que no existe relación entre ellas'],
      solution: 'La forma y = kx se representa por una recta que pasa por el origen.',
    },
    {
      prompt: 'Una magnitud se triplica y la otra también se triplica. ¿Basta eso por sí solo para demostrar proporcionalidad directa en toda la relación?',
      answer: 'No; hay que comprobar que la razón se mantiene en los pares considerados', distractors: ['Sí, siempre', 'No; en proporcionalidad directa una debe disminuir', 'Sí, pero solo si ambas son enteras'],
      solution: 'Un solo cambio compatible no demuestra la relación completa; la razón constante sí la caracteriza.',
    },
    {
      prompt: `Un mapa usa una escala constante: ${a} cm representan ${b} km. ¿Cuántos km representan ${c} cm?`,
      answer: `${d} km`, distractors: [`${d + 1} km`, `${b} km`, `${c + b} km`],
      solution: `La escala es ${k} km por cm; ${c} × ${k} = ${d}.`,
    },
    {
      prompt: '¿Qué afirmación distingue una relación proporcional directa de una relación solo creciente?',
      answer: 'En la proporcional directa existe una razón multiplicativa constante', distractors: ['Toda relación creciente es proporcional', 'En una proporcional la diferencia entre magnitudes es siempre cero', 'Una proporcional nunca puede representarse con decimales'],
      solution: 'Crecer juntas no basta; la característica esencial es y/x constante.',
    },
    {
      prompt: `Una máquina produce ${b} piezas en ${a} minutos a ritmo constante. ¿Cuántas piezas produce en ${c} minutos?`,
      answer: String(d), distractors: [String(b + c), String(d + k), String(Math.max(1, d - k))],
      solution: `Ritmo constante: ${b}/${a}=${k} piezas por minuto; en ${c} minutos produce ${d}.`,
    },
    {
      prompt: 'Si y = 4x + 3, ¿son x e y directamente proporcionales?',
      answer: 'No, porque la relación no pasa por el origen', distractors: ['Sí, porque y aumenta cuando x aumenta', 'Sí, porque aparece una multiplicación', 'No, porque 4 es demasiado grande'],
      solution: 'La proporcionalidad directa tiene forma y = kx, sin término fijo añadido.',
    },
  ]
  return items[family]
}

function events(seed: number): Item {
  const family = (seed >>> 1) % 14
  const items: Item[] = [
    {
      prompt: 'Al lanzar un dado, “obtener un número par” es un…',
      answer: 'Suceso', distractors: ['Experimento imposible', 'Resultado único', 'Espacio muestral'],
      solution: 'Un suceso es un conjunto de resultados del experimento aleatorio.',
    },
    {
      prompt: 'Al lanzar un dado, ¿cuál es el suceso “obtener un número mayor que 4”?',
      answer: '{5, 6}', distractors: ['{4, 5, 6}', '{1, 2, 3, 4}', '{6}'],
      solution: 'Los únicos resultados mayores que 4 son 5 y 6.',
    },
    {
      prompt: 'En una moneda, el suceso “obtener cara o cruz” es…',
      answer: 'Seguro', distractors: ['Imposible', 'Elemental', 'Vacío'],
      solution: 'Incluye todos los resultados posibles del experimento.',
    },
    {
      prompt: 'Al lanzar un dado, el suceso “obtener un 8” es…',
      answer: 'Imposible', distractors: ['Seguro', 'Compatible', 'Elemental posible'],
      solution: '8 no pertenece al espacio muestral de un dado ordinario.',
    },
    {
      prompt: '¿Cuál de estos es un suceso elemental al lanzar un dado?',
      answer: 'Obtener 3', distractors: ['Obtener un número par', 'Obtener menos de 5', 'Obtener un número distinto de 6'],
      solution: 'Un suceso elemental contiene exactamente un resultado.',
    },
    {
      prompt: 'Al lanzar un dado, A={2,4,6} y B={4,5,6}. ¿Qué resultados pertenecen a A y B a la vez?',
      answer: '{4, 6}', distractors: ['{2, 5}', '{2, 4, 5, 6}', '{6}'],
      solution: 'La intersección contiene los resultados comunes a ambos sucesos.',
    },
    {
      prompt: 'Al lanzar un dado, A={1,2} y B={5,6}. ¿Cómo son A y B?',
      answer: 'Incompatibles', distractors: ['Iguales', 'Contrarios necesariamente', 'Seguros'],
      solution: 'No pueden ocurrir simultáneamente porque no comparten resultados.',
    },
    {
      prompt: 'Si A es “obtener número par” al lanzar un dado, ¿cuál es su suceso contrario?',
      answer: 'Obtener número impar', distractors: ['Obtener 2', 'Obtener número mayor que 2', 'Obtener 6'],
      solution: 'El contrario contiene exactamente los resultados que no están en A.',
    },
    {
      prompt: 'En una bolsa con bolas rojas, azules y verdes, ¿qué describe el espacio muestral del color extraído?',
      answer: '{rojo, azul, verde}', distractors: ['Solo {rojo}', '{bola}', 'El número total de bolas únicamente'],
      solution: 'El espacio muestral reúne todos los resultados posibles del experimento.',
    },
    {
      prompt: '¿Qué diferencia hay entre resultado y suceso?',
      answer: 'Un resultado es una posibilidad concreta; un suceso puede agrupar varios resultados', distractors: ['Son siempre exactamente lo mismo', 'Un suceso es el experimento completo', 'Un resultado contiene siempre varios sucesos'],
      solution: 'Los sucesos son subconjuntos del espacio muestral y pueden contener uno o más resultados.',
    },
    {
      prompt: 'Al sacar una carta numerada del 1 al 10, ¿qué suceso representa “sacar múltiplo de 3”?',
      answer: '{3, 6, 9}', distractors: ['{1, 3, 6, 9}', '{3, 9}', '{2, 4, 6, 8, 10}'],
      solution: 'Entre 1 y 10, los múltiplos de 3 son 3, 6 y 9.',
    },
    {
      prompt: 'Si dos sucesos son contrarios, ¿qué ocurre necesariamente?',
      answer: 'Uno ocurre exactamente cuando el otro no ocurre', distractors: ['Pueden ocurrir simultáneamente siempre', 'Tienen que contener el mismo resultado', 'Ambos son imposibles'],
      solution: 'Un suceso y su contrario son disjuntos y juntos cubren todo el espacio muestral.',
    },
    {
      prompt: 'Al lanzar dos monedas, ¿cuál es un suceso compuesto?',
      answer: 'Obtener exactamente una cara', distractors: ['Obtener cara-cara', 'Obtener cruz-cruz', 'Un resultado concreto de los cuatro posibles'],
      solution: '“Exactamente una cara” incluye dos resultados: cara-cruz y cruz-cara.',
    },
    {
      prompt: 'A={1,2,3} y B={3,4} en un mismo espacio muestral. ¿Qué representa A∪B?',
      answer: '{1,2,3,4}', distractors: ['{3}', '{1,2,4}', '{1,2}'],
      solution: 'La unión contiene los resultados que están en A, en B o en ambos.',
    },
  ]
  return items[family]
}

export function generateMathProportionalityEventsDepth(
  skill: SkillMeta,
  difficulty: number,
  seed: number,
): GeneratedQuestion | null {
  const normalized = seed >>> 0
  if ((normalized & 1) !== 0) return null
  if (skill.id === 'M08S02') return finish(skill, difficulty, normalized, proportionality(normalized))
  if (skill.id === 'M15S02') return finish(skill, difficulty, normalized, events(normalized))
  return null
}
