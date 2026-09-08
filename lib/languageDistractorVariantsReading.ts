import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Card = { prompt: string; answer: string; distractors: [string, string, string]; solution: string }

const CARDS: Record<string, Card[]> = {
  L01S03: [
    {
      prompt: 'Lee: «Marta entró en casa chorreando y dejó el paraguas junto a la puerta». ¿Qué se puede inferir con más seguridad?',
      answer: 'Probablemente estaba lloviendo fuera',
      distractors: [
        'Marta había estado nadando antes de volver a casa',
        'El paraguas se había roto mientras caminaba',
        'Marta había salido de casa sin paraguas y regresó a buscarlo',
      ],
      solution: 'Las pistas “chorreando” y “paraguas” apoyan la lluvia; las otras opciones son posibles, pero no están respaldadas por el texto.',
    },
    {
      prompt: 'Lee: «Leo miró el reloj tres veces, guardó sus cuadernos deprisa y se puso la chaqueta». ¿Qué inferencia está mejor apoyada?',
      answer: 'Leo esperaba tener que marcharse pronto',
      distractors: [
        'Leo acababa de llegar y quería instalarse cuanto antes',
        'Leo estaba comprobando si el reloj funcionaba correctamente',
        'Leo tenía frío y por eso decidió ordenar sus cuadernos',
      ],
      solution: 'Mirar repetidamente la hora y recoger deprisa son indicios de que debe marcharse pronto.',
    },
    {
      prompt: 'Lee: «Cuando terminó la presentación, Ana sonrió al ver varias manos levantadas para hacer preguntas». ¿Qué es razonable inferir?',
      answer: 'Ana interpretó las preguntas como una señal de interés',
      distractors: [
        'Ana pensó que la presentación había sido demasiado corta',
        'Ana supo que todas las personas estaban de acuerdo con ella',
        'Ana quiso terminar antes porque no esperaba ninguna pregunta',
      ],
      solution: 'La sonrisa ante las manos levantadas sugiere una valoración positiva del interés mostrado, sin permitir afirmar acuerdo total.',
    },
  ],
  L03S02: [
    {
      prompt: 'En «El banco aprobó el préstamo para la vivienda», ¿qué significa «banco»?',
      answer: 'Entidad financiera',
      distractors: ['Asiento público alargado', 'Acumulación de arena en aguas poco profundas', 'Grupo numeroso de peces'],
      solution: '“Préstamo” y “vivienda” sitúan la palabra en el ámbito financiero.',
    },
    {
      prompt: 'En «La hoja de la sierra estaba desgastada y apenas cortaba», ¿qué significa «hoja»?',
      answer: 'Parte cortante de una herramienta',
      distractors: ['Parte plana de una planta', 'Página de papel', 'Documento impreso de una sola página'],
      solution: 'El verbo “cortaba” y la referencia a la sierra determinan el sentido de pieza cortante.',
    },
    {
      prompt: 'En «El piloto del calentador se apagó y el aparato dejó de funcionar», ¿qué significa «piloto»?',
      answer: 'Luz o llama pequeña que indica o mantiene el funcionamiento',
      distractors: ['Persona que conduce una aeronave', 'Episodio inicial de una serie', 'Prueba inicial de un proyecto'],
      solution: 'El contexto de un calentador y su funcionamiento señala el sentido técnico de “piloto”.',
    },
  ],
  E06S01: [
    {
      prompt: 'Read: “The school library now opens earlier, has a new study area and offers homework help twice a week.” What is the text mainly about?',
      answer: 'New services and improvements at the school library',
      distractors: [
        'A change only to the library opening time',
        'A new rule about doing homework at school',
        'Problems caused by the new study area',
      ],
      solution: 'The main idea combines the earlier opening, study area and homework support.',
    },
    {
      prompt: 'Read: “Sam started cycling to school three weeks ago. He says the journey is quicker than the bus and he feels more energetic in class.” What is the main idea?',
      answer: 'Cycling to school has been a positive change for Sam',
      distractors: [
        'Sam thinks buses are always too slow',
        'Sam cycles mainly because he dislikes school',
        'Sam has been cycling for three years',
      ],
      solution: 'The text focuses on the benefits Sam has noticed since changing how he travels to school.',
    },
    {
      prompt: 'Read: “Our class is collecting old phones, batteries and cables this month so they can be recycled safely.” What is the text mainly about?',
      answer: 'A class recycling collection for electronic waste',
      distractors: [
        'A competition to buy new phones',
        'A lesson about repairing broken cables',
        'A rule banning batteries from school',
      ],
      solution: 'The shared purpose of collecting the items is safe recycling of electronic waste.',
    },
  ],
  E06S02: [
    {
      prompt: 'Read: “The sports centre closes at 8:00 on weekdays, but the swimming pool closes thirty minutes earlier.” When does the pool close on a weekday?',
      answer: 'At 7:30',
      distractors: ['At 8:00', 'At 8:30', 'At 7:00'],
      solution: 'Thirty minutes before 8:00 is 7:30.',
    },
    {
      prompt: 'Read: “Mia wanted the blue notebook, but it was sold out, so she bought the green one instead.” Which notebook did Mia buy?',
      answer: 'The green notebook',
      distractors: ['The blue notebook', 'Both notebooks', 'No notebook'],
      solution: 'The blue one was unavailable, and the text explicitly says she bought the green one instead.',
    },
    {
      prompt: 'Read: “The 10:15 train is delayed by twenty minutes. The 10:30 train is on time and takes five minutes less to reach the city.” Which train is likely to arrive first?',
      answer: 'The 10:30 train',
      distractors: ['The 10:15 train', 'They will arrive at exactly the same time', 'There is not enough information'],
      solution: 'The delayed 10:15 leaves at 10:35, while the 10:30 leaves on time and also has the shorter journey.',
    },
  ],
}

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

export function generateLanguageReadingDistractorVariant(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  if (difficulty < 3) return null
  const cards = CARDS[skill.id]
  if (!cards?.length) return null

  const index = hash(seed + difficulty * 313) % cards.length
  const card = cards[index]
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
    tags: [skill.generator_key, 'plausible_distractors', `family:language-reading:${skill.id}:d${difficulty}:f${index}`],
  }
}
