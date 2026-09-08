import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }

type Card = {
  prompt: string
  answer: string
  distractors: [string, string, string]
  solution: string
}

const CLASSIFICATION_CARDS: Card[] = [
  {
    prompt: 'Una clave dicotómica pregunta primero si un organismo tiene columna vertebral. ¿Qué criterio está utilizando?',
    answer: 'Una característica anatómica observable',
    distractors: ['El lugar donde fue encontrado', 'La edad exacta del individuo', 'La opinión de quien lo observa'],
    solution: 'La presencia de columna vertebral es una característica anatómica observable y útil para clasificar.',
  },
  {
    prompt: 'Dos organismos tienen alas, pero uno tiene plumas y otro una cubierta dura externa. ¿Qué rasgo ayuda mejor a separarlos en una clave?',
    answer: 'El tipo de cubierta corporal',
    distractors: ['El hecho de que ambos tengan alas', 'El tamaño que tenían al nacer', 'El lugar concreto donde se observaron'],
    solution: 'Un buen criterio de clasificación distingue grupos mediante rasgos observables que no comparten todos los organismos comparados.',
  },
  {
    prompt: '¿Cuál es el mejor criterio para separar primero estos organismos: pez, rana, lagarto y gorrión?',
    answer: 'Presencia o ausencia de aletas',
    distractors: ['Ser más o menos bonito', 'Haber sido observado de día o de noche', 'El nombre común que recibe en cada región'],
    solution: 'Las aletas son un rasgo anatómico observable que permite separar al pez del resto de forma objetiva.',
  },
  {
    prompt: 'En una clave, una pregunta útil debe permitir…',
    answer: 'Separar organismos según rasgos observables y definidos',
    distractors: ['Agruparlos según preferencias personales', 'Decidir por el nombre que suene más parecido', 'Clasificarlos por el orden en que se encontraron'],
    solution: 'Las claves funcionan con criterios claros, observables y reproducibles.',
  },
  {
    prompt: 'Quieres distinguir dos plantas muy parecidas. ¿Qué dato sería más útil para una clave de identificación?',
    answer: 'La forma y disposición de sus hojas',
    distractors: ['Quién las plantó', 'Cuál parece más bonita', 'El día exacto en que fueron fotografiadas'],
    solution: 'La morfología de las hojas es un rasgo observable y comparable entre ejemplares.',
  },
  {
    prompt: 'Si una clave pregunta “¿tiene seis patas?”, ¿qué tipo de información está usando?',
    answer: 'Un carácter morfológico cuantificable',
    distractors: ['Una preferencia de comportamiento', 'Una valoración subjetiva', 'Un dato histórico sobre el ejemplar'],
    solution: 'El número de patas es una característica corporal observable y medible.',
  },
  {
    prompt: '¿Qué mejora una clasificación científica de organismos?',
    answer: 'Usar varios rasgos consistentes y observables',
    distractors: ['Basarse en un parecido superficial sin comprobar más rasgos', 'Cambiar los criterios para cada ejemplar', 'Elegir el criterio después de conocer la respuesta'],
    solution: 'Combinar rasgos consistentes reduce errores y hace la clasificación reproducible.',
  },
  {
    prompt: 'Un alumno agrupa delfines y tiburones juntos solo porque ambos nadan. ¿Qué problema tiene ese criterio?',
    answer: 'Usa una semejanza funcional y omite rasgos anatómicos que los diferencian',
    distractors: ['Es correcto porque cualquier animal que nada pertenece al mismo grupo', 'Es correcto si ambos tienen un tamaño parecido', 'Solo falta ordenar los nombres alfabéticamente'],
    solution: 'Para clasificar hay que considerar rasgos diagnósticos relevantes, no una única semejanza superficial.',
  },
]

function hash(seed: number) {
  let x = seed >>> 0
  x ^= x >>> 16
  x = Math.imul(x, 0x7feb352d) >>> 0
  x ^= x >>> 15
  x = Math.imul(x, 0x846ca68b) >>> 0
  x ^= x >>> 16
  return x >>> 0
}

function rotate<T>(items: T[], shift: number) {
  const n = ((shift % items.length) + items.length) % items.length
  return items.slice(n).concat(items.slice(0, n))
}

export function generateKnowledgeDistractorVariant(
  skill: SkillMeta,
  difficulty: number,
  seed: number
): GeneratedQuestion | null {
  if (skill.id !== 'B04S02' || difficulty < 3) return null

  const index = hash(seed + difficulty * 173) % CLASSIFICATION_CARDS.length
  const card = CLASSIFICATION_CARDS[index]
  const options = rotate([card.answer, ...card.distractors], seed + difficulty)

  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt: card.prompt,
    options,
    answerIndex: options.indexOf(card.answer),
    solution: card.solution,
    tags: [skill.generator_key, 'biology_geology', 'plausible_distractors', `family:b04-classification:d${difficulty}:f${index}`],
  }
}
