import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Card = { prompt: string; answer: string; distractors: [string, string, string]; solution: string }

const CARDS: Record<string, Card[]> = {
  B01S03: [
    {
      prompt: 'Tres plantas con abono crecen 12, 11 y 13 cm; tres sin abono, 5, 6 y 5 cm. ¿Qué conclusión está mejor apoyada?',
      answer: 'En estas condiciones, el grupo con abono creció más',
      distractors: [
        'El abono demuestra por sí solo que fue la causa del mayor crecimiento',
        'El abono hará crecer más cualquier especie aunque cambien las condiciones',
        'Los datos permiten asegurar que una dosis mayor de abono produciría todavía más crecimiento',
      ],
      solution: 'Los datos muestran una diferencia entre grupos en estas condiciones, pero no justifican una causalidad absoluta ni generalizaciones fuera del ensayo.',
    },
    {
      prompt: 'Dos grupos de plantas tienen medias de 8,2 cm y 8,4 cm, pero hay mucha variación dentro de cada grupo. ¿Qué interpretación es más prudente?',
      answer: 'La diferencia entre medias es pequeña y hace falta más evidencia para asegurar un efecto',
      distractors: [
        'La diferencia de 0,2 cm basta para demostrar que el segundo tratamiento funciona mejor',
        'La gran variabilidad confirma que cada tratamiento produce un efecto distinto',
        'Si las medias son diferentes, la causa debe ser necesariamente el tratamiento',
      ],
      solution: 'Una diferencia pequeña frente a una variabilidad grande exige cautela y más evidencia antes de atribuir un efecto al tratamiento.',
    },
  ],
  B02S01: [
    {
      prompt: 'Una erupción volcánica libera cenizas y gases a la atmósfera. ¿Qué interacción describe mejor?',
      answer: 'La geosfera puede modificar la atmósfera',
      distractors: [
        'La atmósfera origina las cenizas volcánicas al aumentar la presión sobre el cráter',
        'La hidrosfera produce los gases volcánicos cuando el agua subterránea se calienta',
        'La biosfera recibe materiales de la erupción, pero la atmósfera no interviene en el proceso',
      ],
      solution: 'Los materiales expulsados proceden de la geosfera y pasan a la atmósfera, mostrando una interacción entre ambos sistemas.',
    },
    {
      prompt: 'Tras varios días de lluvia intensa aumenta el caudal de un río y se erosiona una ladera. ¿Qué interacción describe mejor?',
      answer: 'La hidrosfera puede modificar la geosfera',
      distractors: [
        'La geosfera modifica la hidrosfera porque las rocas generan directamente la lluvia',
        'La biosfera modifica la geosfera porque el río transporta sedimentos',
        'La atmósfera modifica la biosfera sin que intervengan el agua ni el suelo',
      ],
      solution: 'El agua en movimiento erosiona y transporta materiales de la geosfera.',
    },
  ],
  B05S01: [
    {
      prompt: 'En un bosque, ¿qué opción representa un factor abiótico?',
      answer: 'La disponibilidad de agua en el suelo',
      distractors: [
        'La densidad de musgos que cubren el suelo',
        'La cantidad de hongos que descomponen materia orgánica',
        'La densidad de raíces que compiten por agua en el suelo',
      ],
      solution: 'El agua es un componente físico no vivo; musgos, hongos y raíces forman parte de organismos vivos.',
    },
    {
      prompt: 'En una laguna aumenta mucho el fitoplancton tras un aporte de nutrientes. ¿Qué cambio puede ocurrir después?',
      answer: 'Puede disminuir el oxígeno disuelto cuando gran cantidad de materia orgánica se descompone',
      distractors: [
        'Puede aumentar de forma sostenida el oxígeno porque el crecimiento del fitoplancton domina sobre la descomposición',
        'Puede detenerse la descomposición porque los nutrientes sustituyen la actividad de bacterias y hongos',
        'Puede mantenerse estable el oxígeno porque productores y descomponedores no afectan al mismo recurso',
      ],
      solution: 'Las proliferaciones de fitoplancton pueden generar mucha materia orgánica y aumentar el consumo de oxígeno durante su descomposición.',
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

export function generateScienceDistractorCleanup(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  if (difficulty < 3) return null
  const cards = CARDS[skill.id]
  if (!cards?.length) return null

  const index = hash(seed + difficulty * 431) % cards.length
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
    tags: [skill.generator_key, 'plausible_distractors', `family:science-cleanup:${skill.id}:d${difficulty}:f${index}`],
  }
}
