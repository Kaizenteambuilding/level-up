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
  const family = seed % 18
  const cycle = Math.floor(seed / 18)
  const a = 4 + ((seed + cycle * 5) % 9)
  const b = 3 + ((seed * 3 + cycle * 7) % 8)
  const c = 2 + ((seed * 5 + cycle * 3) % 7)
  const context = ['una clase','un club','una biblioteca','un torneo'][(seed + cycle) % 4]
  const item = ['libros','fichas','respuestas','visitas'][(seed * 3 + cycle) % 4]
  const total = a + b + c

  if (family === 0) return q(skill, difficulty, seed,
    `En ${context}, una tabla de ${item} registra A=${a}, B=${b} y C=${c}. ¿Cuál es el tamaño de la muestra?`,
    String(total), [String(a + b), String(a), String(total + 1)],
    `El total es ${a}+${b}+${c}=${total}.`)
  if (family === 1) return q(skill, difficulty, seed,
    `En ${context}, de ${total} ${item}, la categoría A aparece ${a} veces. ¿Cuál es su frecuencia relativa?`,
    `${a}/${total}`, [`${total}/${a}`, `${Math.max(1, a - 1)}/${total}`, String(a)],
    'La frecuencia relativa es frecuencia absoluta dividida por el total.')
  if (family === 2) {
    const pct = 20 + 5 * (seed % 9)
    const n = 40
    const count = pct * n / 100
    return q(skill, difficulty, seed,
      `En ${context}, una muestra de ${n} ${item} asigna el ${pct} % a una opción. ¿Cuál es su frecuencia absoluta?`,
      String(count), [String(count + 2), String(Math.max(0, count - 2)), String(n)],
      `${pct}% de ${n} es ${count}.`)
  }
  if (family === 3) {
    const f1 = a
    const f2 = a + b
    const f3 = total
    return q(skill, difficulty, seed,
      `En ${context}, las frecuencias acumuladas de ${item} son ${f1}, ${f2} y ${f3}. ¿Cuál es la frecuencia absoluta de la segunda categoría?`,
      String(b), [String(b + 1), String(b + 2), String(Math.max(0, b - 1))],
      `La segunda frecuencia absoluta es ${f2}-${f1}=${b}.`)
  }
  if (family === 4) return q(skill, difficulty, seed,
    `En ${context}, dos grupos de ${item} tienen tamaños ${total} y ${total * 2}. Para comparar una categoría, ¿qué medida conviene usar?`,
    'La frecuencia relativa', ['La frecuencia absoluta sin más', 'El total de ambos grupos', 'Solo la moda'],
    'La frecuencia relativa permite comparar proporciones entre grupos de tamaños distintos.')
  if (family === 5) return q(skill, difficulty, seed,
    `Si en ${context} todas las frecuencias absolutas de ${item} se duplican, ¿qué ocurre con las frecuencias relativas?`,
    'Permanecen iguales', ['También se duplican', 'Se reducen a la mitad', 'Todas pasan a valer 1'],
    'Numerador y total se multiplican por el mismo factor, por lo que la proporción no cambia.')
  if (family === 6) return q(skill, difficulty, seed,
    `En ${context}, una tabla de ${item} tiene frecuencias ${a}, ${b}, ${c} y x, y total ${total + 6}. ¿Cuánto vale x?`,
    '6', ['5', '7', String(total)],
    `x=${total + 6}-(${a}+${b}+${c})=6.`)
  if (family === 7) return q(skill, difficulty, seed,
    `En una tabla de ${item} de ${context}, la suma de todas las frecuencias relativas debe ser aproximadamente…`,
    '1', ['0', 'El número de categorías', 'La frecuencia máxima'],
    'Las frecuencias relativas representan partes del total y suman 1, salvo pequeños redondeos.')
  if (family === 8) {
    const pct = Math.round((a / total) * 100)
    return q(skill, difficulty, seed,
      `En ${context}, aparecen ${a} ${item} de A en un total de ${total}. Aproximadamente, ¿qué porcentaje representa?`,
      `${pct} %`, [`${Math.max(0, pct - 10)} %`, `${Math.min(100, pct + 10)} %`, `${Math.max(0, pct - 5)} %`],
      `${a}/${total} × 100 ≈ ${pct}%.`)
  }
  if (family === 9) {
    const modalA = Math.max(a, b, c) + 2
    return q(skill, difficulty, seed,
      `En ${context}, A tiene ${modalA} ${item}, B ${b} y C ${c}. ¿Cuál es la categoría modal?`,
      'A', ['B', 'C', 'No puede saberse'],
      `A tiene ${modalA}, más que B (${b}) y C (${c}); por eso es la categoría modal.`)
  }
  if (family === 10) return q(skill, difficulty, seed,
    `Una tabla de ${item} de ${context} tiene frecuencias relativas que suman 0,93. ¿Qué interpretación es más rigurosa?`,
    'Hay que revisar datos o redondeos porque debería sumar aproximadamente 1',
    ['La tabla es necesariamente correcta', 'Significa que faltan exactamente 7 datos', 'Las frecuencias relativas no necesitan guardar relación con 1'],
    'Una desviación apreciable respecto de 1 exige revisar el cálculo o el redondeo.')
  if (family === 11) return q(skill, difficulty, seed,
    `En ${context}, A tiene ${a} ${item} y B ${b}. ¿Qué expresa la diferencia ${Math.abs(a - b)}?`,
    'La diferencia entre sus frecuencias absolutas', ['La frecuencia relativa de A', 'El tamaño total', 'La media de la tabla'],
    'Restar los conteos permite comparar cuántas observaciones más tiene una categoría que otra.')
  if (family === 12) return q(skill,difficulty,seed,`En ${context}, una categoría aparece ${a} veces de ${total}. ¿Qué dato falta para construir su frecuencia relativa?`,'Ninguno: basta dividir su frecuencia entre el total',['La media de los datos','El valor máximo','El orden alfabético'],'La frecuencia relativa se obtiene como frecuencia absoluta dividida por el total.')
  if (family === 13) return q(skill,difficulty,seed,`En ${context}, A aparece ${a} veces y B ${b}. Si se añaden ${c} casos a B, ¿cuál será su nueva frecuencia absoluta?`,String(b+c),[String(b),String(b+c+1),String(a+b+c)],`La nueva frecuencia de B es ${b}+${c}=${b+c}.`)
  if (family === 14) return q(skill,difficulty,seed,`Una categoría tiene frecuencia relativa ${a}/${total}. ¿Qué representa el denominador ${total}?`,'El número total de observaciones',[`Los ${a} casos de esa categoría`,'El número de categorías','La frecuencia acumulada anterior'],'El denominador de una frecuencia relativa es el tamaño total de la muestra.')
  if (family === 15) return q(skill,difficulty,seed,`En ${context}, las frecuencias de A, B y C son ${a}, ${b} y ${c}. ¿Cuál es la frecuencia acumulada hasta B?`,String(a+b),[String(b),String(total),String(a+b+1)],`Se acumulan A y B: ${a}+${b}=${a+b}.`)
  if (family === 16) return q(skill,difficulty,seed,'¿Qué diferencia esencial hay entre frecuencia absoluta y relativa?','La absoluta cuenta casos; la relativa expresa la parte respecto del total',['La absoluta siempre es un porcentaje','La relativa siempre es un número entero','Son dos nombres para el mismo valor'],'Una cuenta observaciones y la otra las compara con el total.')
  {
    const answer = a === b ? 'Tienen la misma frecuencia relativa' : a > b ? 'A' : 'B'
    const distractors: [string, string, string] = a === b ? ['A','B','No puede compararse'] : [a > b ? 'B' : 'A','Tienen la misma frecuencia relativa','No puede compararse']
    return q(skill,difficulty,seed,`En ${context}, A representa ${a} de ${total} casos y B representa ${b}. ¿Qué categoría tiene mayor frecuencia relativa?`,answer,distractors,`Como comparten el mismo total, basta comparar ${a} y ${b}.`)
  }
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
  if (skill.id === 'M14S03') {
    // Keep one in four seeds on established material for spaced review.
    if ((normalized & 3) === 3) return null
    return frequency(skill, difficulty, normalized)
  }
  // M01S05 keeps its established half-seed interleave.
  if ((normalized & 1) === 1) return null
  if (skill.id === 'M01S05') return order(skill, difficulty, normalized)
  return null
}
