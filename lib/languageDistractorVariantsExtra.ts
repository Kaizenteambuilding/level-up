import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Card = { prompt: string; answer: string; distractors: [string, string, string]; solution: string }

const CARDS: Record<string, Card[]> = {
  L02S01: [
    {
      prompt: 'En «Mis amigos llegaron bastante cansados», ¿qué clase de palabra es «bastante»?',
      answer: 'Adverbio',
      distractors: ['Determinante', 'Adjetivo', 'Pronombre'],
      solution: 'Aquí «bastante» modifica al adjetivo «cansados» e indica grado, por eso funciona como adverbio.',
    },
    {
      prompt: 'En «Aquella casa parece muy antigua», ¿qué clase de palabra es «aquella»?',
      answer: 'Determinante',
      distractors: ['Pronombre', 'Adjetivo', 'Adverbio'],
      solution: '«Aquella» acompaña al sustantivo «casa» y lo determina.',
    },
    {
      prompt: 'En «Nosotros llegamos antes que ellos», ¿qué clase de palabra es «ellos»?',
      answer: 'Pronombre',
      distractors: ['Determinante', 'Sustantivo', 'Adverbio'],
      solution: '«Ellos» sustituye a un grupo nominal y funciona como pronombre personal.',
    },
  ],
  L02S02: [
    {
      prompt: 'En «Los alumnos de primero prepararon una exposición», ¿cuál es el sujeto completo?',
      answer: 'Los alumnos de primero',
      distractors: ['Los alumnos', 'de primero', 'una exposición'],
      solution: 'El sujeto completo incluye el núcleo «alumnos» y su complemento «de primero».',
    },
    {
      prompt: 'En «A Marta le encantan las novelas de misterio», ¿qué grupo funciona como sujeto?',
      answer: 'las novelas de misterio',
      distractors: ['A Marta', 'le encantan', 'de misterio'],
      solution: 'El verbo «encantan» concuerda en plural con «las novelas de misterio», que es el sujeto.',
    },
    {
      prompt: 'En «Mañana llegarán los nuevos estudiantes», ¿cuál es el predicado?',
      answer: 'Mañana llegarán',
      distractors: ['los nuevos estudiantes', 'llegarán los nuevos estudiantes', 'Mañana los nuevos estudiantes'],
      solution: 'El sujeto es «los nuevos estudiantes»; el resto de la oración, incluido «Mañana», forma el predicado.',
    },
  ],
  L02S03: [
    {
      prompt: 'En el grupo nominal «aquellos tres libros antiguos», ¿cuál es el núcleo?',
      answer: 'libros',
      distractors: ['aquellos', 'tres', 'antiguos'],
      solution: 'El sustantivo «libros» es el núcleo del grupo nominal; los demás elementos lo determinan o califican.',
    },
    {
      prompt: 'En «corrió bastante rápido hasta casa», ¿cuál es el núcleo del grupo verbal?',
      answer: 'corrió',
      distractors: ['rápido', 'bastante', 'hasta casa'],
      solution: 'El verbo «corrió» es el núcleo del grupo verbal; los demás elementos aportan circunstancias.',
    },
    {
      prompt: 'En el grupo «muy cerca del colegio», ¿qué palabra funciona como núcleo?',
      answer: 'cerca',
      distractors: ['muy', 'del', 'colegio'],
      solution: '«Cerca» es el adverbio principal del grupo; «muy» lo modifica y «del colegio» lo complementa.',
    },
  ],
  L04S01: [
    {
      prompt: '¿Qué palabra está correctamente acentuada?',
      answer: 'música',
      distractors: ['musíca', 'músicá', 'musica'],
      solution: '«Música» es esdrújula y lleva tilde en la antepenúltima sílaba.',
    },
    {
      prompt: '¿Qué palabra lleva tilde por contener un hiato con vocal cerrada tónica?',
      answer: 'país',
      distractors: ['aire', 'causa', 'cuidado'],
      solution: 'En «país», la í tónica rompe el diptongo y forma hiato.',
    },
    {
      prompt: '¿Cuál de estas palabras debe llevar tilde por ser llana terminada en consonante distinta de n o s?',
      answer: 'árbol',
      distractors: ['joven', 'imagen', 'lunes'],
      solution: '«Árbol» es llana y termina en l; las llanas con esa terminación llevan tilde.',
    },
  ],
  L05S02: [
    {
      prompt: '¿Cuál de estas descripciones es más objetiva?',
      answer: 'La torre mide 32 metros y tiene cuatro ventanas en cada lado.',
      distractors: ['La torre es demasiado alta y poco agradable.', 'La torre parece más elegante que los edificios cercanos.', 'La torre resulta impresionante cuando se ve desde la plaza.'],
      solution: 'Una descripción objetiva usa rasgos verificables y evita valoraciones personales.',
    },
    {
      prompt: '¿Qué opción describe principalmente el aspecto físico de una persona?',
      answer: 'Tiene el pelo corto, ojos oscuros y una cicatriz pequeña en la ceja.',
      distractors: ['Suele ayudar a sus compañeros cuando tienen dudas.', 'Prefiere trabajar solo porque se concentra mejor.', 'Se pone nervioso cuando tiene que hablar en público.'],
      solution: 'La opción correcta se centra en rasgos físicos observables, no en conducta, preferencias o emociones.',
    },
    {
      prompt: '¿Qué recurso ayuda más a precisar una descripción de un lugar?',
      answer: 'Combinar adjetivos concretos con datos espaciales y sensoriales',
      distractors: ['Usar muchos adjetivos valorativos aunque no aporten información nueva', 'Narrar varias acciones ocurridas allí sin describir el espacio', 'Repetir el nombre del lugar al inicio de cada oración'],
      solution: 'La precisión descriptiva mejora cuando se aportan rasgos concretos de aspecto, posición, sonido, tamaño u otras cualidades observables.',
    },
  ],
  E04S02: [
    {
      prompt: 'Choose the correct sentence about a completed action yesterday.',
      answer: 'Yesterday we played football after school.',
      distractors: ['Yesterday we play football after school.', 'Yesterday we were playing football every day.', 'Yesterday we have played football after school.'],
      solution: 'A completed action at a finished past time uses past simple: “played”.',
    },
    {
      prompt: 'Choose the correct negative sentence in the past.',
      answer: 'She didn’t visit the museum.',
      distractors: ['She doesn’t visit the museum yesterday.', 'She didn’t visited the museum.', 'She wasn’t visit the museum.'],
      solution: 'Past simple negative uses “didn’t” plus the base form “visit”.',
    },
    {
      prompt: 'Choose the correct question about last weekend.',
      answer: 'Did they finish the project?',
      distractors: ['Have they finished the project last weekend?', 'Did they finished the project?', 'Do they finish the project last weekend?'],
      solution: 'A question about a finished past time uses “Did + subject + base verb”.',
    },
  ],
  E05S03: [
    {
      prompt: 'Choose the sentence that expresses a planned future arrangement.',
      answer: 'I’m going to visit my cousins next weekend.',
      distractors: ['I visit my cousins every weekend.', 'I visited my cousins last weekend.', 'I’m visiting my cousins right now.'],
      solution: '“Be going to” expresses a future intention or plan.',
    },
    {
      prompt: 'Complete: “They ___ travel by train tomorrow.”',
      answer: 'are going to',
      distractors: ['were going to', 'are travelling now to', 'go to'],
      solution: 'With “they”, the future-plan structure is “are going to + base verb”.',
    },
    {
      prompt: 'Choose the correct question about a future plan.',
      answer: 'Are you going to study tonight?',
      distractors: ['Do you study tonight?', 'Did you study tonight?', 'Are you studying every night?'],
      solution: 'The question asks about an intention, so “Are you going to…?” is the appropriate form.',
    },
  ],
  E05S04: [
    {
      prompt: 'Your classmate is carrying several heavy books. What is the most appropriate offer?',
      answer: 'Shall I help you carry those?',
      distractors: ['Could you carry these for me?', 'You must carry those now.', 'Why don’t you carry more books?'],
      solution: '“Shall I…?” offers help; the other options make a request, give an order or make an unsuitable suggestion.',
    },
    {
      prompt: 'You want a classmate to close the window politely. What should you say?',
      answer: 'Could you close the window, please?',
      distractors: ['Shall I close the window for you?', 'You should close the window yesterday.', 'Why are you closing the window?'],
      solution: '“Could you… please?” is a polite request directed to the listener.',
    },
    {
      prompt: 'A friend says, “I’m bored.” Which response is the best suggestion?',
      answer: 'Why don’t we go for a walk?',
      distractors: ['Could you go for a walk for me?', 'You must have gone for a walk.', 'Shall you go for a walk yesterday?'],
      solution: '“Why don’t we…?” makes a natural shared suggestion in this context.',
    },
  ],
  E06S03: [
    {
      prompt: 'Choose the best connector: “The bus was late, ___ we arrived after the film had started.”',
      answer: 'so',
      distractors: ['although', 'because', 'however'],
      solution: 'The second clause is the result of the first, so “so” is the correct connector.',
    },
    {
      prompt: 'Choose the best connector: “I wanted to go swimming; ___, the pool was closed.”',
      answer: 'however',
      distractors: ['therefore', 'for example', 'because'],
      solution: '“However” introduces a contrast between the intention and the obstacle.',
    },
    {
      prompt: 'Which sentence works best as a topic sentence for a paragraph about learning a musical instrument?',
      answer: 'Learning an instrument can improve concentration, patience and confidence.',
      distractors: ['For example, I practise the piano for twenty minutes every evening.', 'However, my keyboard only has sixty-one keys.', 'Finally, I put the music book back on the shelf.'],
      solution: 'A topic sentence introduces the general idea that the rest of the paragraph can develop.',
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

export function generateExtraLanguageDistractorVariant(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  if (difficulty < 3) return null
  const cards = CARDS[skill.id]
  if (!cards?.length) return null

  const index = hash(seed + difficulty * 257) % cards.length
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
    tags: [skill.generator_key, 'plausible_distractors', `family:language-distractor-extra:${skill.id}:d${difficulty}:f${index}`],
  }
}
