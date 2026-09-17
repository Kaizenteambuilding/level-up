import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Item = { prompt: string; answer: string; distractors: [string, string, string]; solution: string }

function rotate<T>(items: T[], shift: number) {
  const offset = ((shift % items.length) + items.length) % items.length
  return items.slice(offset).concat(items.slice(0, offset))
}

function finish(skill: SkillMeta, difficulty: number, seed: number, item: Item): GeneratedQuestion {
  const raw = [item.answer, ...item.distractors]
  if (new Set(raw).size !== 4) throw new Error(`Duplicate M04S01 options for seed ${seed}: ${JSON.stringify(raw)}`)
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
    tags: [skill.generator_key, 'math', 'integer_interpretation_depth'],
  }
}

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

function integerInterpretation(seed: number): Item {
  const family = (seed >>> 2) % 22
  const magnitude = 2 + ((seed >>> 5) % 18)
  const other = 1 + ((seed >>> 10) % 12)
  const altitude = 20 + 10 * ((seed >>> 14) % 18)
  const depth = 10 + 5 * ((seed >>> 18) % 20)
  const balance = 10 + 5 * ((seed >>> 22) % 18)
  const variant = (seed >>> 26) % 4

  if (family === 0) return {
    prompt: `A primera hora se registran ${magnitude} °C bajo cero. ¿Qué entero representa la temperatura?`,
    answer: `-${magnitude}`, distractors: [String(magnitude), '0', `+${magnitude + 1}`],
    solution: 'Una temperatura bajo cero se representa con un entero negativo.',
  }
  if (family === 1) return {
    prompt: `Un ascensor está ${magnitude} plantas por debajo de la planta 0. ¿Qué número representa su posición?`,
    answer: `-${magnitude}`, distractors: [String(magnitude), '0', `+${magnitude + 1}`],
    solution: 'Las posiciones por debajo del nivel de referencia se representan con enteros negativos.',
  }
  if (family === 2) return {
    prompt: `Un submarino está a ${depth} m bajo el nivel del mar. Tomando el nivel del mar como 0, ¿qué entero representa su posición?`,
    answer: `-${depth}`, distractors: [String(depth), '0', `-${depth + 5}`],
    solution: 'Las posiciones bajo el nivel del mar se expresan con signo negativo.',
  }
  if (family === 3) return {
    prompt: `Una plataforma está a ${altitude} m sobre el nivel del mar. Tomando ese nivel como 0, ¿qué entero representa la altura?`,
    answer: String(altitude), distractors: [`-${altitude}`, '0', String(altitude + 10)],
    solution: 'Las alturas por encima del nivel de referencia se representan con enteros positivos.',
  }
  if (family === 4) return {
    prompt: `Una cuenta bancaria tiene una deuda de ${balance} €. ¿Qué entero modela ese saldo respecto de 0 €?`,
    answer: `-${balance}`, distractors: [String(balance), '0', `+${balance + 5}`],
    solution: 'Una deuda se modela como una cantidad negativa respecto del saldo cero.',
  }
  if (family === 5) return {
    prompt: `Una cuenta tiene un saldo a favor de ${balance} €. ¿Qué entero lo representa respecto de 0 €?`,
    answer: String(balance), distractors: [`-${balance}`, '0', String(balance + 5)],
    solution: 'Un saldo a favor se representa con un entero positivo.',
  }
  if (family === 6) {
    const value = magnitude
    return {
      prompt: `En una recta numérica, ¿qué entero está a ${value} unidades a la izquierda de 0?`,
      answer: `-${value}`, distractors: [String(value), '0', `-${value - 1}`],
      solution: 'Moverse a la izquierda de 0 conduce a enteros negativos.',
    }
  }
  if (family === 7) {
    const value = magnitude
    return {
      prompt: `En una recta numérica, ¿qué entero está a ${value} unidades a la derecha de 0?`,
      answer: String(value), distractors: [`-${value}`, '0', String(value - 1)],
      solution: 'Moverse a la derecha de 0 conduce a enteros positivos.',
    }
  }
  if (family === 8) {
    const a = -magnitude
    const b = other
    return {
      prompt: `¿Cuál está más a la derecha en la recta numérica: ${a} o ${b}?`,
      answer: String(b), distractors: [String(a), '0', 'Están en el mismo punto'],
      solution: 'Todo entero positivo está a la derecha de cualquier entero negativo.',
    }
  }
  if (family === 9) {
    const a = -magnitude
    const b = -other
    const greater = Math.max(a, b)
    const lower = Math.min(a, b)
    return {
      prompt: `Entre ${a} y ${b}, ¿cuál es el entero mayor?`,
      answer: String(greater), distractors: [String(lower), '0', String(Math.abs(greater))],
      solution: 'Entre negativos, es mayor el que está más cerca de 0.',
    }
  }
  if (family === 10) return {
    prompt: `¿Cuál es el opuesto de ${signed(magnitude)}?`,
    answer: `-${magnitude}`, distractors: [String(magnitude), '0', String(-magnitude - 1)],
    solution: 'Los números opuestos tienen el mismo valor absoluto y signos contrarios.',
  }
  if (family === 11) return {
    prompt: `¿Cuál es el opuesto de -${magnitude}?`,
    answer: String(magnitude), distractors: [`-${magnitude}`, '0', String(magnitude + 1)],
    solution: 'El opuesto de un número negativo es el positivo con el mismo valor absoluto.',
  }
  if (family === 12) return {
    prompt: `¿Qué representa |-${magnitude}|?`,
    answer: `La distancia de -${magnitude} a 0, que es ${magnitude}`,
    distractors: [`El número -${magnitude} con signo negativo`, 'La distancia entre 0 y 1', `El opuesto de ${magnitude}, que es -${magnitude}`],
    solution: 'El valor absoluto expresa distancia a 0 y nunca es negativo.',
  }
  if (family === 13) {
    const contexts = ['temperatura', 'saldo bancario', 'altura respecto al mar', 'planta de un edificio']
    return {
      prompt: `En un contexto de ${contexts[variant]}, ¿qué suele representar el 0?`,
      answer: 'El nivel o valor de referencia',
      distractors: ['Un valor necesariamente negativo', 'El mayor valor posible', 'La ausencia de escala numérica'],
      solution: 'El 0 actúa como referencia que separa valores positivos y negativos.',
    }
  }
  if (family === 14) {
    const start = -magnitude
    return {
      prompt: `Un ascensor está en la planta ${start} y sube hasta la planta 0. ¿Cómo se interpreta el cambio?`,
      answer: `Sube ${magnitude} plantas hasta el nivel de referencia`,
      distractors: [`Baja ${magnitude} plantas`, `Permanece en la planta ${start}`, `Sube hasta la planta ${magnitude}`],
      solution: `La distancia entre ${start} y 0 es ${magnitude}.`,
    }
  }
  if (family === 15) {
    const initial = magnitude
    return {
      prompt: `La temperatura pasa de +${initial} °C a 0 °C. ¿Qué describe correctamente el cambio?`,
      answer: `Ha descendido ${initial} °C`, distractors: [`Ha subido ${initial} °C`, 'No ha cambiado', `Ha pasado a -${initial} °C`],
      solution: `Ir de +${initial} a 0 supone disminuir ${initial} unidades.`,
    }
  }
  if (family === 16) {
    const initial = -magnitude
    return {
      prompt: `La temperatura pasa de ${initial} °C a 0 °C. ¿Qué describe correctamente el cambio?`,
      answer: `Ha subido ${magnitude} °C`, distractors: [`Ha bajado ${magnitude} °C`, 'No ha cambiado', `Ha pasado a +${magnitude} °C necesariamente`],
      solution: `Ir de ${initial} a 0 supone aumentar ${magnitude} unidades.`,
    }
  }
  if (family === 17) return {
    prompt: `En una competición, una penalización de ${magnitude} puntos se representa como…`,
    answer: `-${magnitude}`, distractors: [String(magnitude), '0', `+${magnitude + 1}`],
    solution: 'Una penalización puede modelarse como una variación negativa.',
  }
  if (family === 18) return {
    prompt: `En una competición, una bonificación de ${magnitude} puntos se representa como…`,
    answer: String(magnitude), distractors: [`-${magnitude}`, '0', String(magnitude + 1)],
    solution: 'Una bonificación se modela como una variación positiva.',
  }
  if (family === 19) {
    const values = [-magnitude, 0, other]
    const ordered = [...values].sort((a, b) => a - b)
    return {
      prompt: `Ordena de menor a mayor los enteros ${values.join(', ')}.`,
      answer: ordered.join(' < '),
      distractors: [[...ordered].reverse().join(' < '), `${ordered[1]} < ${ordered[0]} < ${ordered[2]}`, `${ordered[0]} < ${ordered[2]} < ${ordered[1]}`],
      solution: 'En la recta numérica los valores aumentan al desplazarse hacia la derecha.',
    }
  }
  if (family === 20) {
    const negative = -magnitude
    return {
      prompt: `¿Qué afirmación sobre ${negative} es correcta?`,
      answer: `Está ${magnitude} unidades a la izquierda de 0`,
      distractors: [`Está ${magnitude} unidades a la derecha de 0`, `Es mayor que ${magnitude}`, 'Coincide con 0'],
      solution: 'Un entero negativo se sitúa a la izquierda de 0 y su distancia a 0 es su valor absoluto.',
    }
  }
  const contexts = [
    `un buzo a ${depth} m bajo la superficie`,
    `una deuda de ${balance} €`,
    `una planta ${magnitude} niveles bajo la planta 0`,
    `una temperatura de ${magnitude} °C bajo cero`,
  ]
  return {
    prompt: `¿Cuál de estas expresiones interpreta correctamente ${contexts[variant]}?`,
    answer: `Un valor negativo respecto de un nivel de referencia`,
    distractors: ['Un valor positivo por estar expresado con una cantidad', 'Un valor que debe representarse siempre con 0', 'Una situación que no puede modelarse con enteros'],
    solution: 'Las situaciones por debajo, en deuda o bajo cero se representan mediante enteros negativos.',
  }
}

export function generateMathIntegerInterpretationDepth(
  skill: SkillMeta,
  difficulty: number,
  seed: number,
): GeneratedQuestion | null {
  if (skill.id !== 'M04S01') return null
  const normalized = seed >>> 0
  // Keep one in four seeds on established material for spaced review.
  if ((normalized & 3) === 3) return null
  return finish(skill, difficulty, normalized, integerInterpretation(normalized))
}
