import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Card = { prompt: string; answer: string; distractors: [string, string, string]; solution: string }

const CARDS: Record<string, Card[]> = {
  L01S01: [
    {
      prompt: 'Lee: «El transporte público reduce el número de coches, puede disminuir la contaminación y facilita los desplazamientos». ¿Cuál es la idea principal?',
      answer: 'El transporte público aporta beneficios a la movilidad y al entorno',
      distractors: [
        'El transporte público reduce sobre todo la contaminación de las ciudades',
        'El transporte público facilita los desplazamientos aunque no influye en el tráfico',
        'El transporte público sirve principalmente para reducir el número de coches',
      ],
      solution: 'La idea principal debe integrar los tres beneficios, no quedarse con uno solo ni eliminar parte de la información.',
    },
    {
      prompt: 'Lee: «Dormir bien ayuda a concentrarse, mejora el estado de ánimo y favorece el aprendizaje». ¿Cuál es la idea principal?',
      answer: 'Dormir bien aporta beneficios para aprender y sentirse mejor',
      distractors: [
        'Dormir bien mejora principalmente la concentración durante el estudio',
        'Dormir bien favorece el aprendizaje porque evita cualquier cambio de ánimo',
        'Dormir bien beneficia el estado de ánimo, pero no influye en el aprendizaje',
      ],
      solution: 'La opción correcta resume el conjunto de efectos mencionados sin reducir el texto a un solo detalle.',
    },
    {
      prompt: 'Lee: «Practicar deporte con regularidad fortalece el cuerpo, mejora el descanso y ayuda a reducir el estrés». ¿Qué resume mejor el texto?',
      answer: 'La actividad física regular aporta beneficios físicos y emocionales',
      distractors: [
        'La actividad física regular mejora sobre todo la fuerza y la resistencia corporal',
        'La actividad física regular ayuda a descansar mejor, aunque aumenta el estrés',
        'La actividad física regular reduce el estrés, pero apenas influye en el cuerpo',
      ],
      solution: 'La idea principal integra beneficios corporales y emocionales; las otras opciones recortan o contradicen parte del contenido.',
    },
  ],
  L05S03: [
    {
      prompt: '¿Qué fragmento es principalmente expositivo?',
      answer: '«La fotosíntesis transforma energía luminosa en energía química almacenada en materia orgánica.»',
      distractors: [
        '«La fotosíntesis debería estudiarse más porque es esencial para comprender los ecosistemas.»',
        '«Primero coloca la planta bajo una lámpara y después mide el oxígeno liberado.»',
        '«La hoja, verde y brillante, parecía absorber toda la luz de la ventana.»',
      ],
      solution: 'El texto expositivo explica información de forma objetiva; los demás son argumentativo, instructivo y descriptivo.',
    },
    {
      prompt: '¿Qué fragmento es principalmente argumentativo?',
      answer: '«Conviene ampliar las zonas peatonales porque reducen ruido y tráfico en el centro.»',
      distractors: [
        '«Las zonas peatonales son espacios urbanos en los que se restringe el tráfico de vehículos.»',
        '«Cruza la plaza, gira a la izquierda y continúa hasta la calle peatonal.»',
        '«La plaza tenía bancos de piedra, árboles bajos y una fuente central.»',
      ],
      solution: 'El fragmento argumentativo defiende una postura y aporta una razón; los demás informan, instruyen o describen.',
    },
    {
      prompt: '¿Qué fragmento tiene una finalidad principalmente instructiva?',
      answer: '«Guarda el archivo, cierra el programa y reinicia el equipo.»',
      distractors: [
        '«Reiniciar el equipo puede resolver algunos fallos temporales del sistema.»',
        '«El equipo se bloqueó al abrir varios programas a la vez y hubo que reiniciarlo.»',
        '«El equipo, negro y compacto, tenía dos luces encendidas en la parte frontal.»',
      ],
      solution: 'La opción correcta ordena acciones que el receptor debe realizar; las otras explican, narran o describen.',
    },
  ],
  L06S01: [
    {
      prompt: 'Una obra en la que los personajes hablan directamente y aparecen acotaciones pertenece principalmente al género…',
      answer: 'dramático o teatral',
      distractors: ['narrativo', 'lírico', 'ensayístico'],
      solution: 'Diálogo directo y acotaciones son rasgos característicos del género dramático.',
    },
    {
      prompt: 'Un texto en verso centrado en la expresión de emociones de una voz poética pertenece principalmente al género…',
      answer: 'lírico',
      distractors: ['narrativo', 'dramático', 'didáctico'],
      solution: 'La expresión subjetiva mediante una voz poética es característica de la lírica.',
    },
    {
      prompt: 'Si un texto presenta narrador, personajes, conflicto y sucesión de acciones, ¿a qué género pertenece principalmente?',
      answer: 'narrativo',
      distractors: ['dramático', 'lírico', 'argumentativo'],
      solution: 'La presencia de narrador y una secuencia de acontecimientos define el carácter narrativo.',
    },
  ],
  E01S01: [
    {
      prompt: 'Choose the best answer: “Where are you from?”',
      answer: 'I’m from Spain.',
      distractors: ['I live in Spain.', 'I’m going to Spain.', 'I’ve been to Spain.'],
      solution: 'The question asks about origin; “I’m from…” answers that directly.',
    },
    {
      prompt: 'Choose the best answer: “How old are you?”',
      answer: 'I’m twelve years old.',
      distractors: ['I was twelve last year.', 'I’ll be twelve next year.', 'I’ve lived here for twelve years.'],
      solution: 'The question asks for current age, not a past/future age or duration.',
    },
    {
      prompt: 'Choose the best answer: “What do you like doing at weekends?”',
      answer: 'I like riding my bike.',
      distractors: ['I rode my bike last weekend.', 'I’m riding my bike now.', 'I’m going to repair my bike.'],
      solution: 'The question asks about a general preference, so “I like…” is the appropriate response.',
    },
  ],
  E02S01: [
    {
      prompt: 'Complete: “My brother ___ breakfast at seven every day.”',
      answer: 'has',
      distractors: ['is having', 'had', 'have'],
      solution: 'A regular routine with third-person singular uses present simple: “has”.',
    },
    {
      prompt: 'Choose the correct negative sentence about a routine.',
      answer: 'He doesn’t play tennis on Mondays.',
      distractors: ['He isn’t playing tennis on Mondays.', 'He didn’t play tennis on Mondays.', 'He doesn’t plays tennis on Mondays.'],
      solution: 'A regular routine uses present simple; after “doesn’t”, the verb stays in the base form.',
    },
    {
      prompt: 'Choose the correct question about a regular habit.',
      answer: 'Does Sara study after dinner?',
      distractors: ['Is Sara studying after dinner?', 'Did Sara study after dinner?', 'Does Sara studies after dinner?'],
      solution: 'A repeated habit uses present simple question form: “Does + subject + base verb”.',
    },
  ],
  E03S01: [
    {
      prompt: 'Choose the sentence that describes what is happening now.',
      answer: 'They are studying in the library.',
      distractors: ['They study in the library every Tuesday.', 'They studied in the library yesterday.', 'They are going to study in the library tomorrow.'],
      solution: 'Present continuous describes an action in progress now.',
    },
    {
      prompt: 'Complete: “I ___ my homework at the moment.”',
      answer: 'am doing',
      distractors: ['do', 'did', 'am going to do'],
      solution: '“At the moment” signals present continuous: “am doing”.',
    },
    {
      prompt: 'Choose the best contrast between a routine and an action happening now.',
      answer: 'She usually walks to school, but today she is taking the bus.',
      distractors: ['She usually is walking to school, but today she takes the bus.', 'She usually walked to school, but today she takes the bus.', 'She usually walks to school, but today she took the bus.'],
      solution: 'The routine uses present simple; the temporary action happening today uses present continuous.',
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

export function generateLanguageDistractorVariant(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  if (difficulty < 3) return null
  const cards = CARDS[skill.id]
  if (!cards?.length) return null

  const index = hash(seed + difficulty * 211) % cards.length
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
    tags: [skill.generator_key, 'plausible_distractors', `family:language-distractor:${skill.id}:d${difficulty}:f${index}`],
  }
}
