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
  const raw = [item.answer, ...item.distractors]
  const options = Array.from(new Set(raw))
  if (options.length !== 4) throw new Error(`Duplicate M15S02 options for seed ${seed}: ${JSON.stringify(raw)}`)
  const rotated = rotate(options, seed + difficulty)
  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt: item.prompt,
    options: rotated,
    answerIndex: rotated.indexOf(item.answer),
    solution: item.solution,
    tags: [skill.generator_key, 'math', 'events_content_depth'],
  }
}

function set(values: number[]) {
  return `{${values.join(', ')}}`
}

function range(max: number) {
  return Array.from({ length: max }, (_, index) => index + 1)
}

function events(seed: number): Item {
  const family = (seed >>> 1) % 22
  const sides = [6, 8, 10, 12][(seed >>> 5) % 4]
  const threshold = 2 + ((seed >>> 9) % Math.max(2, sides - 3))
  const values = range(sides)
  const even = values.filter((value) => value % 2 === 0)
  const odd = values.filter((value) => value % 2 === 1)
  const above = values.filter((value) => value > threshold)
  const belowOrEqual = values.filter((value) => value <= threshold)
  const divisor = 2 + ((seed >>> 12) % 3)
  const multiples = values.filter((value) => value % divisor === 0)
  const prime = values.filter((value) => value >= 2 && Array.from({ length: Math.max(0, Math.floor(Math.sqrt(value)) - 1) }, (_, i) => i + 2).every((d) => value % d !== 0))
  const pickA = 1 + ((seed >>> 15) % Math.max(2, sides - 2))
  const pickB = Math.min(sides, pickA + 1 + ((seed >>> 18) % 2))

  if (family === 0) return {
    prompt: `Al lanzar un dado de ${sides} caras, ¿qué conjunto representa el suceso “obtener un número par”?`,
    answer: set(even), distractors: [set(odd), set(values.slice(0, even.length)), `{${sides}}`],
    solution: 'El suceso contiene todos los resultados pares del espacio muestral.',
  }
  if (family === 1) return {
    prompt: `En un dado de ${sides} caras, ¿qué suceso representa “obtener un número mayor que ${threshold}”?`,
    answer: set(above), distractors: [set(belowOrEqual), set(values.filter((value) => value >= threshold)), `{${sides}}`],
    solution: `Los resultados favorables son exactamente los mayores que ${threshold}.`,
  }
  if (family === 2) return {
    prompt: `En un dado de ${sides} caras, el suceso “obtener un número entre 1 y ${sides}, ambos incluidos” es…`,
    answer: 'Seguro', distractors: ['Imposible', 'Elemental', 'Vacío'],
    solution: 'Incluye todos los resultados del espacio muestral.',
  }
  if (family === 3) return {
    prompt: `En un dado de ${sides} caras, el suceso “obtener ${sides + 2}” es…`,
    answer: 'Imposible', distractors: ['Seguro', 'Compuesto', 'Compatible con todos'],
    solution: `${sides + 2} no pertenece al espacio muestral.`,
  }
  if (family === 4) return {
    prompt: `¿Cuál de estos es un suceso elemental al lanzar un dado de ${sides} caras?`,
    answer: `Obtener ${pickA}`, distractors: ['Obtener un número par', `Obtener un número mayor que ${threshold}`, 'Obtener un número distinto de 1'],
    solution: 'Un suceso elemental contiene un único resultado.',
  }
  if (family === 5) return {
    prompt: `En un dado de ${sides} caras, A=${set(even)} y B=${set(above)}. ¿Qué conjunto representa A∩B?`,
    answer: set(even.filter((value) => above.includes(value))),
    distractors: [set(Array.from(new Set([...even, ...above])).sort((a, b) => a - b)), set(even.filter((value) => !above.includes(value))), set(above.filter((value) => !even.includes(value)))],
    solution: 'La intersección contiene solo los resultados comunes a ambos sucesos.',
  }
  if (family === 6) {
    const left = values.filter((value) => value <= Math.floor(sides / 3))
    const right = values.filter((value) => value >= Math.ceil((2 * sides) / 3))
    return {
      prompt: `En un dado de ${sides} caras, A=${set(left)} y B=${set(right)}. ¿Cómo son A y B?`,
      answer: 'Incompatibles', distractors: ['Iguales', 'Contrarios necesariamente', 'Seguros'],
      solution: 'No comparten ningún resultado, así que no pueden ocurrir a la vez.',
    }
  }
  if (family === 7) return {
    prompt: `Si A es “obtener un múltiplo de ${divisor}” en un dado de ${sides} caras, ¿cuál es su suceso contrario?`,
    answer: set(values.filter((value) => !multiples.includes(value))), distractors: [set(multiples), `{${divisor}}`, set(values.filter((value) => value > divisor))],
    solution: 'El contrario contiene todos los resultados del espacio muestral que no pertenecen a A.',
  }
  if (family === 8) {
    const colors = ['rojo', 'azul', 'verde', 'amarillo']
    const count = 3 + ((seed >>> 7) % 2)
    const chosen = colors.slice(0, count)
    return {
      prompt: `Una ruleta solo puede caer en ${chosen.join(', ')}. ¿Cuál es su espacio muestral?`,
      answer: `{${chosen.join(', ')}}`, distractors: [`{${chosen[0]}}`, '{ruleta}', String(count)],
      solution: 'El espacio muestral reúne todos los resultados posibles del experimento.',
    }
  }
  if (family === 9) return {
    prompt: '¿Qué diferencia describe correctamente “resultado” y “suceso”?',
    answer: 'Un resultado es una posibilidad concreta; un suceso puede agrupar uno o varios resultados',
    distractors: ['Son siempre exactamente lo mismo', 'Un resultado contiene varios espacios muestrales', 'Un suceso debe contener siempre todos los resultados'],
    solution: 'Los sucesos son subconjuntos del espacio muestral; un resultado es un elemento concreto.',
  }
  if (family === 10) return {
    prompt: `Se elige al azar una tarjeta numerada del 1 al ${sides}. ¿Qué conjunto representa “múltiplo de ${divisor}”?`,
    answer: set(multiples), distractors: [set(values.filter((value) => value % divisor !== 0)), `{${divisor}}`, set(values.filter((value) => value < divisor))],
    solution: `El suceso contiene exactamente los múltiplos de ${divisor} presentes en el espacio muestral.`,
  }
  if (family === 11) return {
    prompt: 'Si A y su contrario Aᶜ se consideran en el mismo experimento, ¿qué ocurre necesariamente?',
    answer: 'Exactamente uno de los dos ocurre', distractors: ['Siempre ocurren los dos', 'Nunca ocurre ninguno', 'Deben contener el mismo resultado'],
    solution: 'A y Aᶜ son disjuntos y juntos cubren todo el espacio muestral.',
  }
  if (family === 12) {
    const outcomes = ['CC', 'CX', 'XC', 'XX']
    return {
      prompt: 'Al lanzar dos monedas, ¿qué suceso representa “obtener exactamente una cara”?',
      answer: '{CX, XC}', distractors: ['{CC}', '{XX}', `{${outcomes.join(', ')}}`],
      solution: 'Hay exactamente una cara en CX y XC.',
    }
  }
  if (family === 13) {
    const a = values.filter((value) => value <= pickB)
    const b = values.filter((value) => value >= pickA)
    const union = Array.from(new Set([...a, ...b])).sort((x, y) => x - y)
    const intersection = a.filter((value) => b.includes(value))
    return {
      prompt: `En Ω=${set(values)}, A=${set(a)} y B=${set(b)}. ¿Qué representa A∪B?`,
      answer: set(union), distractors: [set(intersection), set(a.filter((value) => !b.includes(value))), set(b.filter((value) => !a.includes(value)))],
      solution: 'La unión incluye los resultados que están en A, en B o en ambos.',
    }
  }
  if (family === 14) return {
    prompt: `En un dado de ${sides} caras, ¿qué suceso es compuesto?`,
    answer: `Obtener un número primo: ${set(prime)}`, distractors: [`Obtener ${pickA}`, `Obtener ${pickB}`, `Obtener ${sides}`],
    solution: 'Un suceso compuesto contiene más de un resultado posible.',
  }
  if (family === 15) {
    const a = even
    const b = prime
    const common = a.filter((value) => b.includes(value))
    return {
      prompt: `En un dado de ${sides} caras, A=“par” y B=“primo”. ¿Son compatibles?`,
      answer: common.length ? `Sí, comparten ${set(common)}` : 'No, no comparten resultados',
      distractors: common.length ? ['No, nunca pueden ocurrir juntos', 'Sí, porque A y B son iguales', 'Solo si el dado se lanza dos veces'] : ['Sí, siempre', 'Sí, porque ambos son sucesos', 'Solo si el dado tiene más caras'],
      solution: common.length ? 'Dos sucesos son compatibles si comparten al menos un resultado.' : 'Son incompatibles cuando su intersección es vacía.',
    }
  }
  if (family === 16) {
    const a = values.filter((value) => value <= threshold)
    const b = values.filter((value) => value > threshold)
    return {
      prompt: `En Ω=${set(values)}, A=${set(a)} y B=${set(b)}. ¿Qué relación tienen A y B?`,
      answer: 'Son sucesos contrarios', distractors: ['Son el mismo suceso', 'Son compatibles pero no cubren Ω', 'A es imposible'],
      solution: 'No comparten resultados y su unión es todo el espacio muestral.',
    }
  }
  if (family === 17) {
    const singleton = [pickA]
    return {
      prompt: `En un experimento con Ω=${set(values)}, el suceso A=${set(singleton)} es…`,
      answer: 'Elemental', distractors: ['Seguro', 'Imposible', 'Compuesto'],
      solution: 'A contiene exactamente un resultado.',
    }
  }
  if (family === 18) {
    const subset = values.filter((value) => value <= Math.max(2, threshold))
    return {
      prompt: `En Ω=${set(values)}, A=${set(subset)}. ¿Qué afirmación es correcta?`,
      answer: 'A es un subconjunto del espacio muestral', distractors: ['A contiene resultados imposibles', 'A debe coincidir siempre con Ω', 'A no puede tener más de un resultado'],
      solution: 'Todo suceso es un subconjunto del espacio muestral.',
    }
  }
  if (family === 19) return {
    prompt: `Al lanzar un dado de ${sides} caras, A=“par” y B=“impar”. ¿Qué vale A∩B?`,
    answer: '∅', distractors: [set(even), set(odd), set(values)],
    solution: 'Ningún resultado puede ser simultáneamente par e impar.',
  }
  if (family === 20) return {
    prompt: `En un dado de ${sides} caras, ¿qué conjunto representa el suceso seguro?`,
    answer: set(values), distractors: [set(even), set(odd), '∅'],
    solution: 'El suceso seguro coincide con todo el espacio muestral.',
  }

  const a = values.filter((value) => value <= threshold)
  const b = values.filter((value) => value >= threshold)
  const intersection = a.filter((value) => b.includes(value))
  return {
    prompt: `En Ω=${set(values)}, A=“≤${threshold}” y B=“≥${threshold}”. ¿Qué resultado pertenece a A∩B?`,
    answer: set(intersection), distractors: [set(a), set(b), '∅'],
    solution: `El único resultado que cumple simultáneamente ≤${threshold} y ≥${threshold} es ${threshold}.`,
  }
}

export function generateMathEventsContentDepth(
  skill: SkillMeta,
  difficulty: number,
  seed: number,
): GeneratedQuestion | null {
  if (skill.id !== 'M15S02') return null
  const normalized = seed >>> 0
  if ((normalized & 1) === 1) return null
  return finish(skill, difficulty, normalized, events(normalized))
}
