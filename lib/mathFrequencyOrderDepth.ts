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
    tags: [skill.generator_key, 'math', 'frequency_order_depth'],
  }
}

function frequency(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion {
  const family = (seed >>> 1) % 12
  const a = 4 + (seed % 9)
  const b = 3 + ((seed >>> 4) % 8)
  const c = 2 + ((seed >>> 8) % 7)
  const total = a + b + c

  if (family === 0) return q(skill, difficulty, seed,
    `Una tabla registra A=${a}, B=${b} y C=${c}. ¿Cuál es el tamaño de la muestra?`,
    String(total), [String(a + b), String(a), String(total + 1)],
    `El total es ${a}+${b}+${c}=${total}.`)
  if (family === 1) return q(skill, difficulty, seed,
    `En ${total} observaciones, la categoría A aparece ${a} veces. ¿Cuál es su frecuencia relativa?`,
    `${a}/${total}`, [`${total}/${a}`, `${b}/${total}`, String(a)],
    'La frecuencia relativa es frecuencia absoluta dividida por el total.')
  if (family === 2) {
    const pct = 20 + 5 * (seed % 9)
    const n = 40
    const count = pct * n / 100
    return q(skill, difficulty, seed,
      `En una muestra de ${n} personas, una opción representa el ${pct} %. ¿Cuál es su frecuencia absoluta?`,
      String(count), [String(pct), String(n - count), String(count + 5)],
      `${pct}% de ${n} es ${count}.`)
  }
  if (family === 3) {
    const f1 = a
    const f2 = a + b
    const f3 = total
    return q(skill, difficulty, seed,
      `Las frecuencias acumuladas son ${f1}, ${f2} y ${f3}. ¿Cuál es la frecuencia absoluta de la segunda categoría?`,
      String(b), [String(f2), String(a), String(c)],
      `La segunda frecuencia absoluta es ${f2}-${f1}=${b}.`)
  }
  if (family === 4) return q(skill, difficulty, seed,
    `Dos grupos tienen tamaños ${total} y ${total * 2}. Para comparar la presencia de una categoría, ¿qué medida conviene usar?`,
    'La frecuencia relativa', ['La frecuencia absoluta sin más', 'El total de ambos grupos', 'Solo la moda'],
    'La frecuencia relativa permite comparar proporciones entre grupos de tamaños distintos.')
  if (family === 5) return q(skill, difficulty, seed,
    'Si todas las frecuencias absolutas de una tabla se duplican, ¿qué ocurre con las frecuencias relativas?',
    'Permanecen iguales', ['También se duplican', 'Se reducen a la mitad', 'Todas pasan a valer 1'],
    'Numerador y total se multiplican por el mismo factor, por lo que la proporción no cambia.')
  if (family === 6) return q(skill, difficulty, seed,
    `Una tabla tiene frecuencias ${a}, ${b}, ${c} y x, y un total de ${total + 6}. ¿Cuánto vale x?`,
    '6', ['5', '7', String(total)],
    `x=${total + 6}-(${a}+${b}+${c})=6.`)
  if (family === 7) return q(skill, difficulty, seed,
    'La suma de las frecuencias relativas de todas las categorías debe ser aproximadamente…',
    '1', ['0', 'El número de categorías', 'La frecuencia máxima'],
    'Las frecuencias relativas representan partes del total y suman 1, salvo pequeños redondeos.')
  if (family === 8) {
    const pct = Math.round((a / total) * 100)
    return q(skill, difficulty, seed,
      `Aparecen ${a} casos de A en un total de ${total}. Aproximadamente, ¿qué porcentaje representa?`,
      `${pct} %`, [`${a} %`, `${total} %`, `${Math.max(0, pct - 10)} %`],
      `${a}/${total} × 100 ≈ ${pct}%.`)
  }
  if (family === 9) return q(skill, difficulty, seed,
    `En una tabla, A tiene frecuencia ${a + 5}, B ${b} y C ${c}. ¿Cuál es la categoría modal?`,
    'A', ['B', 'C', 'No puede saberse'],
    'La categoría modal es la que tiene mayor frecuencia absoluta.')
  if (family === 10) return q(skill, difficulty, seed,
    'Una tabla de frecuencias relativas suma 0,93. ¿Qué interpretación es más rigurosa?',
    'Hay que revisar datos o redondeos porque debería sumar aproximadamente 1',
    ['La tabla es necesariamente correcta', 'Significa que faltan exactamente 7 datos', 'Las frecuencias relativas no necesitan guardar relación con 1'],
    'Una desviación apreciable respecto de 1 exige revisar el cálculo o el redondeo.')
  return q(skill, difficulty, seed,
    `A tiene frecuencia ${a} y B frecuencia ${b}. ¿Qué expresa ${Math.abs(a - b)}?`,
    'La diferencia entre sus frecuencias absolutas', ['La frecuencia relativa de A', 'El tamaño total', 'La media de la tabla'],
    'Restar los conteos permite comparar cuántas observaciones más tiene una categoría que otra.')
}

function uniqueWrongExpressions(
  correctValue: number,
  candidates: Array<{ expression: string; value: number }>,
): [string, string, string] {
  const seenValues = new Set<number>([correctValue])
  const distractors: string[] = []
  for (const candidate of candidates) {
    if (seenValues.has(candidate.value)) continue
    seenValues.add(candidate.value)
    distractors.push(candidate.expression)
    if (distractors.length === 3) break
  }
  if (distractors.length !== 3) throw new Error('Insufficient distinct M01S05 expression distractors')
  return distractors as [string, string, string]
}

function order(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion {
  const family = (seed >>> 1) % 12
  const a = 3 + (seed % 7)
  const b = 2 + ((seed >>> 4) % 6)
  const c = 2 + ((seed >>> 8) % 5)

  if (family === 0) {
    const result = a + b * c
    return q(skill, difficulty, seed,
      `Calcula ${a} + ${b} × ${c}.`, String(result),
      [String((a + b) * c), String(a * b + c), String(result + c)],
      `Primero ${b}×${c}=${b * c}; después se suma ${a}: ${result}.`)
  }
  if (family === 1) {
    const result = (a + b) * c
    return q(skill, difficulty, seed,
      `Calcula (${a} + ${b}) × ${c}.`, String(result),
      [String(a + b * c), String(a * c + b), String(result - c)],
      `Primero el paréntesis: ${a}+${b}=${a + b}; después ×${c}=${result}.`)
  }
  if (family === 2) {
    const dividend = b * c * 4
    const result = a + dividend / b
    return q(skill, difficulty, seed,
      `Calcula ${a} + ${dividend} ÷ ${b}.`, String(result),
      [String((a + dividend) / b), String(dividend / b), String(result + b)],
      `Primero ${dividend}÷${b}=${dividend / b}; luego +${a}=${result}.`)
  }
  if (family === 3) {
    const result = a * (b + c)
    return q(skill, difficulty, seed,
      `Calcula ${a} × (${b} + ${c}).`, String(result),
      [String(a * b + c), String(a + b * c), String(result + a)],
      `El paréntesis vale ${b + c}; ${a}×${b + c}=${result}.`)
  }
  if (family === 4) return q(skill, difficulty, seed,
    `¿Qué operación debe hacerse primero en ${a} + ${b} × ${c}?`,
    `${b} × ${c}`, [`${a} + ${b}`, `${a} + ${c}`, 'Se hacen de izquierda a derecha sin prioridad'],
    'Multiplicaciones y divisiones tienen prioridad sobre sumas y restas.')
  if (family === 5) return q(skill, difficulty, seed,
    `¿Qué cambia al pasar de ${a} + ${b} × ${c} a (${a} + ${b}) × ${c}?`,
    'El paréntesis obliga a sumar antes de multiplicar',
    ['Nada, siempre dan el mismo resultado', 'La multiplicación deja de existir', 'Solo cambia la forma de escribir, nunca el valor'],
    'Los paréntesis modifican el orden de las operaciones y pueden cambiar el resultado.')
  if (family === 6) {
    const inner = a + b
    const result = inner * c - b
    return q(skill, difficulty, seed,
      `Calcula [${a}+${b}]×${c}-${b}.`, String(result),
      [String(inner * (c - b)), String(a + b * c - b), String(result + b)],
      `Primero ${a}+${b}=${inner}; luego ×${c}=${inner * c}; finalmente -${b}=${result}.`)
  }
  if (family === 7) {
    const left = a * b + c
    const distractors = uniqueWrongExpressions(left, [
      { expression: `${a} × (${b}+${c})`, value: a * (b + c) },
      { expression: `${a}+${b}×${c}`, value: a + b * c },
      { expression: `(${a}+${b})×${c}`, value: (a + b) * c },
      { expression: `${a} × ${b} - ${c}`, value: a * b - c },
      { expression: `${a}+${b}+${c}`, value: a + b + c },
      { expression: `${a} × ${c} + ${b}`, value: a * c + b },
      { expression: `${a} × ${b} + ${c} + 1`, value: left + 1 },
      { expression: `${a} × ${b} + ${c} + 2`, value: left + 2 },
      { expression: `${a} × ${b} + ${c} + 3`, value: left + 3 },
    ])
    return q(skill, difficulty, seed,
      `¿Cuál expresión vale ${left}?`, `${a} × ${b} + ${c}`,
      distractors,
      `${a}×${b}+${c}=${left}.`)
  }
  if (family === 8) {
    const numerator = (a + b) * c
    return q(skill, difficulty, seed,
      `Calcula (${numerator} ÷ ${c}) + ${b}.`, String(a + 2 * b),
      [String(numerator / (c + b)), String(a + b), String(numerator + b)],
      `${numerator}÷${c}=${a + b}; después +${b}=${a + 2 * b}.`)
  }
  if (family === 9) return q(skill, difficulty, seed,
    'En una expresión con paréntesis, multiplicaciones y sumas, ¿cuál es la regla correcta?',
    'Resolver primero paréntesis, luego multiplicaciones/divisiones y después sumas/restas',
    ['Resolver siempre de izquierda a derecha', 'Hacer primero todas las sumas', 'Resolver primero la operación con números más grandes'],
    'Ese es el orden convencional de las operaciones.')
  if (family === 10) {
    const result = a * b - c
    return q(skill, difficulty, seed,
      `Calcula ${a} × ${b} - ${c}.`, String(result),
      [String(a * (b - c)), String(a + b - c), String(result + c)],
      `Primero ${a}×${b}=${a * b}; después se resta ${c}: ${result}.`)
  }
  const result = a + b * c - b
  return q(skill, difficulty, seed,
    `Calcula ${a} + ${b} × ${c} - ${b}.`, String(result),
    [String((a + b) * c - b), String(a + b * (c - b)), String(result + b)],
    `Primero ${b}×${c}=${b * c}; después ${a}+${b * c}-${b}=${result}.`)
}

export function generateMathFrequencyOrderDepth(
  skill: SkillMeta,
  difficulty: number,
  seed: number,
): GeneratedQuestion | null {
  const normalized = seed >>> 0
  // Preserve the already-diverse generators on half the seeds and interleave
  // these additional families on the other half.
  if ((normalized & 1) === 1) return null
  if (skill.id === 'M14S03') return frequency(skill, difficulty, normalized)
  if (skill.id === 'M01S05') return order(skill, difficulty, normalized)
  return null
}
