Warning: truncated output (original token count: 116881)
Total output lines: 12084

export type GeneratedQuestion = {
  skillId: string
  label: string
  difficulty: number
  seed: number
  prompt: string
  options: string[]
  answerIndex: number
  solution: string
  tags: string[]
}

type SkillMeta = {
  id: string
  name: string
  generator_key: string
}

function rng(seed: number) {
  let s = seed >>> 0
  return () =>
    ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

function mixedSeed(seed: number, salt: string) {
  let x = seed >>> 0
  for (let i = 0; i < salt.length; i += 1) {
    x ^= salt.charCodeAt(i)
    x = Math.imul(x, 16777619) >>> 0
  }
  x ^= x >>> 16
  x = Math.imul(x, 0x7feb352d) >>> 0
  x ^= x >>> 15
  x = Math.imul(x, 0x846ca68b) >>> 0
  x ^= x >>> 16
  return x >>> 0
}

function pickFamily(seed: number, count: number) {
  let x = seed >>> 0
  x ^= x >>> 16
  x = Math.imul(x, 0x7feb352d) >>> 0
  x ^= x >>> 15
  x = Math.imul(x, 0x846ca68b) >>> 0
  x ^= x >>> 16
  return (x >>> 0) % count
}

function shuffle<T>(r: () => number, items: T[]) {
  const out = [...items]

  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }

  return out
}

function mc(
  skill: SkillMeta,
  difficulty: number,
  seed: number,
  prompt: string,
  answer: string,
  distractors: string[],
  solution: string,
  tags: string[]
): GeneratedQuestion {
  // Do not reuse the first value of the question RNG for answer placement.
  // Sequential seeds otherwise make the fourth position noticeably rarer.
  const r = rng(mixedSeed(seed, `${skill.id}:${difficulty}:answers`))

  const pool = [answer, ...distractors].filter(
    (v, i, a) => a.indexOf(v) === i
  )

  // Garantiza siempre cuatro opciones distintas. Algunos distractores
  // pueden coincidir con la respuesta para ciertos valores aleatorios.
  const fractionMatch = answer.match(/^(-?\d+)\/(\d+)(.*)$/)
  const numberMatch = answer.match(/^(-?\d+(?:[.,]\d+)?)(.*)$/)
  const pairMatch = answer.match(/^\((-?\d+(?:[.,]\d+)?),\s*(-?\d+(?:[.,]\d+)?)\)$/)
  let fallbackStep = 1

  while (pool.length < 4) {
    let candidate: string

    if (fractionMatch) {
      const numerator = Number(fractionMatch[1])
      const denominator = Number(fractionMatch[2])
      const suffix = fractionMatch[3]
      candidate = `${numerator + fallbackStep}/${denominator}${suffix}`
    } else if (pairMatch) {
      const first = Number(pairMatch[1].replace(',', '.'))
      const second = Number(pairMatch[2].replace(',', '.'))
      candidate = `(${first + fallbackStep}, ${second + fallbackStep})`
    } else if (numberMatch) {
      const rawNumber = numberMatch[1].replace(',', '.')
      const numericAnswer = Number(rawNumber)
      const suffix = numberMatch[2]
      candidate = `${numericAnswer + fallbackStep}${suffix}`
    } else {
      // Los símbolos de comparación solo son distractores válidos cuando
      // la propia respuesta es un símbolo. Antes se usaban como relleno
      // para cualquier pregunta y podían aparecer opciones como "<" en
      // ejercicios de geometría.
      const comparisonSymbols = ['<', '>', '=', '≠', '≤', '≥']
      if (comparisonSymbols.includes(answer)) {
        candidate =
          comparisonSymbols.find((symbol) => !pool.includes(symbol)) ??
          `Otra opción ${fallbackStep}`
      } else {
        candidate = `Otra opción ${fallbackStep}`
      }
    }

    fallbackStep += 1

    if (!pool.includes(candidate)) {
      pool.push(candidate)
    }
  }

  const options = shuffle(r, pool.slice(0, 4))

  // M02-M11 were created before the presentation-variation audit. Keep their
  // mathematical generators intact, but give every fixed-difficulty sequence
  // eight deterministic forms. When a generator already has a semantic family,
  // retain it and append the presentation variant so anti-repetition sees both.
  const legacyUnit = /^M(0[2-9]|1[01])S\d+$/.test(skill.id)
  let finalPrompt = prompt
  let finalTags = tags
  if (legacyUnit) {
    const family = pickFamily(seed, 8)
    const openers = [
      '',
      'Elige la opción correcta. ',
      'Reto rápido: ',
      'Razona antes de responder. ',
      'Comprueba cuál es correcta. ',
      'Aplica la idea adecuada. ',
      'Selecciona la respuesta válida. ',
      'Piensa con atención: ',
    ]
    finalPrompt = `${openers[family]}${prompt}`
    const semanticFamilyIndex = tags.findIndex((tag) => tag.startsWith('family:'))
    if (semanticFamilyIndex >= 0) {
      finalTags = tags.map((tag, index) =>
        index === semanticFamilyIndex ? `${tag}:v${family}` : tag
      )
    } else {
      finalTags = [...tags, `family:legacy-${skill.generator_key}:d${difficulty}:f${family}`]
    }
  }

  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt: finalPrompt,
    options,
    answerIndex: options.indexOf(answer),
    solution,
    tags: finalTags,
  }
}

export function generateFirstEvaluationQuestion(
  skill: SkillMeta,
  difficulty: number,
  seed: number
): GeneratedQuestion {
  const r = rng(seed)

  const ri = (a: number, b: number) =>
    Math.floor(r() * (b - a + 1)) + a

  const d = Math.max(1, Math.min(5, difficulty))
  const keyAliases: Record<string, string> = {
    integers_order: 'integers_compare',
    integers_mixed: 'integers_combined',
    algebra_translate: 'algebra_expression',
    like_terms: 'algebra_like_terms',
    equation_multi_step: 'equation_two_step',
    quadrilaterals: 'quadrilateral_types',
  }
  const key = keyAliases[skill.generator_key] ?? skill.generator_key

  // =========================
  // =========================
// M01 · NÚMEROS NATURALES
// =========================

if (key === 'natural_place_value') {
  const family = pickFamily(seed, 8)
  const digits = [3, 4, 5, 6, 7][d - 1]
  const min = 10 ** (digits - 1)
  const max = 10 ** digits - 1
  const n = ri(min, max)
  const positions = [
    { label: 'unidades', divisor: 1 },
    { label: 'decenas', divisor: 10 },
    { label: 'centenas', divisor: 100 },
    { label: 'unidades de millar', divisor: 1000 },
    { label: 'decenas de millar', divisor: 10000 },
    { label: 'centenas de millar', divisor: 100000 },
    { label: 'unidades de millón', divisor: 1000000 },
  ].filter((p) => p.divisor < 10 ** digits)
  const pos = positions[ri(0, positions.length - 1)]
  const digit = Math.floor(n / pos.divisor) % 10
  const tag = `family:m01-place:d${d}:f${family}`

  if (family === 0) {
    return mc(skill, d, seed,
      `En el número ${n}, ¿qué cifra ocupa las ${pos.label}?`,
      String(digit),
      [String((digit + 1) % 10), String((digit + 3) % 10), String((digit + 7) % 10)],
      `La cifra situada en las ${pos.label} es ${digit}.`,
      ['valor_posicional', tag])
  }

  if (family === 1) {
    const value = digit * pos.divisor
    return mc(skill, d, seed,
      `En ${n}, ¿qué valor tiene la cifra ${digit} situada en las ${pos.label}?`,
      String(value),
      [String(digit), String(digit * Math.max(1, pos.divisor / 10)), String(digit * pos.divisor * 10)],
      `Su valor es ${digit} × ${pos.divisor} = ${value}.`,
      ['valor_posicional', tag])
  }

  if (family === 2) {
    const highDiv = 10 ** (digits - 1)
    const lead = Math.floor(n / highDiv)
    const rest = n - lead * highDiv
    return mc(skill, d, seed,
      `¿Qué descomposición comienza correctamente el número ${n}?`,
      `${lead * highDiv} + ${rest}`,
      [`${lead} + ${rest}`, `${lead * highDiv * 10} + ${rest}`, `${lead * highDiv} + ${rest + highDiv}`],
      `${lead} ocupa la posición de valor ${highDiv}, por eso aporta ${lead * highDiv}.`,
      ['descomposicion_natural', tag])
  }

  if (family === 3) {
    const a = ri(1, 9)
    const b = ri(0, 9)
    const c = ri(0, 9)
    const number = a * 1000 + b * 100 + c * 10 + ri(0, 9)
    return mc(skill, d, seed,
      `¿Qué número tiene ${a} unidades de millar, ${b} centenas y ${c} decenas?`,
      String(number - (number % 10)),
      [String(a * 100 + b * 10 + c), String(a * 1000 + c * 100 + b * 10), String(a * 10000 + b * 100 + c * 10)],
      `Las posiciones aportan ${a * 1000} + ${b * 100} + ${c * 10}.`,
      ['construccion_numero', tag])
  }

  if (family === 4) {
    const increase = pos.divisor
    const changed = n + increase
    return mc(skill, d, seed,
      `Si a ${n} le sumamos ${increase}, ¿qué posición estamos aumentando en una unidad antes de posibles llevadas?`,
      pos.label,
      [...positions.filter((p) => p.label !== pos.label).map((p) => p.label), 'todas las posiciones'].slice(0, 3),
      `Sumar ${increase} equivale a sumar una unidad en la posición de ${pos.label}. El resultado sería ${changed}.`,
      ['valor_posicional', 'cambio_posicion', tag])
  }

  if (family === 5) {
    const p1 = positions[Math.min(positions.length - 1, ri(1, positions.length - 1))]
    const p2 = positions[Math.max(0, positions.indexOf(p1) - 1)]
    const v1 = ri(1, 9) * p1.divisor
    const v2 = ri(1, 9) * p2.divisor
    const answer = v1 > v2 ? `${v1} es mayor` : `${v2} es mayor`
    return mc(skill, d, seed,
      `¿Qué valor posicional es mayor: ${v1} o ${v2}?`,
      answer,
      [v1 > v2 ? `${v2} es mayor` : `${v1} es mayor`, 'Son iguales', 'No se pueden comparar'],
      `Comparamos los valores completos: ${v1} y ${v2}.`,
      ['valor_posicional', 'comparacion', tag])
  }

  if (family === 6) {
    const divisor = 10 ** ri(0, Math.min(digits - 1, 5))
    const targetDigit = ri(1, 9)
    const base = Math.floor(n / (divisor * 10)) * divisor * 10 + targetDigit * divisor + (n % divisor)
    return mc(skill, d, seed,
      `¿Cuál de estos números tiene un ${targetDigit} en la posición de valor ${divisor}?`,
      String(base),
      [String(base + divisor), String(base + 10 * divisor), String(Math.max(0, base - divisor))],
      `En ${base}, la cifra de la posición ${divisor} es ${targetDigit}.`,
      ['valor_posicional', 'identificacion', tag])
  }

  const divisor = pos.divisor
  const lower = Math.floor(n / (divisor * 10)) * divisor * 10
  const upper = lower + divisor * 10
  return mc(skill, d, seed,
    `El número ${n} está entre dos múltiplos consecutivos de ${divisor * 10}. ¿Cuáles?`,
    `${lower} y ${upper}`,
    [`${lower - divisor * 10} y ${lower}`, `${upper} y ${upper + divisor * 10}`, `${lower + divisor} y ${upper + divisor}`],
    `${lower} ≤ ${n} < ${upper}.`,
    ['valor_posicional', 'encuadre', tag])
}

if (key === 'natural_compare') {
  const family = pickFamily(seed, 8)
  const ranges = [[10, 99], [100, 999], [1000, 9999], [10000, 99999], [100000, 999999]]
  const [min, max] = ranges[d - 1]
  const a = ri(min, max)
  let b = ri(min, max)
  if (b === a) b = Math.min(max, a + 1)
  const tag = `family:m01-compare:d${d}:f${family}`

  if (family === 0) {
    const answer = a > b ? '>' : '<'
    return mc(skill, d, seed, `Completa: ${a} __ ${b}`, answer,
      ['<', '>', '=', '≠'].filter((x) => x !== answer), `${a} ${answer} ${b}.`, ['comparacion', tag])
  }

  const c = ri(min, max)
  const e = ri(min, max)
  const vals = [a, b, c, e]
  const largest = Math.max(...vals)
  const smallest = Math.min(...vals)

  if (family === 1) {
    return mc(skill, d, seed, `¿Cuál es el mayor de estos números: ${vals.join(', ')}?`, String(largest),
      vals.filter((x) => x !== largest).map(String), `El mayor es ${largest}.`, ['orden_naturales', tag])
  }
  if (family === 2) {
    return mc(skill, d, seed, `¿Cuál es el menor de estos números: ${vals.join(', ')}?`, String(smallest),
      vals.filter((x) => x !== smallest).map(String), `El menor es ${smallest}.`, ['orden_naturales', tag])
  }

  const sorted = [...vals].sort((x, y) => x - y)
  if (family === 3) {
    const answer = sorted.join(' < ')
    return mc(skill, d, seed, `¿Qué orden de menor a mayor es correcto para ${vals.join(', ')}?`, answer,
      [ [...sorted].reverse().join(' < '), `${sorted[0]} < ${sorted[2]} < ${sorted[1]} < ${sorted[3]}`, `${sorted[1]} < ${sorted[0]} < ${sorted[2]} < ${sorted[3]}`],
      `Ordenamos comparando primero las cifras de mayor valor posicional.`, ['orden_naturales', tag])
  }
  if (family === 4) {
    const answer = [...sorted].reverse().join(' > ')
    return mc(skill, d, seed, `¿Qué orden de mayor a menor es correcto para ${vals.join(', ')}?`, answer,
      [sorted.join(' > '), `${sorted[3]} > ${sorted[1]} > ${sorted[2]} > ${sorted[0]}`, `${sorted[2]} > ${sorted[3]} > ${sorted[1]} > ${sorted[0]}`],
      `De mayor a menor empezamos por ${sorted[3]}.`, ['orden_naturales', tag])
  }
  if (family === 5) {
    const low = Math.min(a, b)
    const high = Math.max(a, b)
    const middle = Math.floor((low + high) / 2)
    return mc(skill, d, seed, `¿Qué número está entre ${low} y ${high}?`, String(middle),
      [String(Math.max(min, low - 1)), String(Math.min(max, high + 1)), String(high)],
      `${low} < ${middle} < ${high}.`, ['orden_naturales', 'entre', tag])
  }
  if (family === 6) {
    const target = ri(min, max)
    const delta1 = ri(1, Math.max(2, Math.floor((max - min) / 20)))
    const delta2 = delta1 + ri(2, 10)
    const x = Math.max(min, target - delta1)
    const y = Math.min(max, target + delta2)
    const answer = Math.abs(target - x) <= Math.abs(target - y) ? String(x) : String(y)
    return mc(skill, d, seed, `¿Cuál está más cerca de ${target}: ${x} o ${y}?`, answer,
      [answer === String(x) ? String(y) : String(x), String(target), 'Están a la misma distancia'],
      `Comparamos las distancias a ${target}.`, ['orden_naturales', 'distancia', tag])
  }

  const prefix = ri(1, 9) * 10 ** (Math.max(1, d))
  const x = prefix + ri(10, 49)
  const y = prefix + ri(50, 89)
  return mc(skill, d, seed, `Dos números empiezan por las mismas cifras. ¿Cuál es mayor: ${x} o ${y}?`, String(Math.max(x, y)),
    [String(Math.min(x, y)), 'Son iguales', 'No se puede saber'],
    `Al coincidir las cifras iniciales, decide la primera posición en la que son diferentes.`, ['comparacion', 'valor_posicional', tag])
}

if (key === 'natural_add_sub') {
  const family = pickFamily(seed, 8)
  const max = [100, 1000, 10000, 100000, 1000000][d - 1]
  const a = ri(Math.floor(max / 10), max)
  const b = ri(1, Math.max(2, Math.floor(max / 3)))
  const tag = `family:m01-addsub:d${d}:f${family}`

  if (family === 0) {
    const result = a + b
    return mc(skill, d, seed, `Calcula ${a} + ${b}`, String(result),
      [String(result + 10), String(Math.abs(a - b)), String(result - 1)], `${a} + ${b} = ${result}.`, ['suma_naturales', tag])
  }
  if (family === 1) {
    const high = Math.max(a, b)
    const low = Math.min(a, b)
    const result = high - low
    return mc(skill, d, seed, `Calcula ${high} - ${low}`, String(result),
      [String(high + low), String(result + 10), String(result + 1)], `${high} - ${low} = ${result}.`, ['resta_naturales', tag])
  }
  if (family === 2) {
    const total = a + b
    return mc(skill, d, seed, `Completa: ${a} + □ = ${total}`, String(b),
      [String(a), String(total), String(Math.max(0, b - 1))], `El sumando que falta es ${total} - ${a} = ${b}.`, ['suma_naturales', 'termino_desconocido', tag])
  }
  if (family === 3) {
    const total = a + b
    return mc(skill, d, seed, `Completa: ${total} - □ = ${a}`, String(b),
      [String(a), String(total), String(Math.max(0, b + 1))], `El número que falta es ${total} - ${a} = ${b}.`, ['resta_naturales', 'termino_desconocido', tag])
  }
  if (family === 4) {
    const c = ri(1, Math.max(2, Math.floor(max / 5)))
    const result = a + b - c
    return mc(skill, d, seed, `Calcula ${a} + ${b} - ${c}`, String(result),
      [String(a + b + c), String(a - b + c), String(result + c)], `Primero sumamos y después restamos: ${result}.`, ['suma_resta_naturales', 'dos_pasos', tag])
  }
  if (family === 5) {
    const roundBase = d <= 2 ? 10 : d <= 4 ? 100 : 1000
    const roundedA = Math.round(a / roundBase) * roundBase
    const roundedB = Math.round(b / roundBase) * roundBase
    const estimate = roundedA + roundedB
    return mc(skill, d, seed, `Redondeando al múltiplo de ${roundBase} más cercano, ¿qué estimación obtienes para ${a} + ${b}?`, String(estimate),
      [String(a + b), String(roundedA), String(roundedB)], `Aproximamos a ${roundedA} y ${roundedB}; suman aproximadamente ${estimate}.`, ['estimacion_suma', tag])
  }
  if (family === 6) {
    const result = a + b
    const proposed = result + ri(2, 9)
    return mc(skill, d, seed, `Alguien afirma que ${a} + ${b} = ${proposed}. ¿Qué es correcto?`, `Es incorrecto; el resultado es ${result}`,
      [`Es correcto; da ${proposed}`, `Es incorrecto; el resultado es ${a - b}`, `No se puede comprobar`], `Calculando la suma obtenemos ${result}.`, ['comprobacion_operacion', tag])
  }

  const delta = ri(2, 20)
  const result = (a + delta) + (b - Math.min(delta, b - 1))
  const adjustedB = b - Math.min(delta, b - 1)
  return mc(skill, d, seed, `Para calcular mentalmente ${a} + ${b}, se transforma en ${a + (b - adjustedB)} + ${adjustedB}. ¿Cuál es el resultado?`, String(result),
    [String(a + b + delta), String(a + b - delta), String(a + adjustedB)], `Compensar un sumando y el otro mantiene la suma: ${result}.`, ['calculo_mental', 'compensacion', tag])
}

if (key === 'natural_mult_div') {
  const family = pickFamily(seed, 8)
  const factorMax = [10, 12, 20, 50, 99][d - 1]
  const a = ri(2, factorMax)
  const b = ri(2, d <= 2 ? 12 : 25)
  const product = a * b
  const tag = `family:m01-multdiv:d${d}:f${family}`

  if (family === 0) {
    return mc(skill, d, seed, `Calcula ${a} × ${b}`, String(product),
      [String(a + b), String(product + a), String(Math.max(1, product - b))], `${a} × ${b} = ${product}.`, ['multiplicacion', tag])
  }
  if (family === 1) {
    return mc(skill, d, seed, `Calcula ${product} ÷ ${a}`, String(b),
      [String(a), String(product), String(b + 1)], `${product} ÷ ${a} = ${b}.`, ['division', tag])
  }
  if (family === 2) {
    return mc(skill, d, seed, `Completa: ${a} × □ = ${product}`, String(b),
      [String(a), String(product), String(b + 2)], `El factor que falta es ${product} ÷ ${a} = ${b}.`, ['multiplicacion', 'factor_desconocido', tag])
  }
  if (family === 3) {
    return mc(skill, d, seed, `Completa: □ ÷ ${a} = ${b}`, String(product),
      [String(a + b), String(b), String(product + a)], `El dividendo debe ser ${a} × ${b} = ${product}.`, ['division', 'dividendo_desconocido', tag])
  }
  if (family === 4) {
    const remainder = ri(1, Math.max(1, a - 1))
    const dividend = product + remainder
    return mc(skill, d, seed, `Al dividir ${dividend} entre ${a}, ¿cuál es el cociente y el resto?`, `${b} y resto ${remainder}`,
      [`${b + 1} y resto ${remainder}`, `${b} y resto ${a - remainder}`, `${a} y resto ${remainder}`], `${dividend} = ${a} × ${b} + ${remainder}.`, ['division', 'resto', tag])
  }
  if (family === 5) {
    const c = ri(1, 9)
    const result = a * (b + c)
    return mc(skill, d, seed, `Usa la distributiva: ${a} × (${b} + ${c}). ¿Cuál es el resultado?`, String(result),
      [String(a * b + c), String(product), String(result + a)], `${a}×${b} + ${a}×${c} = ${result}.`, ['multiplicacion', 'distributiva', tag])
  }
  if (family === 6) {
    const groups = a
    const each = b
    return mc(skill, d, seed, `Se reparten ${groups * each} objetos en ${groups} grupos iguales. ¿Cuántos objetos recibe cada grupo?`, String(each),
      [String(groups), String(groups * each), String(each + 1)], `${groups * each} ÷ ${groups} = ${each}.`, ['division', 'reparto', tag])
  }

  return mc(skill, d, seed, `Si ${a} × ${b} = ${product}, ¿qué división relacionada es correcta?`, `${product} ÷ ${a} = ${b}`,
    [`${product} ÷ ${b} = ${a + 1}`, `${a} ÷ ${b} = ${product}`, `${product} ÷ ${a + 1} = ${b}`], `Multiplicación y división son operaciones inversas.`, ['multiplicacion_division', 'operaciones_inversas', tag])
}

if (key === 'operation_priority') {
  const family = pickFamily(seed, 8)
  const m = d <= 2 ? 9 : d <= 4 ? 15 : 25
  const a = ri(2, m)
  const b = ri(2, Math.min(10, m))
  const c = ri(2, Math.min(9, m))
  const e = ri(2, Math.min(8, m))
  const tag = `family:m01-priority:d${d}:f${family}`

  if (family === 0) {
    const result = a + b * c
    return mc(skill, d, seed, `Calcula ${a} + ${b} × ${c}`, String(result),
      [String((a + b) * c), String(a + b + c), String(a * b + c)], `Primero multiplicamos: ${b}×${c}; después sumamos ${a}.`, ['jerarquia_operaciones', tag])
  }
  if (family === 1) {
    const result = a * b + c
    return mc(skill, d, seed, `Calcula ${a} × ${b} + ${c}`, String(result),
      [String(a * (b + c)), String(a + b + c), String(a * b - c)], `La multiplicación se resuelve antes que la suma.`, ['jerarquia_operaciones', tag])
  }
  if (family === 2) {
    const result = (a + b) * c
    return mc(skill, d, seed, `Calcula (${a} + ${b}) × ${c}`, String(result),
      [String(a + b * c), String(a * c + b), String(a + b + c)], `Primero resolvemos el paréntesis y después multiplicamos.`, ['jerarquia_operaciones', 'parentesis', tag])
  }
  if (family === 3) {
    const result = a * (b + c)
    return mc(skill, d, seed, `Calcula ${a} × (${b} + ${c})`, String(result),
      [String(a * b + c), String((a + b) * c), String(a + b + c)], `El paréntesis se resuelve primero.`, ['jerarquia_operaciones', 'parentesis', tag])
  }
  if (family === 4) {
    const result = a + b * c - e
    return mc(skill, d, seed, `Calcula ${a} + ${b} × ${c} - ${e}`, String(result),
      [String((a + b) * c - e), String(a + b * (c - e)), String(result + e)], `Primero ${b}×${c}; después suma y resta de izquierda a derecha.`, ['jerarquia_operaciones', 'tres_operaciones', tag])
  }
  if (family === 5) {
    const div = b * c
    const result = div / b + a
    return mc(skill, d, seed, `Calcula ${div} ÷ ${b} + ${a}`, String(result),
      [String(div / (b + a)), String(div + b + a), String(c * a)], `Primero ${div}÷${b}=${c}; después sumamos ${a}.`, ['jerarquia_operaciones', 'division', tag])
  }
  if (family === 6) {
    const first = `(${a} + ${b}) × ${c}`
    return mc(skill, d, seed, `En la expresión ${first}, ¿qué operación debe hacerse primero?`, `${a} + ${b}`,
      [`${b} × ${c}`, `${a} × ${c}`, 'Da igual el orden'], `Los paréntesis tienen prioridad.`, ['jerarquia_operaciones', 'razonamiento', tag])
  }

  const left = a + b * c
  const right = (a + b) * c
  return mc(skill, d, seed, `¿Cuál es mayor: ${a} + ${b} × ${c} o (${a} + ${b}) × ${c}?`, right > left ? 'La expresión con paréntesis' : 'La expresión sin paréntesis',
    [right > left ? 'La expresión sin paréntesis' : 'La expresión con paréntesis', 'Son iguales', 'No se puede determinar'],
    `Sus valores son ${left} y ${right}.`, ['jerarquia_operaciones', 'comparacion', tag])
}

if (key === 'natural_word_problem') {
  const family = pickFamily(seed, 12)
  const scale = [1, 2, 4, 7, 10][d - 1]
  const tag = `family:m01-word:d${d}:f${family}`

  if (family === 0) {
    const a = ri(20, 80 * scale)
    const b = ri(10, 50 * scale)
    return mc(skill, d, seed, `En una biblioteca había ${a} libros y llegaron ${b} más. ¿Cuántos hay ahora?`, String(a + b),
      [String(a), String(b), String(Math.abs(a - b))], `${a}+${b}=${a + b}.`, ['problema_naturales', 'suma', tag])
  }
  if (family === 1) {
    const total = ri(60, 150 * scale)
    const used = ri(10, Math.max(11, Math.floor(total / 2)))
    return mc(skill, d, seed, `Un almacén tenía ${total} cajas y envió ${used}. ¿Cuántas quedan?`, String(total - used),
      [String(total + used), String(used), String(total)], `${total}-${used}=${total - used}.`, ['problema_naturales', 'resta', tag])
  }
  if (family === 2) {
    const groups = ri(3, 8 + d)
    const each = ri(4, 12 * scale)
    return mc(skill, d, seed, `Hay ${groups} filas con ${each} asientos en cada una. ¿Cuántos asientos hay en total?`, String(groups * each),
      [String(groups + each), String(groups * each - each), String(each)], `${groups}×${each}=${groups * each}.`, ['problema_naturales', 'multiplicacion', tag])
  }
  if (family === 3) {
    const groups = ri(3, 10)
    const each = ri(4, 15 * scale)
    const total = groups * each
    return mc(skill, d, seed, `Se reparten ${total} pegatinas por igual entre ${groups} personas. ¿Cuántas recibe cada una?`, String(each),
      [String(groups), String(total), String(each + 1)], `${total}÷${groups}=${each}.`, ['problema_naturales', 'division', tag])
  }
  if (family === 4) {
    const boxes = ri(2, 6 + d)
    const each = ri(8, 20 * scale)
    const loose = ri(3, 15 * scale)
    const total = boxes * each + loose
    return mc(skill, d, seed, `Hay ${boxes} cajas con ${each} piezas cada una y ${loose} piezas sueltas. ¿Cuántas piezas hay?`, String(total),
      [String(boxes * each), String(boxes + each + loose), String(total - loose)], `${boxes}×${each}+${loose}=${total}.`, ['problema_naturales', 'dos_operaciones', tag])
  }
  if (family === 5) {
    const boxes = ri(3, 8 + d)
    const each = ri(10, 25 * scale)
    const sold = ri(5, Math.max(6, each))
    const total = boxes * each
    const result = total - sold
    return mc(skill, d, seed, `Una tienda recibe ${boxes} cajas de ${each} artículos y vende ${sold}. ¿Cuántos quedan?`, String(result),
      [String(total), String(total + sold), String(boxes + each - sold)], `Primero ${boxes}×${each}=${total}; después ${total}-${sold}=${result}.`, ['problema_naturales', 'dos_operaciones', tag])
  }
  if (family === 6) {
    const days = ri(3, 7)
    const perDay = ri(20, 60 * scale)
    const extra = ri(5, 20 * scale)
    const total = days * perDay + extra
    return mc(skill, d, seed, `Durante ${days} días se recogen ${perDay} unidades cada día y el último día se añaden ${extra} extra. ¿Cuántas se recogen en total?`, String(total),
      [String(days + perDay + extra), String(days * perDay), String(total + perDay)], `${days}×${perDay}+${extra}=${total}.`, ['problema_naturales', 'dos_operaciones', tag])
  }

  if (family === 7) {
    const groups = ri(2, 5 + d)
    const boxes = ri(2, 5)
    const each = ri(8, 18 * scale)
    const used = ri(5, 20 * scale)
    const total = groups * boxes * each
    const result = total - used
    return mc(skill, d, seed, `Hay ${groups} grupos con ${boxes} cajas cada uno y ${each} objetos por caja. Se usan ${used} objetos. ¿Cuántos quedan?`, String(result),
      [String(total), String(groups * boxes + each - used), String(total + used)], `Total: ${groups}×${boxes}×${each}=${total}; después restamos ${used}: ${result}.`, ['problema_naturales', 'varias_operaciones', tag])
  }
  if (family === 8) {
    const adults = ri(12, 35 * scale)
    const children = ri(8, 25 * scale)
    const buses = ri(2, 5 + d)
    const total = adults + children
    return mc(skill, d, seed, `A una excursión van ${adults} adultos y ${children} niños. Se reparten por igual en ${buses} autobuses solo si es posible. ¿Cuántas personas van en total antes de repartirlas?`, String(total),
      [String(adults - children), String(adults * children), String(total + buses)], `Para saber cuántas personas hay, sumamos ${adults}+${children}=${total}.`, ['problema_naturales', 'seleccionar_operacion', tag])
  }
  if (family === 9) {
    const packs = ri(3, 7 + d)
    const each = ri(6, 16 * scale)
    const needed = packs * each
    return mc(skill, d, seed, `Para preparar ${packs} equipos hacen falta ${each} fichas por equipo. ¿Qué operación permite calcular cuántas fichas se necesitan?`, `${packs} × ${each}`,
      [`${packs} + ${each}`, `${each} - ${packs}`, `${each} ÷ ${packs}`], `Hay grupos iguales, así que corresponde multiplicar.`, ['problema_naturales', 'elegir_operacion', tag])
  }
  if (family === 10) {
    const start = ri(80, 180 * scale)
    const morning = ri(10, 35 * scale)
    const afternoon = ri(10, 30 * scale)
    const result = start - morning - afternoon
    return mc(skill, d, seed, `Un depósito contiene ${start} litros. Por la mañana se usan ${morning} y por la tarde ${afternoon}. ¿Cuántos litros quedan?`, String(result),
      [String(start - morning + afternoon), String(start + morning + afternoon), String(morning + afternoon)], `${start}-${morning}-${afternoon}=${result}.`, ['problema_naturales', 'restas_sucesivas', tag])
  }

  const price = ri(4, 12 * scale)
  const count = ri(3, 9 + d)
  const paid = price * count + ri(5, 20 * scale)
  const cost = price * count
  const change = paid - cost
  return mc(skill, d, seed, `Se compran ${count} artículos de ${price} € cada uno y se pagan con ${paid} €. ¿Cuánto cambio corresponde?`, `${change} €`,
    [`${cost} €`, `${paid + cost} €`, `${paid - price} €`], `Coste: ${count}×${price}=${cost} €. Cambio: ${paid}-${cost}=${change} €.`, ['problema_naturales', 'dinero', tag])
}

  // =========================
// M02 · POTENCIAS Y RAÍCES
// =========================

if (key === 'powers_meaning') {
  const base = ri(2, d <= 2 ? 5 : 9)
  const exponent = ri(2, d <= 2 ? 3 : 5)

  if (d <= 2) {
    const answer = Array(exponent)
      .fill(String(base))
      .join(' × ')

    return mc(
      skill,
      d,
      seed,
      `¿Qué significa ${base}^${exponent}?`,
      answer,
      [
        `${base} × ${exponent}`,
        `${base} + ${base}`,
        `${exponent} × ${exponent}`,
      ],
      `Significa multiplicar ${base} por sí mismo ${exponent} veces.`,
      ['potencia_significado']
    )
  }

  if (d === 3) {
    const product = Array(exponent)
      .fill(String(base))
      .join(' × ')

    return mc(
      skill,
      d,
      seed,
      `¿Qué potencia representa ${product}?`,
      `${base}^${exponent}`,
      [
        `${exponent}^${base}`,
        `${base * exponent}^2`,
        `${base}^${exponent - 1}`,
      ],
      `${base} aparece como factor ${exponent} veces, por tanto es ${base}^${exponent}.`,
      ['potencia_significado', 'representacion']
    )
  }

  if (d === 4) {
    return mc(
      skill,
      d,
      seed,
      `En la potencia ${base}^${exponent}, ¿qué representa el exponente ${exponent}?`,
      `El número de veces que se multiplica ${base} por sí mismo`,
      [
        `El resultado de la potencia`,
        `El número que se suma a ${base}`,
        `La base de la potencia`,
      ],
      `El exponente indica cuántas veces aparece la base como factor.`,
      ['potencia_significado', 'base_exponente']
    )
  }

  return mc(
    skill,
    d,
    seed,
    `¿Cuál de estas expresiones representa correctamente ${base}^${exponent}?`,
    Array(exponent).fill(String(base)).join(' × '),
    [
      `${base} × ${exponent}`,
      Array(Math.max(2, exponent - 1))
        .fill(String(base))
        .join(' × '),
      Array(exponent)
        .fill(String(exponent))
        .join(' × '),
    ],
    `${base}^${exponent} significa multiplicar ${base} por sí mismo exactamente ${exponent} veces.`,
    ['potencia_significado', 'dificultad_alta']
  )
}

if (key === 'powers_compute') {
  const configs = [
    { baseMax: 5, expMin: 2, expMax: 2 },
    { baseMax: 7, expMin: 2, expMax: 3 },
    { baseMax: 9, expMin: 2, expMax: 4 },
    { baseMax: 10, expMin: 3, expMax: 4 },
    { baseMax: 8, expMin: 4, expMax: 5 },
  ]

  const config = configs[d - 1]

  const base = ri(2, config.baseMax)
  const exponent = ri(config.expMin, config.expMax)
  const result = base ** exponent

  return mc(
    skill,
    d,
    seed,
    `Calcula ${base}^${exponent}`,
    String(result),
    [
      String(base * exponent),
      String(base ** Math.max(1, exponent - 1)),
      String(result + base),
    ],
    `${base}^${exponent} = ${result}.`,
    ['potencias', `dificultad_${d}`]
  )
}

if (key === 'powers_ten') {
  if (d === 1) {
    const exponent = ri(1, 3)
    const result = 10 ** exponent

    return mc(
      skill,
      d,
      seed,
      `¿Cuánto vale 10^${exponent}?`,
      String(result),
      [
        String(exponent * 10),
        String(10 ** Math.max(0, exponent - 1)),
        String(result + 10),
      ],
      `10^${exponent} es 1 seguido de ${exponent} ceros.`,
      ['potencias_base_10']
    )
  }

  if (d === 2) {
    const exponent = ri(2, 5)

    return mc(
      skill,
      d,
      seed,
      `¿Cuántos ceros tiene el número 10^${exponent}?`,
      String(exponent),
      [
        String(exponent + 1),
        String(exponent - 1),
        '10',
      ],
      `10^${exponent} es 1 seguido de ${exponent} ceros.`,
      ['potencias_base_10', 'ceros']
    )
  }

  if (d === 3) {
    const exponent = ri(2, 6)
    const n = 10 ** exponent

    return mc(
      skill,
      d,
      seed,
      `¿Qué potencia de 10 es ${n}?`,
      `10^${exponent}`,
      [
        `10^${exponent - 1}`,
        `10^${exponent + 1}`,
        `${exponent}^10`,
      ],
      `${n} es 1 seguido de ${exponent} ceros, por tanto es 10^${exponent}.`,
      ['potencias_base_10', 'reconocer_potencia']
    )
  }

  if (d === 4) {
    const n = ri(2, 9)
    const exponent = ri(2, 5)
    const result = n * 10 ** exponent

    return mc(
      skill,
      d,
      seed,
      `Calcula ${n} × 10^${exponent}`,
      String(result),
      [
        String(n * exponent * 10),
        String(n * 10 ** (exponent - 1)),
        String(result + n),
      ],
      `Multiplicar por 10^${exponent} desplaza ${exponent} posiciones: resultado ${result}.`,
      ['potencias_base_10', 'multiplicacion']
    )
  }

  const a = ri(2, 5)
  const b = ri(2, 4)
  const resultExponent = a + b

  return mc(
    skill,
    d,
    seed,
    `Simplifica 10^${a} × 10^${b}`,
    `10^${resultExponent}`,
    [
      `10^${a * b}`,
      `10^${Math.abs(a - b)}`,
      `20^${resultExponent}`,
    ],
    `Al multiplicar potencias de base 10, sumamos exponentes: ${a} + ${b} = ${resultExponent}.`,
    ['potencias_base_10', 'propiedades']
  )
}

if (key === 'powers_properties') {
  const base = ri(2, d >= 4 ? 7 : 5)

  if (d === 1) {
    const m = ri(2, 4)
    const n = ri(1, 3)

    return mc(
      skill,
      d,
      seed,
      `Simplifica ${base}^${m} × ${base}^${n}`,
      `${base}^${m + n}`,
      [
        `${base}^${m * n}`,
        `${base}^${Math.abs(m - n)}`,
        `${base * 2}^${m + n}`,
      ],
      `Al multiplicar potencias de la misma base, sumamos exponentes: ${m} + ${n} = ${m + n}.`,
      ['propiedades_potencias', 'producto']
    )
  }

  if (d === 2) {
    const n = ri(1, 3)
    const m = ri(n + 2, n + 5)

    return mc(
      skill,
      d,
      seed,
      `Simplifica ${base}^${m} ÷ ${base}^${n}`,
      `${base}^${m - n}`,
      [
        `${base}^${m + n}`,
        `${base}^${m * n}`,
        `${base}^${n}`,
      ],
      `Al dividir potencias de la misma base, restamos exponentes: ${m} - ${n} = ${m - n}.`,
      ['propiedades_potencias', 'cociente']
    )
  }

  if (d === 3) {
    const m = ri(2, 4)
    const n = ri(2, 3)

    return mc(
      skill,
      d,
      seed,
      `Simplifica (${base}^${m})^${n}`,
      `${base}^${m * n}`,
      [
        `${base}^${m + n}`,
        `${base}^${m}`,
        `${base * n}^${m}`,
      ],
      `En una potencia de otra potencia multiplicamos exponentes: ${m} × ${n} = ${m * n}.`,
      ['propiedades_potencias', 'potencia_de_potencia']
    )
  }

  if (d === 4) {
    const a = ri(2, 4)
    const b = ri(1, 3)
    const c = ri(1, 3)
    const resultExp = a + b - c

    return mc(
      skill,
      d,
      seed,
      `Simplifica (${base}^${a} × ${base}^${b}) ÷ ${base}^${c}`,
      `${base}^${resultExp}`,
      [
        `${base}^${a + b + c}`,
        `${base}^${a * b - c}`,
        `${base}^${Math.abs(a - b - c)}`,
      ],
      `Primero sumamos los exponentes del producto y después restamos el del cociente: ${a}+${b}-${c}=${resultExp}.`,
      ['propiedades_potencias', 'operaciones_combinadas']
    )
  }

  const a = ri(2, 3)
  const b = ri(2, 3)
  const c = ri(1, 3)
  const resultExp = a * b + c

  return mc(
    skill,
    d,
    seed,
    `Simplifica (${base}^${a})^${b} × ${base}^${c}`,
    `${base}^${resultExp}`,
    [
      `${base}^${a + b + c}`,
      `${base}^${a * (b + c)}`,
      `${base}^${a * b - c}`,
    ],
    `Primero multiplicamos exponentes: ${a}×${b}=${a * b}. Después sumamos ${c}: ${a * b}+${c}=${resultExp}.`,
    ['propiedades_potencias', 'operaciones_combinadas', 'dificultad_alta']
  )
}

if (key === 'sqrt_exact') {
  if (d === 1) {
    const root = ri(2, 10)
    const n = root * root

    return mc(
      skill,
      d,
      seed,
      `Calcula √${n}`,
      String(root),
      [
        String(root + 1),
        String(root - 1),
        String(root * 2),
      ],
      `Como ${root} × ${root} = ${n}, entonces √${n} = ${root}.`,
      ['raiz_cuadrada']
    )
  }

  if (d === 2) {
    const root = ri(8, 15)
    const n = root * root

    return mc(
      skill,
      d,
      seed,
      `Calcula √${n}`,
      String(root),
      [
        String(root + 1),
        String(root - 2),
        String(n / 2),
      ],
      `${root}² = ${n}, por tanto √${n} = ${root}.`,
      ['raiz_cuadrada']
    )
  }

  if (d === 3) {
    const root = ri(4, 16)
    const n = root * root

    return mc(
      skill,
      d,
      seed,
      `¿Qué número elevado al cuadrado da ${n}?`,
      String(root),
      [
        String(root + 2),
        String(root - 1),
        String(root * 2),
      ],
      `${root} × ${root} = ${n}.`,
      ['raiz_cuadrada', 'operacion_inversa']
    )
  }

  if (d === 4) {
    const r1 = ri(3, 12)
    const r2 = ri(2, 10)
    const n1 = r1 * r1
    const n2 = r2 * r2
    const result = r1 + r2

    return mc(
      skill,
      d,
      seed,
      `Calcula √${n1} + √${n2}`,
      String(result),
      [
        String(r1 * r2),
        String(Math.abs(r1 - r2)),
        String(result + 1),
      ],
      `√${n1}=${r1} y √${n2}=${r2}. Por tanto ${r1}+${r2}=${result}.`,
      ['raiz_cuadrada', 'suma_raices']
    )
  }

  const r1 = ri(6, 15)
  const r2 = ri(2, r1 - 1)
  const n1 = r1 * r1
  const n2 = r2 * r2
  const result = r1 - r2

  return mc(
    skill,
    d,
    seed,
    `Calcula √${n1} - √${n2}`,
    String(result),
    [
      String(r1 + r2),
      String(r1 * r2),
      String(result + 2),
    ],
    `√${n1}=${r1} y √${n2}=${r2}. Entonces ${r1}-${r2}=${result}.`,
    ['raiz_cuadrada', 'resta_raices', 'dificultad_alta']
  )
}

 // =========================
// M03 · DIVISIBILIDAD
// =========================

if (key === 'multiples') {
  const maxBase = [6, 10, 15, 20, 30][d - 1]
  const n = ri(2, maxBase)

  if (d <= 2) {
    const k = ri(2, 8 + d)
    const answer = n * k

    return mc(
      skill,
      d,
      seed,
      `¿Cuál de estos números es múltiplo de ${n}?`,
      String(answer),
      [
        String(answer + 1),
        String(answer - 1),
        String(answer + n + 1),
      ],
      `${answer} es múltiplo de ${n} porque ${n} × ${k} = ${answer}.`,
      ['multiplos']
    )
  }

  if (d === 3) {
    const k = ri(5, 15)
    const previous = n * k
    const answer = n * (k + 1)

    return mc(
      skill,
      d,
      seed,
      `Después de ${previous}, ¿cuál es el siguiente múltiplo positivo de ${n}?`,
      String(answer),
      [
        String(previous + 1),
        String(previous + n - 1),
        String(answer + n),
      ],
      `Los múltiplos de ${n} avanzan de ${n} en ${n}. ${previous} + ${n} = ${answer}.`,
      ['multiplos', 'secuencia']
    )
  }

  if (d === 4) {
    const k1 = ri(3, 8)
    const k2 = k1 + ri(2, 5)
    const a = n * k1
    const b = n * k2
    const answer = 'Sí'

    return mc(
      skill,
      d,
      seed,
      `¿Son ${a} y ${b} múltiplos de ${n}?`,
      answer,
      [
        'No',
        `Solo ${a}`,
        `Solo ${b}`,
      ],
      `${a}=${n}×${k1} y ${b}=${n}×${k2}, así que ambos son múltiplos de ${n}.`,
      ['multiplos', 'razonamiento']
    )
  }

  const k = ri(8, 20)
  const multiple = n * k

  return mc(
    skill,
    d,
    seed,
    `Un número es múltiplo de ${n} y está entre ${multiple - n} y ${multiple + n}. ¿Cuál puede ser?`,
    String(multiple),
    [
      String(multiple - 1),
      String(multiple + 1),
      String(multiple + Math.max(2, Math.floor(n / 2))),
    ],
    `${multiple}=${n}×${k}, por tanto es múltiplo de ${n}.`,
    ['multiplos', 'dificultad_alta']
  )
}

if (key === 'divisors') {
  if (d <= 2) {
    const divisor = ri(2, d === 1 ? 8 : 12)
    const k = ri(2, 10)
    const total = divisor * k

    return mc(
      skill,
      d,
      seed,
      `¿Cuál de estos números es divisor de ${total}?`,
      String(divisor),
      [
        String(divisor + 1),
        String(total - 1),
        String(total + 1),
      ],
      `${total} ÷ ${divisor} = ${k}, sin resto.`,
      ['divisores']
    )
  }

  if (d === 3) {
    const a = ri(2, 8)
    const b = ri(2, 8)
    const total = a * b

    return mc(
      skill,
      d,
      seed,
      `¿Es ${a} divisor de ${total}?`,
      'Sí',
      [
        'No',
        'Solo si el cociente es 1',
        'No se puede saber',
      ],
      `${total} ÷ ${a} = ${b}, que es exacto.`,
      ['divisores', 'division_exacta']
    )
  }

  if (d === 4) {
    const a = ri(2, 6)
    const b = ri(2, 6)
    const c = ri(2, 5)
    const total = a * b * c
    const divisor = a * b

    return mc(
      skill,
      d,
      seed,
      `¿Cuál de estos números es divisor de ${total}?`,
      String(divisor),
      [
        String(divisor + 1),
        String(total - 1),
        String(divisor + c),
      ],
      `${total} ÷ ${divisor} = ${c}, sin resto.`,
      ['divisores', 'compuestos']
    )
  }

  const a = ri(3, 9)
  const b = ri(3, 9)
  const total = a * b

  return mc(
    skill,
    d,
    seed,
    `Si ${total} = ${a} × ${b}, ¿qué afirmación es correcta?`,
    `${a} y ${b} son divisores de ${total}`,
    [
      `${total} es divisor de ${a}`,
      `${a + b} es siempre divisor de ${total}`,
      `Solo ${a} es divisor de ${total}`,
    ],
    `Como ${total}=${a}×${b}, tanto ${a} como ${b} dividen exactamente a ${total}.`,
    ['divisores', 'razonamiento', 'dificultad_alta']
  )
}

if (key === 'divisibility_rules') {
  const rules = [
    {
      divisor: 2,
      make: () => ri(10, 99) * 2,
      explanation: 'Su última cifra es par.',
    },
    {
      divisor: 3,
      make: () => ri(10, 99) * 3,
      explanation: 'La suma de sus cifras es múltiplo de 3.',
    },
    {
      divisor: 5,
      make: () => ri(2, 30) * 5,
      explanation: 'Termina en 0 o en 5.',
    },
    {
      divisor: 10,
      make: () => ri(2, 30) * 10,
      explanation: 'Termina en 0.',
    },
  ]

  if (d <= 2) {
    const rule = rules[ri(0, d === 1 ? 1 : 3)]
    const n = rule.make()

    return mc(
      skill,
      d,
      seed,
      `¿Es ${n} divisible entre ${rule.divisor}?`,
      'Sí',
      [
        'No',
        'Solo si es primo',
        'No se puede saber',
      ],
      rule.explanation,
      ['criterios_divisibilidad']
    )
  }

  if (d === 3) {
    const n = ri(10, 80) * 6

    return mc(
      skill,
      d,
      seed,
      `¿Por cuáles de estos números es divisible ${n}?`,
      '2 y 3',
      [
        'Solo 2',
        'Solo 3',
        'Solo 5',
      ],
      `${n} es par y además es múltiplo de 3, por tanto es divisible entre 2 y entre 3.`,
      ['criterios_divisibilidad', 'varios_criterios']
    )
  }

  if (d === 4) {
    const n = ri(10, 50) * 30

    return mc(
      skill,
      d,
      seed,
      `El número ${n} es divisible entre...`,
      '2, 3, 5 y 10',
      [
        'Solo 2 y 3',
        'Solo 5 y 10',
        'Solo 3 y 5',
      ],
      `${n} es múltiplo de 30, por lo que cumple los criterios de 2, 3, 5 y 10.`,
      ['criterios_divisibilidad', 'combinados']
    )
  }

  const base = ri(10, 40)
  const n = base * 15

  return mc(
    skill,
    d,
    seed,
    `Sabemos que ${n} es múltiplo de 15. ¿Qué afirmación es necesariamente cierta?`,
    'Es divisible entre 3 y entre 5',
    [
      'Es siempre divisible entre 2',
      'Es siempre divisible entre 10',
      'Es siempre un número primo',
    ],
    `Como 15=3×5, todo múltiplo de 15 es divisible entre 3 y entre 5.`,
    ['criterios_divisibilidad', 'razonamiento', 'dificultad_alta']
  )
}

if (key === 'prime_numbers') {
  const smallPrimes = [2, 3, 5, 7, 11, 13, 17, 19]
  const mediumPrimes = [23, 29, 31, 37, 41, 43, 47]
  const largePrimes = [53, 59, 61, 67, 71, 73, 79, 83, 89, 97]

  if (d <= 2) {
    const list = d === 1 ? smallPrimes : [...smallPrimes, ...mediumPrimes]
    const p = list[ri(0, list.length - 1)]

    return mc(
      skill,
      d,
      seed,
      `¿Cuál de estos números es primo?`,
      String(p),
      [
        String(p * 2),
        String(p * 3),
        String((p + 1) * 2),
      ],
      `${p} tiene exactamente dos divisores positivos: 1 y ${p}.`,
      ['primos']
    )
  }

  if (d === 3) {
    const p = mediumPrimes[ri(0, mediumPrimes.length - 1)]

    return mc(
      skill,
      d,
      seed,
      `¿Es ${p} un número primo?`,
      'Sí',
      [
        'No',
        'Solo si es par',
        'No se puede determinar',
      ],
      `${p} solo es divisible entre 1 y ${p}.`,
      ['primos', 'reconocimiento']
    )
  }

  if (d === 4) {
    const p = largePrimes[ri(0, largePrimes.length - 1)]
    const composite1 = ri(6, 12) * ri(2, 5)
    const composite2 = ri(5, 10) * ri(3, 6)

    return mc(
      skill,
      d,
      seed,
      `¿Cuál de estos números es primo?`,
      String(p),
      [
        String(composite1),
        String(composite2),
        String(p * 2),
      ],
      `${p} no tiene divisores positivos distintos de 1 y de sí mismo.`,
      ['primos', 'numeros_mayores']
    )
  }

  const p = largePrimes[ri(0, largePrimes.length - 1)]

  return mc(
    skill,
    d,
    seed,
    `¿Qué afirmación sobre ${p} es correcta?`,
    `Sus únicos divisores positivos son 1 y ${p}`,
    [
      `Es divisible entre 2`,
      `Tiene exactamente tres divisores`,
      `Es múltiplo de 5`,
    ],
    `${p} es primo porque tiene exactamente dos divisores positivos.`,
    ['primos', 'razonamiento', 'dificultad_alta']
  )
}

if (key === 'prime_factorization') {
  const primes = [2, 3, 5, 7]

  if (d === 1) {
    const a = primes[ri(0, 2)]
    const b = primes[ri(0, 2)]
    const factors = [a, b].sort((x, y) => x - y)
    const n = a * b
    const answer = factors.join(' × ')

    return mc(
      skill,
      d,
      seed,
      `Descompón ${n} en factores primos`,
      answer,
      [
        `1 × ${n}`,
        `${a + b} × 1`,
        `${n} × 1`,
      ],
      `${n} = ${answer}.`,
      ['factorizacion_primos']
    )
  }

  if (d <= 3) {
    const count = d === 2 ? 3 : 4
    const factors = Array.from(
      { length: count },
      () => primes[ri(0, d === 2 ? 2 : 3)]
    ).sort((x, y) => x - y)

    const n = factors.reduce((acc, value) => acc * value, 1)
    const answer = factors.join(' × ')

    return mc(
      skill,
      d,
      seed,
      `Descompón ${n} en factores primos`,
      answer,
      [
        `1 × ${n}`,
        `${factors[0]} × ${n}`,
        `${factors.reduce((a, b) => a + b, 0)} × 1`,
      ],
      `${n} = ${answer}.`,
      ['factorizacion_primos', `dificultad_${d}`]
    )
  }

  if (d === 4) {
    const p = primes[ri(0, 2)]
    const q = primes[ri(1, 3)]
    const n = p * p * q
    const answer = `${p}^2 × ${q}`

    return mc(
      skill,
      d,
      seed,
      `Escribe la descomposición en factores primos de ${n} usando potencias cuando sea posible`,
      answer,
      [
        `${p} × ${q}^2`,
        `${p}^3 × ${q}`,
        `${p + q}^2`,
      ],
      `${n}=${p}×${p}×${q}=${p}^2×${q}.`,
      ['factorizacion_primos', 'potencias']
    )
  }

  const p = primes[ri(0, 2)]
  const q = primes[ri(1, 3)]
  const n = p * p * q * q
  const answer = `${p}^2 × ${q}^2`

  return mc(
    skill,
    d,
    seed,
    `Descompón ${n} completamente en factores primos`,
    answer,
    [
      `${p} × ${q}`,
      `${p}^2 × ${q}`,
      `${p} × ${q}^2`,
    ],
    `${n}=${p}×${p}×${q}×${q}=${p}^2×${q}^2.`,
    ['factorizacion_primos', 'potencias', 'dificultad_alta']
  )
}

if (key === 'gcd') {
  const gcdValue = (x: number, y: number): number => {
    x = Math.abs(x)
    y = Math.abs(y)

    while (y !== 0) {
      const temp = y
      y = x % y
      x = temp
    }

    return x
  }

  if (d <= 2) {
    const g = ri(2, d === 1 ? 5 : 8)
    const a = g * ri(2, 6)
    const b = g * ri(2, 6)
    const result = gcdValue(a, b)

    return mc(
      skill,
      d,
      seed,
      `Calcula MCD(${a}, ${b})`,
      String(result),
      [
        String(Math.min(a, b)),
        String(a * b),
        String(result + 1),
      ],
      `El mayor número que divide exactamente a ${a} y ${b} es ${result}.`,
      ['mcd']
    )
  }

  if (d === 3) {
    const g = ri(3, 10)
    const a = g * ri(3, 9)
    const b = g * ri(4, 10)
    const result = gcdValue(a, b)

    return mc(
      skill,
      d,
      seed,
      `Calcula el máximo común divisor de ${a} y ${b}`,
      String(result),
      [
        String(g),
        String(result * 2),
        String(Math.min(a, b)),
      ].filter((x) => x !== String(result)),
      `El MCD de ${a} y ${b} es ${result}.`,
      ['mcd', 'numeros_mayores']
    )
  }

  if (d === 4) {
    const g = ri(2, 8)
    const a = g * ri(4, 10)
    const b = g * ri(5, 12)
    const c = g * ri(3, 9)
    const result = gcdValue(gcdValue(a, b), c)

    return mc(
      skill,
      d,
      seed,
      `Calcula MCD(${a}, ${b}, ${c})`,
      String(result),
      [
        String(g),
        String(result + 2),
        String(Math.min(a, b, c)),
      ].filter((x) => x !== String(result)),
      `El mayor divisor común de los tres números es ${result}.`,
      ['mcd', 'tres_numeros']
    )
  }

  const g = ri(3, 12)
  const a = g * ri(5, 12)
  const b = g * ri(6, 14)
  const result = gcdValue(a, b)

  return mc(
    skill,
    d,
    seed,
    `Se quieren hacer grupos iguales usando ${a} objetos de un tipo y ${b} de otro, sin que sobre ninguno. ¿Cuál es el mayor número de grupos posibles?`,
    String(result),
    [
      String(a + b),
      String(Math.min(a, b)),
      String(result + 1),
    ],
    `El mayor número de grupos posibles es MCD(${a}, ${b}) = ${result}.`,
    ['mcd', 'problema', 'dificultad_alta']
  )
}

if (key === 'lcm') {
  const gcdValue = (x: number, y: number): number => {
    x = Math.abs(x)
    y = Math.abs(y)

    while (y !== 0) {
      const temp = y
      y = x % y
      x = temp
    }

    return x
  }

  const lcmValue = (x: number, y: number) =>
    Math.abs(x * y) / gcdValue(x, y)

  if (d <= 2) {
    const a = ri(2, d === 1 ? 6 : 10)
    const b = ri(2, d === 1 ? 6 : 10)
    const result = lcmValue(a, b)

    return mc(
      skill,
      d,
      seed,
      `Calcula mcm(${a}, ${b})`,
      String(result),
      [
        String(a * b),
        String(Math.max(a, b)),
        String(gcdValue(a, b)),
      ].filter((x) => x !== String(result)),
      `El mínimo común múltiplo de ${a} y ${b} es ${result}.`,
      ['mcm']
    )
  }

  if (d === 3) {
    const a = ri(4, 12)
    const b = ri(5, 15)
    const result = lcmValue(a, b)

    return mc(
      skill,
      d,
      seed,
      `¿Cuál es el menor múltiplo positivo común de ${a} y ${b}?`,
      String(result),
      [
        String(a * b),
        String(a + b),
        String(Math.max(a, b)),
      ].filter((x) => x !== String(result)),
      `Ese número es el mcm(${a}, ${b}) = ${result}.`,
      ['mcm', 'reconocimiento']
    )
  }

  if (d === 4) {
    const a = ri(2, 7)
    const b = ri(3, 8)
    const c = ri(4, 9)
    const result = lcmValue(lcmValue(a, b), c)

    return mc(
      skill,
      d,
      seed,
      `Calcula mcm(${a}, ${b}, ${c})`,
      String(result),
      [
        String(a * b * c),
        String(Math.max(a, b, c)),
        String(result + Math.min(a, b, c)),
      ].filter((x) => x !== String(result)),
      `El menor múltiplo común de los tres números es ${result}.`,
      ['mcm', 'tres_numeros']
    )
  }

  const a = ri(3, 8)
  const b = ri(4, 10)
  const result = lcmValue(a, b)

  return mc(
    skill,
    d,
    seed,
    `Dos señales se repiten cada ${a} y ${b} minutos. Si coinciden ahora, ¿dentro de cuántos minutos volverán a coincidir?`,
    String(result),
    [
      String(a + b),
      String(a * b),
      String(Math.max(a, b)),
    ].filter((x) => x !== String(result)),
    `Volverán a coincidir al cabo del mcm(${a}, ${b}) = ${result} minutos.`,
    ['mcm', 'problema', 'dificultad_alta']
  )
}

  // =========================
// M04 · NÚMEROS ENTEROS
// =========================

if (key === 'integers_context') {
  const variants = [
    {
      prompt: 'Un ascensor está 3 plantas bajo la planta baja. ¿Qué número entero representa su posición?',
      answer: '-3',
      distractors: ['3', '0', '-2'],
      solution: 'Las plantas bajo la planta baja se representan con números negativos.',
    },
    {
      prompt: 'La temperatura es de 5 °C bajo cero. ¿Qué número entero la representa?',
      answer: '-5',
      distractors: ['5', '0', '-4'],
      solution: 'Una temperatura bajo cero se representa con un número negativo.',
    },
    {
      prompt: 'Un submarino está a 8 metros bajo el nivel del mar. ¿Qué número representa su posición?',
      answer: '-8',
      distractors: ['8', '0', '-7'],
      solution: 'Las posiciones bajo el nivel del mar se representan con números negativos.',
    },
    {
      prompt: 'Un jugador gana 6 puntos. ¿Qué número entero representa el cambio en su puntuación?',
      answer: '+6',
      distractors: ['-6', '0', '+5'],
      solution: 'Una ganancia se representa mediante un número positivo.',
    },
  ]

  if (d <= 2) {
    const v = variants[ri(0, variants.length - 1)]

    return mc(
      skill,
      d,
      seed,
      v.prompt,
      v.answer,
      v.distractors,
      v.solution,
      ['enteros_contexto']
    )
  }

  const amount = ri(3, d === 3 ? 10 : 20)

  if (d === 3) {
    return mc(
      skill,
      d,
      seed,
      `Una cuenta tiene un saldo de ${amount} € y se produce un cargo de ${amount + 4} €. ¿Qué número entero representa el saldo final?`,
      '-4',
      [
        '4',
        String(amount + 4),
        String(-amount),
      ],
      `${amount} - ${amount + 4} = -4. El saldo queda 4 € por debajo de cero.`,
      ['enteros_contexto', 'saldo']
    )
  }

  if (d === 4) {
    const start = ri(-10, 5)
    const change = ri(6, 15)
    const result = start - change

    return mc(
      skill,
      d,
      seed,
      `La temperatura era de ${start} °C y baja ${change} °C. ¿Qué temperatura queda?`,
      `${result} °C`,
      [
        `${start + change} °C`,
        `${Math.abs(result)} °C`,
        `${-change} °C`,
      ],
      `${start} - ${change} = ${result}.`,
      ['enteros_contexto', 'cambios']
    )
  }

  const start = ri(-15, -3)
  const rise = ri(4, 12)
  const fall = ri(5, 14)
  const result = start + rise - fall

  return mc(
    skill,
    d,
    seed,
    `Un submarino está a ${start} m respecto al nivel del mar. Sube ${rise} m y después baja ${fall} m. ¿A qué nivel queda?`,
    `${result} m`,
    [
      `${start + rise + fall} m`,
      `${Math.abs(result)} m`,
      `${start - rise + fall} m`,
    ],
    `${start} + ${rise} - ${fall} = ${result}.`,
    ['enteros_contexto', 'varios_cambios', 'dificultad_alta']
  )
}

if (key === 'integers_compare') {
  const limit = [6, 10, 20, 50, 100][d - 1]
  let a = ri(-limit, limit)
  let b = ri(-limit, limit)

  while (a === b) b = ri(-limit, limit)

  if (d <= 2) {
    const answer = a > b ? '>' : '<'

    return mc(
      skill,
      d,
      seed,
      `Completa: ${a} __ ${b}`,
      answer,
      ['<', '>', '=', '≤'].filter((x) => x !== answer),
      `En la recta numérica, ${a} está ${a > b ? 'a la derecha' : 'a la izquierda'} de ${b}.`,
      ['comparar_enteros']
    )
  }

  if (d === 3) {
    const values = [ri(-limit, -1), ri(-limit, -1), ri(0, limit)]
    const answer = String(Math.max(...values))

    return mc(
      skill,
      d,
      seed,
      `¿Cuál es el mayor de estos números: ${values.join(', ')}?`,
      answer,
      values.map(String).filter((x) => x !== answer).concat([String(-limit)]),
      `El número mayor es ${answer}.`,
      ['comparar_enteros', 'orden']
    )
  }

  if (d === 4) {
    const x = ri(2, limit)
    const values = [-x, x, 0, -x - 1]
    const answer = String(-x - 1)

    return mc(
      skill,
      d,
      seed,
      `¿Cuál es el menor de estos números: ${values.join(', ')}?`,
      answer,
      values.map(String).filter((v) => v !== answer),
      `Entre números negativos, el que tiene mayor valor absoluto está más a la izquierda. El menor es ${answer}.`,
      ['comparar_enteros', 'orden']
    )
  }

  const x = ri(10, limit)
  const y = ri(1, 9)
  const values = [-x, -(x - y), x - y, -y]
  const sorted = [...values].sort((m, n) => m - n)
  const answer = sorted.join(' < ')

  return mc(
    skill,
    d,
    seed,
    `¿Cuál es el orden correcto de menor a mayor para ${values.join(', ')}?`,
    answer,
    [
      [...sorted].reverse().join(' < '),
      [sorted[1], sorted[0], sorted[2], sorted[3]].join(' < '),
      [sorted[0], sorted[2], sorted[1], sorted[3]].join(' < '),
    ],
    `En la recta numérica el orden es ${answer}.`,
    ['comparar_enteros', 'orden_multiple', 'dificultad_alta']
  )
}

if (key === 'integers_number_line') {
  const limit = [5, 10, 15, 25, 40][d - 1]

  if (d === 1) {
    const n = ri(-limit, limit)

    return mc(
      skill,
      d,
      seed,
      `En una recta numérica, ¿qué número está inmediatamente a la derecha de ${n}?`,
      String(n + 1),
      [
        String(n - 1),
        String(-n),
        String(n + 2),
      ],
      `Al movernos una posición a la derecha sumamos 1: ${n} + 1 = ${n + 1}.`,
      ['recta_numerica']
    )
  }

  if (d === 2) {
    const n = ri(-limit, limit)

    return mc(
      skill,
      d,
      seed,
      `En una recta numérica, ¿qué número está inmediatamente a la izquierda de ${n}?`,
      String(n - 1),
      [
        String(n + 1),
        String(-n),
        String(n - 2),
      ],
      `Al movernos una posición a la izquierda restamos 1: ${n} - 1 = ${n - 1}.`,
      ['recta_numerica']
    )
  }

  if (d === 3) {
    const start = ri(-10, 5)
    const steps = ri(2, 8)
    const answer = start + steps

    return mc(
      skill,
      d,
      seed,
      `Partes de ${start} en la recta numérica y avanzas ${steps} posiciones a la derecha. ¿Dónde llegas?`,
      String(answer),
      [
        String(start - steps),
        String(steps),
        String(answer + 1),
      ],
      `${start} + ${steps} = ${answer}.`,
      ['recta_numerica', 'desplazamiento']
    )
  }

  if (d === 4) {
    const start = ri(-5, 15)
    const steps = ri(5, 15)
    const answer = start - steps

    return mc(
      skill,
      d,
      seed,
      `Partes de ${start} y retrocedes ${steps} posiciones en la recta numérica. ¿Dónde llegas?`,
      String(answer),
      [
        String(start + steps),
        String(-answer),
        String(answer - 1),
      ],
      `Retroceder significa restar: ${start} - ${steps} = ${answer}.`,
      ['recta_numerica', 'desplazamiento']
    )
  }

  const start = ri(-15, 10)
  const right = ri(5, 15)
  const left = ri(5, 15)
  const answer = start + right - left

  return mc(
    skill,
    d,
    seed,
    `Desde ${start} avanzas ${right} posiciones a la derecha y después ${left} a la izquierda. ¿En qué número terminas?`,
    String(answer),
    [
      String(start + right + left),
      String(start - right + left),
      String(Math.abs(answer)),
    ],
    `${start} + ${right} - ${left} = ${answer}.`,
    ['recta_numerica', 'varios_desplazamientos', 'dificultad_alta']
  )
}

if (key === 'integers_add') {
  const limit = [6, 10, 20, 40, 75][d - 1]
  const a = ri(-limit, limit)
  const b = ri(-limit, limit)
  const result = a + b

  if (d <= 2) {
    return mc(
      skill,
      d,
      seed,
      `Calcula ${a} + (${b})`,
      String(result),
      [
        String(a - b),
        String(-result),
        String(result + 1),
      ],
      `${a} + (${b}) = ${result}.`,
      ['suma_enteros', `dificultad_${d}`]
    )
  }

  if (d === 3) {
    const c = ri(-10, 10)
    const answer = a + b + c

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a} + (${b}) + (${c})`,
      String(answer),
      [
        String(a + b - c),
        String(-answer),
        String(answer + 2),
      ],
      `${a} + (${b}) + (${c}) = ${answer}.`,
      ['suma_enteros', 'tres_terminos']
    )
  }

  if (d === 4) {
    const c = ri(-20, 20)
    const answer = a + b + c

    return mc(
      skill,
      d,
      seed,
      `La temperatura cambia así: ${a >= 0 ? '+' : ''}${a} °C, ${b >= 0 ? '+' : ''}${b} °C y ${c >= 0 ? '+' : ''}${c} °C. ¿Cuál es el cambio total?`,
      `${answer} °C`,
      [
        `${Math.abs(answer)} °C`,
        `${a + b - c} °C`,
        `${answer + 1} °C`,
      ],
      `Sumamos los tres cambios: ${a} + (${b}) + (${c}) = ${answer}.`,
      ['suma_enteros', 'contexto']
    )
  }

  const c = ri(-30, 30)
  const d4 = ri(-20, 20)
  const answer = a + b + c + d4

  return mc(
    skill,
    d,
    seed,
    `Calcula ${a} + (${b}) + (${c}) + (${d4})`,
    String(answer),
    [
      String(a + b + c - d4),
      String(-answer),
      String(answer + 5),
    ],
    `Sumando todos los términos obtenemos ${answer}.`,
    ['suma_enteros', 'cuatro_terminos', 'dificultad_alta']
  )
}

if (key === 'integers_sub') {
  const limit = [6, 10, 20, 40, 75][d - 1]
  const a = ri(-limit, limit)
  const b = ri(-limit, limit)
  const result = a - b

  if (d <= 2) {
    return mc(
      skill,
      d,
      seed,
      `Calcula ${a} - (${b})`,
      String(result),
      [
        String(a + b),
        String(-result),
        String(result - 1),
      ],
      `${a} - (${b}) = ${result}.`,
      ['resta_enteros', `dificultad_${d}`]
    )
  }

  if (d === 3) {
    const c = ri(-10, 10)
    const answer = a - b - c

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a} - (${b}) - (${c})`,
      String(answer),
      [
        String(a + b - c),
        String(a - b + c),
        String(-answer),
      ],
      `${a} - (${b}) - (${c}) = ${answer}.`,
      ['resta_enteros', 'tres_terminos']
    )
  }

  if (d === 4) {
    const start = ri(-20, 20)
    const change = ri(-20, 20)
    const answer = start - change

    return mc(
      skill,
      d,
      seed,
      `Un marcador está en ${start}. Se le resta (${change}). ¿Cuál es el nuevo valor?`,
      String(answer),
      [
        String(start + change),
        String(-answer),
        String(answer + 2),
      ],
      `${start} - (${change}) = ${answer}.`,
      ['resta_enteros', 'contexto']
    )
  }

  const c = ri(-25, 25)
  const answer = a - b + c

  return mc(
    skill,
    d,
    seed,
    `Calcula ${a} - (${b}) + (${c})`,
    String(answer),
    [
      String(a + b + c),
      String(a - b - c),
      String(-answer),
    ],
    `${a} - (${b}) + (${c}) = ${answer}.`,
    ['resta_enteros', 'operaciones_combinadas', 'dificultad_alta']
  )
}

if (key === 'integers_mult_div') {
  const maxFactor = [5, 8, 10, 12, 15][d - 1]
  const aAbs = ri(2, maxFactor)
  const bAbs = ri(2, maxFactor)
  const signA = r() < 0.5 ? -1 : 1
  const signB = r() < 0.5 ? -1 : 1
  const a = aAbs * signA
  const b = bAbs * signB

  if (d <= 2) {
    const result = a * b

    return mc(
      skill,
      d,
      seed,
      `Calcula (${a}) × (${b})`,
      String(result),
      [
        String(-result),
        String(a + b),
        String(Math.abs(result)),
      ].filter((x) => x !== String(result)),
      `Aplicamos la regla de los signos: (${a}) × (${b}) = ${result}.`,
      ['multiplicacion_enteros']
    )
  }

  if (d === 3) {
    const divisor = b
    const quotient = a
    const dividend = divisor * quotient

    return mc(
      skill,
      d,
      seed,
      `Calcula (${dividend}) ÷ (${divisor})`,
      String(quotient),
      [
        String(-quotient),
        String(dividend * divisor),
        String(Math.abs(quotient)),
      ].filter((x) => x !== String(quotient)),
      `(${dividend}) ÷ (${divisor}) = ${quotient}.`,
      ['division_enteros']
    )
  }

  if (d === 4) {
    const c = ri(2, 6) * (r() < 0.5 ? -1 : 1)
    const result = a * b * c

    return mc(
      skill,
      d,
      seed,
      `Calcula (${a}) × (${b}) × (${c})`,
      String(result),
      [
        String(-result),
        String(a * b + c),
        String(Math.abs(result)),
      ].filter((x) => x !== String(result)),
      `Aplicamos sucesivamente la regla de los signos y obtenemos ${result}.`,
      ['multiplicacion_enteros', 'tres_factores']
    )
  }

  const c = ri(2, 6) * (r() < 0.5 ? -1 : 1)
  const numerator = a * b * c
  const result = numerator / c

  return mc(
    skill,
    d,
    seed,
    `Calcula [(${a}) × (${b}) × (${c})] ÷ (${c})`,
    String(result),
    [
      String(-result),
      String(a * b * c),
      String(a + b),
    ].filter((x) => x !== String(result)),
    `El factor (${c}) se cancela al dividir: queda (${a}) × (${b}) = ${result}.`,
    ['enteros_mult_div', 'operaciones_combinadas', 'dificultad_alta']
  )
}

if (key === 'integers_combined') {
  if (d === 1) {
    const a = ri(-8, 8)
    const b = ri(-8, 8)
    const c = ri(-5, 5)
    const result = a + b - c

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a} + (${b}) - (${c})`,
      String(result),
      [
        String(a + b + c),
        String(a - b - c),
        String(-result),
      ],
      `Operamos de izquierda a derecha: resultado ${result}.`,
      ['operaciones_combinadas_enteros']
    )
  }

  if (d === 2) {
    const a = ri(-10, 10)
    const b = ri(2, 6)
    const c = ri(-5, 5)
    const result = a + b * c

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a} + ${b} × (${c})`,
      String(result),
      [
        String((a + b) * c),
        String(a - b * c),
        String(-result),
      ],
      `Primero hacemos la multiplicación: ${b} × (${c}) = ${b * c}. Después sumamos ${a}: ${result}.`,
      ['operaciones_combinadas_enteros', 'jerarquia']
    )
  }

  if (d === 3) {
    const a = ri(-8, 8)
    const b = ri(-8, 8)
    const c = ri(2, 5)
    const result = (a + b) * c

    return mc(
      skill,
      d,
      seed,
      `Calcula (${a} + ${b}) × ${c}`,
      String(result),
      [
        String(a + b * c),
        String((a - b) * c),
        String(-result),
      ],
      `Primero resolvemos el paréntesis: ${a}+${b}=${a + b}. Después multiplicamos por ${c}: ${result}.`,
      ['operaciones_combinadas_enteros', 'parentesis']
    )
  }

  if (d === 4) {
    const a = ri(-10, 10)
    const b = ri(2, 6)
    const c = ri(-6, 6)
    const e = ri(-8, 8)
    const result = a - b * c + e

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a} - ${b} × (${c}) + (${e})`,
      String(result),
      [
        String((a - b) * c + e),
        String(a + b * c + e),
        String(-result),
      ],
      `Primero multiplicamos y después sumamos/restamos: resultado ${result}.`,
      ['operaciones_combinadas_enteros', 'jerarquia']
    )
  }

  const a = ri(-8, 8)
  const b = ri(-8, 8)
  const c = ri(2, 5)
  const e = ri(-10, 10)
  const f = ri(2, 5)
  const result = (a + b) * c - e * f

  return mc(
    skill,
    d,
    seed,
    `Calcula (${a} + ${b}) × ${c} - (${e}) × ${f}`,
    String(result),
    [
      String(a + b * c - e * f),
      String((a + b) * (c - e) * f),
      String(-result),
    ],
    `Resolvemos primero el paréntesis y las multiplicaciones. El resultado final es ${result}.`,
    ['operaciones_combinadas_enteros', 'jerarquia', 'dificultad_alta']
  )
}

if (key === 'integers_word_problem') {
  const variants = ri(0, d <= 2 ? 2 : 4)

  if (variants === 0) {
    const start = ri(-10, 5)
    const rise = ri(3, 12)
    const answer = start + rise

    return mc(
      skill,
      d,
      seed,
      `La temperatura es de ${start} °C y sube ${rise} °C. ¿Cuál es la nueva temperatura?`,
      `${answer} °C`,
      [
        `${start - rise} °C`,
        `${Math.abs(answer)} °C`,
        `${rise} °C`,
      ],
      `${start} + ${rise} = ${answer}.`,
      ['problema_enteros', 'temperatura']
    )
  }

  if (variants === 1) {
    const start = ri(-20, -3)
    const rise = ri(4, 15)
    const answer = start + rise

    return mc(
      skill,
      d,
      seed,
      `Un submarino está a ${start} m respecto al nivel del mar y asciende ${rise} m. ¿A qué nivel queda?`,
      `${answer} m`,
      [
        `${start - rise} m`,
        `${Math.abs(answer)} m`,
        `${rise} m`,
      ],
      `${start} + ${rise} = ${answer}.`,
      ['problema_enteros', 'altura']
    )
  }

  if (variants === 2) {
    const balance = ri(5, 30)
    const charge = ri(balance + 1, balance + 20)
    const answer = balance - charge

    return mc(
      skill,
      d,
      seed,
      `Tienes ${balance} € en una cuenta y se carga un recibo de ${charge} €. ¿Cuál es el saldo final?`,
      `${answer} €`,
      [
        `${Math.abs(answer)} €`,
        `${balance + charge} €`,
        `${-charge} €`,
      ],
      `${balance} - ${charge} = ${answer}.`,
      ['problema_enteros', 'saldo']
    )
  }

  if (variants === 3) {
    const start = ri(-15, 10)
    const up = ri(4, 12)
    const down = ri(4, 12)
    const answer = start + up - down

    return mc(
      skill,
      d,
      seed,
      `Un ascensor está en la planta ${start}. Sube ${up} plantas y después baja ${down}. ¿En qué planta termina?`,
      String(answer),
      [
        String(start + up + down),
        String(start - up + down),
        String(Math.abs(answer)),
      ],
      `${start} + ${up} - ${down} = ${answer}.`,
      ['problema_enteros', 'varios_cambios']
    )
  }

  const start = ri(-20, 5)
  const change1 = ri(5, 15)
  const change2 = ri(5, 15)
  const change3 = ri(3, 10)
  const answer = start + change1 - change2 + change3

  return mc(
    skill,
    d,
    seed,
    `La temperatura empieza en ${start} °C, sube ${change1} °C, baja ${change2} °C y vuelve a subir ${change3} °C. ¿Cuál es la temperatura final?`,
    `${answer} °C`,
    [
      `${start + change1 + change2 + change3} °C`,
      `${start - change1 - change2 + change3} °C`,
      `${Math.abs(answer)} °C`,
    ],
    `${start} + ${change1} - ${change2} + ${change3} = ${answer}.`,
    ['problema_enteros', 'varios_cambios', 'dificultad_alta']
  )
}

 // =========================
// M05 · NÚMEROS DECIMALES
// =========================

if (key === 'decimal_place_value') {
  if (d === 1) {
    const integerPart = ri(1, 20)
    const tenths = ri(1, 9)
    const n = `${integerPart}.${tenths}`

    return mc(
      skill,
      d,
      seed,
      `En ${n}, ¿qué cifra ocupa las décimas?`,
      String(tenths),
      [
        String(integerPart % 10),
        '0',
        String((tenths + 1) % 10),
      ],
      `La primera cifra después de la coma decimal es la de las décimas: ${tenths}.`,
      ['valor_posicional_decimal']
    )
  }

  if (d === 2) {
    const integerPart = ri(1, 50)
    const tenths = ri(0, 9)
    const hundredths = ri(1, 9)
    const n = `${integerPart}.${tenths}${hundredths}`

    return mc(
      skill,
      d,
      seed,
      `En ${n}, ¿qué cifra ocupa las centésimas?`,
      String(hundredths),
      [
        String(tenths),
        String(integerPart % 10),
        '0',
      ],
      `La segunda cifra después de la coma es la de las centésimas: ${hundredths}.`,
      ['valor_posicional_decimal', 'centesimas']
    )
  }

  if (d === 3) {
    const integerPart = ri(10, 99)
    const tenths = ri(0, 9)
    const hundredths = ri(0, 9)
    const thousandths = ri(1, 9)
    const n = `${integerPart}.${tenths}${hundredths}${thousandths}`

    return mc(
      skill,
      d,
      seed,
      `En ${n}, ¿qué cifra ocupa las milésimas?`,
      String(thousandths),
      [
        String(hundredths),
        String(tenths),
        String(integerPart % 10),
      ],
      `La tercera cifra después de la coma es la de las milésimas: ${thousandths}.`,
      ['valor_posicional_decimal', 'milesimas']
    )
  }

  if (d === 4) {
    const integerPart = ri(10, 999)
    const tenths = ri(1, 9)
    const hundredths = ri(0, 9)
    const n = `${integerPart}.${tenths}${hundredths}`

    return mc(
      skill,
      d,
      seed,
      `En ${n}, ¿qué valor representa la cifra ${tenths} situada en las décimas?`,
      `${tenths / 10}`,
      [
        `${tenths}`,
        `${tenths / 100}`,
        `${tenths * 10}`,
      ],
      `Una cifra situada en las décimas representa esa cifra dividida entre 10: ${tenths}/10 = ${tenths / 10}.`,
      ['valor_posicional_decimal', 'valor_cifra']
    )
  }

  const integerPart = ri(100, 999)
  const tenths = ri(1, 9)
  const hundredths = ri(1, 9)
  const thousandths = ri(1, 9)
  const n = `${integerPart}.${tenths}${hundredths}${thousandths}`

  return mc(
    skill,
    d,
    seed,
    `En ${n}, ¿qué valor representa la cifra ${hundredths} situada en las centésimas?`,
    `${hundredths / 100}`,
    [
      `${hundredths / 10}`,
      `${hundredths}`,
      `${hundredths / 1000}`,
    ],
    `La cifra ${hundredths} está en las centésimas, por tanto representa ${hundredths}/100 = ${hundredths / 100}.`,
    ['valor_posicional_decimal', 'valor_cifra', 'dificultad_alta']
  )
}

if (key === 'decimal_compare') {
  if (d === 1) {
    const a = (ri(10, 99) / 10).toFixed(1)
    const b = (ri(10, 99) / 10).toFixed(1)
    const answer = Number(a) > Number(b) ? '>' : Number(a) < Number(b) ? '<' : '='

    return mc(
      skill,
      d,
      seed,
      `Completa: ${a} __ ${b}`,
      answer,
      ['<', '>', '=', '≠'].filter((x) => x !== answer),
      `${a} ${answer} ${b}.`,
      ['comparacion_decimales']
    )
  }

  if (d === 2) {
    const a = (ri(100, 999) / 100).toFixed(2)
    const b = (ri(100, 999) / 100).toFixed(2)
    const answer = Number(a) > Number(b) ? '>' : Number(a) < Number(b) ? '<' : '='

    return mc(
      skill,
      d,
      seed,
      `Completa: ${a} __ ${b}`,
      answer,
      ['<', '>', '=', '≠'].filter((x) => x !== answer),
      `${a} ${answer} ${b}.`,
      ['comparacion_decimales', 'centesimas']
    )
  }

  if (d === 3) {
    const base = ri(10, 99)
    const tenths = ri(0, 9)
    const h1 = ri(0, 8)
    const h2 = h1 + 1

    const a = `${base}.${tenths}${h1}`
    const b = `${base}.${tenths}${h2}`

    return mc(
      skill,
      d,
      seed,
      `Completa: ${a} __ ${b}`,
      '<',
      ['>', '=', '≠'],
      `Coinciden hasta las décimas; en las centésimas, ${h1} < ${h2}. Por tanto ${a} < ${b}.`,
      ['comparacion_decimales', 'cifras_cercanas']
    )
  }

  if (d === 4) {
    const a = (ri(1000, 9999) / 1000).toFixed(3)
    const b = (ri(1000, 9999) / 1000).toFixed(3)

    const values = [Number(a), Number(b)]
    const answer = String(Math.max(...values))

    return mc(
      skill,
      d,
      seed,
      `¿Cuál es mayor: ${a} o ${b}?`,
      answer,
      [
        String(Math.min(...values)),
        'Son iguales',
        'No se puede saber',
      ],
      `Comparando cifra a cifra, el mayor es ${answer}.`,
      ['comparacion_decimales', 'milesimas']
    )
  }

  const a = ri(1000, 9999) / 1000
  const b = ri(1000, 9999) / 1000
  const c = ri(1000, 9999) / 1000
  const values = [a, b, c]
  const sorted = [...values].sort((x, y) => x - y)
  const answer = sorted.map((x) => x.toFixed(3)).join(' < ')

  return mc(
    skill,
    d,
    seed,
    `Ordena de menor a mayor: ${values.map((x) => x.toFixed(3)).join(', ')}`,
    answer,
    [
      [...sorted].reverse().map((x) => x.toFixed(3)).join(' < '),
      [sorted[1], sorted[0], sorted[2]].map((x) => x.toFixed(3)).join(' < '),
      [sorted[0], sorted[2], sorted[1]].map((x) => x.toFixed(3)).join(' < '),
    ],
    `El orden correcto es ${answer}.`,
    ['comparacion_decimales', 'orden_multiple', 'dificultad_alta']
  )
}

if (key === 'decimal_add_sub') {
  if (d === 1) {
    const a = ri(10, 99) / 10
    const b = ri(10, 99) / 10
    const result = a + b

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a.toFixed(1)} + ${b.toFixed(1)}`,
      result.toFixed(1),
      [
        (result + 1).toFixed(1),
        (result - 0.1).toFixed(1),
        String(Math.round(result)),
      ],
      `Alineamos las comas y sumamos: ${a.toFixed(1)} + ${b.toFixed(1)} = ${result.toFixed(1)}.`,
      ['suma_decimales']
    )
  }

  if (d === 2) {
    const a = ri(100, 999) / 100
    const b = ri(10, 500) / 100
    const result = a + b

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a.toFixed(2)} + ${b.toFixed(2)}`,
      result.toFixed(2),
      [
        (result + 0.1).toFixed(2),
        (result - 0.01).toFixed(2),
        String(Math.round(result)),
      ],
      `Alineamos las comas y sumamos: resultado ${result.toFixed(2)}.`,
      ['suma_decimales', 'centesimas']
    )
  }

  if (d === 3) {
    const a = ri(500, 1500) / 100
    const b = ri(100, Math.floor(a * 100)) / 100
    const result = a - b

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a.toFixed(2)} - ${b.toFixed(2)}`,
      result.toFixed(2),
      [
        (a + b).toFixed(2),
        (result + 0.1).toFixed(2),
        Math.abs(b - a).toFixed(2),
      ],
      `Alineamos las comas y restamos: ${a.toFixed(2)} - ${b.toFixed(2)} = ${result.toFixed(2)}.`,
      ['resta_decimales']
    )
  }

  if (d === 4) {
    const a = ri(100, 999) / 100
    const b = ri(100, 999) / 100
    const c = ri(10, 500) / 100
    const result = a + b - c

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a.toFixed(2)} + ${b.toFixed(2)} - ${c.toFixed(2)}`,
      result.toFixed(2),
      [
        (a + b + c).toFixed(2),
        (result + 1).toFixed(2),
        (result - 0.1).toFixed(2),
      ],
      `Primero sumamos y después restamos. Resultado: ${result.toFixed(2)}.`,
      ['suma_resta_decimales', 'varias_operaciones']
    )
  }

  const a = ri(1000, 9999) / 1000
  const b = ri(1000, 9999) / 1000
  const c = ri(100, 900) / 1000
  const result = a - b + c

  return mc(
    skill,
    d,
    seed,
    `Calcula ${a.toFixed(3)} - ${b.toFixed(3)} + ${c.toFixed(3)}`,
    result.toFixed(3),
    [
      (a + b + c).toFixed(3),
      (result + 0.1).toFixed(3),
      (result - 0.01).toFixed(3),
    ],
    `Operamos respetando las posiciones decimales. Resultado: ${result.toFixed(3)}.`,
    ['suma_resta_decimales', 'milesimas', 'dificultad_alta']
  )
}

if (key === 'decimal_mult_div') {
  if (d === 1) {
    const a = ri(11, 99) / 10
    const b = ri(2, 9)
    const result = a * b

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a.toFixed(1)} × ${b}`,
      result.toFixed(1),
      [
        (a + b).toFixed(1),
        (result * 10).toFixed(1),
        (result / 10).toFixed(2),
      ],
      `${a.toFixed(1)} × ${b} = ${result.toFixed(1)}.`,
      ['multiplicacion_decimales']
    )
  }

  if (d === 2) {
    const divisor = ri(2, 9)
    const quotient = ri(11, 99) / 10
    const dividend = quotient * divisor

    return mc(
      skill,
      d,
      seed,
      `Calcula ${dividend.toFixed(1)} ÷ ${divisor}`,
      quotient.toFixed(1),
      [
        (quotient * 10).toFixed(1),
        (quotient + divisor).toFixed(1),
        (quotient / 10).toFixed(2),
      ],
      `${dividend.toFixed(1)} ÷ ${divisor} = ${quotient.toFixed(1)}.`,
      ['division_decimales']
    )
  }

  if (d === 3) {
    const a = ri(11, 99) / 10
    const b = ri(11, 99) / 10
    const result = a * b

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a.toFixed(1)} × ${b.toFixed(1)}`,
      result.toFixed(2),
      [
        (a + b).toFixed(2),
        (result * 10).toFixed(2),
        (result / 10).toFixed(2),
      ],
      `Multiplicamos como enteros y colocamos dos cifras decimales. Resultado: ${result.toFixed(2)}.`,
      ['multiplicacion_decimales', 'dos_decimales']
    )
  }

  if (d === 4) {
    const divisor = ri(11, 50) / 10
    const quotient = ri(2, 15)
    const dividend = divisor * quotient

    return mc(
      skill,
      d,
      seed,
      `Calcula ${dividend.toFixed(1)} ÷ ${divisor.toFixed(1)}`,
      String(quotient),
      [
        String(quotient + 1),
        String(quotient - 1),
        String(Math.round(dividend)),
      ],
      `${dividend.toFixed(1)} ÷ ${divisor.toFixed(1)} = ${quotient}.`,
      ['division_decimales', 'divisor_decimal']
    )
  }

  const a = ri(10, 99) / 10
  const b = ri(10, 50) / 10
  const c = ri(2, 5)
  const result = (a * b) / c

  return mc(
    skill,
    d,
    seed,
    `Calcula (${a.toFixed(1)} × ${b.toFixed(1)}) ÷ ${c}`,
    result.toFixed(2),
    [
      (a * b * c).toFixed(2),
      ((a + b) / c).toFixed(2),
      (result + 1).toFixed(2),
    ],
    `Primero multiplicamos ${a.toFixed(1)} × ${b.toFixed(1)} y después dividimos entre ${c}. Resultado: ${result.toFixed(2)}.`,
    ['multiplicacion_division_decimales', 'operaciones_combinadas', 'dificultad_alta']
  )
}

if (key === 'decimal_round') {
  if (d === 1) {
    const n = ri(100, 999) / 100
    const answer = n.toFixed(1)

    return mc(
      skill,
      d,
      seed,
      `Redondea ${n.toFixed(2)} a las décimas`,
      answer,
      [
        n.toFixed(2),
        String(Math.floor(n)),
        (n + 0.1).toFixed(1),
      ],
      `Miramos la cifra de las centésimas. Resultado: ${answer}.`,
      ['redondeo_decimales']
    )
  }

  if (d === 2) {
    const n = ri(1000, 9999) / 1000
    const answer = n.toFixed(2)

    return mc(
      skill,
      d,
      seed,
      `Redondea ${n.toFixed(3)} a las centésimas`,
      answer,
      [
        n.toFixed(3),
        n.toFixed(1),
        (n + 0.01).toFixed(2),
      ],
      `Miramos la cifra de las milésimas y redondeamos a centésimas: ${answer}.`,
      ['redondeo_decimales', 'centesimas']
    )
  }

  if (d === 3) {
    const n = ri(100, 9999) / 100
    const answer = String(Math.round(n))

    return mc(
      skill,
      d,
      seed,
      `Redondea ${n.toFixed(2)} a las unidades`,
      answer,
      [
        String(Math.floor(n)),
        String(Math.ceil(n)),
        n.toFixed(1),
      ].filter((x) => x !== answer),
      `Observamos la parte decimal y redondeamos a la unidad más cercana: ${answer}.`,
      ['redondeo_decimales', 'unidades']
    )
  }

  if (d === 4) {
    const n = ri(10000, 99999) / 10000
    const answer = n.toFixed(3)

    return mc(
      skill,
      d,
      seed,
      `Redondea ${n.toFixed(4)} a las milésimas`,
      answer,
      [
        n.toFixed(4),
        n.toFixed(2),
        (n + 0.001).toFixed(3),
      ],
      `Miramos la cuarta cifra decimal y redondeamos a milésimas: ${answer}.`,
      ['redondeo_decimales', 'milesimas']
    )
  }

  const n = ri(10000, 99999) / 1000
  const toTenths = n.toFixed(1)
  const toHundredths = n.toFixed(2)

  return mc(
    skill,
    d,
    seed,
    `El número es ${n.toFixed(3)}. ¿Cuál es su redondeo correcto a décimas y centésimas?`,
    `${toTenths} y ${toHundredths}`,
    [
      `${toHundredths} y ${toTenths}`,
      `${n.toFixed(3)} y ${toHundredths}`,
      `${Math.floor(n)} y ${toTenths}`,
    ],
    `A décimas: ${toTenths}. A centésimas: ${toHundredths}.`,
    ['redondeo_decimales', 'doble_redondeo', 'dificultad_alta']
  )
}

 // =========================
// M06 · SISTEMA MÉTRICO Y MEDIDA
// =========================

if (key === 'metric_length') {
  if (d === 1) {
    const metres = ri(2, 50)
    const answer = metres * 100

    return mc(
      skill,
      d,
      seed,
      `Convierte ${metres} m a centímetros`,
      String(answer),
      [
        String(metres * 10),
        String(metres * 1000),
        String(metres),
      ],
      `${metres} m = ${answer} cm porque 1 m = 100 cm.`,
      ['conversion_longitud']
    )
  }

  if (d === 2) {
    const km = ri(2, 20)
    const answer = km * 1000

    return mc(
      skill,
      d,
      seed,
      `Convierte ${km} km a metros`,
      String(answer),
      [
        String(km * 100),
        String(km * 10),
        String(km * 10000),
      ],
      `${km} km = ${answer} m porque 1 km = 1000 m.`,
      ['conversion_longitud', 'kilometros']
    )
  }

  if (d === 3) {
    const cm = ri(200, 5000)
    const answer = cm / 100

    return mc(
      skill,
      d,
      seed,
      `Convierte ${cm} cm a metros`,
      String(answer),
      [
        String(cm / 10),
        String(cm / 1000),
        String(cm * 100),
      ],
      `${cm} cm ÷ 100 = ${answer} m.`,
      ['conversion_longitud', 'conversion_inversa']
    )
  }

  if (d === 4) {
    const metres = ri(2, 25)
    const centimetres = ri(10, 99)
    const answer = metres * 100 + centimetres

    return mc(
      skill,
      d,
      seed,
      `¿Cuántos centímetros son ${metres} m y ${centimetres} cm?`,
      String(answer),
      [
        String(metres * 10 + centimetres),
        String(metres * 1000 + centimetres),
        String(metres + centimetres),
      ],
      `${metres} m = ${metres * 100} cm. Sumamos ${centimetres} cm: ${answer} cm.`,
      ['conversion_longitud', 'medidas_compuestas']
    )
  }

  const km = ri(1, 9)
  const metres = ri(100, 900)
  const answer = km * 1000 + metres

  return mc(
    skill,
    d,
    seed,
    `Una ruta tiene ${km} km y ${metres} m. ¿Cuántos metros mide en total?`,
    String(answer),
    [
      String(km * 100 + metres),
      String(km * 1000 - metres),
      String(km + metres),
    ],
    `${km} km = ${km * 1000} m. Sumamos ${metres}: ${answer} m.`,
    ['conversion_longitud', 'problema', 'dificultad_alta']
  )
}

if (key === 'metric_mass') {
  if (d === 1) {
    const kg = ri(2, 20)
    const answer = kg * 1000

    return mc(
      skill,
      d,
      seed,
      `Convierte ${kg} kg a gramos`,
      String(answer),
      [
        String(kg * 100),
        String(kg * 10),
        String(kg),
      ],
      `${kg} kg = ${answer} g porque 1 kg = 1000 g.`,
      ['conversion_masa']
    )
  }

  if (d === 2) {
    const grams = ri(2, 20) * 1000
    const answer = grams / 1000

    return mc(
      skill,
      d,
      seed,
      `Convierte ${grams} g a kilogramos`,
      String(answer),
      [
        String(grams / 100),
        String(grams / 10),
        String(grams),
      ],
      `${grams} g ÷ 1000 = ${answer} kg.`,
      ['conversion_masa', 'conversion_inversa']
    )
  }

  if (d === 3) {
    const kg = ri(2, 15)
    const grams = ri(100, 900)
    const answer = kg * 1000 + grams

    return mc(
      skill,
      d,
      seed,
      `¿Cuántos gramos son ${kg} kg y ${grams} g?`,
      String(answer),
      [
        String(kg * 100 + grams),
        String(kg * 1000 - grams),
        String(kg + grams),
      ],
      `${kg} kg = ${kg * 1000} g. Sumamos ${grams} g: ${answer} g.`,
      ['conversion_masa', 'medidas_compuestas']
    )
  }

  if (d === 4) {
    const packs = ri(2, 8)
    const gramsPerPack = ri(2, 9) * 250
    const totalGrams = packs * gramsPerPack
    const answer = totalGrams / 1000

    return mc(
      skill,
      d,
      seed,
      `Hay ${packs} paquetes de ${gramsPerPack} g cada uno. ¿Cuántos kilogramos pesan en total?`,
      String(answer),
      [
        String(totalGrams),
        String(answer + 1),
        String(packs + gramsPerPack),
      ],
      `${packs} × ${gramsPerPack} = ${totalGrams} g. Dividimos entre 1000: ${answer} kg.`,
      ['conversion_masa', 'problema']
    )
  }

  const startKg = ri(3, 12)
  const removedGrams = ri(2, 8) * 250
  const totalGrams = startKg * 1000
  const remainingGrams = totalGrams - removedGrams
  const answer = remainingGrams / 1000

  return mc(
    skill,
    d,
    seed,
    `Una caja pesa ${startKg} kg. Se retiran ${removedGrams} g. ¿Cuántos kilogramos pesa ahora?`,
    String(answer),
    [
      String(startKg + removedGrams / 1000),
      String(remainingGrams),
      String(startKg - removedGrams),
    ],
    `${startKg} kg = ${totalGrams} g. Restamos ${removedGrams} g y quedan ${remainingGrams} g = ${answer} kg.`,
    ['conversion_masa', 'problema', 'dificultad_alta']
  )
}

if (key === 'metric_capacity') {
  if (d === 1) {
    const litres = ri(2, 15)
    const answer = litres * 1000

    return mc(
      skill,
      d,
      seed,
      `Convierte ${litres} L a mililitros`,
      String(answer),
      [
        String(litres * 100),
        String(litres * 10),
        String(litres),
      ],
      `${litres} L = ${answer} mL porque 1 L = 1000 mL.`,
      ['conversion_capacidad']
    )
  }

  if (d === 2) {
    const ml = ri(2, 15) * 1000
    const answer = ml / 1000

    return mc(
      skill,
      d,
      seed,
      `Convierte ${ml} mL a litros`,
      String(answer),
      [
        String(ml / 100),
        String(ml / 10),
        String(ml),
      ],
      `${ml} mL ÷ 1000 = ${answer} L.`,
      ['conversion_capacidad', 'conversion_inversa']
    )
  }

  if (d === 3) {
    const litres = ri(1, 8)
    const ml = ri(1, 9) * 100
    const answer = litres * 1000 + ml

    return mc(
      skill,
      d,
      seed,
      `¿Cuántos mililitros son ${litres} L y ${ml} mL?`,
      String(answer),
      [
        String(litres * 100 + ml),
        String(litres * 1000 - ml),
        String(litres + ml),
      ],
      `${litres} L = ${litres * 1000} mL. Sumamos ${ml}: ${answer} mL.`,
      ['conversion_capacidad', 'medidas_compuestas']
    )
  }

  if (d === 4) {
    const bottles = ri(2, 8)
    const mlEach = [250, 500, 750][ri(0, 2)]
    const totalMl = bottles * mlEach
    const answer = totalMl / 1000

    return mc(
      skill,
      d,
      seed,
      `Hay ${bottles} botellas de ${mlEach} mL cada una. ¿Cuántos litros contienen en total?`,
      String(answer),
      [
        String(totalMl),
        String(answer + 1),
        String(bottles + mlEach),
      ],
      `${bottles} × ${mlEach} = ${totalMl} mL = ${answer} L.`,
      ['conversion_capacidad', 'problema']
    )
  }

  const litres = ri(3, 10)
  const usedMl = ri(2, 8) * 250
  const startMl = litres * 1000
  const remainingMl = startMl - usedMl
  const answer = remainingMl / 1000

  return mc(
    skill,
    d,
    seed,
    `Un depósito contiene ${litres} L. Se utilizan ${usedMl} mL. ¿Cuántos litros quedan?`,
    String(answer),
    [
      String(litres + usedMl / 1000),
      String(remainingMl),
      String(litres - usedMl),
    ],
    `${litres} L = ${startMl} mL. Restamos ${usedMl}: quedan ${remainingMl} mL = ${answer} L.`,
    ['conversion_capacidad', 'problema', 'dificultad_alta']
  )
}

if (key === 'metric_area_units') {
  if (d === 1) {
    const m2 = ri(2, 12)
    const answer = m2 * 10000

    return mc(
      skill,
      d,
      seed,
      `Convierte ${m2} m² a cm²`,
      String(answer),
      [
        String(m2 * 100),
        String(m2 * 1000),
        String(m2 * 10),
      ],
      `1 m² = 10000 cm². Por tanto ${m2} m² = ${answer} cm².`,
      ['conversion_superficie']
    )
  }

  if (d === 2) {
    const m2 = ri(2, 20)
    const answer = m2 * 100

    return mc(
      skill,
      d,
      seed,
      `Convierte ${m2} m² a dm²`,
      String(answer),
      [
        String(m2 * 10),
        String(m2 * 1000),
        String(m2),
      ],
      `1 m² = 100 dm². Resultado: ${answer} dm².`,
      ['conversion_superficie', 'decimetros_cuadrados']
    )
  }

  if (d === 3) {
    const m2 = ri(2, 15)
    const cm2 = m2 * 10000

    return mc(
      skill,
      d,
      seed,
      `¿Cuántos m² son ${cm2} cm²?`,
      String(m2),
      [
        String(cm2 / 100),
        String(cm2 / 1000),
        String(m2 * 10),
      ],
      `${cm2} cm² ÷ 10000 = ${m2} m².`,
      ['conversion_superficie', 'conversion_inversa']
    )
  }

  if (d === 4) {
    const side = ri(2, 10)
    const areaM2 = side * side
    const answer = areaM2 * 10000

    return mc(
      skill,
      d,
      seed,
      `Un cuadrado tiene ${side} m de lado. ¿Cuál es su área en cm²?`,
      String(answer),
      [
        String(areaM2 * 100),
        String(side * 10000),
        String(areaM2),
      ],
      `Área = ${side} × ${side} = ${areaM2} m². Como 1 m² = 10000 cm², son ${answer} cm².`,
      ['conversion_superficie', 'area', 'problema']
    )
  }

  const width = ri(3, 12)
  const height = ri(2, 10)
  const areaM2 = width * height
  const answer = areaM2 * 10000

  return mc(
    skill,
    d,
    seed,
    `Un terreno rectangular mide ${width} m por ${height} m. ¿Cuál es su superficie en cm²?`,
    String(answer),
    [
      String(areaM2),
      String(areaM2 * 100),
      String((width + height) * 10000),
    ],
    `Área = ${width} × ${height} = ${areaM2} m². Multiplicamos por 10000: ${answer} cm².`,
    ['conversion_superficie', 'area', 'problema', 'dificultad_alta']
  )
}

if (key === 'sexagesimal_time') {
  if (d === 1) {
    const hours = ri(1, 5)
    const minutes = ri(1, 50)
    const answer = hours * 60 + minutes

    return mc(
      skill,
      d,
      seed,
      `¿Cuántos minutos son ${hours} h y ${minutes} min?`,
      String(answer),
      [
        String(hours * 100 + minutes),
        String(hours * 60),
        String(hours + minutes),
      ],
      `${hours} × 60 + ${minutes} = ${answer} minutos.`,
      ['sistema_sexagesimal']
    )
  }

  if (d === 2) {
    const hours = ri(1, 5)
    const minutes = ri(1, 10) * 5
    const total = hours * 60 + minutes

    return mc(
      skill,
      d,
      seed,
      `Convierte ${total} minutos a horas y minutos`,
      `${hours} h ${minutes} min`,
      [
        `${hours + 1} h ${minutes} min`,
        `${hours} h ${Math.max(0, minutes - 10)} min`,
        `${total} h`,
      ],
      `${total} minutos = ${hours} horas y ${minutes} minutos.`,
      ['sistema_sexagesimal', 'conversion_inversa']
    )
  }

  if (d === 3) {
    const minutes = ri(2, 9)
    const seconds = ri(1, 50)
    const answer = minutes * 60 + seconds

    return mc(
      skill,
      d,
      seed,
      `¿Cuántos segundos son ${minutes} min y ${seconds} s?`,
      String(answer),
      [
        String(minutes * 100 + seconds),
        String(minutes * 60),
        String(minutes + seconds),
      ],
      `${minutes} × 60 + ${seconds} = ${answer} segundos.`,
      ['sistema_sexagesimal', 'segundos']
    )
  }

  if (d === 4) {
    const startHour = ri(8, 16)
    const startMinute = ri(0, 5) * 10
    const duration = ri(2, 8) * 10
    const startTotal = startHour * 60 + startMinute
    const endTotal = startTotal + duration
    const endHour = Math.floor(endTotal / 60)
    const endMinute = endTotal % 60
    const answer = `${endHour}:${String(endMinute).padStart(2, '0')}`

    return mc(
      skill,
      d,
      seed,
      `Una actividad empieza a las ${startHour}:${String(startMinute).padStart(2, '0')} y dura ${duration} minutos. ¿A qué hora termina?`,
      answer,
      [
        `${startHour}:${String((startMinute + duration) % 60).padStart(2, '0')}`,
        `${endHour + 1}:${String(endMinute).padStart(2, '0')}`,
        `${Math.max(0, endHour - 1)}:${String(endMinute).padStart(2, '0')}`,
      ],
      `Sumamos ${duration} minutos a la hora inicial. Termina a las ${answer}.`,
      ['sistema_sexagesimal', 'duracion']
    )
  }

  const startHour = ri(8, 14)
  const startMinute = ri(0, 5) * 10
  const durationHours = ri(1, 3)
  const durationMinutes = ri(1, 5) * 10

  const startTotal = startHour * 60 + startMinute
  const durationTotal = durationHours * 60 + durationMinutes
  const endTotal = startTotal + durationTotal

  const endHour = Math.floor(endTotal / 60)
  const endMinute = endTotal % 60
  const answer = `${endHour}:${String(endMinute).padStart(2, '0')}`

  return mc(
    skill,
    d,
    seed,
    `Un viaje comienza a las ${startHour}:${String(startMinute).padStart(2, '0')} y dura ${durationHours} h ${durationMinutes} min. ¿A qué hora termina?`,
    answer,
    [
      `${startHour + durationHours}:${String(startMinute).padStart(2, '0')}`,
      `${endHour + 1}:${String(endMinute).padStart(2, '0')}`,
      `${Math.max(0, endHour - 1)}:${String(endMinute).padStart(2, '0')}`,
    ],
    `Pasamos la duración a minutos y la sumamos a la hora inicial. El viaje termina a las ${answer}.`,
    ['sistema_sexagesimal', 'problema_tiempo', 'dificultad_alta']
  )
}

 // =========================
// M07 · FRACCIONES
// =========================

if (key === 'fraction_meaning') {
  const den = ri(3, d <= 2 ? 8 : 15)
  const num = ri(1, den - 1)

  if (d === 1) {
    const variant = ri(0, 1)

    if (variant === 0) {
      return mc(
        skill,
        d,
        seed,
        `En la fracción ${num}/${den}, ¿qué indica el denominador?`,
        'El total de partes iguales',
        [
          'Las partes que tomamos',
          'El resultado de dividir',
          'El número mayor',
        ],
        `El denominador ${den} indica en cuántas partes iguales se divide la unidad.`,
        ['significado_fraccion', 'denominador']
      )
    }

    return mc(
      skill,
      d,
      seed,
      `En la fracción ${num}/${den}, ¿qué indica el numerador?`,
      'Las partes que tomamos',
      [
        'El total de partes iguales',
        'El tamaño de cada parte',
        'El resultado de dividir',
      ],
      `El numerador ${num} indica cuántas partes estamos tomando.`,
      ['significado_fraccion', 'numerador']
    )
  }

  if (d === 2) {
    return mc(
      skill,
      d,
      seed,
      `Una unidad se divide en ${den} partes iguales y tomamos ${num}. ¿Qué fracción representa?`,
      `${num}/${den}`,
      [
        `${den}/${num}`,
        `${num}/${den + 1}`,
        `${Math.min(num + 1, den - 1)}/${den}`,
      ],
      `Tomamos ${num} de ${den} partes iguales, por tanto la fracción es ${num}/${den}.`,
      ['significado_fraccion', 'representacion']
    )
  }

  if (d === 3) {
    return mc(
      skill,
      d,
      seed,
      `¿Cuál de estas situaciones representa ${num}/${den}?`,
      `Tomar ${num} de ${den} partes iguales`,
      [
        `Tomar ${den} de ${num} partes iguales`,
        `Tomar ${num + 1} de ${den} partes`,
        `Dividir ${num} partes entre ${den}`,
      ],
      `${num}/${den} significa tomar ${num} partes de una unidad dividida en ${den} partes iguales.`,
      ['significado_fraccion', 'interpretacion']
    )
  }

  if (d === 4) {
    const improperNum = den + ri(1, den)

    return mc(
      skill,
      d,
      seed,
      `La fracción ${improperNum}/${den} es...`,
      'Mayor que 1',
      [
        'Menor que 1',
        'Igual a 1',
        'Siempre igual a 0',
      ],
      `Como ${improperNum} > ${den}, la fracción es mayor que 1.`,
      ['significado_fraccion', 'fraccion_impropia']
    )
  }

  const whole = ri(1, 3)
  const extra = ri(1, den - 1)
  const improper = whole * den + extra

  return mc(
    skill,
    d,
    seed,
    `¿Qué significa ${improper}/${den}?`,
    `${whole} unidades completas y ${extra}/${den}`,
    [
      `${whole + 1} unidades completas`,
      `${extra} unidades y ${whole}/${den}`,
      `Solo ${extra}/${den} de una unidad`,
    ],
    `${improper}/${den} = ${whole} + ${extra}/${den}.`,
    ['significado_fraccion', 'fraccion_impropia', 'dificultad_alta']
  )
}

if (key === 'fraction_equivalent') {
  if (d === 1) {
    const den = ri(3, 8)
    const num = ri(1, den - 1)
    const k = ri(2, 4)
    const answer = `${num * k}/${den * k}`

    return mc(
      skill,
      d,
      seed,
      `¿Qué fracción es equivalente a ${num}/${den}?`,
      answer,
      [
        `${num + k}/${den + k}`,
        `${num}/${den * k}`,
        `${num * k}/${den}`,
      ],
      `Multiplicamos numerador y denominador por ${k}: ${answer}.`,
      ['fracciones_equivalentes']
    )
  }

  if (d === 2) {
    const den = ri(3, 9)
    const num = ri(1, den - 1)
    const k = ri(2, 5)

    return mc(
      skill,
      d,
      seed,
      `${num}/${den} = ?/${den * k}. ¿Qué número falta?`,
      String(num * k),
      [
        String(num + k),
        String(den * k),
        String(num * k + 1),
      ],
      `El denominador se multiplica por ${k}, así que el numerador también: ${num}×${k}=${num * k}.`,
      ['fracciones_equivalentes', 'termino_desconocido']
    )
  }

  if (d === 3) {
    const den = ri(4, 10)
    const num = ri(1, den - 1)
    const k = ri(2, 6)
    const eqNum = num * k
    const eqDen = den * k

    return mc(
      skill,
      d,
      seed,
      `¿Son equivalentes ${num}/${den} y ${eqNum}/${eqDen}?`,
      'Sí',
      [
        'No',
        'Solo si los denominadores son iguales',
        'No se puede saber',
      ],
      `Al multiplicar ${num}/${den} por ${k}/${k} obtenemos ${eqNum}/${eqDen}.`,
      ['fracciones_equivalentes', 'comprobar']
    )
  }

  if (d === 4) {
    const den = ri(5, 12)
    const num = ri(2, den - 1)
    const k = ri(2, 5)
    const eqNum = num * k
    const eqDen = den * k

    return mc(
      skill,
      d,
      seed,
      `${eqNum}/${eqDen} = ${num}/?. ¿Qué denominador falta?`,
      String(den),
      [
        String(eqDen),
        String(den + k),
        String(Math.max(1, den - 1)),
      ],
      `${eqNum}/${eqDen} se obtiene multiplicando ${num}/${den} por ${k}/${k}. El denominador buscado es ${den}.`,
      ['fracciones_equivalentes', 'termino_desconocido']
    )
  }

  const den = ri(6, 15)
  const num = ri(1, den - 1)
  const k1 = ri(2, 4)
  const k2 = ri(5, 7)

  const correct = `${num * k1}/${den * k1}`

  return mc(
    skill,
    d,
    seed,
    `¿Cuál de estas fracciones pertenece a la misma clase de equivalencia que ${num}/${den}?`,
    correct,
    [
      `${num * k2}/${den * k2 + 1}`,
      `${num + k1}/${den + k1}`,
      `${num * k1 + 1}/${den * k1}`,
    ],
    `${correct} se obtiene multiplicando numerador y denominador por el mismo número.`,
    ['fracciones_equivalentes', 'razonamiento', 'dificultad_alta']
  )
}

if (key === 'fraction_simplify') {
  const gcd = (a: number, b: number): number => {
    a = Math.abs(a)
    b = Math.abs(b)

    while (b !== 0) {
      const temp = b
      b = a % b
      a = temp
    }

    return a
  }

  const maxBaseDen = [8, 10, 12, 15, 20][d - 1]

  let baseNum = ri(1, maxBaseDen - 1)
  let baseDen = ri(baseNum + 1, maxBaseDen)

  while (gcd(baseNum, baseDen) !== 1) {
    baseNum = ri(1, maxBaseDen - 1)
    baseDen = ri(baseNum + 1, maxBaseDen)
  }

  const multiplierMax = [3, 4, 6, 8, 12][d - 1]
  const k = ri(2, multiplierMax)

  const num = baseNum * k
  const den = baseDen * k
  const answer = `${baseNum}/${baseDen}`

  return mc(
    skill,
    d,
    seed,
    `Simplifica completamente ${num}/${den}`,
    answer,
    [
      `${num}/${baseDen}`,
      `${baseNum}/${den}`,
      `${Math.max(1, baseNum * 2)}/${baseDen * 2}`,
    ].filter((x) => x !== answer),
    `El máximo factor común permite reducir ${num}/${den} hasta ${answer}.`,
    ['simplificacion_fracciones', `dificultad_${d}`]
  )
}

if (key === 'fraction_compare') {
  if (d === 1) {
    const den = ri(4, 10)
    const a = ri(1, den - 2)
    const b = ri(a + 1, den - 1)

    return mc(
      skill,
      d,
      seed,
      `Completa: ${a}/${den} __ ${b}/${den}`,
      '<',
      ['>', '=', '≠'],
      `Con el mismo denominador comparamos numeradores: ${a} < ${b}.`,
      ['comparacion_fracciones']
    )
  }

  if (d === 2) {
    const num = ri(1, 5)
    const den1 = ri(num + 1, 8)
    const den2 = ri(den1 + 1, 12)

    return mc(
      skill,
      d,
      seed,
      `Completa: ${num}/${den1} __ ${num}/${den2}`,
      '>',
      ['<', '=', '≠'],
      `Con el mismo numerador, la fracción con menor denominador es mayor.`,
      ['comparacion_fracciones', 'mismo_numerador']
    )
  }

  if (d === 3) {
    const den1 = ri(3, 8)
    const den2 = ri(3, 8)
    const num1 = ri(1, den1 - 1)
    const num2 = ri(1, den2 - 1)

    const left = num1 * den2
    const right = num2 * den1
    const answer = left > right ? '>' : left < right ? '<' : '='

    return mc(
      skill,
      d,
      seed,
      `Completa: ${num1}/${den1} __ ${num2}/${den2}`,
      answer,
      ['<', '>', '=', '≠'].filter((x) => x !== answer),
      `Comparamos productos cruzados: ${num1}×${den2}=${left} y ${num2}×${den1}=${right}.`,
      ['comparacion_fracciones', 'productos_cruzados']
    )
  }

  if (d === 4) {
    const rationalKey = (num: number, den: number) => {
      let a = Math.abs(num)
      let b = Math.abs(den)
      while (b !== 0) {
        const next = a % b
        a = b
        b = next
      }
      return `${num / a}/${den / a}`
    }

    let den1 = 3
    let den2 = 4
    let num1 = 1
    let num2 = 3

    for (let attempt = 0; attempt < 50; attempt++) {
      const candidateDen1 = ri(5, 12)
      const candidateDen2 = ri(5, 12)
      const candidateNum1 = ri(1, candidateDen1 - 1)
      const candidateNum2 = ri(1, candidateDen2 - 1)
      const keys = new Set([
        rationalKey(candidateNum1, candidateDen1),
        rationalKey(candidateNum2, candidateDen2),
        '1/2',
      ])

      if (keys.size === 3) {
        den1 = candidateDen1
        den2 = candidateDen2
        num1 = candidateNum1
        num2 = candidateNum2
        break
      }
    }

    const fractions = [
      { text: `${num1}/${den1}`, value: num1 / den1 },
      { text: `${num2}/${den2}`, value: num2 / den2 },
      { text: '1/2', value: 0.5 },
    ]

    const largest = [...fractions].sort((a, b) => b.value - a.value)[0]

    return mc(
      skill,
      d,
      seed,
      `¿Cuál es la mayor: ${fractions.map((x) => x.text).join(', ')}?`,
      largest.text,
      fractions
        .map((x) => x.text)
        .filter((x) => x !== largest.text)
        .concat(['Son iguales']),
      `Comparamos sus valores. La mayor es ${largest.text}.`,
      ['comparacion_fracciones', 'varias_fracciones']
    )
  }

  const rationalKey = (num: number, den: number) => {
    let a = Math.abs(num)
    let b = Math.abs(den)
    while (b !== 0) {
      const next = a % b
      a = b
      b = next
    }
    return `${num / a}/${den / a}`
  }

  let fractions = [
    { n: 1, d: 4 },
    { n: 1, d: 2 },
    { n: 3, d: 4 },
  ]

  for (let attempt = 0; attempt < 50; attempt++) {
    const den1 = ri(7, 15)
    const den2 = ri(7, 15)
    const den3 = ri(7, 15)
    const candidates = [
      { n: ri(1, den1 - 1), d: den1 },
      { n: ri(1, den2 - 1), d: den2 },
      { n: ri(1, den3 - 1), d: den3 },
    ]

    if (new Set(candidates.map((fraction) => rationalKey(fraction.n, fraction.d))).size === 3) {
      fractions = candidates
      break
    }
  }

  const sorted = [...fractions].sort(
    (x, y) => x.n / x.d - y.n / y.d
  )

  const answer = sorted
    .map((x) => `${x.n}/${x.d}`)
    .join(' < ')

  return mc(
    skill,
    d,
    seed,
    `Ordena de menor a mayor: ${fractions
      .map((x) => `${x.n}/${x.d}`)
      .join(', ')}`,
    answer,
    [
      [...sorted]
        .reverse()
        .map((x) => `${x.n}/${x.d}`)
        .join(' < '),
      `${sorted[1].n}/${sorted[1].d} < ${sorted[0].n}/${sorted[0].d} < ${sorted[2].n}/${sorted[2].d}`,
      `${sorted[0].n}/${sorted[0].d} < ${sorted[2].n}/${sorted[2].d} < ${sorted[1].n}/${sorted[1].d}`,
    ],
    `Comparamos las tres fracciones y obtenemos ${answer}.`,
    ['comparacion_fracciones', 'orden', 'dificultad_alta']
  )
}

if (key === 'fraction_add_sub') {
  const gcd = (a: number, b: number): number => {
    a = Math.abs(a)
    b = Math.abs(b)

    while (b !== 0) {
      const temp = b
      b = a % b
      a = temp
    }

    return a
  }

  const simplify = (num: number, den: number) => {
    const g = gcd(num, den)
    return `${num / g}/${den / g}`
  }

  if (d === 1) {
    const den = ri(4, 10)
    const a = ri(1, den - 2)
    const b = ri(1, den - a)
    const answer = `${a + b}/${den}`

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a}/${den} + ${b}/${den}`,
      answer,
      [
        `${a + b}/${den * 2}`,
        `${a * b}/${den}`,
        `${Math.abs(a - b)}/${den}`,
      ],
      `Como tienen el mismo denominador, sumamos numeradores: ${answer}.`,
      ['suma_fracciones']
    )
  }

  if (d === 2) {
    const den = ri(4, 10)
    const a = ri(2, den - 1)
    const b = ri(1, a - 1)
    const answer = `${a - b}/${den}`

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a}/${den} - ${b}/${den}`,
      answer,
      [
        `${a + b}/${den}`,
        `${a - b}/${den * 2}`,
        `${a * b}/${den}`,
      ],
      `Con el mismo denominador restamos numeradores: ${answer}.`,
      ['resta_fracciones']
    )
  }

  if (d === 3) {
    const den1 = ri(2, 6)
    const factor = ri(2, 4)
    const den2 = den1 * factor
    const a = ri(1, den1 - 1)
    const b = ri(1, den2 - 1)

    const num = a * factor + b
    const answer = simplify(num, den2)

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a}/${den1} + ${b}/${den2}`,
      answer,
      [
        `${a + b}/${den1 + den2}`,
        `${num}/${den1}`,
        `${Math.abs(a * factor - b)}/${den2}`,
      ],
      `Convertimos ${a}/${den1} a denominador ${den2}, sumamos y simplificamos. Resultado: ${answer}.`,
      ['suma_fracciones', 'distinto_denominador']
    )
  }

  if (d === 4) {
    const den1 = ri(3, 8)
    const den2 = ri(3, 9)
    const a = ri(1, den1 - 1)
    const b = ri(1, den2 - 1)

    const commonDen = den1 * den2
    const num = a * den2 + b * den1
    const answer = simplify(num, commonDen)

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a}/${den1} + ${b}/${den2}`,
      answer,
      [
        `${a + b}/${den1 + den2}`,
        `${num}/${commonDen + 1}`,
        `${Math.abs(a * den2 - b * den1)}/${commonDen}`,
      ],
      `Buscamos un denominador común, sumamos y simplificamos. Resultado: ${answer}.`,
      ['suma_fracciones', 'distinto_denominador']
    )
  }

  const den1 = ri(4, 10)
  const den2 = ri(4, 10)
  const den3 = ri(4, 10)

  const a = ri(1, den1 - 1)
  const b = ri(1, den2 - 1)
  const c = ri(1, den3 - 1)

  const commonDen = den1 * den2 * den3
  const num =
    a * den2 * den3 +
    b * den1 * den3 -
    c * den1 * den2

  const answer = simplify(num, commonDen)

  return mc(
    skill,
    d,
    seed,
    `Calcula ${a}/${den1} + ${b}/${den2} - ${c}/${den3}`,
    answer,
    [
      `${a + b - c}/${den1 + den2 + den3}`,
      `${Math.abs(num)}/${commonDen + 1}`,
      `${a + b + c}/${commonDen}`,
    ],
    `Usamos denominador común, operamos numeradores y simplificamos. Resultado: ${answer}.`,
    ['suma_resta_fracciones', 'tres_fracciones', 'dificultad_alta']
  )
}

if (key === 'fraction_multiply') {
  const gcd = (a: number, b: number): number => {
    while (b !== 0) {
      const temp = b
      b = a % b
      a = temp
    }
    return Math.abs(a)
  }

  const simplify = (num: number, den: number) => {
    const g = gcd(num, den)
    return `${num / g}/${den / g}`
  }

  if (d === 1) {
    const num = ri(1, 5)
    const den = ri(num + 1, 8)
    const k = ri(2, 5)
    const answer = simplify(num * k, den)

    return mc(
      skill,
      d,
      seed,
      `Calcula ${num}/${den} × ${k}`,
      answer,
      [
        `${num + k}/${den}`,
        `${num}/${den * k}`,
        `${num * k}/${den * k}`,
      ],
      `Multiplicamos el numerador por ${k} y simplificamos: ${answer}.`,
      ['multiplicacion_fracciones']
    )
  }

  const maxDen = [8, 8, 10, 12, 15][d - 1]
  const a = ri(1, 6)
  const b = ri(2, maxDen)
  const c = ri(1, 6)
  const e = ri(2, maxDen)

  const answer = simplify(a * c, b * e)

  return mc(
    skill,
    d,
    seed,
    `Calcula ${a}/${b} × ${c}/${e}`,
    answer,
    [
      `${a + c}/${b + e}`,
      `${a * e}/${b * c}`,
      `${a + c}/${b * e}`,
    ],
    `Multiplicamos numeradores y denominadores y simplificamos: ${answer}.`,
    ['multiplicacion_fracciones', `dificultad_${d}`]
  )
}

if (key === 'fraction_divide') {
  const gcd = (a: number, b: number): number => {
    while (b !== 0) {
      const temp = b
      b = a % b
      a = temp
    }
    return Math.abs(a)
  }

  const simplify = (num: number, den: number) => {
    const g = gcd(num, den)
    return `${num / g}/${den / g}`
  }

  if (d === 1) {
    const divisor = ri(2, 5)
    const num = ri(1, 5)
    const den = ri(num + 1, 8)
    const answer = simplify(num, den * divisor)

    return mc(
      skill,
      d,
      seed,
      `Calcula ${num}/${den} ÷ ${divisor}`,
      answer,
      [
        simplify(num * divisor, den),
        `${num + divisor}/${den}`,
        `${num}/${den}`,
      ],
      `Dividir entre ${divisor} equivale a multiplicar por 1/${divisor}. Resultado: ${answer}.`,
      ['division_fracciones']
    )
  }

  const maxDen = [8, 8, 10, 12, 15][d - 1]
  const a = ri(1, 6)
  const b = ri(2, maxDen)
  const c = ri(1, 6)
  const e = ri(2, maxDen)

  const answer = simplify(a * e, b * c)

  return mc(
    skill,
    d,
    seed,
    `Calcula ${a}/${b} ÷ ${c}/${e}`,
    answer,
    [
      simplify(a * c, b * e),
      `${a + c}/${b + e}`,
      `${b * c}/${a * e}`,
    ],
    `Multiplicamos por la inversa: ${a}/${b} × ${e}/${c}. Resultado: ${answer}.`,
    ['division_fracciones', `dificultad_${d}`]
  )
}

if (key === 'fraction_word_problem') {
  const family = ri(0, 5)

  // =========================================================
  // 1. MULTIPLICAR UNA FRACCIÓN POR UN NÚMERO
  // =========================================================
  if (family === 0) {
    const den = ri(3, 10)
    const num = ri(1, den - 1)
    const reps = ri(2, 6)
    const answer = `${num * reps}/${den}`

    const contexts = [
      {
        prompt: `Una etapa de entrenamiento mide ${num}/${den} km. Si se completa ${reps} veces, ¿qué distancia se recorre en total?`,
        solution: `${num}/${den} × ${reps} = ${answer} km.`,
      },
      {
        prompt: `Cada cinta mide ${num}/${den} m. Se utilizan ${reps} cintas iguales. ¿Cuántos metros se utilizan en total?`,
        solution: `${num}/${den} × ${reps} = ${answer} m.`,
      },
      {
        prompt: `Un robot avanza ${num}/${den} m en cada movimiento. Después de ${reps} movimientos, ¿cuánto ha avanzado?`,
        solution: `${num}/${den} × ${reps} = ${answer} m.`,
      },
      {
        prompt: `Cada botella contiene ${num}/${den} L. Hay ${reps} botellas iguales. ¿Cuántos litros contienen entre todas?`,
        solution: `${num}/${den} × ${reps} = ${answer} L.`,
      },
      {
        prompt: `Marta lee ${num}/${den} de capítulo cada día. Si mantiene ese ritmo durante ${reps} días, ¿cuántos capítulos habrá leído en total?`,
        solution: `${num}/${den} × ${reps} = ${answer} capítulos.`,
      },
    ]

    const context = contexts[ri(0, contexts.length - 1)]

    return mc(
      skill,
      d,
      seed,
      context.prompt,
      answer,
      [
        `${num}/${den * reps}`,
        `${num + reps}/${den}`,
        `${num}/${den}`,
      ],
      context.solution,
      ['problema_fracciones', 'multiplicacion']
    )
  }

  // =========================================================
  // 2. CALCULAR UNA FRACCIÓN DE UNA CANTIDAD
  // =========================================================
  if (family === 1) {
    const den = ri(2, 8)
    const num = ri(1, den - 1)
    const groups = ri(2, 8)
    const total = den * groups
    const answer = num * groups

    const contexts = [
      {
        prompt: `En una colección hay ${total} cromos. ${num}/${den} son especiales. ¿Cuántos cromos especiales hay?`,
        solution: `${num}/${den} de ${total} = ${answer}.`,
      },
      {
        prompt: `Un libro tiene ${total} páginas. Lucía ha leído ${num}/${den} del libro. ¿Cuántas páginas ha leído?`,
        solution: `${num}/${den} de ${total} = ${answer} páginas.`,
      },
      {
        prompt: `En un depósito hay ${total} litros de agua. Se utiliza ${num}/${den} del contenido. ¿Cuántos litros se utilizan?`,
        solution: `${num}/${den} de ${total} = ${answer} litros.`,
      },
      {
        prompt: `Un equipo dispone de ${total} €. Gasta ${num}/${den} del dinero. ¿Cuántos euros gasta?`,
        solution: `${num}/${den} de ${total} = ${answer} €.`,
      },
      {
        prompt: `Hay ${total} alumnos en una actividad y ${num}/${den} participan en un juego. ¿Cuántos alumnos participan?`,
        solution: `${num}/${den} de ${total} = ${answer} alumnos.`,
      },
    ]

    const context = contexts[ri(0, contexts.length - 1)]

    return mc(
      skill,
      d,
      seed,
      context.prompt,
      String(answer),
      [
        String(total - answer),
        String(groups),
        String(num * den),
      ],
      context.solution,
      ['problema_fracciones', 'fraccion_de_cantidad']
    )
  }

  // =========================================================
  // 3. HALLAR EL TOTAL CONOCIENDO UNA FRACCIÓN
  // =========================================================
  if (family === 2) {
    const den = ri(3, 8)
    const num = ri(1, den - 1)
    const factor = ri(2, 7)
    const known = num * factor
    const total = den * factor

    const contexts = [
      {
        prompt: `${known} alumnos representan ${num}/${den} de una clase. ¿Cuántos alumnos hay en total?`,
        solution: `Si ${num} partes son ${known}, una parte vale ${factor}. El total es ${den} × ${factor} = ${total}.`,
      },
      {
        prompt: `${known} cromos son ${num}/${den} de una colección. ¿Cuántos cromos tiene la colección completa?`,
        solution: `Si ${num}/${den} son ${known}, el total es ${total} cromos.`,
      },
      {
        prompt: `Se han recorrido ${known} km, que representan ${num}/${den} de una ruta. ¿Cuántos kilómetros tiene la ruta completa?`,
        solution: `${known} km representan ${num}/${den}; la ruta completa mide ${total} km.`,
      },
      {
        prompt: `Laura ha leído ${known} páginas, que son ${num}/${den} de un libro. ¿Cuántas páginas tiene el libro?`,
        solution: `Si ${known} páginas son ${num}/${den}, el libro completo tiene ${total} páginas.`,
      },
      {
        prompt: `${known} € representan ${num}/${den} del dinero ahorrado. ¿Cuánto dinero hay ahorrado en total?`,
        solution: `El total correspondiente a ${den}/${den} es ${total} €.`,
      },
    ]

    const context = contexts[ri(0, contexts.length - 1)]

    return mc(
      skill,
      d,
      seed,
      context.prompt,
      String(total),
      [
        String(known * den),
        String(total - known),
        String(known + den),
      ],
      context.solution,
      ['problema_fracciones', 'hallar_total']
    )
  }

  // =========================================================
  // 4. FRACCIÓN QUE QUEDA
  // =========================================================
  if (family === 3) {
    const den = ri(4, 12)
    const used = ri(1, den - 1)
    const remaining = den - used
    const answer = `${remaining}/${den}`

    const contexts = [
      {
        prompt: `De una tarta se han comido ${used}/${den}. ¿Qué fracción queda?`,
        solution: `${den}/${den} - ${used}/${den} = ${answer}.`,
      },
      {
        prompt: `Un depósito estaba lleno y se utiliza ${used}/${den} de su contenido. ¿Qué fracción queda?`,
        solution: `Del total ${den}/${den} restamos ${used}/${den}. Queda ${answer}.`,
      },
      {
        prompt: `De una tableta de chocolate se han consumido ${used}/${den}. ¿Qué fracción queda sin consumir?`,
        solution: `${den}/${den} - ${used}/${den} = ${answer}.`,
      },
      {
        prompt: `De una jornada de trabajo se ha completado ${used}/${den}. ¿Qué fracción queda por completar?`,
        solution: `La jornada completa es ${den}/${den}; quedan ${answer}.`,
      },
      {
        prompt: `Un videojuego está completado en ${used}/${den}. ¿Qué fracción queda todavía por completar?`,
        solution: `${den}/${den} - ${used}/${den} = ${answer}.`,
      },
    ]

    const context = contexts[ri(0, contexts.length - 1)]

    return mc(
      skill,
      d,
      seed,
      context.prompt,
      answer,
      [
        `${used}/${den}`,
        `${den}/${remaining}`,
        `${remaining}/${used}`,
      ],
      context.solution,
      ['problema_fracciones', 'fraccion_restante']
    )
  }

  // =========================================================
  // 5. SUMAR FRACCIONES CON EL MISMO DENOMINADOR
  // =========================================================
  if (family === 4) {
    const den = ri(5, 12)
    const a = ri(1, den - 2)
    const b = ri(1, den - a - 1)
    const sum = a + b
    const answer = `${sum}/${den}`

    const contexts = [
      {
        prompt: `Por la mañana se recorren ${a}/${den} km y por la tarde ${b}/${den} km. ¿Qué distancia se recorre en total?`,
        solution: `${a}/${den} + ${b}/${den} = ${answer} km.`,
      },
      {
        prompt: `Marta lee ${a}/${den} de un libro el lunes y ${b}/${den} el martes. ¿Qué fracción del libro ha leído entre los dos días?`,
        solution: `${a}/${den} + ${b}/${den} = ${answer}.`,
      },
      {
        prompt: `Se llenan ${a}/${den} de un depósito por la mañana y ${b}/${den} por la tarde. ¿Qué fracción se ha llenado en total?`,
        solution: `${a}/${den} + ${b}/${den} = ${answer}.`,
      },
      {
        prompt: `Un jugador completa ${a}/${den} de una misión en una partida y ${b}/${den} en otra. ¿Qué fracción completa en total?`,
        solution: `${a}/${den} + ${b}/${den} = ${answer}.`,
      },
      {
        prompt: `En una receta se utilizan ${a}/${den} kg de un ingrediente y después otros ${b}/${den} kg. ¿Cuánto se utiliza en total?`,
        solution: `${a}/${den} + ${b}/${den} = ${answer} kg.`,
      },
    ]

    const context = contexts[ri(0, contexts.length - 1)]

    return mc(
      skill,
      d,
      seed,
      context.prompt,
      answer,
      [
        `${sum}/${den * 2}`,
        `${Math.abs(a - b)}/${den}`,
        `${a * b}/${den}`,
      ],
      context.solution,
      ['problema_fracciones', 'suma']
    )
  }

  // =========================================================
  // 6. RESTAR FRACCIONES CON EL MISMO DENOMINADOR
  // =========================================================
  const den = ri(5, 12)
  const start = ri(2, den - 1)
  const used = ri(1, start - 1)
  const remaining = start - used
  const answer = `${remaining}/${den}`

  const contexts = [
    {
      prompt: `Una botella contiene ${start}/${den} L y se consumen ${used}/${den} L. ¿Cuánto queda?`,
      solution: `${start}/${den} - ${used}/${den} = ${answer} L.`,
    },
    {
      prompt: `Marta había recorrido ${start}/${den} km y retrocede ${used}/${den} km. ¿Qué distancia neta queda recorrida?`,
      solution: `${start}/${den} - ${used}/${den} = ${answer} km.`,
    },
    {
      prompt: `Quedaban ${start}/${den} de una tableta de chocolate y se comen ${used}/${den}. ¿Qué fracción queda?`,
      solution: `${start}/${den} - ${used}/${den} = ${answer}.`,
    },
    {
      prompt: `Un depósito contiene ${start}/${den} de su capacidad y se vacían ${used}/${den}. ¿Qué fracción de su capacidad queda?`,
      solution: `${start}/${den} - ${used}/${den} = ${answer}.`,
    },
    {
      prompt: `Un jugador tiene completados ${start}/${den} de un reto, pero pierde un progreso equivalente a ${used}/${den}. ¿Qué fracción conserva?`,
      solution: `${start}/${den} - ${used}/${den} = ${answer}.`,
    },
  ]

  const context = contexts[ri(0, contexts.length - 1)]

  return mc(
    skill,
    d,
    seed,
    context.prompt,
    answer,
    [
      `${start + used}/${den}`,
      `${start}/${den}`,
      `${used}/${den}`,
    ],
    context.solution,
    ['problema_fracciones', 'resta']
  )
}
 // =========================
// M08 · PROPORCIONALIDAD Y PORCENTAJES
// =========================

if (key === 'ratio') {
  const gcd = (x: number, y: number): number => {
    x = Math.abs(x)
    y = Math.abs(y)

    while (y !== 0) {
      const temp = y
      y = x % y
      x = temp
    }

    return x
  }

  if (d === 1) {
    const a = ri(2, 8)
    const b = ri(2, 8)

    const contexts = [
      {
        prompt: `En una caja hay ${a} lápices rojos por cada ${b} azules. ¿Cuál es la razón rojos:azules?`,
        solution: `La razón rojos:azules es ${a}:${b}.`,
      },
      {
        prompt: `Hay ${a} chicos por cada ${b} chicas. ¿Cuál es la razón chicos:chicas?`,
        solution: `La razón chicos:chicas es ${a}:${b}.`,
      },
      {
        prompt: `Una mezcla lleva ${a} vasos de agua por cada ${b} de zumo. ¿Cuál es la razón agua:zumo?`,
        solution: `La razón agua:zumo es ${a}:${b}.`,
      },
    ]

    const v = contexts[ri(0, contexts.length - 1)]

    return mc(
      skill,
      d,
      seed,
      v.prompt,
      `${a}:${b}`,
      [
        `${b}:${a}`,
        `${a + b}:1`,
        `${a * b}:1`,
      ],
      v.solution,
      ['razon']
    )
  }

  if (d === 2) {
    const baseA = ri(1, 5)
    const baseB = ri(2, 6)
    const k = ri(2, 5)

    const a = baseA * k
    const b = baseB * k

    return mc(
      skill,
      d,
      seed,
      `Simplifica la razón ${a}:${b}`,
      `${baseA}:${baseB}`,
      [
        `${a}:${baseB}`,
        `${baseA}:${b}`,
        `${baseA + baseB}:1`,
      ],
      `Dividimos los dos términos entre ${k}: ${a}:${b} = ${baseA}:${baseB}.`,
      ['razon', 'simplificacion']
    )
  }

  if (d === 3) {
    const a = ri(2, 7)
    const b = ri(2, 7)
    const k = ri(2, 5)

    return mc(
      skill,
      d,
      seed,
      `Si la razón es ${a}:${b} y la primera cantidad vale ${a * k}, ¿cuánto vale la segunda?`,
      String(b * k),
      [
        String(a * k),
        String(a + b + k),
        String(b + k),
      ],
      `La primera cantidad se ha multiplicado por ${k}, así que la segunda también: ${b}×${k}=${b * k}.`,
      ['razon', 'razones_equivalentes']
    )
  }

  if (d === 4) {
    let a = ri(4, 15)
    let b = ri(4, 15)

    while (gcd(a, b) === 1) {
      a = ri(4, 15)
      b = ri(4, 15)
    }

    const g = gcd(a, b)
    const simpleA = a / g
    const simpleB = b / g

    return mc(
      skill,
      d,
      seed,
      `En un grupo hay ${a} alumnos de un equipo y ${b} de otro. Expresa la razón en su forma más simple.`,
      `${simpleA}:${simpleB}`,
      [
        `${a}:${b}`,
        `${simpleB}:${simpleA}`,
        `${a + b}:${g}`,
      ],
      `MCD(${a}, ${b})=${g}. Dividimos ambos términos entre ${g}: ${simpleA}:${simpleB}.`,
      ['razon', 'simplificacion', 'mcd']
    )
  }

  const a = ri(2, 6)
  const b = ri(2, 7)
  const totalParts = a + b
  const multiplier = ri(3, 8)
  const total = totalParts * multiplier

  return mc(
    skill,
    d,
    seed,
    `Dos cantidades están en razón ${a}:${b} y juntas suman ${total}. ¿Cuánto vale la primera cantidad?`,
    String(a * multiplier),
    [
      String(b * multiplier),
      String(total / 2),
      String(a + multiplier),
    ],
    `La razón tiene ${totalParts} partes. Cada parte vale ${total}÷${totalParts}=${multiplier}. La primera cantidad es ${a}×${multiplier}=${a * multiplier}.`,
    ['razon', 'reparto_proporcional', 'dificultad_alta']
  )
}

if (key === 'direct_proportion_recognize') {
  const easyVariants = [
    {
      prompt:
        'Si compras el doble de cuadernos al mismo precio unitario, ¿pagas el doble?',
      answer: 'Sí',
      solution:
        'Al duplicar la cantidad manteniendo el precio unitario, se duplica el coste.',
    },
    {
      prompt:
        'Si una receta usa 3 huevos y haces el doble de cantidad, ¿necesitas el doble de huevos?',
      answer: 'Sí',
      solution:
        'Al duplicar la receta, se duplican proporcionalmente los ingredientes.',
    },
    {
      prompt:
        'Si duplicas el número de personas que comparten una pizza fija, ¿cada persona recibe el doble?',
      answer: 'No',
      solution:
        'La cantidad total de pizza no aumenta. Al haber más personas, toca menos a cada una.',
    },
  ]

  const mediumVariants = [
    {
      prompt:
        'A velocidad constante, si un coche recorre el triple de distancia, ¿emplea el triple de tiempo?',
      answer: 'Sí',
      solution:
        'Manteniendo constante la velocidad, distancia y tiempo son directamente proporcionales.',
    },
    {
      prompt:
        'Si el lado de un cuadrado se duplica, ¿su área también se duplica?',
      answer: 'No',
      solution:
        'El área depende del cuadrado del lado. Si el lado se duplica, el área se multiplica por 4.',
    },
    {
      prompt:
        'Si 5 entradas cuestan 40 € al mismo precio cada una, ¿10 entradas cuestan 80 €?',
      answer: 'Sí',
      solution:
        'Al duplicar el número de entradas, se duplica el coste total.',
    },
    {
      prompt:
        'Si tardas 4 horas en un viaje y duplicas la velocidad para la misma distancia, ¿tardarás 8 horas?',
      answer: 'No',
      solution:
        'Para una distancia fija, aumentar la velocidad reduce el tiempo; no es proporcionalidad directa.',
    },
  ]

  const hardVariants = [
    {
      prompt:
        'Una magnitud pasa de 4 a 12 mientras otra pasa de 7 a 21. ¿Podrían ser directamente proporcionales?',
      answer: 'Sí',
      solution:
        'Las dos se han multiplicado por 3, así que mantienen el mismo factor.',
    },
    {
      prompt:
        'Una magnitud pasa de 5 a 15 mientras otra pasa de 8 a 20. ¿Son directamente proporcionales?',
      answer: 'No',
      solution:
        'La primera se multiplica por 3, pero la segunda por 2,5. Los factores no coinciden.',
    },
    {
      prompt:
        'Si y = 4x, ¿x e y son magnitudes directamente proporcionales?',
      answer: 'Sí',
      solution:
        'La razón y/x es constante e igual a 4.',
    },
  ]

  const pool =
    d <= 2
      ? easyVariants
      : d <= 4
        ? mediumVariants
        : hardVariants

  const v = pool[ri(0, pool.length - 1)]

  return mc(
    skill,
    d,
    seed,
    v.prompt,
    v.answer,
    v.answer === 'Sí'
      ? ['No', 'Solo algunas veces', 'No se puede saber']
      : ['Sí', 'Siempre', 'Exactamente el doble'],
    v.solution,
    ['proporcionalidad_directa', `dificultad_${d}`]
  )
}

if (key === 'direct_proportion_table') {
  if (d === 1) {
    const price = ri(2, 6)
    const quantity = ri(2, 8)
    const answer = quantity * price

    return mc(
      skill,
      d,
      seed,
      `Si 1 unidad cuesta ${price} €, ¿cuánto cuestan ${quantity} unidades?`,
      String(answer),
      [
        String(quantity + price),
        String(answer + price),
        String(price),
      ],
      `${quantity} × ${price} = ${answer} €.`,
      ['tabla_proporcional']
    )
  }

  if (d === 2) {
    const x1 = ri(2, 5)
    const factor = ri(2, 6)
    const y1 = x1 * factor
    const x2 = x1 * 2
    const answer = y1 * 2

    return mc(
      skill,
      d,
      seed,
      `En una tabla proporcional: ${x1} → ${y1}. ¿Qué valor corresponde a ${x2}?`,
      String(answer),
      [
        String(y1 + x2),
        String(y1),
        String(answer + factor),
      ],
      `${x2} es el doble de ${x1}, por tanto el valor correspondiente es el doble de ${y1}: ${answer}.`,
      ['tabla_proporcional', 'escalado']
    )
  }

  if (d === 3) {
    const factor = ri(3, 8)
    const x1 = ri(2, 6)
    const y1 = x1 * factor
    const x2 = ri(7, 15)
    const answer = x2 * factor

    return mc(
      skill,
      d,
      seed,
      `Una tabla cumple y = ${factor}x. Si para x=${x1}, y=${y1}, ¿cuánto vale y cuando x=${x2}?`,
      String(answer),
      [
        String(x2 + factor),
        String(y1 + x2),
        String(answer - factor),
      ],
      `La constante de proporcionalidad es ${factor}. Entonces ${factor}×${x2}=${answer}.`,
      ['tabla_proporcional', 'constante_proporcionalidad']
    )
  }

  if (d === 4) {
    const factor = ri(2, 7)
    const x = ri(4, 12)
    const y = x * factor

    return mc(
      skill,
      d,
      seed,
      `En una relación directamente proporcional, x=${x} corresponde a y=${y}. ¿Cuál es la constante de proporcionalidad y/x?`,
      String(factor),
      [
        String(x),
        String(y),
        String(x + factor),
      ],
      `${y}÷${x}=${factor}.`,
      ['tabla_proporcional', 'constante_proporcionalidad']
    )
  }

  const factor = ri(3, 9)
  const x1 = ri(2, 5)
  const x2 = ri(6, 12)
  const y1 = factor * x1
  const y2 = factor * x2

  return mc(
    skill,
    d,
    seed,
    `¿Cuál de estas parejas completa correctamente una tabla de proporcionalidad que contiene (${x1}, ${y1})?`,
    `(${x2}, ${y2})`,
    [
      `(${x2}, ${y2 + 1})`,
      `(${x2}, ${y1 + x2})`,
      `(${x2}, ${factor + x2})`,
    ],
    `La constante es ${y1}/${x1}=${factor}. Por tanto, para x=${x2}, y=${factor}×${x2}=${y2}.`,
    ['tabla_proporcional', 'razonamiento', 'dificultad_alta']
  )
}

if (key === 'rule_of_three') {
  if (d === 1) {
    const units = ri(2, 5)
    const unitPrice = ri(2, 6)
    const target = ri(2, 8)

    const total = units * unitPrice
    const answer = target * unitPrice

    return mc(
      skill,
      d,
      seed,
      `Si ${units} unidades cuestan ${total} €, ¿cuánto cuestan ${target} unidades?`,
      String(answer),
      [
        String(total + target),
        String(total * target),
        String(unitPrice),
      ],
      `Cada unidad cuesta ${total}÷${units}=${unitPrice} €. Entonces ${target}×${unitPrice}=${answer} €.`,
      ['regla_de_tres']
    )
  }

  if (d === 2) {
    const kg = ri(2, 6)
    const pricePerKg = ri(3, 8)
    const total = kg * pricePerKg
    const targetKg = ri(7, 12)
    const answer = targetKg * pricePerKg

    return mc(
      skill,
      d,
      seed,
      `${kg} kg de fruta cuestan ${total} €. ¿Cuánto cuestan ${targetKg} kg?`,
      String(answer),
      [
        String(total + targetKg),
        String(targetKg * kg),
        String(answer + pricePerKg),
      ],
      `Precio por kg: ${total}÷${kg}=${pricePerKg} €. Para ${targetKg} kg: ${targetKg}×${pricePerKg}=${answer} €.`,
      ['regla_de_tres', 'precio']
    )
  }

  if (d === 3) {
    const people = ri(2, 5)
    const amountPerPerson = ri(2, 6)
    const total = people * amountPerPerson
    const targetPeople = ri(6, 12)
    const answer = targetPeople * amountPerPerson

    return mc(
      skill,
      d,
      seed,
      `Para ${people} personas hacen falta ${total} porciones. ¿Cuántas hacen falta para ${targetPeople} personas?`,
      String(answer),
      [
        String(total + targetPeople),
        String(targetPeople * people),
        String(answer - amountPerPerson),
      ],
      `${total}÷${people}=${amountPerPerson} porciones por persona. ${targetPeople}×${amountPerPerson}=${answer}.`,
      ['regla_de_tres', 'problema']
    )
  }

  if (d === 4) {
    const distance = ri(2, 6) * 50
    const litres = ri(2, 6)
    const targetDistance = distance * ri(2, 4)
    const factor = targetDistance / distance
    const answer = litres * factor

    return mc(
      skill,
      d,
      seed,
      `Un vehículo consume ${litres} L para recorrer ${distance} km. Manteniendo el mismo consumo, ¿cuántos litros necesita para ${targetDistance} km?`,
      String(answer),
      [
        String(litres + factor),
        String(targetDistance / litres),
        String(answer + litres),
      ],
      `${targetDistance}/${distance}=${factor}. Multiplicamos ${litres}×${factor}=${answer} L.`,
      ['regla_de_tres', 'varios_pasos']
    )
  }

  const machines = ri(2, 5)
  const productionPerMachine = ri(20, 50)
  const hours = ri(2, 5)
  const total = machines * productionPerMachine * hours
  const targetMachines = ri(6, 9)
  const answer = targetMachines * productionPerMachine * hours

  return mc(
    skill,
    d,
    seed,
    `${machines} máquinas producen ${total} piezas en ${hours} horas. Si todas trabajan al mismo ritmo, ¿cuántas producirán ${targetMachines} máquinas en el mismo tiempo?`,
    String(answer),
    [
      String(total + targetMachines),
      String(total * targetMachines),
      String(productionPerMachine * targetMachines),
    ],
    `Cada máquina produce ${productionPerMachine} piezas por hora. En ${hours} h, ${targetMachines} máquinas producen ${answer}.`,
    ['regla_de_tres', 'varios_pasos', 'dificultad_alta']
  )
}

if (key === 'percentage_of') {
  if (d === 1) {
    const p = [10, 25, 50][ri(0, 2)]
    const amount = ri(2, 10) * 20
    const answer = (p * amount) / 100

    return mc(
      skill,
      d,
      seed,
      `¿Cuánto es el ${p}% de ${amount}?`,
      String(answer),
      [
        String(amount - p),
        String(amount + p),
        String(((100 - p) * amount) / 100),
      ],
      `${p}/100 × ${amount} = ${answer}.`,
      ['porcentaje']
    )
  }

  if (d === 2) {
    const p = [5, 10, 20, 25, 50][ri(0, 4)]
    const amount = ri(2, 20) * 20
    const answer = (p * amount) / 100

    return mc(
      skill,
      d,
      seed,
      `Calcula el ${p}% de ${amount}`,
      String(answer),
      [
        String(amount - p),
        String(p),
        String(answer + p),
      ],
      `${amount}×${p}/100=${answer}.`,
      ['porcentaje']
    )
  }

  if (d === 3) {
    const p = [15, 30, 35, 40, 60, 75][ri(0, 5)]
    const amount = ri(2, 10) * 100
    const answer = (p * amount) / 100

    return mc(
      skill,
      d,
      seed,
      `En un grupo de ${amount} personas, el ${p}% cumple una condición. ¿Cuántas personas son?`,
      String(answer),
      [
        String(amount - answer),
        String(p),
        String(answer + 10),
      ],
      `${p}% de ${amount} = ${answer}.`,
      ['porcentaje', 'contexto']
    )
  }

  if (d === 4) {
    const percentage = [20, 25, 40, 50][ri(0, 3)]
    const multiplier = ri(2, 8)
    const part = percentage * multiplier
    const total = 100 * multiplier

    return mc(
      skill,
      d,
      seed,
      `${part} es el ${percentage}% de un número. ¿Cuál es ese número?`,
      String(total),
      [
        String(part * percentage),
        String(part + percentage),
        String(total - part),
      ],
      `Si ${percentage}% son ${part}, el 100% es ${part}×100/${percentage}=${total}.`,
      ['porcentaje', 'hallar_total']
    )
  }

  const total = ri(4, 12) * 50
  const percentage = [15, 30, 45, 60, 75][ri(0, 4)]
  const part = (total * percentage) / 100

  return mc(
    skill,
    d,
    seed,
    `De un total de ${total}, una parte vale ${part}. ¿Qué porcentaje representa?`,
    `${percentage}%`,
    [
      `${100 - percentage}%`,
      `${Math.max(1, percentage - 5)}%`,
      `${Math.min(100, percentage + 10)}%`,
    ],
    `${part}/${total}×100=${percentage}%.`,
    ['porcentaje', 'hallar_porcentaje', 'dificultad_alta']
  )
}

if (key === 'percentage_change') {
  if (d === 1) {
    const price = ri(4, 12) * 20
    const discount = [10, 20, 25][ri(0, 2)]
    const saving = (price * discount) / 100
    const finalPrice = price - saving

    return mc(
      skill,
      d,
      seed,
      `Un producto cuesta ${price} € y tiene un ${discount}% de descuento. ¿Cuál es el precio final?`,
      String(finalPrice),
      [
        String(saving),
        String(price + saving),
        String(price - discount),
      ],
      `Descuento: ${saving} €. Precio final: ${price}-${saving}=${finalPrice} €.`,
      ['descuento_porcentual']
    )
  }

  if (d === 2) {
    const price = ri(4, 12) * 25
    const increase = [10, 20, 25][ri(0, 2)]
    const rise = (price * increase) / 100
    const finalPrice = price + rise

    return mc(
      skill,
      d,
      seed,
      `Un precio de ${price} € aumenta un ${increase}%. ¿Cuál es el nuevo precio?`,
      String(finalPrice),
      [
        String(price - rise),
        String(rise),
        String(price + increase),
      ],
      `Aumento: ${price}×${increase}/100=${rise} €. Nuevo precio: ${finalPrice} €.`,
      ['aumento_porcentual']
    )
  }

  if (d === 3) {
    const original = ri(4, 12) * 50
    const discount = [15, 20, 30][ri(0, 2)]
    const saving = (original * discount) / 100
    const finalPrice = original - saving

    return mc(
      skill,
      d,
      seed,
      `Tras un descuento del ${discount}%, un producto que costaba ${original} € queda en...`,
      String(finalPrice),
      [
        String(saving),
        String(original + saving),
        String(original - discount),
      ],
      `El descuento es ${saving} €. ${original}-${saving}=${finalPrice} €.`,
      ['descuento_porcentual']
    )
  }

  if (d === 4) {
    const original = ri(4, 10) * 100
    const risePercent = [10, 20, 25][ri(0, 2)]
    const rise = (original * risePercent) / 100
    const afterRise = original + rise
    const discountPercent = [10, 20][ri(0, 1)]
    const discount = (afterRise * discountPercent) / 100
    const final = afterRise - discount

    return mc(
      skill,
      d,
      seed,
      `Un artículo cuesta ${original} €. Primero sube un ${risePercent}% y después se rebaja un ${discountPercent}% sobre el nuevo precio. ¿Cuál es el precio final?`,
      String(final),
      [
        String(original),
        String(afterRise),
        String(original - discount),
      ],
      `Tras la subida cuesta ${afterRise} €. El ${discountPercent}% de ${afterRise} es ${discount} €. Precio final: ${final} €.`,
      ['variacion_porcentual', 'dos_cambios']
    )
  }

  const original = ri(4, 10) * 100
  const increase = [20, 25, 50][ri(0, 2)]
  const newValue = original * (1 + increase / 100)

  return mc(
    skill,
    d,
    seed,
    `Una cantidad pasa de ${original} a ${newValue}. ¿Qué porcentaje ha aumentado?`,
    `${increase}%`,
    [
      `${100 - increase}%`,
      `${Math.max(5, increase - 10)}%`,
      `${Math.min(100, increase + 10)}%`,
    ],
    `El aumento es ${newValue - original}. Dividimos entre ${original} y multiplicamos por 100: ${increase}%.`,
    ['variacion_porcentual', 'hallar_variacion', 'dificultad_alta']
  )
}

if (key === 'proportion_word_problem') {
  const variant = ri(0, d === 1 ? 1 : d === 2 ? 2 : 5)

  if (variant === 0) {
    const people = ri(2, 6)
    const perPerson = ri(2, 5)
    const portions = people * perPerson
    const target = ri(people + 1, people + 6)
    const answer = target * perPerson

    return mc(
      skill,
      d,
      seed,
      `Para ${people} personas hacen falta ${portions} porciones. ¿Cuántas hacen falta para ${target} personas?`,
      String(answer),
      [
        String(portions + target),
        String(portions * target),
        String(target),
      ],
      `Son ${perPerson} porciones por persona. ${target}×${perPerson}=${answer}.`,
      ['problema_proporcionalidad', 'receta']
    )
  }

  if (variant === 1) {
    const notebooks = ri(2, 6)
    const unitPrice = ri(2, 8)
    const cost = notebooks * unitPrice
    const target = ri(7, 12)
    const answer = target * unitPrice

    return mc(
      skill,
      d,
      seed,
      `${notebooks} cuadernos cuestan ${cost} €. ¿Cuánto cuestan ${target} cuadernos al mismo precio unitario?`,
      String(answer),
      [
        String(cost + target),
        String(target * notebooks),
        String(unitPrice),
      ],
      `Cada cuaderno cuesta ${unitPrice} €. ${target}×${unitPrice}=${answer} €.`,
      ['problema_proporcionalidad', 'precio']
    )
  }

  if (variant === 2) {
    const distance = ri(2, 5) * 40
    const fuel = ri(2, 6)
    const factor = ri(2, 4)
    const targetDistance = distance * factor
    const answer = fuel * factor

    return mc(
      skill,
      d,
      seed,
      `Un coche consume ${fuel} L en ${distance} km. ¿Cuántos litros consumirá en ${targetDistance} km al mismo ritmo?`,
      String(answer),
      [
        String(fuel + factor),
        String(distance / fuel),
        String(answer + fuel),
      ],
      `La distancia se multiplica por ${factor}, así que el consumo también: ${fuel}×${factor}=${answer} L.`,
      ['problema_proporcionalidad', 'consumo']
    )
  }

  if (variant === 3) {
    const metres = ri(2, 6)
    const costPerMetre = ri(3, 9)
    const cost = metres * costPerMetre
    const budgetMetres = ri(7, 14)
    const answer = budgetMetres * costPerMetre

    return mc(
      skill,
      d,
      seed,
      `${metres} m de tela cuestan ${cost} €. ¿Cuánto costarán ${budgetMetres} m?`,
      String(answer),
      [
        String(cost + budgetMetres),
        String(budgetMetres * metres),
        String(answer - costPerMetre),
      ],
      `Cada metro cuesta ${costPerMetre} €. ${budgetMetres}×${costPerMetre}=${answer} €.`,
      ['problema_proporcionalidad', 'medida']
    )
  }

  if (variant === 4) {
    const servings = ri(2, 5)
    const flourPerServing = ri(50, 100)
    const flour = servings * flourPerServing
    const target = ri(6, 12)
    const answer = target * flourPerServing

    return mc(
      skill,
      d,
      seed,
      `Para ${servings} raciones se necesitan ${flour} g de harina. ¿Cuántos gramos se necesitan para ${target} raciones?`,
      String(answer),
      [
        String(flour + target),
        String(flour * target),
        String(answer - flourPerServing),
      ],
      `Son ${flourPerServing} g por ración. ${target}×${flourPerServing}=${answer} g.`,
      ['problema_proporcionalidad', 'receta']
    )
  }

  const workers = ri(2, 5)
  const itemsPerWorker = ri(10, 30)
  const hours = ri(2, 5)
  const total = workers * itemsPerWorker * hours
  const targetWorkers = ri(6, 9)
  const answer = targetWorkers * itemsPerWorker * hours

  return mc(
    skill,
    d,
    seed,
    `${workers} trabajadores producen ${total} piezas en ${hours} horas trabajando al mismo ritmo. ¿Cuántas producirán ${targetWorkers} trabajadores en el mismo tiempo?`,
    String(answer),
    [
      String(total + targetWorkers),
      String(itemsPerWorker * targetWorkers),
      String(total * targetWorkers),
    ],
    `Cada trabajador produce ${itemsPerWorker} piezas por hora. En ${hours} horas, ${targetWorkers} trabajadores producen ${answer}.`,
    ['problema_proporcionalidad', 'varios_pasos', 'dificultad_alta']
  )
}

 // =========================
// M09 · ÁLGEBRA Y ECUACIONES
// =========================

if (key === 'algebra_expression') {
  if (d === 1) {
    const n = ri(2, 9)
    const family = pickFamily(seed, 5)
    const variants = [
      {
        prompt: `¿Qué expresión representa "un número más ${n}"?`,
        answer: `x + ${n}`,
        distractors: [`${n}x`, `x - ${n}`, `${n} - x`],
        solution: `Si llamamos x al número, sumarle ${n} se escribe x + ${n}.`,
        tag: 'sumar_constante',
      },
      {
        prompt: `¿Qué expresión representa "un número menos ${n}"?`,
        answer: `x - ${n}`,
        distractors: [`${n} - x`, `${n}x`, `x + ${n}`],
        solution: `Partimos del número x y le restamos ${n}: x - ${n}.`,
        tag: 'restar_constante',
      },
      {
        prompt: `¿Qué expresión representa "el doble de un número"?`,
        answer: '2x',
        distractors: ['x + 2', 'x²', '2 - x'],
        solution: 'El doble de x se obtiene multiplicando x por 2: 2x.',
        tag: 'doble',
      },
      {
        prompt: `¿Qué expresión representa "la mitad de un número"?`,
        answer: 'x ÷ 2',
        distractors: ['2x', 'x - 2', '2 ÷ x'],
        solution: 'La mitad de x se obtiene dividiendo x entre 2: x ÷ 2.',
        tag: 'mitad',
      },
      {
        prompt: `¿Qué expresión representa "la diferencia entre un número y ${n}"?`,
        answer: `x - ${n}`,
        distractors: [`${n} - x`, `x + ${n}`, `${n}x`],
        solution: `La diferencia entre el número x y ${n}, en ese orden, es x - ${n}.`,
        tag: 'diferencia_orden',
      },
    ]
    const variant = variants[family]
    return mc(
      skill,
      d,
      seed,
      variant.prompt,
      variant.answer,
      variant.distractors,
      variant.solution,
      ['lenguaje_algebraico', `family:algebra_expression:d1:${variant.tag}`]
    )
  }

  if (d === 2) {
    const n = ri(2, 9)

    return mc(
      skill,
      d,
      seed,
      `¿Qué expresión representa "el triple de un número menos ${n}"?`,
      `3x - ${n}`,
      [
        `3(x - ${n})`,
        `x - ${3 * n}`,
        `${n}x - 3`,
      ],
      `El triple de un número es 3x y después restamos ${n}: 3x - ${n}.`,
      ['lenguaje_algebraico']
    )
  }

  if (d === 3) {
    const a = ri(2, 6)
    const b = ri(2, 10)

    return mc(
      skill,
      d,
      seed,
      `¿Qué expresión representa "${a} veces un número aumentado en ${b}"?`,
      `${a}x + ${b}`,
      [
        `${a}(x + ${b})`,
        `${a + b}x`,
        `x + ${a * b}`,
      ],
      `${a} veces el número es ${a}x; después aumentamos ${b}: ${a}x + ${b}.`,
      ['lenguaje_algebraico', 'interpretacion']
    )
  }

  if (d === 4) {
    const a = ri(2, 5)
    const b = ri(2, 8)

    return mc(
      skill,
      d,
      seed,
      `¿Qué expresión representa "${a} veces la suma de un número y ${b}"?`,
      `${a}(x + ${b})`,
      [
        `${a}x + ${b}`,
        `${a + b}x`,
        `x + ${a * b}`,
      ],
      `La suma es x + ${b}; al multiplicarla completa por ${a} obtenemos ${a}(x + ${b}).`,
      ['lenguaje_algebraico', 'parentesis']
    )
  }

  const a = ri(2, 6)
  const b = ri(2, 8)
  const c = ri(2, 7)

  return mc(
    skill,
    d,
    seed,
    `¿Qué expresión representa "${a} veces la diferencia entre un número y ${b}, más ${c}"?`,
    `${a}(x - ${b}) + ${c}`,
    [
      `${a}x - ${b} + ${c}`,
      `${a}(x + ${b}) - ${c}`,
      `${a}x - ${b + c}`,
    ],
    `Primero expresamos la diferencia x - ${b}, la multiplicamos por ${a} y después sumamos ${c}.`,
    ['lenguaje_algebraico', 'parentesis', 'dificultad_alta']
  )
}

if (key === 'algebra_evaluate') {
  if (d === 1) {
    const x = ri(1, 10)
    const b = ri(1, 10)
    const answer = x + b

    return mc(
      skill,
      d,
      seed,
      `Si x = ${x}, ¿cuánto vale x + ${b}?`,
      String(answer),
      [
        String(x * b),
        String(x - b),
        String(answer + 1),
      ],
      `Sustituimos x por ${x}: ${x} + ${b} = ${answer}.`,
      ['valor_numerico']
    )
  }

  if (d === 2) {
    const x = ri(1, 10)
    const a = ri(2, 6)
    const b = ri(1, 10)
    const answer = a * x + b

    return mc(
      skill,
      d,
      seed,
      `Si x = ${x}, calcula ${a}x + ${b}`,
      String(answer),
      [
        String(a + x + b),
        String(a * (x + b)),
        String(answer - b),
      ],
      `Sustituimos x=${x}: ${a}×${x}+${b}=${answer}.`,
      ['valor_numerico']
    )
  }

  if (d === 3) {
    const x = ri(-6, 8)
    const a = ri(2, 6)
    const b = ri(-8, 8)
    const answer = a * x + b

    return mc(
      skill,
      d,
      seed,
      `Si x = ${x}, calcula ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`,
      String(answer),
      [
        String(a + x + b),
        String(a * (x + b)),
        String(-answer),
      ],
      `Sustituimos x por ${x}: ${a}×(${x}) ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${answer}.`,
      ['valor_numerico', 'enteros']
    )
  }

  if (d === 4) {
    const x = ri(-5, 7)
    const a = ri(2, 5)
    const b = ri(1, 6)
    const c = ri(-8, 8)
    const answer = a * (x + b) + c

    return mc(
      skill,
      d,
      seed,
      `Si x = ${x}, calcula ${a}(x + ${b}) ${c >= 0 ? '+' : '-'} ${Math.abs(c)}`,
      String(answer),
      [
        String(a * x + b + c),
        String(a * (x - b) + c),
        String(-answer),
      ],
      `Primero sustituimos: ${a}(${x}+${b}) ${c >= 0 ? '+' : '-'} ${Math.abs(c)} = ${answer}.`,
      ['valor_numerico', 'parentesis']
    )
  }

  const x = ri(-5, 6)
  const y = ri(-5, 6)
  const a = ri(2, 5)
  const b = ri(2, 5)
  const c = ri(-8, 8)
  const answer = a * x - b * y + c

  return mc(
    skill,
    d,
    seed,
    `Si x = ${x} e y = ${y}, calcula ${a}x - ${b}y ${c >= 0 ? '+' : '-'} ${Math.abs(c)}`,
    String(answer),
    [
      String(a * x + b * y + c),
      String(a + x - b + y + c),
      String(-answer),
    ],
    `Sustituimos ambas variables y operamos: ${a}×(${x}) - ${b}×(${y}) ${c >= 0 ? '+' : '-'} ${Math.abs(c)} = ${answer}.`,
    ['valor_numerico', 'dos_variables', 'dificultad_alta']
  )
}

if (key === 'algebra_like_terms') {
  if (d === 1) {
    const a = ri(2, 8)
    const b = ri(2, 8)
    const answer = a + b

    return mc(
      skill,
      d,
      seed,
      `Simplifica ${a}x + ${b}x`,
      `${answer}x`,
      [
        `${a * b}x`,
        `${answer}x²`,
        `${Math.abs(a - b)}x`,
      ],
      `Son términos semejantes: (${a}+${b})x=${answer}x.`,
      ['terminos_semejantes']
    )
  }

  if (d === 2) {
    const a = ri(5, 12)
    const b = ri(2, a - 1)
    const answer = a - b

    return mc(
      skill,
      d,
      seed,
      `Simplifica ${a}x - ${b}x`,
      `${answer}x`,
      [
        `${a + b}x`,
        `${answer}x²`,
        `${a * b}x`,
      ],
      `Restamos los coeficientes: (${a}-${b})x=${answer}x.`,
      ['terminos_semejantes']
    )
  }

  if (d === 3) {
    const a = ri(2, 8)
    const b = ri(2, 8)
    const c = ri(1, 10)
    const answer = a + b

    return mc(
      skill,
      d,
      seed,
      `Simplifica ${a}x + ${c} + ${b}x`,
      `${answer}x + ${c}`,
      [
        `${answer + c}x`,
        `${a * b}x + ${c}`,
        `${answer}x`,
      ],
      `Agrupamos términos semejantes: ${a}x+${b}x=${answer}x. El término independiente ${c} permanece.`,
      ['terminos_semejantes', 'termino_independiente']
    )
  }

  if (d === 4) {
    const a = ri(3, 9)
    const b = ri(2, 8)
    const c = ri(1, a - 1)
    const e = ri(1, 7)
    const coef = a - c
    const constant = b + e

    return mc(
      skill,
      d,
      seed,
      `Simplifica ${a}x + ${b} - ${c}x + ${e}`,
      `${coef}x + ${constant}`,
      [
        `${a + c}x + ${constant}`,
        `${coef}x + ${b - e}`,
        `${coef + constant}x`,
      ],
      `Agrupamos las x: ${a}-${c}=${coef}. Agrupamos constantes: ${b}+${e}=${constant}.`,
      ['terminos_semejantes', 'varios_terminos']
    )
  }

  const a = ri(3, 10)
  const b = ri(2, 8)
  const c = ri(2, 8)
  const e = ri(1, a - 1)
  const f = ri(1, b - 1)

  const coefX = a - e
  const coefY = b - f

  return mc(
    skill,
    d,
    seed,
    `Simplifica ${a}x + ${b}y - ${e}x - ${f}y + ${c}`,
    `${coefX}x + ${coefY}y + ${c}`,
    [
      `${a + e}x + ${b + f}y + ${c}`,
      `${coefX + coefY}xy + ${c}`,
      `${coefX}x + ${coefY + c}y`,
    ],
    `Agrupamos por separado los términos con x, con y y el término independiente.`,
    ['terminos_semejantes', 'dos_variables', 'dificultad_alta']
  )
}

if (key === 'algebra_distributive') {
  if (d === 1) {
    const a = ri(2, 6)
    const b = ri(1, 8)

    return mc(
      skill,
      d,
      seed,
      `Desarrolla ${a}(x + ${b})`,
      `${a}x + ${a * b}`,
      [
        `${a}x + ${b}`,
        `${a + b}x`,
        `${a}x + ${a + b}`,
      ],
      `Aplicamos la distributiva: ${a}·x + ${a}·${b} = ${a}x + ${a * b}.`,
      ['propiedad_distributiva']
    )
  }

  if (d === 2) {
    const a = ri(2, 7)
    const b = ri(1, 8)

    return mc(
      skill,
      d,
      seed,
      `Desarrolla ${a}(x - ${b})`,
      `${a}x - ${a * b}`,
      [
        `${a}x - ${b}`,
        `${a - b}x`,
        `${a}x + ${a * b}`,
      ],
      `Distribuimos ${a}: ${a}x - ${a}×${b} = ${a}x - ${a * b}.`,
      ['propiedad_distributiva']
    )
  }

  if (d === 3) {
    const a = ri(2, 6)
    const b = ri(2, 5)
    const c = ri(1, 7)

    return mc(
      skill,
      d,
      seed,
      `Desarrolla ${a}(${b}x + ${c})`,
      `${a * b}x + ${a * c}`,
      [
        `${a + b}x + ${c}`,
        `${a * b}x + ${c}`,
        `${a + b}x + ${a * c}`,
      ],
      `Multiplicamos ${a} por cada término: ${a * b}x + ${a * c}.`,
      ['propiedad_distributiva', 'coeficiente']
    )
  }

  if (d === 4) {
    const a = ri(2, 6)
    const b = ri(2, 5)
    const c = ri(1, 7)
    const e = ri(1, 8)

    return mc(
      skill,
      d,
      seed,
      `Simplifica ${a}(${b}x - ${c}) + ${e}`,
      `${a * b}x - ${a * c - e}`,
      [
        `${a * b}x - ${a * c + e}`,
        `${a + b}x - ${c + e}`,
        `${a * b}x - ${c} + ${e}`,
      ],
      `Distribuimos: ${a * b}x-${a * c}+${e}. Al agrupar constantes queda ${a * b}x-${a * c - e}.`,
      ['propiedad_distributiva', 'simplificacion']
    )
  }

  const a = ri(2, 5)
  const b = ri(1, 7)
  const c = ri(2, 5)
  const e = ri(1, 7)

  const coef = a + c
  const constant = a * b - c * e

  return mc(
    skill,
    d,
    seed,
    `Simplifica ${a}(x + ${b}) + ${c}(x - ${e})`,
    `${coef}x ${constant >= 0 ? '+' : '-'} ${Math.abs(constant)}`,
    [
      `${a * c}x ${constant >= 0 ? '+' : '-'} ${Math.abs(constant)}`,
      `${coef}x + ${a * b + c * e}`,
      `${a + c + b + e}x`,
    ],
    `Desarrollamos ambos paréntesis y agrupamos términos semejantes. Resultado: ${coef}x ${constant >= 0 ? '+' : '-'} ${Math.abs(constant)}.`,
    ['propiedad_distributiva', 'dos_parentesis', 'dificultad_alta']
  )
}

if (key === 'equation_one_step') {
  if (d === 1) {
    const x = ri(1, 15)
    const b = ri(2, 10)
    const total = x + b

    return mc(
      skill,
      d,
      seed,
      `Resuelve x + ${b} = ${total}`,
      String(x),
      [
        String(total + b),
        String(b),
        String(Math.abs(total - x)),
      ],
      `Restamos ${b} en ambos lados: x=${total}-${b}=${x}.`,
      ['ecuacion_un_paso']
    )
  }

  if (d === 2) {
    const x = ri(2, 15)
    const b = ri(2, 10)
    const total = x - b

    return mc(
      skill,
      d,
      seed,
      `Resuelve x - ${b} = ${total}`,
      String(x),
      [
        String(total - b),
        String(b - total),
        String(total),
      ],
      `Sumamos ${b} en ambos lados: x=${total}+${b}=${x}.`,
      ['ecuacion_un_paso']
    )
  }

  if (d === 3) {
    const x = ri(2, 12)
    const a = ri(2, 9)
    const total = a * x

    return mc(
      skill,
      d,
      seed,
      `Resuelve ${a}x = ${total}`,
      String(x),
      [
        String(total - a),
        String(total + a),
        String(a),
      ],
      `Dividimos ambos lados entre ${a}: x=${total}÷${a}=${x}.`,
      ['ecuacion_un_paso', 'multiplicacion']
    )
  }

  if (d === 4) {
    const divisor = ri(2, 8)
    const x = ri(2, 12) * divisor
    const result = x / divisor

    return mc(
      skill,
      d,
      seed,
      `Resuelve x/${divisor} = ${result}`,
      String(x),
      [
        String(result / divisor),
        String(result + divisor),
        String(result),
      ],
      `Multiplicamos ambos lados por ${divisor}: x=${result}×${divisor}=${x}.`,
      ['ecuacion_un_paso', 'division']
    )
  }

  const x = ri(-15, 15)
  const b = ri(-10, 10)
  const total = x + b

  return mc(
    skill,
    d,
    seed,
    `Resuelve x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${total}`,
    String(x),
    [
      String(total + b),
      String(-x),
      String(total),
    ],
    `Aislamos x realizando la operación inversa. x=${x}.`,
    ['ecuacion_un_paso', 'enteros', 'dificultad_alta']
  )
}

if (key === 'equation_two_step') {
  if (d === 1) {
    const x = ri(1, 10)
    const a = ri(2, 6)
    const b = ri(1, 8)
    const total = a * x + b

    return mc(
      skill,
      d,
      seed,
      `Resuelve ${a}x + ${b} = ${total}`,
      String(x),
      [
        String(total - b),
        String(total / a),
        String(x + b),
      ],
      `Restamos ${b}: ${a}x=${total - b}. Dividimos entre ${a}: x=${x}.`,
      ['ecuacion_dos_pasos']
    )
  }

  if (d === 2) {
    const x = ri(1, 12)
    const a = ri(2, 7)
    const b = ri(1, 10)
    const total = a * x - b

    return mc(
      skill,
      d,
      seed,
      `Resuelve ${a}x - ${b} = ${total}`,
      String(x),
      [
        String(total + b),
        String(total / a),
        String(x - b),
      ],
      `Sumamos ${b}: ${a}x=${total + b}. Después dividimos entre ${a}: x=${x}.`,
      ['ecuacion_dos_pasos']
    )
  }

  if (d === 3) {
    const x = ri(-8, 12)
    const a = ri(2, 7)
    const b = ri(-10, 10)
    const total = a * x + b

    return mc(
      skill,
      d,
      seed,
      `Resuelve ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${total}`,
      String(x),
      [
        String(total - b),
        String(-x),
        String(total / a),
      ],
      `Deshacemos primero el término independiente y después dividimos entre ${a}. x=${x}.`,
      ['ecuacion_dos_pasos', 'enteros']
    )
  }

  if (d === 4) {
    const x = ri(1, 10)
    const a = ri(2, 5)
    const b = ri(1, 6)
    const total = a * (x + b)

    return mc(
      skill,
      d,
      seed,
      `Resuelve ${a}(x + ${b}) = ${total}`,
      String(x),
      [
        String(total / a),
        String(x + b),
        String(total - b),
      ],
      `Dividimos entre ${a}: x+${b}=${total / a}. Restamos ${b}: x=${x}.`,
      ['ecuacion_dos_pasos', 'parentesis']
    )
  }

  const x = ri(-8, 10)
  const a = ri(2, 6)
  const b = ri(-8, 8)
  const c = ri(-10, 10)
  const total = a * (x + b) + c

  return mc(
    skill,
    d,
    seed,
    `Resuelve ${a}(x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}) ${c >= 0 ? '+' : '-'} ${Math.abs(c)} = ${total}`,
    String(x),
    [
      String(total - c),
      String(-x),
      String(total / a),
    ],
    `Aislamos el paréntesis, dividimos entre ${a} y finalmente despejamos x. Resultado: x=${x}.`,
    ['ecuacion_dos_pasos', 'parentesis', 'dificultad_alta']
  )
}

if (key === 'equation_both_sides') {
  if (d === 1) {
    const x = ri(1, 10)
    const a = ri(2, 6)
    const c = ri(1, a - 1)
    const b = ri(1, 8)
    const right = a * x + b - c * x

    return mc(
      skill,
      d,
      seed,
      `Resuelve ${a}x + ${b} = ${c}x + ${right}`,
      String(x),
      [
        String(right - b),
        String(a - c),
        String(x + 1),
      ],
      `Pasamos las x a un lado y los números al otro. El resultado es x=${x}.`,
      ['ecuacion_ambos_lados']
    )
  }

  if (d === 2) {
    const x = ri(-8, 10)
    const a = ri(3, 7)
    const c = ri(1, a - 1)
    const b = ri(-8, 8)
    const right = a * x + b - c * x

    return mc(
      skill,
      d,
      seed,
      `Resuelve ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c}x ${right >= 0 ? '+' : '-'} ${Math.abs(right)}`,
      String(x),
      [
        String(-x),
        String(a - c),
        String(right - b),
      ],
      `Agrupamos términos con x y términos independientes. x=${x}.`,
      ['ecuacion_ambos_lados', 'enteros']
    )
  }

  if (d === 3) {
    const x = ri(1, 10)
    const a = ri(2, 5)
    const b = ri(1, 6)
    const c = ri(1, a - 1)
    const leftConstant = a * b
    const rightConstant = a * x + leftConstant - c * x

    return mc(
      skill,
      d,
      seed,
      `Resuelve ${a}(x + ${b}) = ${c}x + ${rightConstant}`,
      String(x),
      [
        String(rightConstant),
        String(x + b),
        String(-x),
      ],
      `Desarrollamos el paréntesis y agrupamos las x en un lado. Resultado: x=${x}.`,
      ['ecuacion_ambos_lados', 'distributiva']
    )
  }

  if (d === 4) {
    const x = ri(-6, 8)
    const a = ri(3, 6)
    const c = ri(1, a - 1)
    const b = ri(-5, 5)
    const e = ri(-6, 6)
    const rightConstant = a * (x + b) - c * x - e

    return mc(
      skill,
      d,
      seed,
      `Resuelve ${a}(x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}) = ${c}x ${e >= 0 ? '+' : '-'} ${Math.abs(e)} ${rightConstant >= 0 ? '+' : '-'} ${Math.abs(rightConstant)}`,
      String(x),
      [
        String(-x),
        String(a - c),
        String(rightConstant),
      ],
      `Desarrollamos, agrupamos los términos semejantes y despejamos x. Resultado: ${x}.`,
      ['ecuacion_ambos_lados', 'distributiva']
    )
  }

  const x = ri(-8, 8)
  const a = ri(3, 6)
  const c = ri(1, a - 1)
  const b = ri(-5, 5)
  const e = ri(-5, 5)

  const left = a * (x + b)
  const rightBase = c * (x + e)
  const extra = left - rightBase

  return mc(
    skill,
    d,
    seed,
    `Resuelve ${a}(x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}) = ${c}(x ${e >= 0 ? '+' : '-'} ${Math.abs(e)}) ${extra >= 0 ? '+' : '-'} ${Math.abs(extra)}`,
    String(x),
    [
      String(-x),
      String(a + c),
      String(extra),
    ],
    `Desarrollamos ambos lados, agrupamos las x y despejamos. La solución es x=${x}.`,
    ['ecuacion_ambos_lados', 'dos_parentesis', 'dificultad_alta']
  )
}

if (key === 'equation_word_problem') {
  const variant = ri(0, d <= 2 ? 2 : 5)

  if (variant === 0) {
    const x = ri(5, 20)
    const extra = ri(2, 10)
    const total = x + extra

    return mc(
      skill,
      d,
      seed,
      `Pienso un número. Si le sumo ${extra}, obtengo ${total}. ¿Qué número es?`,
      String(x),
      [
        String(total + extra),
        String(extra),
        String(total),
      ],
      `Planteamos x + ${extra} = ${total}. Por tanto x=${x}.`,
      ['problema_ecuaciones']
    )
  }

  if (variant === 1) {
    const x = ri(3, 15)
    const multiplier = ri(2, 6)
    const total = x * multiplier

    return mc(
      skill,
      d,
      seed,
      `El ${multiplier === 2 ? 'doble' : multiplier === 3 ? 'triple' : `${multiplier} veces`} de un número es ${total}. ¿Cuál es el número?`,
      String(x),
      [
        String(total - multiplier),
        String(total + multiplier),
        String(multiplier),
      ],
      `Planteamos ${multiplier}x=${total}. Dividimos entre ${multiplier}: x=${x}.`,
      ['problema_ecuaciones', 'multiplicacion']
    )
  }

  if (variant === 2) {
    const x = ri(5, 20)
    const price = ri(2, 8)
    const fixed = ri(2, 10)
    const total = price * x + fixed

    return mc(
      skill,
      d,
      seed,
      `Una actividad cuesta ${fixed} € de inscripción más ${price} € por sesión. Si se pagan ${total} €, ¿cuántas sesiones se han realizado?`,
      String(x),
      [
        String(total / price),
        String(x + fixed),
        String(total - fixed),
      ],
      `Planteamos ${price}x + ${fixed} = ${total}. Restamos ${fixed} y dividimos entre ${price}: x=${x}.`,
      ['problema_ecuaciones', 'dos_pasos']
    )
  }

  if (variant === 3) {
    const age = ri(8, 20)
    const years = ri(2, 8)
    const future = age + years

    return mc(
      skill,
      d,
      seed,
      `Dentro de ${years} años una persona tendrá ${future} años. ¿Qué edad tiene ahora?`,
      String(age),
      [
        String(future + years),
        String(years),
        String(future),
      ],
      `Si x es la edad actual: x + ${years} = ${future}. Entonces x=${age}.`,
      ['problema_ecuaciones', 'edad']
    )
  }

  if (variant === 4) {
    const x = ri(4, 15)
    const multiplier = ri(2, 5)
    const extra = ri(2, 10)
    const total = multiplier * x + extra

    return mc(
      skill,
      d,
      seed,
      `El ${multiplier === 2 ? 'doble' : multiplier === 3 ? 'triple' : `${multiplier} veces`} de un número más ${extra} es ${total}. ¿Cuál es el número?`,
      String(x),
      [
        String(total - extra),
        String(total / multiplier),
        String(x + extra),
      ],
      `Planteamos ${multiplier}x + ${extra} = ${total}. Restamos ${extra} y dividimos entre ${multiplier}: x=${x}.`,
      ['problema_ecuaciones', 'dos_pasos']
    )
  }

  const x = ri(5, 15)
  const a = ri(2, 5)
  const b = ri(2, 8)
  const total = a * (x + b)

  return mc(
    skill,
    d,
    seed,
    `Se compran ${a} paquetes iguales. Cada paquete contiene el mismo número de unidades más ${b} unidades extra. En total hay ${total} unidades. ¿Cuántas unidades base contiene cada paquete?`,
    String(x),
    [
      String(total / a),
      String(total - b),
      String(x + b),
    ],
    `Planteamos ${a}(x + ${b}) = ${total}. Dividimos entre ${a} y restamos ${b}: x=${x}.`,
    ['problema_ecuaciones', 'parentesis', 'dificultad_alta']
  )
}

  // =========================
// M10 · RECTAS Y ÁNGULOS
// =========================

if (key === 'geometry_lines') {
  if (d === 1) {
    const variants = [
      {
        prompt: 'Dos rectas que nunca se cortan y mantienen siempre la misma distancia son...',
        answer: 'Paralelas',
        solution: 'Las rectas paralelas nunca se cortan y mantienen siempre la misma distancia.',
      },
      {
        prompt: 'Dos rectas que se cortan formando cuatro ángulos rectos son...',
        answer: 'Perpendiculares',
        solution: 'Las rectas perpendiculares se cortan formando ángulos de 90°.',
      },
      {
        prompt: 'Dos rectas que se cortan en un punto son...',
        answer: 'Secantes',
        solution: 'Las rectas secantes tienen un punto de corte.',
      },
    ]

    const v = variants[ri(0, variants.length - 1)]

    return mc(
      skill,
      d,
      seed,
      v.prompt,
      v.answer,
      ['Paralelas', 'Perpendiculares', 'Secantes', 'Segmentos'].filter(
        (x) => x !== v.answer
      ),
      v.solution,
      ['rectas']
    )
  }

  if (d === 2) {
    const variants = [
      {
        prompt: 'Dos carreteras mantienen siempre la misma separación y no llegan a cruzarse. ¿Qué relación tienen?',
        answer: 'Son paralelas',
        solution: 'Mantener siempre la misma distancia sin cortarse corresponde a rectas paralelas.',
      },
      {
        prompt: 'Dos calles se cruzan formando un ángulo de 90°. ¿Qué relación tienen?',
        answer: 'Son perpendiculares',
        solution: 'Si se cortan formando 90°, son perpendiculares.',
      },
      {
        prompt: 'Dos líneas se cruzan formando ángulos que no son rectos. ¿Qué tipo de rectas son?',
        answer: 'Secantes',
        solution: 'Al cortarse en un punto son secantes, aunque no sean perpendiculares.',
      },
    ]

    const v = variants[ri(0, variants.length - 1)]

    return mc(
      skill,
      d,
      seed,
      v.prompt,
      v.answer,
      ['Son paralelas', 'Son perpendiculares', 'Son secantes', 'Son segmentos'].filter(
        (x) => x !== v.answer
      ),
      v.solution,
      ['rectas', 'contexto']
    )
  }

  if (d === 3) {
    return mc(
      skill,
      d,
      seed,
      '¿Cuál de estas afirmaciones es correcta?',
      'Dos rectas perpendiculares también son secantes',
      [
        'Dos rectas paralelas siempre son secantes',
        'Dos rectas secantes siempre son perpendiculares',
        'Dos rectas paralelas forman un ángulo de 90°',
      ],
      'Las rectas perpendiculares se cortan en un punto, así que son un caso particular de rectas secantes.',
      ['rectas', 'razonamiento']
    )
  }

  if (d === 4) {
    return mc(
      skill,
      d,
      seed,
      'Dos rectas se cortan formando un ángulo de 65°. ¿Cómo se clasifican?',
      'Secantes no perpendiculares',
      [
        'Paralelas',
        'Perpendiculares',
        'Coincidentes',
      ],
      'Se cortan, por tanto son secantes. Como no forman 90°, no son perpendiculares.',
      ['rectas', 'clasificacion']
    )
  }

  return mc(
    skill,
    d,
    seed,
    '¿Qué condición garantiza que dos rectas de un plano sean paralelas?',
    'Que no tengan ningún punto en común y mantengan dirección constante',
    [
      'Que se corten formando 90°',
      'Que tengan exactamente un punto en común',
      'Que midan la misma longitud',
    ],
    'Dos rectas paralelas tienen la misma dirección y no se cortan.',
    ['rectas', 'razonamiento', 'dificultad_alta']
  )
}

if (key === 'angle_types') {
  if (d === 1) {
    const angle = [30, 45, 60, 90, 120, 150, 180][ri(0, 6)]

    const answer =
      angle < 90
        ? 'Agudo'
        : angle === 90
          ? 'Recto'
          : angle < 180
            ? 'Obtuso'
            : 'Llano'

    return mc(
      skill,
      d,
      seed,
      `¿Qué tipo de ángulo mide ${angle}°?`,
      answer,
      ['Agudo', 'Recto', 'Obtuso', 'Llano'].filter((x) => x !== answer),
      `Un ángulo de ${angle}° es ${answer.toLowerCase()}.`,
      ['tipo_angulo']
    )
  }

  if (d === 2) {
    const type = ri(0, 2)

    if (type === 0) {
      const angle = ri(10, 89)

      return mc(
        skill,
        d,
        seed,
        `Un ángulo mide ${angle}°. ¿Cómo se clasifica?`,
        'Agudo',
        ['Recto', 'Obtuso', 'Llano'],
        'Todo ángulo mayor de 0° y menor de 90° es agudo.',
        ['tipo_angulo']
      )
    }

    if (type === 1) {
      const angle = ri(91, 179)

      return mc(
        skill,
        d,
        seed,
        `Un ángulo mide ${angle}°. ¿Cómo se clasifica?`,
        'Obtuso',
        ['Agudo', 'Recto', 'Llano'],
        'Todo ángulo mayor de 90° y menor de 180° es obtuso.',
        ['tipo_angulo']
      )
    }

    const angle = ri(181, 300)

    return mc(
      skill,
      d,
      seed,
      `Un ángulo mide ${angle}°. ¿Cómo se clasifica?`,
      'Cóncavo',
      ['Agudo', 'Obtuso', 'Llano'],
      'Un ángulo mayor de 180° y menor de 360° es cóncavo.',
      ['tipo_angulo', 'concavo']
    )
  }

  if (d === 3) {
    const variants = [
      {
        prompt: '¿Cuál de estos ángulos es agudo?',
        answer: '72°',
        distractors: ['90°', '120°', '180°'],
      },
      {
        prompt: '¿Cuál de estos ángulos es obtuso?',
        answer: '135°',
        distractors: ['45°', '90°', '180°'],
      },
      {
        prompt: '¿Cuál de estos ángulos es llano?',
        answer: '180°',
        distractors: ['60°', '90°', '140°'],
      },
    ]

    const v = variants[ri(0, variants.length - 1)]

    return mc(
      skill,
      d,
      seed,
      v.prompt,
      v.answer,
      v.distractors,
      `La respuesta correcta es ${v.answer}.`,
      ['tipo_angulo', 'reconocimiento']
    )
  }

  if (d === 4) {
    const angle = ri(20, 80)
    const supplementary = 180 - angle

    return mc(
      skill,
      d,
      seed,
      `Un ángulo mide ${angle}°. Su suplementario mide ${supplementary}°. ¿Qué tipo de ángulo es el suplementario?`,
      supplementary < 90 ? 'Agudo' : supplementary === 90 ? 'Recto' : 'Obtuso',
      ['Agudo', 'Recto', 'Obtuso', 'Llano'].filter((x) => {
        const correct =
          supplementary < 90
            ? 'Agudo'
            : supplementary === 90
              ? 'Recto'
              : 'Obtuso'
        return x !== correct
      }),
      `El suplementario mide ${supplementary}°.`,
      ['tipo_angulo', 'suplementarios']
    )
  }

  const a = ri(20, 80)
  const b = ri(100, 170)

  return mc(
    skill,
    d,
    seed,
    `¿Cuál de estas afirmaciones es correcta sobre los ángulos ${a}° y ${b}°?`,
    `${a}° es agudo y ${b}° es obtuso`,
    [
      `${a}° es obtuso y ${b}° es agudo`,
      'Los dos son rectos',
      'Los dos son agudos',
    ],
    `${a}° es menor de 90° y ${b}° está entre 90° y 180°.`,
    ['tipo_angulo', 'comparacion', 'dificultad_alta']
  )
}

if (key === 'angle_measure') {
  if (d === 1) {
    const angle1 = ri(2, 7) * 10
    const angle2 = ri(2, 7) * 10
    const total = angle1 + angle2

    return mc(
      skill,
      d,
      seed,
      `Dos ángulos miden ${angle1}° y ${angle2}°. ¿Cuánto miden entre los dos?`,
      `${total}°`,
      [
        `${Math.abs(angle1 - angle2)}°`,
        `${total + 10}°`,
        `${Math.max(0, total - 10)}°`,
      ],
      `${angle1}° + ${angle2}° = ${total}°.`,
      ['medida_angulos']
    )
  }

  if (d === 2) {
    const total = ri(9, 17) * 10
    const known = ri(2, total / 10 - 1) * 10
    const missing = total - known

    return mc(
      skill,
      d,
      seed,
      `Dos ángulos suman ${total}°. Si uno mide ${known}°, ¿cuánto mide el otro?`,
      `${missing}°`,
      [
        `${total + known}°`,
        `${known}°`,
        `${Math.abs(total - missing)}°`,
      ],
      `${total}° - ${known}° = ${missing}°.`,
      ['medida_angulos', 'angulo_desconocido']
    )
  }

  if (d === 3) {
    const a = ri(2, 6) * 10
    const b = ri(2, 6) * 10
    const c = ri(2, 6) * 10
    const total = a + b + c

    return mc(
      skill,
      d,
      seed,
      `Tres ángulos miden ${a}°, ${b}° y ${c}°. ¿Cuánto suman?`,
      `${total}°`,
      [
        `${a + b}°`,
        `${Math.abs(a + b - c)}°`,
        `${total + 10}°`,
      ],
      `${a}+${b}+${c}=${total}°.`,
      ['medida_angulos', 'tres_angulos']
    )
  }

  if (d === 4) {
    const total = 180
    const a = ri(3, 7) * 10
    const b = ri(3, 7) * 10
    const missing = total - a - b

    return mc(
      skill,
      d,
      seed,
      `Tres ángulos forman un ángulo llano. Dos miden ${a}° y ${b}°. ¿Cuánto mide el tercero?`,
      `${missing}°`,
      [
        `${180 - a}°`,
        `${180 - b}°`,
        `${a + b}°`,
      ],
      `Un ángulo llano mide 180°. Entonces 180-${a}-${b}=${missing}°.`,
      ['medida_angulos', 'varios_pasos']
    )
  }

  const total = 360
  const a = ri(4, 9) * 10
  const b = ri(4, 9) * 10
  const c = ri(4, 9) * 10
  const missing = total - a - b - c

  return mc(
    skill,
    d,
    seed,
    `Alrededor de un punto hay cuatro ángulos. Tres miden ${a}°, ${b}° y ${c}°. ¿Cuánto mide el cuarto?`,
    `${missing}°`,
    [
      `${180 - a}°`,
      `${a + b + c}°`,
      `${360 - a - b}°`,
    ],
    `Los ángulos alrededor de un punto suman 360°. 360-${a}-${b}-${c}=${missing}°.`,
    ['medida_angulos', 'alrededor_punto', 'dificultad_alta']
  )
}

if (key === 'angle_relations') {
  if (d === 1) {
    const a = ri(2, 8) * 10
    const answer = 90 - a

    return mc(
      skill,
      d,
      seed,
      `Dos ángulos son complementarios. Si uno mide ${a}°, ¿cuánto mide el otro?`,
      `${answer}°`,
      [
        `${180 - a}°`,
        `${a}°`,
        `${90 + a}°`,
      ],
      `Los complementarios suman 90°. 90-${a}=${answer}°.`,
      ['angulos_complementarios']
    )
  }

  if (d === 2) {
    const a = ri(2, 16) * 10
    const answer = 180 - a

    return mc(
      skill,
      d,
      seed,
      `Dos ángulos son suplementarios. Si uno mide ${a}°, ¿cuánto mide el otro?`,
      `${answer}°`,
      [
        `${90 - Math.min(a, 90)}°`,
        `${a}°`,
        `${180 + a}°`,
      ],
      `Los suplementarios suman 180°. 180-${a}=${answer}°.`,
      ['angulos_suplementarios']
    )
  }

  if (d === 3) {
    const a = ri(3, 15) * 10

    return mc(
      skill,
      d,
      seed,
      `Dos ángulos opuestos por el vértice. Si uno mide ${a}°, ¿cuánto mide el otro?`,
      `${a}°`,
      [
        `${180 - a}°`,
        `${90 - Math.min(a, 90)}°`,
        `${a + 10}°`,
      ],
      'Los ángulos opuestos por el vértice tienen la misma medida.',
      ['angulos_opuestos_vertice']
    )
  }

  if (d === 4) {
    const a = ri(3, 15) * 10
    const adjacent = 180 - a

    return mc(
      skill,
      d,
      seed,
      `Dos rectas se cortan. Uno de los ángulos mide ${a}°. ¿Cuánto mide uno de sus ángulos adyacentes?`,
      `${adjacent}°`,
      [
        `${a}°`,
        `${90 - Math.min(a, 90)}°`,
        `${a + 20}°`,
      ],
      `Los ángulos adyacentes formados por dos rectas suman 180°. ${180}-${a}=${adjacent}°.`,
      ['angulos_adyacentes', 'suplementarios']
    )
  }

  const a = ri(3, 8) * 10
  const complement = 90 - a
  const supplementary = 180 - a

  return mc(
    skill,
    d,
    seed,
    `Un ángulo mide ${a}°. ¿Cuánto miden respectivamente su complementario y su suplementario?`,
    `${complement}° y ${supplementary}°`,
    [
      `${supplementary}° y ${complement}°`,
      `${a}° y ${180 - a}°`,
      `${90 + a}° y ${180 + a}°`,
    ],
    `Complementario: 90-${a}=${complement}°. Suplementario: 180-${a}=${supplementary}°.`,
    ['relaciones_angulos', 'dificultad_alta']
  )
}

if (key === 'parallel_angles') {
  if (d === 1) {
    const angle = ri(3, 14) * 10

    return mc(
      skill,
      d,
      seed,
      `Dos rectas paralelas son cortadas por una secante. Si un ángulo correspondiente mide ${angle}°, ¿cuánto mide el otro correspondiente?`,
      `${angle}°`,
      [
        `${180 - angle}°`,
        `${Math.abs(90 - angle)}°`,
        `${angle + 10}°`,
      ],
      `Los ángulos correspondientes son iguales: ${angle}°.`,
      ['angulos_paralelas']
    )
  }

  if (d === 2) {
    const angle = ri(3, 14) * 10

    return mc(
      skill,
      d,
      seed,
      `Dos rectas paralelas son cortadas por una secante. Un ángulo alterno interno mide ${angle}°. ¿Cuánto mide su alterno interno?`,
      `${angle}°`,
      [
        `${180 - angle}°`,
        `${90 - Math.min(angle, 90)}°`,
        `${angle + 20}°`,
      ],
      'Los ángulos alternos internos entre rectas paralelas son iguales.',
      ['angulos_paralelas', 'alternos_internos']
    )
  }

  if (d === 3) {
    const angle = ri(3, 14) * 10
    const supplementary = 180 - angle

    return mc(
      skill,
      d,
      seed,
      `En dos rectas paralelas cortadas por una secante, un ángulo interior mide ${angle}°. ¿Cuánto mide el ángulo interior del mismo lado de la secante?`,
      `${supplementary}°`,
      [
        `${angle}°`,
        `${90 - Math.min(angle, 90)}°`,
        `${supplementary + 10}°`,
      ],
      `Los ángulos interiores del mismo lado son suplementarios: 180-${angle}=${supplementary}°.`,
      ['angulos_paralelas', 'interiores_mismo_lado']
    )
  }

  if (d === 4) {
    const angle = ri(4, 13) * 10
    const supplementary = 180 - angle

    return mc(
      skill,
      d,
      seed,
      `Una secante corta dos rectas paralelas. Si uno de los ángulos es ${angle}°, ¿qué dos medidas distintas aparecerán entre los ocho ángulos formados?`,
      `${angle}° y ${supplementary}°`,
      [
        `${angle}° y 90°`,
        `${supplementary}° y 90°`,
        `Solo ${angle}°`,
      ],
      `Los ángulos iguales conservan ${angle}° y los adyacentes miden ${supplementary}°.`,
      ['angulos_paralelas', 'razonamiento']
    )
  }

  const angle = ri(3, 14) * 10
  const supplementary = 180 - angle

  return mc(
    skill,
    d,
    seed,
    `Dos rectas paralelas son cortadas por una secante. Si un ángulo exterior mide ${angle}°, ¿cuánto puede medir un ángulo interior adyacente?`,
    `${supplementary}°`,
    [
      `${angle}°`,
      `${90 - Math.min(angle, 90)}°`,
      `${angle + 10}°`,
    ],
    `Los ángulos adyacentes son suplementarios: 180-${angle}=${supplementary}°.`,
    ['angulos_paralelas', 'exteriores', 'dificultad_alta']
  )
}

 // =========================
// M11 · FIGURAS GEOMÉTRICAS
// =========================

if (key === 'polygon_classification') {
  if (d === 1) {
    const sides = [3, 4, 5, 6, 8][ri(0, 4)]
    const names: Record<number, string> = {
      3: 'Triángulo',
      4: 'Cuadrilátero',
      5: 'Pentágono',
      6: 'Hexágono',
      8: 'Octógono',
    }
    const answer = names[sides]

    return mc(
      skill,
      d,
      seed,
      `¿Cómo se llama un polígono de ${sides} lados?`,
      answer,
      ['Triángulo', 'Cuadrilátero', 'Pentágono', 'Hexágono', 'Octógono']
        .filter((x) => x !== answer)
        .slice(0, 3),
      `Un polígono de ${sides} lados se llama ${answer.toLowerCase()}.`,
      ['poligonos', 'clasificacion']
    )
  }

  if (d === 2) {
    const variants = [
      {
        prompt: 'Una figura cerrada tiene 5 lados y 5 vértices. ¿Qué figura es?',
        answer: 'Pentágono',
      },
      {
        prompt: 'Una señal tiene forma de polígono de 8 lados. ¿Cómo se llama esa figura?',
        answer: 'Octógono',
      },
      {
        prompt: 'Una figura cerrada está formada por 6 segmentos. ¿Cómo se clasifica?',
        answer: 'Hexágono',
      },
      {
        prompt: 'Una figura cerrada tiene exactamente 4 lados. ¿A qué familia pertenece?',
        answer: 'Cuadriláteros',
      },
    ]

    const v = variants[ri(0, variants.length - 1)]

    return mc(
      skill,
      d,
      seed,
      v.prompt,
      v.answer,
      ['Triángulo', 'Cuadriláteros', 'Pentágono', 'Hexágono', 'Octógono']
        .filter((x) => x !== v.answer)
        .slice(0, 3),
      `La figura descrita corresponde a ${v.answer.toLowerCase()}.`,
      ['poligonos', 'reconocimiento']
    )
  }

  if (d === 3) {
    return mc(
      skill,
      d,
      seed,
      '¿Cuál de estas afirmaciones sobre los polígonos es correcta?',
      'Un pentágono tiene cinco lados y cinco vértices',
      [
        'Un hexágono tiene cinco lados',
        'Todo cuadrilátero es un cuadrado',
        'Un triángulo tiene cuatro vértices',
      ],
      'En un polígono hay tantos vértices como lados. Un pentágono tiene cinco de cada.',
      ['poligonos', 'razonamiento']
    )
  }

  if (d === 4) {
    const sides = ri(5, 10)

    return mc(
      skill,
      d,
      seed,
      `Un polígono tiene ${sides} vértices. ¿Cuántos lados tiene?`,
      String(sides),
      [
        String(sides - 1),
        String(sides + 1),
        String(sides * 2),
      ],
      `Un polígono tiene el mismo número de lados que de vértices: ${sides}.`,
      ['poligonos', 'lados_vertices']
    )
  }

  return mc(
    skill,
    d,
    seed,
    '¿Cuál de estas figuras NO es un polígono?',
    'Una figura cerrada cuyo borde contiene un arco de circunferencia',
    [
      'Una figura cerrada formada por tres segmentos',
      'Una figura cerrada formada por cinco segmentos',
      'Una figura cerrada formada por ocho segmentos',
    ],
    'Los polígonos están formados únicamente por segmentos rectos.',
    ['poligonos', 'propiedades', 'dificultad_alta']
  )
}

if (key === 'triangle_types') {
  if (d === 1) {
    const variants = [
      {
        prompt: 'Un triángulo tiene sus tres lados iguales. ¿Cómo se llama?',
        answer: 'Equilátero',
      },
      {
        prompt: 'Un triángulo tiene exactamente dos lados iguales. ¿Cómo se llama?',
        answer: 'Isósceles',
      },
      {
        prompt: 'Un triángulo tiene sus tres lados de distinta longitud. ¿Cómo se llama?',
        answer: 'Escaleno',
      },
    ]

    const v = variants[ri(0, variants.length - 1)]

    return mc(
      skill,
      d,
      seed,
      v.prompt,
      v.answer,
      ['Equilátero', 'Isósceles', 'Escaleno', 'Rectángulo'].filter(
        (x) => x !== v.answer
      ),
      `Por sus lados, ese triángulo es ${v.answer.toLowerCase()}.`,
      ['triangulos', 'clasificacion_lados']
    )
  }

  if (d === 2) {
    const variants = [
      {
        angles: '60°, 60° y 60°',
        answer: 'Acutángulo',
        explanation: 'Todos sus ángulos son menores de 90°.',
      },
      {
        angles: '90°, 55° y 35°',
        answer: 'Rectángulo',
        explanation: 'Tiene un ángulo de 90°.',
      },
      {
        angles: '110°, 40° y 30°',
        answer: 'Obtusángulo',
        explanation: 'Tiene un ángulo mayor de 90°.',
      },
    ]

    const v = variants[ri(0, variants.length - 1)]

    return mc(
      skill,
      d,
      seed,
      `Un triángulo tiene ángulos de ${v.angles}. ¿Cómo se clasifica según sus ángulos?`,
      v.answer,
      ['Acutángulo', 'Rectángulo', 'Obtusángulo', 'Equilátero'].filter(
        (x) => x !== v.answer
      ),
      v.explanation,
      ['triangulos', 'clasificacion_angulos']
    )
  }

  if (d === 3) {
    const a = ri(3, 7)
    const b = a
    const c = ri(2, 8)

    if (c === a) {
      return mc(
        skill,
        d,
        seed,
        `Un triángulo tiene lados de ${a} cm, ${b} cm y ${c} cm. ¿Cómo se clasifica por sus lados?`,
        'Equilátero',
        ['Isósceles', 'Escaleno', 'Rectángulo'],
        'Los tres lados tienen la misma longitud, por lo que es equilátero.',
        ['triangulos', 'clasificacion_lados']
      )
    }

    return mc(
      skill,
      d,
      seed,
      `Un triángulo tiene lados de ${a} cm, ${b} cm y ${c} cm. ¿Cómo se clasifica por sus lados?`,
      'Isósceles',
      ['Equilátero', 'Escaleno', 'Rectángulo'],
      `Dos lados miden ${a} cm, por lo que es isósceles.`,
      ['triangulos', 'clasificacion_lados']
    )
  }

  if (d === 4) {
    const angle1 = ri(3, 7) * 10
    const angle2 = ri(3, 7) * 10
    const angle3 = 180 - angle1 - angle2

    const answer =
      angle1 === 90 || angle2 === 90 || angle3 === 90
        ? 'Rectángulo'
        : angle1 > 90 || angle2 > 90 || angle3 > 90
          ? 'Obtusángulo'
          : 'Acutángulo'

    return mc(
      skill,
      d,
      seed,
      `Dos ángulos de un triángulo miden ${angle1}° y ${angle2}°. ¿Cómo se clasifica el triángulo según sus ángulos?`,
      answer,
      ['Acutángulo', 'Rectángulo', 'Obtusángulo'].filter((x) => x !== answer),
      `El tercer ángulo mide 180-${angle1}-${angle2}=${angle3}°. Por tanto es ${answer.toLowerCase()}.`,
      ['triangulos', 'angulos', 'varios_pasos']
    )
  }

  return mc(
    skill,
    d,
    seed,
    '¿Cuál de estas afirmaciones es necesariamente cierta?',
    'Todo triángulo equilátero es también acutángulo',
    [
      'Todo triángulo isósceles es rectángulo',
      'Todo triángulo escaleno es obtusángulo',
      'Todo triángulo rectángulo es equilátero',
    ],
    'Un triángulo equilátero tiene tres ángulos de 60°, por lo que todos son agudos.',
    ['triangulos', 'razonamiento', 'dificultad_alta']
  )
}

if (key === 'quadrilateral_types') {
  const names = ['Cuadrado', 'Rectángulo', 'Rombo', 'Paralelogramo', 'Trapecio']
  const otherNames = (answer: string) => names.filter((x) => x !== answer).slice(0, 3)

  // 25 familias pedagógicas reales: 5 por nivel de dificultad.
  if (d === 1) {
    const family = ri(0, 4)

    if (family === 0) {
      const variants = [
        ['Tiene cuatro lados iguales y cuatro ángulos rectos.', 'Cuadrado', 'Un cuadrado cumple simultáneamente ambas propiedades.'],
        ['Tiene cuatro ángulos rectos y los lados opuestos son iguales.', 'Rectángulo', 'Un rectángulo tiene cuatro ángulos de 90° y lados opuestos iguales.'],
        ['Tiene cuatro lados iguales, sin exigir ángulos rectos.', 'Rombo', 'La propiedad característica indicada es la de un rombo.'],
        ['Tiene dos pares de lados opuestos paralelos.', 'Paralelogramo', 'Un paralelogramo tiene sus dos pares de lados opuestos paralelos.'],
        ['Tiene exactamente un par de lados paralelos.', 'Trapecio', 'Con la convención usada aquí, un trapecio tiene exactamente un par de lados paralelos.'],
      ] as const
      const v = variants[ri(0, variants.length - 1)]
      return mc(skill, d, seed, `${v[0]} ¿Qué cuadrilátero describe?`, v[1], otherNames(v[1]), v[2], ['cuadrilateros', 'family:identify_by_properties'])
    }

    if (family === 1) {
      const answer = ['Cuadrado', 'Rectángulo', 'Rombo', 'Trapecio'][ri(0, 3)]
      const facts: Record<string, string> = {
        Cuadrado: 'Tiene cuatro lados iguales y cuatro ángulos rectos',
        Rectángulo: 'Tiene cuatro ángulos rectos',
        Rombo: 'Tiene cuatro lados iguales',
        Trapecio: 'Tiene exactamente un par de lados paralelos',
      }
      return mc(skill, d, seed, `¿Qué afirmación describe correctamente un ${answer.toLowerCase()}?`, facts[answer], [
        'Tiene exactamente tres lados', 'Todos sus ángulos tienen que ser agudos', 'No puede tener ningún lado paralelo'
      ], `La propiedad correcta es: ${facts[answer].toLowerCase()}.`, ['cuadrilateros', 'family:recognize_fact'])
    }

    if (family === 2) {
      const pair = [['Cuadrado', 4], ['Rectángulo', 2], ['Rombo', 2], ['Paralelogramo', 2], ['Trapecio', 1]][ri(0, 4)] as [string, number]
      const answer = pair[1] === 1 ? '1 par' : `${pair[1]} pares`
      return mc(skill, d, seed, `¿Cuántos pares de lados paralelos tiene un ${pair[0].toLowerCase()}?`, answer,
        ['0 pares', '1 par', '2 pares', '4 pares'].filter((x) => x !== answer).slice(0, 3),
        `Un ${pair[0].toLowerCase()} tiene ${answer} de lados paralelos.`, ['cuadrilateros', 'family:parallel_pairs'])
    }

    if (family === 3) {
      const shape = ['Cuadrado', 'Rectángulo'][ri(0, 1)]
      return mc(skill, d, seed, `¿Cuánto mide cada ángulo interior de un ${shape.toLowerCase()}?`, '90°', ['45°', '60°', '120°'],
        `Los cuatro ángulos interiores de un ${shape.toLowerCase()} son rectos: 90°.`, ['cuadrilateros', 'family:right_angles'])
    }

    const shape = ['Cuadrado', 'Rombo'][ri(0, 1)]
    return mc(skill, d, seed, `¿Qué propiedad comparten siempre un cuadrado y un rombo?`, 'Sus cuatro lados tienen la misma longitud',
      ['Sus cuatro ángulos son rectos', 'Tienen exactamente un par de lados paralelos', 'Sus diagonales tienen siempre la misma longitud'],
      `Tanto el cuadrado como el rombo tienen sus cuatro lados iguales.`, ['cuadrilateros', 'family:shared_equal_sides'])
  }

  if (d === 2) {
    const family = ri(0, 4)

    if (family === 0) {
      const promptType = ri(0, 1)
      if (promptType === 0) return mc(skill, d, seed,
        'Una figura tiene cuatro ángulos rectos, pero no tiene los cuatro lados iguales. ¿Cuál es la clasificación más precisa?',
        'Rectángulo', ['Cuadrado', 'Rombo', 'Trapecio'],
        'Los cuatro ángulos rectos la hacen rectángulo; al no tener cuatro lados iguales, no es cuadrado.', ['cuadrilateros', 'family:distinguish_rectangle_square'])
      return mc(skill, d, seed,
        'Una figura tiene cuatro lados iguales, pero uno de sus ángulos no mide 90°. ¿Cuál es la clasificación más precisa?',
        'Rombo', ['Cuadrado', 'Rectángulo', 'Trapecio'],
        'Cuatro lados iguales permiten clasificarla como rombo; al no tener cuatro ángulos rectos, no es cuadrado.', ['cuadrilateros', 'family:distinguish_rhombus_square'])
    }

    if (family === 1) return mc(skill, d, seed,
      '¿Cuál de estas afirmaciones es siempre verdadera para todo cuadrado?',
      'También es un rectángulo y un rombo', ['No es un paralelogramo', 'Tiene exactamente un par de lados paralelos', 'Sus diagonales nunca son iguales'],
      'Un cuadrado tiene cuatro ángulos rectos y cuatro lados iguales, así que cumple las definiciones de rectángulo y rombo.', ['cuadrilateros', 'family:class_inclusion'])

    if (family === 2) {
      const angle = [70, 80, 110, 120][ri(0, 3)]
      const opposite = angle
      return mc(skill, d, seed, `En un paralelogramo, un ángulo interior mide ${angle}°. ¿Cuánto mide el ángulo opuesto?`, `${opposite}°`,
        [`${180-angle}°`, `${90-angle/2}°`, `${angle+10}°`],
        'En todo paralelogramo, los ángulos opuestos son iguales.', ['cuadrilateros', 'family:opposite_angles_basic'])
    }

    if (family === 3) {
      const angle = [55, 65, 72, 105, 118][ri(0, 4)]
      return mc(skill, d, seed, `En un paralelogramo, un ángulo mide ${angle}°. ¿Cuánto mide uno de sus ángulos adyacentes?`, `${180-angle}°`,
        [`${angle}°`, `${Math.round(90-angle/2)}°`, `${180-angle+10}°`],
        `Los ángulos consecutivos de un paralelogramo son suplementarios: 180°-${angle}°=${180-angle}°.`, ['cuadrilateros', 'family:adjacent_angles_basic'])
    }

    return mc(skill, d, seed,
      '¿Cuál de estas situaciones es imposible en un cuadrilátero?',
      'Tener cinco ángulos interiores', ['Tener cuatro lados', 'Tener dos diagonales', 'Tener cuatro vértices'],
      'Por definición, un cuadrilátero tiene cuatro lados, cuatro vértices y cuatro ángulos interiores.', ['cuadrilateros', 'family:impossible_basic'])
  }

  if (d === 3) {
    const family = ri(0, 4)

    if (family === 0) {
      const a = ri(60, 120), b = ri(60, 120), c = ri(60, 120)
      const fourth = 360 - a - b - c
      if (fourth > 10 && fourth < 170) return mc(skill, d, seed,
        `Tres ángulos de un cuadrilátero miden ${a}°, ${b}° y ${c}°. ¿Cuánto mide el cuarto?`, `${fourth}°`,
        [`${180-fourth}°`, `${fourth+10}°`, `${Math.max(10, fourth-10)}°`],
        `La suma de los ángulos interiores de un cuadrilátero es 360°: 360-${a}-${b}-${c}=${fourth}°.`, ['cuadrilateros', 'family:fourth_angle'])
      return mc(skill, d, seed, '¿Cuánto suman los cuatro ángulos interiores de cualquier cuadrilátero?', '360°', ['180°', '270°', '540°'],
        'Todo cuadrilátero puede dividirse en dos triángulos; 2×180°=360°.', ['cuadrilateros', 'family:fourth_angle'])
    }

    if (family === 1) {
      const acute = ri(45, 85), obtuse = 180 - acute
      return mc(skill, d, seed,
        `Un paralelogramo tiene un ángulo de ${acute}°. ¿Cuál es la lista correcta de sus cuatro ángulos?`,
        `${acute}°, ${obtuse}°, ${acute}°, ${obtuse}°`,
        [`${acute}°, ${acute}°, ${obtuse}°, ${obtuse}°`, `90°, 90°, 90°, 90°`, `${acute}°, ${obtuse}°, ${obtuse}°, ${obtuse}°`],
        'Los opuestos son iguales y los consecutivos suman 180°.', ['cuadrilateros', 'family:all_parallelogram_angles'])
    }

    if (family === 2) return mc(skill, d, seed,
      '¿Qué propiedad de las diagonales permite distinguir siempre un rectángulo de un paralelogramo cualquiera?',
      'En el rectángulo las diagonales tienen la misma longitud', ['En el rectángulo hay una sola diagonal', 'En el rectángulo las diagonales no se cortan', 'En el rectángulo las diagonales son lados'],
      'Las diagonales de un rectángulo son congruentes; un paralelogramo general no tiene por qué tenerlas iguales.', ['cuadrilateros', 'family:rectangle_diagonals'])

    if (family === 3) return mc(skill, d, seed,
      'Un cuadrilátero tiene sus cuatro lados iguales y sus diagonales se cortan perpendicularmente. ¿Qué clasificación encaja mejor sin suponer ángulos rectos?',
      'Rombo', ['Rectángulo', 'Trapecio', 'Paralelogramo sin más información'],
      'Cuatro lados iguales y diagonales perpendiculares son propiedades de un rombo; no se han dado cuatro ángulos rectos.', ['cuadrilateros', 'family:rhombus_diagonals'])

    const top = ri(50, 120)
    return mc(skill, d, seed,
      `En un trapecio isósceles, uno de los ángulos de una base mide ${top}°. ¿Cuánto mide el otro ángulo de esa misma base?`, `${top}°`,
      [`${180-top}°`, '90°', `${top+20}°`],
      'En un trapecio isósceles, los dos ángulos apoyados sobre una misma base son iguales.', ['cuadrilateros', 'family:isosceles_trapezoid_base_angles'])
  }

  if (d === 4) {
    const family = ri(0, 4)

    if (f…16881 tokens truncated…espondiente'],`El área necesita base y altura perpendicular; otro lado no determina necesariamente la altura.`,['area_triangulo','razonamiento','family:m12s03_d4_dato'])
  }

  const base=ri(6,14)*2,height=ri(4,10),area=(base*height)/2
  if (family===0) {
    const x=height
    return mc(skill,d,seed,`Un triángulo tiene base ${base} cm y área ${area} cm². Si su altura es x, ¿cuánto vale x?`,String(x),[String(x+2),String(x*2),String(area/base)],`(${base}·x)/2=${area}; x=${x}.`,['area_triangulo','ecuacion','family:m12s03_d5_ecuacion'])
  }
  if (family===1) {
    const scale=3
    return mc(skill,d,seed,`Un triángulo se amplía multiplicando todas sus longitudes por ${scale}. ¿Por cuánto se multiplica su área?`,'Por 9',['Por 3','Por 6','Por 27'],`El área escala con el cuadrado del factor: ${scale}²=9.`,['area_triangulo','semejanza','family:m12s03_d5_escala'])
  }
  if (family===2) {
    const rectArea=base*height
    return mc(skill,d,seed,`Un rectángulo de ${base}×${height} cm contiene un triángulo cuya base y altura coinciden con las del rectángulo. ¿Qué fracción del área del rectángulo ocupa el triángulo?`,'1/2',['1/3','1/4','2/3'],`Área triángulo ${area}; rectángulo ${rectArea}. La razón es 1/2.`,['area_triangulo','razon','family:m12s03_d5_fraccion'])
  }
  if (family===3) {
    const area2=area+ri(5,15)
    return mc(skill,d,seed,`Dos triángulos tienen la misma base. El primero tiene área ${area} cm² y el segundo ${area2} cm². ¿Cuál tiene mayor altura?`,'El segundo',['El primero','Tienen la misma altura','No se puede saber'],`Con la misma base, mayor área implica mayor altura.`,['area_triangulo','razonamiento','family:m12s03_d5_misma_base'])
  }
  const halfBase=base/2,doubleHeight=height*2
  return mc(skill,d,seed,`Un triángulo cambia de base ${base} cm y altura ${height} cm a base ${halfBase} cm y altura ${doubleHeight} cm. ¿Qué ocurre con su área?`,'Permanece igual',['Se duplica','Se reduce a la mitad','Se cuadruplica'],`El producto base×altura sigue siendo ${base*height}; por tanto el área no cambia.`,['area_triangulo','invariancia','family:m12s03_d5_compensacion'])
}

// M12S04 · Área de paralelogramo y trapecio
if (key === 'quadrilateral_area') {
  const family = pickFamily(seed, 5)

  if (d === 1) {
    const base=ri(4,12),height=ri(3,9),area=base*height
    if (family===0) return mc(skill,d,seed,`Un paralelogramo tiene base ${base} cm y altura ${height} cm. ¿Cuál es su área?`,`${area} cm²`,[`${2*(base+height)} cm²`,`${base+height} cm²`,`${area+height} cm²`],`A=base×altura=${area} cm².`,['area_paralelogramo','family:m12s04_d1_paralelogramo'])
    if (family===1) return mc(skill,d,seed,`¿Qué operación calcula el área de un paralelogramo de base ${base} y altura ${height}?`,`${base} × ${height}`,[`(${base}+${height})×2`,`${base}+${height}`,`(${base}×${height})÷2`],`El área es base×altura.`,['area_paralelogramo','concepto','family:m12s04_d1_operacion'])
    if (family===2) {
      const B=ri(6,12),b=ri(2,B-2),h=ri(2,6)*2,A=((B+b)*h)/2
      return mc(skill,d,seed,`Un trapecio tiene bases ${B} cm y ${b} cm y altura ${h} cm. ¿Cuál es su área?`,`${A} cm²`,[`${(B+b)*h} cm²`,`${B*b} cm²`,`${B+b+h} cm²`],`A=((B+b)×h)/2=${A} cm².`,['area_trapecio','family:m12s04_d1_trapecio'])
    }
    if (family===3) return mc(skill,d,seed,`Un romboide de base ${base} cm y altura perpendicular ${height} cm tiene la misma fórmula de área que un paralelogramo. ¿Cuál es?`,`${area} cm²`,[`${base+height} cm²`,`${2*(base+height)} cm²`,`${area/2} cm²`],`Área = base×altura = ${area} cm².`,['area_paralelogramo','contexto','family:m12s04_d1_romboide'])
    return mc(skill,d,seed,`En la fórmula del área de un trapecio, ¿qué dos longitudes se suman antes de multiplicar por la altura?`,'Las dos bases',['Los dos lados oblicuos','La base mayor y un lado','La altura y una base'],`A=((B+b)×h)/2.`,['area_trapecio','concepto','family:m12s04_d1_bases'])
  }

  if (d === 2) {
    if (family===0) {
      const base=ri(5,14),height=ri(3,10),area=base*height
      return mc(skill,d,seed,`Una parcela con forma de paralelogramo tiene base ${base} m y altura ${height} m. ¿Qué superficie ocupa?`,`${area} m²`,[`${2*(base+height)} m²`,`${base+height} m²`,`${area+base} m²`],`Área=${area} m².`,['area_paralelogramo','contexto','family:m12s04_d2_parcela'])
    }
    if (family===1) {
      const B=ri(7,14),b=ri(3,B-2),h=ri(2,7)*2,A=((B+b)*h)/2
      return mc(skill,d,seed,`Calcula el área de un trapecio con bases ${B} cm y ${b} cm y altura ${h} cm.`,`${A} cm²`,[`${(B+b)*h} cm²`,`${B*b} cm²`,`${B+b+h} cm²`],`A=((B+b)h)/2=${A} cm².`,['area_trapecio','family:m12s04_d2_directa'])
    }
    if (family===2) {
      const base=ri(5,12),height=ri(3,8),area=base*height
      return mc(skill,d,seed,`Dos paralelogramos tienen la misma base ${base} cm y la misma altura ${height} cm, aunque uno esté más inclinado. ¿Cómo son sus áreas?`,'Iguales',['La del más inclinado es mayor','La del menos inclinado es mayor','No se puede saber'],`El área depende de base y altura perpendicular, no de la inclinación.`,['area_paralelogramo','razonamiento','family:m12s04_d2_inclinacion'])
    }
    if (family===3) {
      const B=ri(8,16),b=ri(3,B-2),h=ri(2,6)*2,A=((B+b)*h)/2
      return mc(skill,d,seed,`Un terreno trapezoidal tiene bases ${B} m y ${b} m y altura ${h} m. ¿Qué superficie ocupa?`,`${A} m²`,[`${(B+b)*h} m²`,`${B*b} m²`,`${B+b+h} m²`],`Área del trapecio = ${A} m².`,['area_trapecio','contexto','family:m12s04_d2_terreno'])
    }
    const base=ri(5,12),height=ri(3,8),area=base*height
    return mc(skill,d,seed,`Un paralelogramo y un rectángulo tienen la misma base ${base} cm y altura ${height} cm. ¿Qué relación hay entre sus áreas?`,'Son iguales',['La del rectángulo es el doble','La del paralelogramo es el doble','Depende del lado oblicuo'],`Ambos tienen área base×altura=${area} cm².`,['area_paralelogramo','comparacion','family:m12s04_d2_rectangulo'])
  }

  if (d === 3) {
    if (family===0) {
      const base=ri(5,14),height=ri(3,10),area=base*height
      return mc(skill,d,seed,`Un paralelogramo tiene área ${area} cm² y base ${base} cm. ¿Cuál es su altura?`,`${height} cm`,[`${area-base} cm`,`${base+height} cm`,`${height*2} cm`],`Altura=${area}÷${base}=${height} cm.`,['area_paralelogramo','inverso','family:m12s04_d3_altura'])
    }
    if (family===1) {
      const B=ri(8,16),b=ri(4,B-2),h=ri(2,7)*2,A=((B+b)*h)/2
      return mc(skill,d,seed,`Un trapecio tiene área ${A} cm², bases ${B} cm y ${b} cm. ¿Cuál es su altura?`,`${h} cm`,[`${A/(B+b)} cm`,`${B-b} cm`,`${h*2} cm`],`h=2A/(B+b)=2×${A}/${B+b}=${h} cm.`,['area_trapecio','inverso','family:m12s04_d3_altura_trapecio'])
    }
    if (family===2) {
      const base=ri(6,14),height=ri(4,10),area=base*height,price=ri(2,5)
      return mc(skill,d,seed,`Cubrir un paralelogramo de base ${base} m y altura ${height} m cuesta ${price} € por m². ¿Cuál es el coste?`,`${area*price} €`,[`${area} €`,`${2*(base+height)*price} €`,`${area+price} €`],`Área ${area}; coste ${area*price} €.`,['area_paralelogramo','coste','family:m12s04_d3_coste'])
    }
    if (family===3) {
      const B=ri(8,14),b=ri(3,B-2),h=ri(2,6)*2,A=((B+b)*h)/2
      return mc(skill,d,seed,`Si un trapecio de bases ${B} y ${b} cm y altura ${h} cm duplica su altura, ¿qué ocurre con el área?`,'Se duplica',['Se cuadruplica','No cambia','Se reduce a la mitad'],`El área es proporcional a la altura.`,['area_trapecio','proporcionalidad','family:m12s04_d3_doble_altura'])
    }
    const base=ri(6,14),height=ri(4,10),area=base*height
    return mc(skill,d,seed,`Un paralelogramo de área ${area} cm² se corta y recoloca sin perder piezas hasta formar un rectángulo con la misma base y altura. ¿Qué área tendrá el rectángulo?`,`${area} cm²`,[`${area/2} cm²`,`${area*2} cm²`,`${base+height} cm²`],`Recolocar sin perder piezas conserva el área.`,['area_paralelogramo','conservacion','family:m12s04_d3_recolocar'])
  }

  if (d === 4) {
    if (family===0) {
      const B=ri(8,16),b=ri(4,B-2),h=ri(2,7)*2,A=((B+b)*h)/2,price=ri(2,5)
      return mc(skill,d,seed,`Una parcela trapezoidal de bases ${B} m y ${b} m y altura ${h} m cuesta cubrirla a ${price} € por m². ¿Cuál es el coste?`,`${A*price} €`,[`${A} €`,`${(B+b)*h*price} €`,`${A+price} €`],`Área ${A} m²; coste ${A*price} €.`,['area_trapecio','varios_pasos','family:m12s04_d4_coste'])
    }
    if (family===1) {
      const base=ri(6,14),height=ri(4,10),area=base*height,extra=ri(2,5),newArea=base*(height+extra)
      return mc(skill,d,seed,`La altura de un paralelogramo de base ${base} cm pasa de ${height} a ${height+extra} cm. ¿Cuánto aumenta el área?`,`${newArea-area} cm²`,[`${extra} cm²`,`${base+extra} cm²`,`${newArea} cm²`],`Aumento = base×aumento de altura = ${base}×${extra}=${newArea-area} cm².`,['area_paralelogramo','variacion','family:m12s04_d4_aumento'])
    }
    if (family===2) {
      const B=ri(8,16),b=ri(4,B-2),h=ri(2,7)*2,A=((B+b)*h)/2
      return mc(skill,d,seed,`Un trapecio tiene área ${A} cm² y altura ${h} cm. La suma de sus bases es...`,`${B+b} cm`,[`${A/h} cm`,`${B-b} cm`,`${(B+b)*2} cm`],`B+b=2A/h=2×${A}/${h}=${B+b} cm.`,['area_trapecio','inverso','family:m12s04_d4_suma_bases'])
    }
    if (family===3) {
      const B=ri(8,16),b=ri(4,B-2),h=ri(2,7)*2,A=((B+b)*h)/2
      const mid=(B+b)/2
      return mc(skill,d,seed,`La base media de un trapecio es la media de sus bases. Si las bases son ${B} y ${b} cm, ¿qué relación permite calcular el área?`,`${mid} × ${h} = ${A}`, [`${B*b} = ${B*b}`,`${B+b+h} = ${B+b+h}`,`${mid} + ${h} = ${mid+h}`],`Área = base media × altura = ${mid}×${h}=${A}.`,['area_trapecio','base_media','family:m12s04_d4_media'])
    }
    const base=ri(6,14),height=ri(4,10),area=base*height
    return mc(skill,d,seed,`¿Qué información adicional necesitas, además de la base ${base} cm, para hallar el área de un paralelogramo?`,'La altura perpendicular',['La longitud del lado oblicuo','Un ángulo cualquiera sin más datos','El perímetro'],`El área es base×altura perpendicular.`,['area_paralelogramo','razonamiento','family:m12s04_d4_dato'])
  }

  if (family===0) {
    const B=ri(8,16),b=ri(4,B-2),h=ri(2,7)*2,A=((B+b)*h)/2
    return mc(skill,d,seed,`Un trapecio tiene bases ${B} y ${b} cm. Si su área es ${A} cm², verifica cuál es su altura.`,`${h} cm`,[`${h/2} cm`,`${B-b} cm`,`${A/(B+b)} cm`],`h=2A/(B+b)=${h}.`,['area_trapecio','inverso','family:m12s04_d5_verificar'])
  }
  if (family===1) {
    const base=ri(6,14),height=ri(4,10),area=base*height,scale=2
    return mc(skill,d,seed,`Un paralelogramo se amplía multiplicando base y altura por ${scale}. ¿Por cuánto se multiplica su área?`,'Por 4',['Por 2','Por 8','No cambia'],`El área escala con el cuadrado del factor: 2²=4.`,['area_paralelogramo','escala','family:m12s04_d5_escala'])
  }
  if (family===2) {
    const B=ri(8,16),b=ri(4,B-2),h=ri(2,7)*2,A=((B+b)*h)/2
    const newB=B+2,newb=b-2,newA=((newB+newb)*h)/2
    return mc(skill,d,seed,`En un trapecio de bases ${B} y ${b} cm, la base mayor aumenta 2 cm y la menor disminuye 2 cm, manteniendo la altura ${h} cm. ¿Qué ocurre con el área?`,'Permanece igual',['Aumenta','Disminuye','Se duplica'],`La suma de bases no cambia: ${B+b} cm, así que el área sigue siendo ${newA} cm².`,['area_trapecio','invariancia','family:m12s04_d5_compensacion'])
  }
  if (family===3) {
    const base=ri(6,14),height=ri(4,10),area=base*height
    return mc(skill,d,seed,`Dos paralelogramos tienen igual área ${area} cm². Si uno tiene base ${base} cm, su altura es ${height} cm. ¿Qué debe ocurrir si el otro tiene una base mayor?`,'Debe tener una altura menor',['Debe tener una altura mayor','Debe tener la misma altura','No puede tener la misma área'],`Para conservar el producto base×altura, si la base aumenta la altura debe disminuir.`,['area_paralelogramo','razonamiento','family:m12s04_d5_base_altura'])
  }
  const B=ri(8,16),b=ri(4,B-2),h=ri(2,7)*2,A=((B+b)*h)/2
  return mc(skill,d,seed,`Un trapecio de área ${A} cm² se divide por una línea paralela a las bases en dos regiones. ¿Podemos afirmar que cada región tiene área ${A/2} cm² solo porque la línea está a mitad de altura?`,'No, no necesariamente',['Sí, siempre','Sí, porque las alturas son iguales','Sí, porque las bases son paralelas'],`En un trapecio las anchuras cambian con la altura; dividir la altura por la mitad no garantiza dividir el área por la mitad.`,['area_trapecio','razonamiento','family:m12s04_d5_mitad_altura'])
}

// M12S05 · Circunferencia y círculo
if (key === 'circle_measure') {
  const family = pickFamily(seed, 5)
  const pi = 3.14

  if (d === 1) {
    const radius=ri(2,10),diameter=radius*2
    if (family===0) return mc(skill,d,seed,`Un círculo tiene radio ${radius} cm. ¿Cuál es su diámetro?`,`${diameter} cm`,[`${radius} cm`,`${radius*3} cm`,`${diameter+1} cm`],`Diámetro=2×radio=${diameter} cm.`,['circulo','radio_diametro','family:m12s05_d1_diametro'])
    if (family===1) return mc(skill,d,seed,`Una circunferencia tiene diámetro ${diameter} cm. ¿Cuál es su radio?`,`${radius} cm`,[`${diameter} cm`,`${diameter*2} cm`,`${radius+2} cm`],`Radio=diámetro÷2=${radius} cm.`,['circulo','radio_diametro','family:m12s05_d1_radio'])
    if (family===2) return mc(skill,d,seed,`¿Qué segmento mide el doble que el radio en un círculo?`,'El diámetro',['La cuerda cualquiera','El arco','La tangente'],`El diámetro mide dos radios.`,['circulo','concepto','family:m12s05_d1_concepto'])
    if (family===3) return mc(skill,d,seed,`Si el radio de una rueda es ${radius} cm, ¿qué distancia hay de un extremo al opuesto pasando por el centro?`,`${diameter} cm`,[`${radius} cm`,`${radius+2} cm`,`${radius*4} cm`],`Esa distancia es el diámetro: ${diameter} cm.`,['circulo','contexto','family:m12s05_d1_rueda'])
    return mc(skill,d,seed,`¿Cuál es la unidad correcta para expresar la longitud de una circunferencia?`,'cm',['cm²','cm³','grados'],`La longitud es una magnitud lineal.`,['circulo','unidades','family:m12s05_d1_unidad'])
  }

  if (d === 2) {
    const radius=ri(2,10),diameter=radius*2,circ=pi*diameter
    if (family===0) return mc(skill,d,seed,`Una circunferencia tiene diámetro ${diameter} cm. Usando π≈3,14, ¿cuánto mide su longitud?`,`${circ.toFixed(2)} cm`,[`${(pi*radius).toFixed(2)} cm`,`${diameter*2} cm`,`${(diameter+pi).toFixed(2)} cm`],`L≈πd=3,14×${diameter}=${circ.toFixed(2)} cm.`,['circulo','longitud','family:m12s05_d2_longitud_d'])
    if (family===1) return mc(skill,d,seed,`Una rueda tiene radio ${radius} cm. Usando π≈3,14, ¿cuánto mide aproximadamente su borde?`,`${(2*pi*radius).toFixed(2)} cm`,[`${(pi*radius).toFixed(2)} cm`,`${(pi*radius*radius).toFixed(2)} cm`,`${diameter} cm`],`Longitud≈2πr=${(2*pi*radius).toFixed(2)} cm.`,['circulo','longitud','family:m12s05_d2_longitud_r'])
    if (family===2) return mc(skill,d,seed,`¿Qué fórmula permite calcular la longitud de una circunferencia si conocemos su diámetro d?`,'π · d',['π · d²','2 · d','d ÷ π'],`La longitud de la circunferencia es π por el diámetro.`,['circulo','formula','family:m12s05_d2_formula'])
    if (family===3) return mc(skill,d,seed,`Una rueda de diámetro ${diameter} cm da una vuelta completa. ¿Qué distancia avanza sin deslizar, aproximadamente?`,`${circ.toFixed(2)} cm`,[`${diameter} cm`,`${(pi*radius).toFixed(2)} cm`,`${(diameter*pi*2).toFixed(2)} cm`],`Avanza una longitud de circunferencia: ${circ.toFixed(2)} cm.`,['circulo','contexto','family:m12s05_d2_vuelta'])
    return mc(skill,d,seed,`Si dos circunferencias tienen radios ${radius} cm y ${radius*2} cm, ¿qué relación hay entre sus longitudes?`,'La segunda mide el doble',['La segunda mide cuatro veces más','Son iguales','La primera mide el doble'],`La longitud es directamente proporcional al radio.`,['circulo','proporcionalidad','family:m12s05_d2_doble_radio'])
  }

  if (d === 3) {
    const radius=ri(2,10),diameter=radius*2,area=pi*radius*radius,circ=2*pi*radius
    if (family===0) return mc(skill,d,seed,`Un círculo tiene radio ${radius} cm. Usando π≈3,14, ¿cuál es su área?`,`${area.toFixed(2)} cm²`,[`${circ.toFixed(2)} cm²`,`${(pi*radius).toFixed(2)} cm²`,`${(radius*radius).toFixed(2)} cm²`],`A≈πr²=${area.toFixed(2)} cm².`,['circulo','area','family:m12s05_d3_area'])
    if (family===1) return mc(skill,d,seed,`Un círculo tiene diámetro ${diameter} cm. ¿Qué radio debes usar para calcular su área?`,`${radius} cm`,[`${diameter} cm`,`${diameter*2} cm`,`${radius+1} cm`],`El radio es la mitad del diámetro: ${radius} cm.`,['circulo','varios_pasos','family:m12s05_d3_d_a_r'])
    if (family===2) return mc(skill,d,seed,`¿Qué fórmula corresponde al área de un círculo de radio r?`,'πr²',['2πr','πd','2r²'],`El área es π por el cuadrado del radio.`,['circulo','formula','family:m12s05_d3_formula_area'])
    if (family===3) return mc(skill,d,seed,`Una mesa circular tiene radio ${radius} m. ¿Qué superficie ocupa aproximadamente usando π≈3,14?`,`${area.toFixed(2)} m²`,[`${circ.toFixed(2)} m²`,`${(pi*radius).toFixed(2)} m²`,`${(radius*radius).toFixed(2)} m²`],`Área≈${area.toFixed(2)} m².`,['circulo','contexto','family:m12s05_d3_mesa'])
    return mc(skill,d,seed,`Si el radio de un círculo se duplica, ¿por cuánto se multiplica su área?`,'Por 4',['Por 2','Por 8','No cambia'],`El área depende de r²: duplicar r multiplica el área por 4.`,['circulo','escala','family:m12s05_d3_doble_area'])
  }

  if (d === 4) {
    const radius=ri(2,8),diameter=radius*2,area=pi*radius*radius,circ=2*pi*radius
    if (family===0) return mc(skill,d,seed,`Una pista circular tiene radio ${radius} m. Usando π≈3,14, ¿qué pareja da su longitud exterior y su área?`,`${circ.toFixed(2)} m y ${area.toFixed(2)} m²`,[`${area.toFixed(2)} m y ${circ.toFixed(2)} m²`,`${(pi*radius).toFixed(2)} m y ${area.toFixed(2)} m²`,`${circ.toFixed(2)} m y ${(radius*radius).toFixed(2)} m²`],`Longitud≈${circ.toFixed(2)} m; área≈${area.toFixed(2)} m².`,['circulo','longitud_area','family:m12s05_d4_pareja'])
    if (family===1) {
      const laps=ri(2,5),distance=circ*laps
      return mc(skill,d,seed,`Una rueda de radio ${radius} m da ${laps} vueltas completas sin deslizar. ¿Qué distancia recorre aproximadamente?`,`${distance.toFixed(2)} m`,[`${circ.toFixed(2)} m`,`${(area*laps).toFixed(2)} m`,`${(diameter*laps).toFixed(2)} m`],`Cada vuelta recorre ${circ.toFixed(2)} m; total ${distance.toFixed(2)} m.`,['circulo','varios_pasos','family:m12s05_d4_vueltas'])
    }
    if (family===2) {
      const price=ri(2,5),cost=area*price
      return mc(skill,d,seed,`Cubrir un círculo de radio ${radius} m cuesta ${price} € por m². Usando π≈3,14, ¿cuál es el coste aproximado?`,`${cost.toFixed(2)} €`,[`${area.toFixed(2)} €`,`${(circ*price).toFixed(2)} €`,`${(radius*price).toFixed(2)} €`],`Área≈${area.toFixed(2)}; coste≈${cost.toFixed(2)} €.`,['circulo','coste','family:m12s05_d4_coste'])
    }
    if (family===3) {
      const newR=radius+2,newArea=pi*newR*newR
      return mc(skill,d,seed,`El radio de un círculo aumenta de ${radius} cm a ${newR} cm. ¿Cuánto aumenta aproximadamente el área usando π≈3,14?`,`${(newArea-area).toFixed(2)} cm²`,[`${(2*pi*2).toFixed(2)} cm²`,`${newArea.toFixed(2)} cm²`,`${(circ+2).toFixed(2)} cm²`],`Aumento≈${newArea.toFixed(2)}-${area.toFixed(2)}=${(newArea-area).toFixed(2)} cm².`,['circulo','variacion','family:m12s05_d4_aumento'])
    }
    return mc(skill,d,seed,`Un círculo y una circunferencia tienen radio ${radius} cm. ¿Cuál de estas afirmaciones es correcta?`,'El círculo tiene área y la circunferencia tiene longitud',['Ambos tienen solo longitud','Ambos tienen solo área','La circunferencia tiene área y el círculo longitud'],`El círculo es la región interior; la circunferencia es su borde.`,['circulo','concepto','family:m12s05_d4_diferencia'])
  }

  const radius=ri(3,8),area=pi*radius*radius,circ=2*pi*radius
  if (family===0) {
    const scale=3
    return mc(skill,d,seed,`Si el radio de un círculo se multiplica por ${scale}, ¿por cuánto se multiplica su área?`,'Por 9',['Por 3','Por 6','Por 27'],`El área escala con el cuadrado: 3²=9.`,['circulo','escala','family:m12s05_d5_escala_area'])
  }
  if (family===1) return mc(skill,d,seed,`Si el radio de una circunferencia se duplica, ¿por cuánto se multiplica su longitud?`,'Por 2',['Por 4','Por 8','No cambia'],`L=2πr, por tanto es proporcional a r.`,['circulo','escala','family:m12s05_d5_escala_longitud'])
  if (family===2) {
    const inner=radius,outer=radius+2,ring=pi*(outer*outer-inner*inner)
    return mc(skill,d,seed,`Una corona circular tiene radio interior ${inner} cm y exterior ${outer} cm. ¿Cuál es aproximadamente su área usando π≈3,14?`,`${ring.toFixed(2)} cm²`,[`${(pi*outer*outer).toFixed(2)} cm²`,`${(pi*inner*inner).toFixed(2)} cm²`,`${(2*pi*(outer-inner)).toFixed(2)} cm²`],`Área corona=π(R²-r²)≈${ring.toFixed(2)} cm².`,['circulo','diferencia_areas','family:m12s05_d5_corona'])
  }
  if (family===3) {
    const ratio=area/circ
    return mc(skill,d,seed,`Para un círculo de radio ${radius} cm, ¿cuál es aproximadamente la razón área/longitud usando π≈3,14?`,String(ratio),[String(circ/area),String(area),String(circ)],`A/L=(πr²)/(2πr)=r/2=${radius/2}.`,['circulo','razonamiento','family:m12s05_d5_razon'])
  }
  const diameter=radius*2
  return mc(skill,d,seed,`Una circunferencia tiene longitud aproximada ${circ.toFixed(2)} cm usando π≈3,14. ¿Cuál es su diámetro?`,`${diameter} cm`,[`${radius} cm`,`${(circ/pi/2).toFixed(2)} cm`,`${diameter+2} cm`],`d=L/π≈${circ.toFixed(2)}/3,14=${diameter} cm.`,['circulo','inverso','family:m12s05_d5_diametro_inverso'])
}

// M12S06 · Figuras compuestas
if (key === 'composite_area') {
  const family = pickFamily(seed, 5)

  if (d === 1) {
    const w1=ri(3,8),h1=ri(2,6),w2=ri(2,6),h2=ri(2,5),a1=w1*h1,a2=w2*h2,total=a1+a2
    if (family===0) return mc(skill,d,seed,`Una figura está formada por dos rectángulos sin solaparse: ${w1}×${h1} cm y ${w2}×${h2} cm. ¿Cuál es el área total?`,`${total} cm²`,[`${a1} cm²`,`${a2} cm²`,`${total+w2} cm²`],`Área total=${a1}+${a2}=${total} cm².`,['figuras_compuestas','suma','family:m12s06_d1_dos_rectangulos'])
    if (family===1) return mc(skill,d,seed,`Una figura se compone de dos cuadrados de lados ${w1} cm y ${w2} cm, sin solaparse. ¿Cuál es el área total?`,`${w1*w1+w2*w2} cm²`,[`${w1*w1} cm²`,`${w2*w2} cm²`,`${(w1+w2)**2} cm²`],`Sumamos las áreas de ambos cuadrados.`,['figuras_compuestas','suma','family:m12s06_d1_dos_cuadrados'])
    if (family===2) return mc(skill,d,seed,`Para hallar el área de una figura formada por dos rectángulos que no se solapan, ¿qué debemos hacer?`,'Sumar las áreas de los dos rectángulos',['Sumar solo sus perímetros','Multiplicar sus perímetros','Restar siempre las áreas'],`Si las piezas no se solapan, el área total es la suma.`,['figuras_compuestas','concepto','family:m12s06_d1_metodo'])
    if (family===3) return mc(skill,d,seed,`Una figura en L se divide en dos rectángulos de áreas ${a1} cm² y ${a2} cm². ¿Cuál es el área total?`,`${total} cm²`,[`${Math.abs(a1-a2)} cm²`,`${a1} cm²`,`${a2} cm²`],`Sumamos las dos regiones: ${total} cm².`,['figuras_compuestas','suma','family:m12s06_d1_l'])
    return mc(skill,d,seed,`Una figura está formada por un rectángulo de área ${a1} cm² y un cuadrado de área ${w2*w2} cm², sin solaparse. ¿Qué área ocupa?`,`${a1+w2*w2} cm²`,[`${a1} cm²`,`${w2*w2} cm²`,`${a1*w2} cm²`],`Área total = suma de las dos áreas.`,['figuras_compuestas','suma','family:m12s06_d1_rect_cuad'])
  }

  if (d === 2) {
    if (family===0) {
      const bigW=ri(7,12),bigH=ri(6,10),cutW=ri(2,4),cutH=ri(2,4),result=bigW*bigH-cutW*cutH
      return mc(skill,d,seed,`De un rectángulo de ${bigW}×${bigH} cm se recorta una esquina de ${cutW}×${cutH} cm. ¿Qué área queda?`,`${result} cm²`,[`${bigW*bigH} cm²`,`${cutW*cutH} cm²`,`${result+cutW*cutH} cm²`],`Área restante=${bigW*bigH}-${cutW*cutH}=${result} cm².`,['figuras_compuestas','resta','family:m12s06_d2_recorte'])
    }
    if (family===1) {
      const rectW=ri(5,10),rectH=ri(3,7),triBase=ri(3,8)*2,triH=ri(2,6),rectA=rectW*rectH,triA=triBase*triH/2,total=rectA+triA
      return mc(skill,d,seed,`Una figura une un rectángulo de ${rectW}×${rectH} cm y un triángulo de base ${triBase} cm y altura ${triH} cm. ¿Cuál es el área total?`,`${total} cm²`,[`${rectA} cm²`,`${rectA+triBase*triH} cm²`,`${triA} cm²`],`Rectángulo ${rectA}; triángulo ${triA}; total ${total}.`,['figuras_compuestas','suma','family:m12s06_d2_rect_triang'])
    }
    if (family===2) {
      const side=ri(6,12),cut=ri(2,4),result=side*side-cut*cut
      return mc(skill,d,seed,`A un cuadrado de lado ${side} cm se le quita un cuadrado de lado ${cut} cm. ¿Qué área queda?`,`${result} cm²`,[`${side*side} cm²`,`${cut*cut} cm²`,`${result+cut} cm²`],`Área restante=${side*side}-${cut*cut}=${result} cm².`,['figuras_compuestas','resta','family:m12s06_d2_cuadrado_recorte'])
    }
    if (family===3) {
      const a=ri(3,8),b=ri(2,6),c=ri(2,6),area=a*b+c*b
      return mc(skill,d,seed,`Una figura en L puede dividirse en dos rectángulos de ${a}×${b} cm y ${c}×${b} cm. ¿Cuál es su área?`,`${area} cm²`,[`${a*b} cm²`,`${c*b} cm²`,`${(a+c)+b} cm²`],`Sumamos ${a*b}+${c*b}=${area} cm².`,['figuras_compuestas','descomponer','family:m12s06_d2_l'])
    }
    const bigW=ri(8,14),bigH=ri(6,10),holeW=ri(2,4),holeH=ri(2,4),result=bigW*bigH-holeW*holeH
    return mc(skill,d,seed,`Una placa rectangular de ${bigW}×${bigH} cm tiene un hueco rectangular de ${holeW}×${holeH} cm. ¿Qué superficie de material queda?`,`${result} cm²`,[`${bigW*bigH} cm²`,`${holeW*holeH} cm²`,`${result+holeW} cm²`],`Material restante = área exterior menos hueco = ${result} cm².`,['figuras_compuestas','hueco','family:m12s06_d2_hueco'])
  }

  if (d === 3) {
    if (family===0) {
      const bigW=ri(8,14),bigH=ri(7,12),cutW=ri(2,5),cutH=ri(2,5),remaining=bigW*bigH-cutW*cutH,price=ri(2,5)
      return mc(skill,d,seed,`Un suelo de ${bigW}×${bigH} m tiene una zona de ${cutW}×${cutH} m que no se cubre. Si cubrir cada m² cuesta ${price} €, ¿cuál es el coste?`,`${remaining*price} €`,[`${bigW*bigH*price} €`,`${remaining} €`,`${cutW*cutH*price} €`],`Área útil ${remaining} m²; coste ${remaining*price} €.`,['figuras_compuestas','coste','family:m12s06_d3_coste'])
    }
    if (family===1) {
      const rectW=ri(6,12),rectH=ri(4,8),triBase=rectW,triH=ri(2,6),total=rectW*rectH+triBase*triH/2
      return mc(skill,d,seed,`Una fachada es un rectángulo de ${rectW}×${rectH} m coronado por un triángulo de base ${triBase} m y altura ${triH} m. ¿Qué área total tiene?`,`${total} m²`,[`${rectW*rectH} m²`,`${rectW*rectH+triBase*triH} m²`,`${triBase*triH/2} m²`],`Sumamos rectángulo y triángulo: ${total} m².`,['figuras_compuestas','contexto','family:m12s06_d3_fachada'])
    }
    if (family===2) {
      const outer=ri(8,14),inner=outer-2,result=outer*outer-inner*inner
      return mc(skill,d,seed,`Un marco cuadrado tiene lado exterior ${outer} cm e interior ${inner} cm. ¿Qué área ocupa solo el marco?`,`${result} cm²`,[`${outer*outer} cm²`,`${inner*inner} cm²`,`${(outer-inner)*4} cm²`],`Área marco=${outer*outer}-${inner*inner}=${result} cm².`,['figuras_compuestas','marco','family:m12s06_d3_marco'])
    }
    if (family===3) {
      const w=ri(8,14),h=ri(6,10),half=w/2,total=w*h,halfArea=total/2
      return mc(skill,d,seed,`Un rectángulo de ${w}×${h} cm se divide verticalmente en dos partes iguales. ¿Qué área tiene cada mitad?`,`${halfArea} cm²`,[`${total} cm²`,`${half*h+2} cm²`,`${w+h} cm²`],`Área total ${total}; cada mitad ${halfArea} cm².`,['figuras_compuestas','particion','family:m12s06_d3_mitad'])
    }
    const square=ri(8,14),cutW=ri(2,4),cutH=ri(2,4),remain=square*square-cutW*cutH
    return mc(skill,d,seed,`De una lámina cuadrada de lado ${square} cm se corta un rectángulo de ${cutW}×${cutH} cm. ¿Qué porcentaje aproximado del área original queda?`,`${((remain/(square*square))*100).toFixed(1)}%`,[`${((cutW*cutH/(square*square))*100).toFixed(1)}%`,'50%',`${remain}%`],`Queda ${remain} de ${square*square} cm²: ${(remain/(square*square)*100).toFixed(1)}%.`,['figuras_compuestas','porcentaje','family:m12s06_d3_porcentaje'])
  }

  if (d === 4) {
    if (family===0) {
      const outerW=ri(10,16),outerH=ri(8,14),innerW=outerW-2,innerH=outerH-2,border=outerW*outerH-innerW*innerH
      return mc(skill,d,seed,`Un marco rectangular mide exteriormente ${outerW}×${outerH} cm e interiormente ${innerW}×${innerH} cm. ¿Qué área tiene el marco?`,`${border} cm²`,[`${outerW*outerH} cm²`,`${innerW*innerH} cm²`,`${2*(outerW+outerH)} cm²`],`Área marco = exterior - interior = ${border} cm².`,['figuras_compuestas','diferencia_areas','family:m12s06_d4_marco_rect'])
    }
    if (family===1) {
      const rectW=ri(6,12),rectH=ri(4,8),circleR=ri(2,Math.min(3,Math.floor(rectH/2))),rectA=rectW*rectH,circleA=3.14*circleR*circleR,remain=rectA-circleA
      return mc(skill,d,seed,`Una placa rectangular de ${rectW}×${rectH} cm tiene un agujero circular de radio ${circleR} cm. Usando π≈3,14, ¿qué área de material queda?`,`${remain.toFixed(2)} cm²`,[`${rectA} cm²`,`${circleA.toFixed(2)} cm²`,`${(rectA+circleA).toFixed(2)} cm²`],`Área restante=${rectA}-${circleA.toFixed(2)}=${remain.toFixed(2)} cm².`,['figuras_compuestas','circulo_hueco','family:m12s06_d4_agujero'])
    }
    if (family===2) {
      const w=ri(8,14),h=ri(6,10),triBase=w,triH=ri(3,6),total=w*h+w*triH/2,price=ri(2,5)
      return mc(skill,d,seed,`Una figura formada por un rectángulo ${w}×${h} m y un triángulo de base ${w} m y altura ${triH} m se pinta a ${price} €/m². ¿Cuál es el coste?`,`${total*price} €`,[`${total} €`,`${w*h*price} €`,`${(w*h+w*triH)*price} €`],`Área total ${total} m²; coste ${total*price} €.`,['figuras_compuestas','coste','family:m12s06_d4_coste_compuesto'])
    }
    if (family===3) {
      const outer=ri(10,16),inner=outer-4,border=outer*outer-inner*inner
      return mc(skill,d,seed,`Un marco cuadrado tiene lado exterior ${outer} cm y un hueco cuadrado centrado de lado ${inner} cm. Si el material se reparte en cuatro bandas iguales por simetría, ¿qué área corresponde en total al marco?`,`${border} cm²`,[`${border/4} cm²`,`${outer*outer} cm²`,`${inner*inner} cm²`],`El área total del marco es exterior menos hueco: ${border} cm².`,['figuras_compuestas','simetria','family:m12s06_d4_marco_cuad'])
    }
    const bigW=ri(10,16),bigH=ri(8,14),cutW=ri(2,5),cutH=ri(2,5),remain=bigW*bigH-cutW*cutH
    return mc(skill,d,seed,`Una figura en L se obtiene quitando a un rectángulo de ${bigW}×${bigH} cm una esquina de ${cutW}×${cutH} cm. ¿Qué método es correcto?`,`Calcular ${bigW*bigH} - ${cutW*cutH} = ${remain} cm²`,[`Sumar ${bigW*bigH} + ${cutW*cutH}`,`Calcular solo ${cutW*cutH}`,`Sumar todos los lados`],`En una figura con recorte, restamos el área eliminada.`,['figuras_compuestas','metodo','family:m12s06_d4_metodo'])
  }

  if (family===0) {
    const outer=ri(10,16),inner=outer-4,border=outer*outer-inner*inner,price=ri(2,5)
    return mc(skill,d,seed,`Un marco cuadrado tiene lado exterior ${outer} cm e interior ${inner} cm. Si cada cm² de material cuesta ${price} céntimos, ¿cuál es el coste?`,`${border*price} céntimos`,[`${border} céntimos`,`${outer*outer*price} céntimos`,`${inner*inner*price} céntimos`],`Área material ${border} cm²; coste ${border*price} céntimos.`,['figuras_compuestas','varios_pasos','family:m12s06_d5_marco_coste'])
  }
  if (family===1) {
    const w=ri(10,16),h=ri(8,14),cutW=ri(2,5),cutH=ri(2,5),remain=w*h-cutW*cutH,total=w*h
    return mc(skill,d,seed,`De un rectángulo de ${w}×${h} cm se recorta una pieza de ${cutW}×${cutH} cm. ¿Qué fracción del área original queda?`,`${remain}/${total}`,[`${cutW*cutH}/${total}`,`${remain}/${cutW*cutH}`,`${total}/${remain}`],`Queda ${remain} de ${total} cm².`,['figuras_compuestas','fraccion','family:m12s06_d5_fraccion'])
  }
  if (family===2) {
    const rectW=ri(8,14),rectH=ri(6,10),r=ri(2,3),rectA=rectW*rectH,circleA=3.14*r*r,remain=rectA-circleA
    return mc(skill,d,seed,`Una placa de ${rectW}×${rectH} cm tiene un agujero circular de radio ${r} cm. ¿Qué porcentaje aproximado del material original queda?`,`${((remain/rectA)*100).toFixed(1)}%`,[`${((circleA/rectA)*100).toFixed(1)}%`,'50%',`${remain.toFixed(1)}%`],`Queda ${remain.toFixed(2)} de ${rectA} cm²: ${(remain/rectA*100).toFixed(1)}%.`,['figuras_compuestas','porcentaje','family:m12s06_d5_porcentaje'])
  }
  if (family===3) {
    const w=ri(8,14),h=ri(6,10),triH=ri(3,6),rectA=w*h,triA=w*triH/2,total=rectA+triA
    return mc(skill,d,seed,`Una figura compuesta tiene área total ${total} cm². Si su parte rectangular ocupa ${rectA} cm², ¿qué área ocupa la parte triangular?`,`${triA} cm²`,[`${total} cm²`,`${rectA} cm²`,`${total+rectA} cm²`],`Área triangular=${total}-${rectA}=${triA} cm².`,['figuras_compuestas','inverso','family:m12s06_d5_parte_desconocida'])
  }
  const outer=ri(12,18),borderWidth=2,inner=outer-2*borderWidth,border=outer*outer-inner*inner
  return mc(skill,d,seed,`Un marco cuadrado tiene lado exterior ${outer} cm y anchura uniforme ${borderWidth} cm. ¿Qué área ocupa el marco?`,`${border} cm²`,[`${outer*outer} cm²`,`${inner*inner} cm²`,`${4*outer*borderWidth} cm²`],`Lado interior=${inner} cm; área marco=${outer*outer}-${inner*inner}=${border} cm².`,['figuras_compuestas','razonamiento','family:m12s06_d5_anchura_marco'])
}

// M13 · TABLAS Y GRÁFICAS
// =========================

// M13S01 · Coordenadas cartesianas
if (key === 'coordinates') {
  const family = pickFamily(seed, 5)

  if (d === 1) {
    if (family === 0) {
      const x = ri(1, 7)
      const y = ri(1, 7)
      return mc(skill, d, seed,
        `¿Qué coordenadas tiene el punto P si está en x = ${x} e y = ${y}?`,
        `(${x}, ${y})`,
        [`(${y}, ${x})`, `(${-x}, ${y})`, `(${x}, ${-y})`],
        `Las coordenadas se escriben como (x, y): P = (${x}, ${y}).`,
        ['coordenadas_cartesianas', 'family:coordinates:d1:leer_par'])
    }

    if (family === 1) {
      const x = ri(1, 7)
      const y = ri(1, 7)
      return mc(skill, d, seed,
        `El punto A tiene coordenadas (${x}, ${y}). ¿Cuál es su coordenada horizontal?`,
        String(x),
        [String(y), String(-x), String(x + y)],
        `La primera coordenada de un punto es la coordenada x.`,
        ['coordenadas_cartesianas', 'family:coordinates:d1:coordenada_x'])
    }

    if (family === 2) {
      const x = ri(1, 7)
      const y = ri(1, 7)
      return mc(skill, d, seed,
        `El punto B tiene coordenadas (${x}, ${y}). ¿Cuál es su coordenada vertical?`,
        String(y),
        [String(x), String(-y), String(x + y)],
        `La segunda coordenada de un punto es la coordenada y.`,
        ['coordenadas_cartesianas', 'family:coordinates:d1:coordenada_y'])
    }

    if (family === 3) {
      const x = ri(1, 6)
      const y = ri(1, 6)
      return mc(skill, d, seed,
        `Desde el origen, un punto está ${x} unidades a la derecha y ${y} hacia arriba. ¿Qué coordenadas tiene?`,
        `(${x}, ${y})`,
        [`(${y}, ${x})`, `(${-x}, ${y})`, `(${x}, ${-y})`],
        `Derecha corresponde a x positiva y arriba a y positiva.`,
        ['coordenadas_cartesianas', 'family:coordinates:d1:desde_origen'])
    }

    const x = ri(1, 7)
    const y = ri(1, 7)
    return mc(skill, d, seed,
      `¿Cuál de estos puntos tiene x = ${x} e y = ${y}?`,
      `(${x}, ${y})`,
      [`(${y}, ${x})`, `(${-x}, ${y})`, `(${x}, ${-y})`],
      `El punto que cumple ambas coordenadas es (${x}, ${y}).`,
      ['coordenadas_cartesianas', 'family:coordinates:d1:elegir_punto'])
  }

  if (d === 2) {
    let x = ri(-7, 7)
    let y = ri(-7, 7)
    if (x === 0) x = 3
    if (y === 0) y = -2

    if (family === 0) {
      return mc(skill, d, seed,
        `¿En qué cuadrante está el punto (${x}, ${y})?`,
        x > 0 && y > 0 ? 'I' : x < 0 && y > 0 ? 'II' : x < 0 && y < 0 ? 'III' : 'IV',
        ['I', 'II', 'III', 'IV'].filter((q) => q !== (x > 0 && y > 0 ? 'I' : x < 0 && y > 0 ? 'II' : x < 0 && y < 0 ? 'III' : 'IV')),
        `El signo de x y de y determina el cuadrante.`,
        ['coordenadas_cartesianas', 'cuadrantes', 'family:coordinates:d2:cuadrante'])
    }

    if (family === 1) {
      return mc(skill, d, seed,
        `Un punto está ${Math.abs(x)} unidades ${x > 0 ? 'a la derecha' : 'a la izquierda'} del origen y ${Math.abs(y)} ${y > 0 ? 'por encima' : 'por debajo'}. ¿Cuáles son sus coordenadas?`,
        `(${x}, ${y})`,
        [`(${y}, ${x})`, `(${-x}, ${y})`, `(${x}, ${-y})`],
        `El desplazamiento horizontal da x=${x} y el vertical y=${y}.`,
        ['coordenadas_cartesianas', 'signos', 'family:coordinates:d2:descripcion'])
    }

    if (family === 2) {
      const quadrant = ri(1, 4)
      const answer = quadrant === 1 ? 'x positiva, y positiva' : quadrant === 2 ? 'x negativa, y positiva' : quadrant === 3 ? 'x negativa, y negativa' : 'x positiva, y negativa'
      return mc(skill, d, seed,
        `¿Qué signos tienen las coordenadas de un punto del cuadrante ${quadrant}?`,
        answer,
        ['x positiva, y positiva', 'x negativa, y positiva', 'x negativa, y negativa', 'x positiva, y negativa'].filter((v) => v !== answer),
        `En el cuadrante ${quadrant}, los signos son ${answer}.`,
        ['coordenadas_cartesianas', 'cuadrantes', 'family:coordinates:d2:signos_cuadrante'])
    }

    if (family === 3) {
      const axis = ri(0, 1)
      const value = ri(-7, 7) || 4
      const answer = axis === 0 ? `(${value}, 0)` : `(0, ${value})`
      return mc(skill, d, seed,
        `¿Qué punto está sobre el eje ${axis === 0 ? 'X' : 'Y'} y tiene la otra coordenada igual a ${value}?`,
        answer,
        [axis === 0 ? `(0, ${value})` : `(${value}, 0)`, `(${value}, ${value})`, `(${-value}, ${value})`],
        `En el eje ${axis === 0 ? 'X' : 'Y'} la coordenada ${axis === 0 ? 'y' : 'x'} vale 0.`,
        ['coordenadas_cartesianas', 'ejes', 'family:coordinates:d2:punto_eje'])
    }

    return mc(skill, d, seed,
      `¿Cuál de estos puntos está en el cuadrante ${x > 0 && y > 0 ? 'I' : x < 0 && y > 0 ? 'II' : x < 0 && y < 0 ? 'III' : 'IV'}?`,
      `(${x}, ${y})`,
      [`(${-x}, ${y})`, `(${x}, ${-y})`, `(${-x}, ${-y})`],
      `Los signos de (${x}, ${y}) corresponden a ese cuadrante.`,
      ['coordenadas_cartesianas', 'cuadrantes', 'family:coordinates:d2:elegir_por_cuadrante'])
  }

  if (d === 3) {
    const x = ri(-6, 6)
    const y = ri(-6, 6)
    const dx = ri(2, 6)
    const dy = ri(2, 6)

    if (family === 0) {
      return mc(skill, d, seed,
        `El punto P está en (${x}, ${y}). Se desplaza ${dx} unidades a la derecha. ¿Dónde queda?`,
        `(${x + dx}, ${y})`,
        [`(${x - dx}, ${y})`, `(${x}, ${y + dx})`, `(${y}, ${x + dx})`],
        `Moverse a la derecha aumenta x en ${dx}.`,
        ['coordenadas_cartesianas', 'desplazamientos', 'family:coordinates:d3:derecha'])
    }

    if (family === 1) {
      return mc(skill, d, seed,
        `El punto P está en (${x}, ${y}). Se desplaza ${dy} unidades hacia abajo. ¿Dónde queda?`,
        `(${x}, ${y - dy})`,
        [`(${x}, ${y + dy})`, `(${x - dy}, ${y})`, `(${y - dy}, ${x})`],
        `Moverse hacia abajo disminuye y en ${dy}.`,
        ['coordenadas_cartesianas', 'desplazamientos', 'family:coordinates:d3:abajo'])
    }

    if (family === 2) {
      return mc(skill, d, seed,
        `El punto P = (${x}, ${y}) se refleja respecto del eje X. ¿Cuál es su imagen?`,
        `(${x}, ${-y})`,
        [`(${-x}, ${y})`, `(${-x}, ${-y})`, `(${y}, ${x})`],
        `Al reflejar respecto del eje X cambia el signo de y.`,
        ['coordenadas_cartesianas', 'simetria', 'family:coordinates:d3:reflejo_x'])
    }

    if (family === 3) {
      return mc(skill, d, seed,
        `El punto P = (${x}, ${y}) se refleja respecto del eje Y. ¿Cuál es su imagen?`,
        `(${-x}, ${y})`,
        [`(${x}, ${-y})`, `(${-x}, ${-y})`, `(${y}, ${x})`],
        `Al reflejar respecto del eje Y cambia el signo de x.`,
        ['coordenadas_cartesianas', 'simetria', 'family:coordinates:d3:reflejo_y'])
    }

    return mc(skill, d, seed,
      `El punto (${x}, ${y}) se traslada ${dx} a la izquierda y ${dy} hacia arriba. ¿Dónde queda?`,
      `(${x - dx}, ${y + dy})`,
      [`(${x + dx}, ${y + dy})`, `(${x - dx}, ${y - dy})`, `(${y + dy}, ${x - dx})`],
      `Izquierda resta ${dx} a x y arriba suma ${dy} a y.`,
      ['coordenadas_cartesianas', 'desplazamientos', 'family:coordinates:d3:traslacion_doble'])
  }

  if (d === 4) {
    const x1 = ri(-7, 7)
    const y1 = ri(-7, 7)
    let x2 = ri(-7, 7)
    let y2 = ri(-7, 7)
    if (x2 === x1) x2 += 2
    if (y2 === y1) y2 -= 2

    if (family === 0) {
      return mc(skill, d, seed,
        `¿Cuál es el punto medio entre A(${x1}, ${y1}) y B(${x2}, ${y2})?`,
        `(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`,
        [`(${x1 + x2}, ${y1 + y2})`, `(${(x1 - x2) / 2}, ${(y1 - y2) / 2})`, `(${(y1 + y2) / 2}, ${(x1 + x2) / 2})`],
        `Promediamos por separado las coordenadas x e y.`,
        ['coordenadas_cartesianas', 'punto_medio', 'family:coordinates:d4:punto_medio'])
    }

    if (family === 1) {
      const dx = Math.abs(x2 - x1)
      return mc(skill, d, seed,
        `A(${x1}, ${y1}) y B(${x2}, ${y1}) están en una línea horizontal. ¿Qué distancia hay entre ellos?`,
        String(dx),
        [String(Math.abs(x2 + x1)), String(dx + 1), String(Math.abs(y1))],
        `En horizontal, la distancia es |${x2}-${x1}|=${dx}.`,
        ['coordenadas_cartesianas', 'distancia', 'family:coordinates:d4:distancia_horizontal'])
    }

    if (family === 2) {
      const dy = Math.abs(y2 - y1)
      return mc(skill, d, seed,
        `A(${x1}, ${y1}) y B(${x1}, ${y2}) están en una línea vertical. ¿Qué distancia hay entre ellos?`,
        String(dy),
        [String(Math.abs(y2 + y1)), String(dy + 1), String(Math.abs(x1))],
        `En vertical, la distancia es |${y2}-${y1}|=${dy}.`,
        ['coordenadas_cartesianas', 'distancia', 'family:coordinates:d4:distancia_vertical'])
    }

    if (family === 3) {
      const dx = ri(2, 5)
      const dy = ri(2, 5)
      return mc(skill, d, seed,
        `Un punto pasa de (${x1}, ${y1}) a (${x1 + dx}, ${y1 - dy}). ¿Qué desplazamiento se ha realizado?`,
        `${dx} a la derecha y ${dy} hacia abajo`,
        [`${dx} a la izquierda y ${dy} hacia abajo`, `${dy} a la derecha y ${dx} hacia arriba`, `${dx} a la derecha y ${dy} hacia arriba`],
        `x aumenta ${dx} e y disminuye ${dy}.`,
        ['coordenadas_cartesianas', 'desplazamientos', 'family:coordinates:d4:deducir_traslacion'])
    }

    return mc(skill, d, seed,
      `¿Qué transformación lleva P(${x1}, ${y1}) a P'(${-x1}, ${-y1})?`,
      'Simetría respecto del origen',
      ['Simetría respecto del eje X', 'Simetría respecto del eje Y', 'Traslación horizontal'],
      `Cambian de signo x e y, lo que corresponde a una simetría respecto del origen.`,
      ['coordenadas_cartesianas', 'simetria', 'family:coordinates:d4:simetria_origen'])
  }

  const x = ri(-8, 8)
  const y = ri(-8, 8)

  if (family === 0) {
    return mc(skill, d, seed,
      `El punto P = (${x}, ${y}) se refleja primero en el eje X y después en el eje Y. ¿Dónde termina?`,
      `(${-x}, ${-y})`,
      [`(${x}, ${-y})`, `(${-x}, ${y})`, `(${y}, ${x})`],
      `La primera reflexión cambia y y la segunda cambia x.`,
      ['coordenadas_cartesianas', 'simetria', 'family:coordinates:d5:doble_reflejo'])
  }

  if (family === 1) {
    const dx = ri(2, 6)
    const dy = ri(2, 6)
    return mc(skill, d, seed,
      `P(${x}, ${y}) se traslada (${dx}, ${-dy}) y después se refleja en el eje Y. ¿Cuál es la posición final?`,
      `(${-x - dx}, ${y - dy})`,
      [`(${x + dx}, ${-y + dy})`, `(${-x + dx}, ${y - dy})`, `(${-x - dx}, ${-y + dy})`],
      `Trasladamos a (${x + dx}, ${y - dy}) y luego cambiamos el signo de x.`,
      ['coordenadas_cartesianas', 'transformaciones', 'family:coordinates:d5:traslacion_reflejo'])
  }

  if (family === 2) {
    const qx = -x
    const qy = y
    return mc(skill, d, seed,
      `Los puntos P(${x}, ${y}) y Q(${qx}, ${qy}) son simétricos. ¿Respecto de qué eje?`,
      'Eje Y',
      ['Eje X', 'Origen', 'Recta y = x'],
      `Solo cambia el signo de x, por lo que la simetría es respecto del eje Y.`,
      ['coordenadas_cartesianas', 'simetria', 'family:coordinates:d5:deducir_eje'])
  }

  if (family === 3) {
    const dx = ri(2, 5)
    const dy = ri(2, 5)
    return mc(skill, d, seed,
      `A(${x}, ${y}) se traslada ${dx} a la derecha y ${dy} hacia arriba. Luego se deshace exactamente esa traslación. ¿Dónde termina?`,
      `(${x}, ${y})`,
      [`(${x + dx}, ${y + dy})`, `(${x - dx}, ${y - dy})`, `(${-x}, ${-y})`],
      `Una traslación seguida de su inversa devuelve el punto a su posición inicial.`,
      ['coordenadas_cartesianas', 'transformaciones', 'family:coordinates:d5:transformacion_inversa'])
  }

  return mc(skill, d, seed,
    `¿Cuál de estas transformaciones conserva siempre la distancia de un punto al origen?`,
    'Una simetría respecto del origen',
    ['Una traslación de 3 unidades a la derecha', 'Una traslación de 2 unidades hacia arriba', 'Sumar 4 a la coordenada x'],
    `La simetría respecto del origen cambia signos, pero no la distancia al origen.`,
    ['coordenadas_cartesianas', 'razonamiento', 'family:coordinates:d5:invariante'])
}

// M13S02 · Leer tablas de valores
if (key === 'value_tables') {
  const family = pickFamily(seed, 5)

  if (d === 1) {
    const factor = ri(2, 6)
    const x = ri(2, 8)
    const y = x * factor

    if (family === 0) {
      return mc(skill, d, seed,
        `En una tabla se cumple y = ${factor}x. ¿Cuánto vale y cuando x = ${x}?`,
        String(y),
        [String(x + factor), String(x), String(y + factor)],
        `y = ${factor}×${x}=${y}.`,
        ['lectura_tablas', 'family:value_tables:d1:calcular_y'])
    }

    if (family === 1) {
      return mc(skill, d, seed,
        `La tabla contiene el par (${x}, ${y}). ¿Cuál es el valor de y cuando x = ${x}?`,
        String(y),
        [String(x), String(factor), String(x + y)],
        `En el par (x, y), el segundo valor es y.`,
        ['lectura_tablas', 'family:value_tables:d1:leer_par'])
    }

    if (family === 2) {
      return mc(skill, d, seed,
        `Si y = ${factor}x y y = ${y}, ¿qué valor de x aparece en la tabla?`,
        String(x),
        [String(y), String(factor), String(x + factor)],
        `${y}÷${factor}=${x}.`,
        ['lectura_tablas', 'family:value_tables:d1:calcular_x'])
    }

    if (family === 3) {
      const x2 = x + 1
      return mc(skill, d, seed,
        `¿Qué pareja pertenece a la tabla de y = ${factor}x?`,
        `(${x2}, ${factor * x2})`,
        [`(${x2}, ${factor * x2 + 1})`, `(${factor * x2}, ${x2})`, `(${x2}, ${x2 + factor})`],
        `La pareja correcta cumple y=${factor}×${x2}=${factor * x2}.`,
        ['lectura_tablas', 'family:value_tables:d1:elegir_par'])
    }

    return mc(skill, d, seed,
      `En una tabla proporcional, x pasa de ${x} a ${x + 2}. Si y = ${factor}x, ¿cuánto aumenta y?`,
      String(2 * factor),
      [String(factor), String(x + 2), String(2 + factor)],
      `Al aumentar x en 2, y aumenta en ${factor}×2=${2 * factor}.`,
      ['lectura_tablas', 'family:value_tables:d1:cambio_simple'])
  }

  if (d === 2) {
    const factor = ri(2, 6)
    const x1 = ri(1, 5)
    const x2 = x1 + ri(2, 5)
    const y1 = x1 * factor
    const y2 = x2 * factor

    if (family === 0) {
      return mc(skill, d, seed,
        `Una tabla contiene (${x1}, ${y1}) y sigue y = ${factor}x. ¿Qué pareja corresponde a x = ${x2}?`,
        `(${x2}, ${y2})`,
        [`(${x2}, ${y1})`, `(${y2}, ${x2})`, `(${x2}, ${x2 + factor})`],
        `Para x=${x2}, y=${factor}×${x2}=${y2}.`,
        ['lectura_tablas', 'pares_valores', 'family:value_tables:d2:completar_par'])
    }

    if (family === 1) {
      return mc(skill, d, seed,
        `En la tabla aparecen (${x1}, ${y1}) y (${x2}, ${y2}). ¿Cuál es la constante de proporcionalidad y/x?`,
        String(factor),
        [String(x1), String(y1), String(x1 + factor)],
        `${y1}÷${x1}=${factor}.`,
        ['lectura_tablas', 'constante', 'family:value_tables:d2:constante'])
    }

    if (family === 2) {
      const wrong = y2 + ri(1, 3)
      return mc(skill, d, seed,
        `¿Qué fila rompe la proporcionalidad y = ${factor}x?`,
        `(${x2}, ${wrong})`,
        [`(${x1}, ${y1})`, `(${x1 + 1}, ${(x1 + 1) * factor})`, `(${x2 + 1}, ${(x2 + 1) * factor})`],
        `${wrong} no es ${factor}×${x2}.`,
        ['lectura_tablas', 'family:value_tables:d2:detectar_error'])
    }

    if (family === 3) {
      const missingX = ri(2, 8)
      const missingY = missingX * factor
      return mc(skill, d, seed,
        `En una tabla proporcional con constante ${factor}, aparece y = ${missingY}. ¿Qué x corresponde?`,
        String(missingX),
        [String(missingY), String(missingX + factor), String(Math.max(1, missingX - 1))],
        `${missingY}÷${factor}=${missingX}.`,
        ['lectura_tablas', 'family:value_tables:d2:hallar_x'])
    }

    return mc(skill, d, seed,
      `Si una tabla cumple y=${factor}x, ¿cuál es la diferencia entre los valores de y para x=${x1} y x=${x2}?`,
      String(y2 - y1),
      [String(y2 + y1), String(x2 - x1), String(factor)],
      `${y2}-${y1}=${y2 - y1}.`,
      ['lectura_tablas', 'family:value_tables:d2:diferencia'])
  }

  if (d === 3) {
    const a = ri(2, 5)
    const b = ri(1, 7)
    const x = ri(1, 7)
    const y = a * x + b

    if (family === 0) {
      return mc(skill, d, seed,
        `Una tabla sigue la regla y=${a}x+${b}. ¿Cuánto vale y cuando x=${x}?`,
        String(y),
        [String(a + x + b), String(a * (x + b)), String(y - b)],
        `Sustituimos x=${x}: ${a}×${x}+${b}=${y}.`,
        ['lectura_tablas', 'regla_lineal', 'family:value_tables:d3:evaluar_regla'])
    }

    if (family === 1) {
      const x2 = x + 2
      return mc(skill, d, seed,
        `Para y=${a}x+${b}, ¿qué pareja corresponde a x=${x2}?`,
        `(${x2}, ${a * x2 + b})`,
        [`(${x2}, ${a * x2})`, `(${a * x2 + b}, ${x2})`, `(${x2}, ${a + x2 + b})`],
        `y=${a}×${x2}+${b}=${a * x2 + b}.`,
        ['lectura_tablas', 'regla_lineal', 'family:value_tables:d3:par_lineal'])
    }

    if (family === 2) {
      const y0 = b
      return mc(skill, d, seed,
        `En la regla y=${a}x+${b}, ¿qué valor toma y cuando x=0?`,
        String(y0),
        [String(a), String(a + b), '0'],
        `Al sustituir x=0 queda y=${b}.`,
        ['lectura_tablas', 'regla_lineal', 'family:value_tables:d3:valor_inicial'])
    }

    if (family === 3) {
      const x2 = x + 3
      const y2 = a * x2 + b
      return mc(skill, d, seed,
        `La tabla contiene (${x}, ${y}) y (${x2}, ${y2}). ¿Cuánto aumenta y cuando x aumenta ${x2 - x}?`,
        String(y2 - y),
        [String(x2 - x), String(a), String(y2 + y)],
        `El aumento es ${y2}-${y}=${y2 - y}.`,
        ['lectura_tablas', 'family:value_tables:d3:cambio_lineal'])
    }

    const wrongY = y + ri(1, 4)
    return mc(skill, d, seed,
      `¿Cuál de estas parejas NO cumple y=${a}x+${b}?`,
      `(${x}, ${wrongY})`,
      [`(${x}, ${y})`, `(${x + 1}, ${a * (x + 1) + b})`, `(${x + 2}, ${a * (x + 2) + b})`],
      `Para x=${x} debería ser y=${y}, no ${wrongY}.`,
      ['lectura_tablas', 'family:value_tables:d3:detectar_par_invalido'])
  }

  if (d === 4) {
    const a = ri(2, 5)
    const b = ri(-5, 5)
    const x1 = ri(1, 5)
    const x2 = x1 + 2
    const y1 = a * x1 + b
    const y2 = a * x2 + b

    if (family === 0) {
      return mc(skill, d, seed,
        `Una tabla contiene (${x1}, ${y1}) y (${x2}, ${y2}). ¿Cuál es la tasa de cambio Δy/Δx?`,
        String(a),
        [String(y2 - y1), String(x2 - x1), String(a + b)],
        `Δy/Δx = (${y2}-${y1})/(${x2}-${x1})=${a}.`,
        ['lectura_tablas', 'tasa_cambio', 'family:value_tables:d4:pendiente'])
    }

    if (family === 1) {
      return mc(skill, d, seed,
        `Los pares (${x1}, ${y1}) y (${x2}, ${y2}) pertenecen a una regla y=ax+b. Si a=${a}, ¿cuánto vale b?`,
        String(b),
        [String(a), String(y1), String(a + b)],
        `b = y-ax = ${y1}-${a}×${x1}=${b}.`,
        ['lectura_tablas', 'regla_lineal', 'family:value_tables:d4:hallar_b'])
    }

    if (family === 2) {
      const targetX = x2 + 2
      const targetY = a * targetX + b
      return mc(skill, d, seed,
        `A partir de (${x1}, ${y1}) y (${x2}, ${y2}), la relación mantiene la misma tasa de cambio. ¿Qué y corresponde a x=${targetX}?`,
        String(targetY),
        [String(targetY - a), String(targetY + a), String(targetX + b)],
        `La tasa es ${a} y la regla es y=${a}x${b >= 0 ? '+' : '-'}${Math.abs(b)}.`,
        ['lectura_tablas', 'extrapolacion', 'family:value_tables:d4:extrapolar'])
    }

    if (family === 3) {
      const targetY = a * (x1 + 3) + b
      return mc(skill, d, seed,
        `Una tabla sigue y=${a}x${b >= 0 ? '+' : '-'}${Math.abs(b)}. ¿Qué x produce y=${targetY}?`,
        String(x1 + 3),
        [String(targetY), String(a), String(x1 + 2)],
        `Resolvemos ${targetY}=${a}x${b >= 0 ? '+' : '-'}${Math.abs(b)} y obtenemos x=${x1 + 3}.`,
        ['lectura_tablas', 'regla_lineal', 'family:value_tables:d4:invertir_regla'])
    }

    return mc(skill, d, seed,
      `¿Cuál de estas reglas representa una tabla cuya y aumenta ${a} cada vez que x aumenta 1 y cuyo valor inicial es ${b}?`,
      `y = ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`,
      [`y = ${a + 1}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`, `y = ${a}x ${b >= 0 ? '-' : '+'} ${Math.abs(b)}`, `y = x + ${a}`],
      `La tasa de cambio es ${a} y el valor inicial es ${b}.`,
      ['lectura_tablas', 'regla_lineal', 'family:value_tables:d4:elegir_regla'])
  }

  const a = ri(2, 5)
  const b = ri(-6, 6)
  const x1 = ri(1, 5)
  const x2 = x1 + 2
  const y1 = a * x1 + b
  const y2 = a * x2 + b

  if (family === 0) {
    return mc(skill, d, seed,
      `Una tabla contiene (${x1}, ${y1}) y (${x2}, ${y2}). ¿Qué regla los relaciona?`,
      `y = ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`,
      [`y = ${a + 1}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`, `y = ${a}x ${b >= 0 ? '-' : '+'} ${Math.abs(b)}`, `y = x + ${a}`],
      `La tasa es ${a} y al sustituir obtenemos b=${b}.`,
      ['lectura_tablas', 'deducir_regla', 'family:value_tables:d5:deducir_regla'])
  }

  if (family === 1) {
    const x3 = x2 + 2
    const y3 = a * x3 + b
    return mc(skill, d, seed,
      `Los pares (${x1}, ${y1}), (${x2}, ${y2}) y (${x3}, ${y3}) siguen una regla lineal. ¿Qué característica permanece constante?`,
      `La razón entre el cambio de y y el cambio de x`,
      ['El valor de y', 'La suma x+y', 'El producto x·y'],
      `En una relación lineal, la tasa de cambio Δy/Δx es constante.`,
      ['lectura_tablas', 'razonamiento', 'family:value_tables:d5:invariante_lineal'])
  }

  if (family === 2) {
    const wrongA = a + 1
    return mc(skill, d, seed,
      `Una persona afirma que los pares (${x1}, ${y1}) y (${x2}, ${y2}) cumplen y=${wrongA}x${b >= 0 ? '+' : '-'}${Math.abs(b)}. ¿Qué error comete?`,
      'Usa una tasa de cambio incorrecta',
      ['Intercambia x e y', 'El valor inicial es necesariamente 0', 'No se pueden usar dos puntos'],
      `La tasa real es (${y2}-${y1})/(${x2}-${x1})=${a}, no ${wrongA}.`,
      ['lectura_tablas', 'razonamiento', 'family:value_tables:d5:detectar_regla_erronea'])
  }

  if (family === 3) {
    const x3 = x2 + 3
    const y3 = a * x3 + b
    return mc(skill, d, seed,
      `Una tabla lineal pasa por (${x1}, ${y1}) y (${x2}, ${y2}). Si continúa con la misma regla, ¿qué pareja debe aparecer para x=${x3}?`,
      `(${x3}, ${y3})`,
      [`(${x3}, ${y3 + 1})`, `(${y3}, ${x3})`, `(${x3}, ${a * x3})`],
      `La regla deducida se mantiene y da y=${y3}.`,
      ['lectura_tablas', 'extrapolacion', 'family:value_tables:d5:predecir_par'])
  }

  return mc(skill, d, seed,
    `¿Qué información mínima permite determinar de forma única una regla lineal y=ax+b?`,
    'Dos puntos con valores de x distintos',
    ['Un solo valor de x', 'Un solo valor de y', 'Solo el signo de a'],
    `Dos puntos con x distintas permiten calcular la tasa a y después b.`,
    ['lectura_tablas', 'razonamiento', 'family:value_tables:d5:informacion_minima'])
}

// M13S03 · Representar datos en gráficas
if (key === 'plot_graph') {
  const family = pickFamily(seed, 5)

  const banks = {
    1: [
      ['comparar cuántos alumnos prefieren fútbol, baloncesto, natación y tenis', 'Gráfico de barras', 'Las barras facilitan comparar categorías.'],
      ['mostrar cómo cambia la temperatura durante un día', 'Gráfico de líneas', 'Las líneas muestran bien la evolución en el tiempo.'],
      ['mostrar qué porcentaje del presupuesto corresponde a cada categoría', 'Diagrama de sectores', 'Los sectores representan partes de un total.'],
      ['comparar las ventas de cuatro tiendas en el mismo mes', 'Gráfico de barras', 'Se comparan categorías independientes.'],
      ['seguir la cantidad de lluvia registrada cada día de una semana', 'Gráfico de líneas', 'Interesa observar la evolución día a día.'],
    ],
    2: [
      ['mostrar cómo se reparte un día entre dormir, estudiar, ocio y deporte', 'Diagrama de sectores', 'Las actividades forman partes de un total de 24 horas.'],
      ['comparar el número de libros prestados por distintas bibliotecas', 'Gráfico de barras', 'Las bibliotecas son categorías comparables.'],
      ['seguir el número de visitantes de una web durante doce meses', 'Gráfico de líneas', 'Se estudia una evolución temporal.'],
      ['comparar la frecuencia de varios colores elegidos en una encuesta', 'Gráfico de barras', 'Las barras comparan frecuencias categóricas.'],
      ['mostrar qué fracción del gasto familiar corresponde a vivienda, comida y transporte', 'Diagrama de sectores', 'Se representan partes de un total.'],
    ],
    3: [
      ['representar las alturas de alumnos agrupadas en intervalos de 5 cm', 'Histograma', 'Los histogramas representan datos cuantitativos agrupados en intervalos.'],
      ['estudiar si existe relación entre horas de estudio y nota obtenida', 'Diagrama de dispersión', 'Relaciona dos variables numéricas.'],
      ['representar puntos definidos mediante parejas ordenadas (x, y)', 'Plano cartesiano', 'Las parejas ordenadas se sitúan en un sistema de coordenadas.'],
      ['comparar frecuencias de categorías y localizar rápidamente la mayor', 'Gráfico de barras', 'La altura de las barras hace visible la comparación.'],
      ['seguir la evolución de una población a lo largo de 20 años', 'Gráfico de líneas', 'Se analiza una magnitud a lo largo del tiempo.'],
    ],
    4: [
      ['analizar la relación entre temperatura y consumo eléctrico de muchos días', 'Diagrama de dispersión', 'Permite observar asociación entre dos variables cuantitativas.'],
      ['representar una distribución de edades agrupadas en intervalos', 'Histograma', 'Los intervalos numéricos consecutivos se representan con histograma.'],
      ['mostrar simultáneamente la evolución mensual de ventas de dos productos', 'Gráfico de líneas', 'Dos líneas permiten comparar tendencias temporales.'],
      ['comparar porcentajes de participación de varias categorías que suman 100%', 'Diagrama de sectores', 'El total se divide en sectores proporcionales.'],
      ['situar las posiciones de varios objetos dadas por coordenadas', 'Plano cartesiano', 'Las posiciones (x, y) se representan en el plano.'],
    ],
    5: [
      ['buscar una posible correlación entre edad y presión arterial en una muestra', 'Diagrama de dispersión', 'Se estudia la relación entre dos variables cuantitativas.'],
      ['comparar la forma de una distribución de tiempos agrupados por intervalos', 'Histograma', 'El histograma permite observar la distribución de frecuencias por intervalos.'],
      ['mostrar composición porcentual cuando el total es exactamente 100%', 'Diagrama de sectores', 'Representa proporciones de un total.'],
      ['comparar una misma magnitud en varias categorías sin componente temporal', 'Gráfico de barras', 'Las barras son adecuadas para categorías discretas.'],
      ['analizar una serie temporal y detectar subidas, bajadas y tendencias', 'Gráfico de líneas', 'La conexión de puntos ordenados temporalmente hace visibles las tendencias.'],
    ],
  } as const

  const [situation, answer, solution] = banks[d as 1 | 2 | 3 | 4 | 5][family]
  const allTypes = ['Gráfico de barras', 'Gráfico de líneas', 'Diagrama de sectores', 'Histograma', 'Diagrama de dispersión', 'Plano cartesiano']
  const distractors = allTypes.filter((type) => type !== answer).slice((family + d) % 2, (family + d) % 2 + 3)

  return mc(skill, d, seed,
    `¿Qué tipo de gráfica es más adecuada para ${situation}?`,
    answer,
    distractors,
    solution,
    ['representacion_grafica', `family:plot_graph:d${d}:${family}`])
}

// M13S04 · Interpretar gráficas
if (key === 'graph_interpret') {
  const family = pickFamily(seed, 5)

  if (d === 1) {
    const a = ri(8, 20)
    const b = ri(8, 20)
    const c = Math.max(a, b) + ri(2, 7)

    if (family === 0) {
      return mc(skill, d, seed,
        `Un gráfico de barras muestra: fútbol ${a}, baloncesto ${b} y tenis ${c}. ¿Qué deporte tiene mayor frecuencia?`,
        'Tenis',
        ['Fútbol', 'Baloncesto', 'Todos igual'],
        `El valor mayor es ${c}, correspondiente a tenis.`,
        ['interpretacion_graficas', 'family:graph_interpret:d1:maximo'])
    }

    if (family === 1) {
      const min = Math.min(a, b)
      const answer = a < b ? 'Fútbol' : b < a ? 'Baloncesto' : 'Empate'
      return mc(skill, d, seed,
        `Un gráfico muestra fútbol ${a} y baloncesto ${b}. ¿Qué categoría tiene menor valor?`,
        answer,
        ['Fútbol', 'Baloncesto', 'Empate', 'No se puede determinar'].filter((v) => v !== answer),
        `El valor menor es ${min}.`,
        ['interpretacion_graficas', 'family:graph_interpret:d1:minimo'])
    }

    if (family === 2) {
      return mc(skill, d, seed,
        `Una barra representa ${a} alumnos y otra ${b}. ¿Cuántos alumnos representan entre las dos?`,
        String(a + b),
        [String(Math.abs(a - b)), String(Math.max(a, b)), String(a + b + 2)],
        `${a}+${b}=${a + b}.`,
        ['interpretacion_graficas', 'family:graph_interpret:d1:suma'])
    }

    if (family === 3) {
      const diff = Math.abs(a - b)
      return mc(skill, d, seed,
        `En un gráfico de barras dos categorías valen ${a} y ${b}. ¿Cuál es la diferencia entre ambas?`,
        String(diff),
        [String(a + b), String(Math.max(a, b)), String(diff + 1)],
        `La diferencia es |${a}-${b}|=${diff}.`,
        ['interpretacion_graficas', 'family:graph_interpret:d1:diferencia'])
    }

    return mc(skill, d, seed,
      `Una gráfica muestra valores ${a}, ${b} y ${c}. ¿Cuántos datos aparecen representados?`,
      '3',
      ['2', String(a + b + c), String(c)],
      `Hay tres categorías o datos representados.`,
      ['interpretacion_graficas', 'family:graph_interpret:d1:contar_datos'])
  }

  if (d === 2) {
    const m = ri(10, 25)
    const t = m + ri(2, 8)
    const w = ri(8, m)

    if (family === 0) {
      return mc(skill, d, seed,
        `Ventas: lunes ${m}, martes ${t}, miércoles ${w}. ¿Cuántas más hubo el martes que el miércoles?`,
        String(t - w),
        [String(t + w), String(t - m), String(m - w)],
        `${t}-${w}=${t - w}.`,
        ['interpretacion_graficas', 'family:graph_interpret:d2:diferencia_dias'])
    }

    if (family === 1) {
      return mc(skill, d, seed,
        `Una gráfica registra ${m} el lunes, ${t} el martes y ${w} el miércoles. ¿Cuál es el total de los tres días?`,
        String(m + t + w),
        [String(t), String(t - w), String(m + w)],
        `${m}+${t}+${w}=${m + t + w}.`,
        ['interpretacion_graficas', 'family:graph_interpret:d2:total'])
    }

    if (family === 2) {
      return mc(skill, d, seed,
        `Una serie pasa de ${m} a ${t}. ¿En cuánto aumenta?`,
        String(t - m),
        [String(t + m), String(t), String(m)],
        `${t}-${m}=${t - m}.`,
        ['interpretacion_graficas', 'family:graph_interpret:d2:aumento'])
    }

    if (family === 3) {
      const answer = t > m && m > w ? 'Martes > Lunes > Miércoles' : 'Martes es el mayor'
      return mc(skill, d, seed,
        `Con valores lunes ${m}, martes ${t}, miércoles ${w}, ¿qué orden de mayor a menor es correcto?`,
        'Martes > Lunes > Miércoles',
        ['Lunes > Martes > Miércoles', 'Miércoles > Lunes > Martes', 'Martes > Miércoles > Lunes'],
        `Como ${t}>${m}>${w}, el orden es martes, lunes, miércoles.`,
        ['interpretacion_graficas', 'family:graph_interpret:d2:ordenar'])
    }

    return mc(skill, d, seed,
      `Una gráfica pasa de ${m} a ${t} y después baja a ${w}. ¿Qué descripción es correcta?`,
      'Primero sube y después baja',
      ['Siempre sube', 'Siempre baja', 'No cambia'],
      `De ${m} a ${t} aumenta y de ${t} a ${w} disminuye.`,
      ['interpretacion_graficas', 'family:graph_interpret:d2:tendencia'])
  }

  if (d === 3) {
    const jan = ri(10, 20)
    const feb = jan + ri(2, 8)
    const mar = feb + ri(2, 8)
    const apr = mar - ri(1, 5)

    if (family === 0) {
      return mc(skill, d, seed,
        `Una gráfica registra enero ${jan}, febrero ${feb} y marzo ${mar}. ¿Cuánto ha aumentado desde enero hasta marzo?`,
        String(mar - jan),
        [String(mar + jan), String(feb - jan), String(mar)],
        `${mar}-${jan}=${mar - jan}.`,
        ['interpretacion_graficas', 'family:graph_interpret:d3:cambio_neto'])
    }

    if (family === 1) {
      return mc(skill, d, seed,
        `Valores mensuales: ${jan}, ${feb}, ${mar}, ${apr}. ¿En qué tramo se produce una disminución?`,
        'De marzo a abril',
        ['De enero a febrero', 'De febrero a marzo', 'No hay disminución'],
        `Solo ${apr} es menor que el valor anterior ${mar}.`,
        ['interpretacion_graficas', 'family:graph_interpret:d3:detectar_bajada'])
    }

    if (family === 2) {
      const total = jan + feb + mar
      return mc(skill, d, seed,
        `Una gráfica muestra ${jan}, ${feb} y ${mar}. ¿Cuál es su media?`,
        String(total / 3),
        [String(total), String(mar), String(feb)],
        `(${jan}+${feb}+${mar})/3=${total / 3}.`,
        ['interpretacion_graficas', 'family:graph_interpret:d3:media'])
    }

    if (family === 3) {
      const growth1 = feb - jan
      const growth2 = mar - feb
      const answer = growth1 > growth2 ? 'De enero a febrero' : growth2 > growth1 ? 'De febrero a marzo' : 'Aumenta lo mismo'
      return mc(skill, d, seed,
        `Valores: enero ${jan}, febrero ${feb}, marzo ${mar}. ¿En qué tramo aumenta más?`,
        answer,
        ['De enero a febrero', 'De febrero a marzo', 'Aumenta lo mismo', 'No hay ningún aumento'].filter((v) => v !== answer),
        `Los aumentos son ${growth1} y ${growth2}.`,
        ['interpretacion_graficas', 'family:graph_interpret:d3:comparar_cambios'])
    }

    return mc(skill, d, seed,
      `Una serie mensual vale ${jan}, ${feb}, ${mar}, ${apr}. ¿Cuál es el máximo?`,
      String(Math.max(jan, feb, mar, apr)),
      [String(jan), String(feb), String(apr)].filter((v) => v !== String(Math.max(jan, feb, mar, apr))),
      `El valor máximo es ${Math.max(jan, feb, mar, apr)}.`,
      ['interpretacion_graficas', 'family:graph_interpret:d3:maximo_serie'])
  }

  if (d === 4) {
    const values = [ri(10, 30), ri(10, 30), ri(10, 30), ri(10, 30)]
    const total = values.reduce((sum, value) => sum + value, 0)
    const average = total / 4

    if (family === 0) {
      return mc(skill, d, seed,
        `Una gráfica muestra cuatro valores: ${values.join(', ')}. ¿Cuál es su media?`,
        String(average),
        [String(total), String(Math.max(...values)), String(Math.min(...values))],
        `Sumamos ${total} y dividimos entre 4: ${average}.`,
        ['interpretacion_graficas', 'family:graph_interpret:d4:media'])
    }

    if (family === 1) {
      const above = values.filter((v) => v > average).length
      return mc(skill, d, seed,
        `Los valores son ${values.join(', ')} y su media es ${average}. ¿Cuántos están por encima de la media?`,
        String(above),
        [String(4 - above), '4', '0'].filter((v) => v !== String(above)),
        `Contamos los valores mayores que ${average}: ${above}.`,
        ['interpretacion_graficas', 'family:graph_interpret:d4:sobre_media'])
    }

    if (family === 2) {
      const range = Math.max(...values) - Math.min(...values)
      return mc(skill, d, seed,
        `Una gráfica presenta ${values.join(', ')}. ¿Cuál es el rango (máximo - mínimo)?`,
        String(range),
        [String(Math.max(...values)), String(Math.min(...values)), String(total)],
        `Rango = ${Math.max(...values)}-${Math.min(...values)}=${range}.`,
        ['interpretacion_graficas', 'family:graph_interpret:d4:rango'])
    }

    if (family === 3) {
      const sorted = [...values].sort((a, b) => a - b)
      const median = (sorted[1] + sorted[2]) / 2
      return mc(skill, d, seed,
        `Los valores de una gráfica son ${values.join(', ')}. ¿Cuál es la mediana?`,
        String(median),
        [String(average), String(sorted[1]), String(sorted[2])],
        `Ordenamos y promediamos los dos centrales: ${median}.`,
        ['interpretacion_graficas', 'family:graph_interpret:d4:mediana'])
    }

    const max = Math.max(...values)
    const min = Math.min(...values)
    return mc(skill, d, seed,
      `En una gráfica con valores ${values.join(', ')}, ¿cuál es la diferencia entre el máximo y el mínimo?`,
      String(max - min),
      [String(max), String(min), String(total)],
      `${max}-${min}=${max - min}.`,
      ['interpretacion_graficas', 'family:graph_interpret:d4:diferencia_extremos'])
  }

  const start = ri(20, 40)
  const peak = start + ri(8, 20)
  const end = peak - ri(3, 10)
  const net = end - start

  if (family === 0) {
    return mc(skill, d, seed,
      `Una gráfica comienza en ${start}, alcanza ${peak} y termina en ${end}. ¿Cuál es el cambio neto entre inicio y final?`,
      String(net),
      [String(peak - start), String(peak - end), String(end + start)],
      `Cambio neto = ${end}-${start}=${net}.`,
      ['interpretacion_graficas', 'family:graph_interpret:d5:cambio_neto'])
  }

  if (family === 1) {
    const rise = peak - start
    const fall = peak - end
    return mc(skill, d, seed,
      `Una serie sube de ${start} a ${peak} y después baja a ${end}. ¿Qué cambio es mayor en valor absoluto?`,
      rise > fall ? 'La subida inicial' : fall > rise ? 'La bajada final' : 'Son iguales',
      ['La subida inicial', 'La bajada final', 'Son iguales', 'No se puede determinar'].filter((v) => v !== (rise > fall ? 'La subida inicial' : fall > rise ? 'La bajada final' : 'Son iguales')),
      `La subida es ${rise} y la bajada ${fall}.`,
      ['interpretacion_graficas', 'family:graph_interpret:d5:comparar_cambios'])
  }

  if (family === 2) {
    const percent = ((end - start) / start) * 100
    return mc(skill, d, seed,
      `Una magnitud pasa de ${start} a ${end}. ¿Cuál es aproximadamente su variación porcentual?`,
      `${percent.toFixed(1)}%`,
      [`${(percent + 10).toFixed(1)}%`, `${(percent - 10).toFixed(1)}%`, `${((peak - start) / start * 100).toFixed(1)}%`],
      `Variación = (${end}-${start})/${start}×100 = ${percent.toFixed(1)}%.`,
      ['interpretacion_graficas', 'family:graph_interpret:d5:variacion_porcentual'])
  }

  if (family === 3) {
    return mc(skill, d, seed,
      `Una gráfica alcanza un máximo de ${peak} y termina en ${end}. ¿Qué porcentaje del máximo representa el valor final?`,
      `${((end / peak) * 100).toFixed(1)}%`,
      [`${((start / peak) * 100).toFixed(1)}%`, `${((peak / end) * 100).toFixed(1)}%`, `${((peak - end) / peak * 100).toFixed(1)}%`],
      `Calculamos ${end}/${peak}×100=${((end / peak) * 100).toFixed(1)}%.`,
      ['interpretacion_graficas', 'family:graph_interpret:d5:porcentaje_del_maximo'])
  }

  return mc(skill, d, seed,
    `Una serie comienza en ${start}, sube a ${peak} y termina en ${end}. ¿Cuál afirmación resume mejor la evolución?`,
    'Termina por encima del valor inicial, aunque baja desde el máximo',
    ['Termina por debajo del valor inicial', 'No presenta ningún descenso', 'El máximo coincide con el valor final'],
    `Como ${end}>${start} pero ${end}<${peak}, termina por encima del inicio tras descender desde el máximo.`,
    ['interpretacion_graficas', 'razonamiento', 'family:graph_interpret:d5:resumir_tendencia'])
}

// M14 · ESTADÍSTICA
// =========================

// M14S01 · Población, muestra e individuo
// M14 full-module upgrade: five pedagogical families per skill, scaled by difficulty.
if (key === 'stats_population') {
  // M14S01: 8 families at every difficulty so consecutive practice does not
  // collapse into the same population/sample/individual wording.
  const f = pickFamily(seed, 8)
  const N = 100 * d + ri(20, 90)
  const n = Math.min(N - 5, 10 * d + ri(5, 25))
  const tag = `family:m14-pop:d${d}:f${f}`

  if (d === 1) {
    if (f === 0) return mc(skill,d,seed,`En un colegio hay ${N} alumnos y queremos conocer su deporte favorito. ¿Cuál es la población?`,`Los ${N} alumnos`,[`Los profesores`,`El deporte favorito`,`Un solo alumno`],`La población es todo el grupo que queremos estudiar.`,['estadistica',tag])
    if (f === 1) return mc(skill,d,seed,`De ${N} alumnos se pregunta a ${n}. ¿Qué forman los ${n} alumnos elegidos?`,'La muestra',['La población','La variable','La frecuencia'],`La muestra es la parte de la población que se observa.`,['estadistica',tag])
    if (f === 2) return mc(skill,d,seed,'En un estudio sobre mascotas, cada alumno que participa es...','Un individuo',['Una población','Una muestra completa','Una variable'],`Cada elemento de la población es un individuo.`,['estadistica',tag])
    if (f === 3) return mc(skill,d,seed,`Una biblioteca tiene ${N} socios y entrevista a ${n}. ¿Cuál es la muestra?`,`Los ${n} socios entrevistados`,[`Los ${N} socios`,`La biblioteca`,`La opinión de cada socio`],`La muestra es el subconjunto entrevistado.`,['estadistica',tag])
    if (f === 4) return mc(skill,d,seed,'¿Cuál de estos ejemplos describe una población?','Todos los alumnos de un instituto',['20 alumnos elegidos al azar','Un alumno de 1.º','Las edades anotadas'],`Una población incluye a todos los individuos que se quieren estudiar.`,['estadistica',tag])
    if (f === 5) return mc(skill,d,seed,'¿Cuál de estos ejemplos describe una muestra?','30 vecinos elegidos de todo un barrio',['Todos los vecinos del barrio','La edad de los vecinos','Un tipo de vivienda'],`Una muestra es una parte de la población.`,['estadistica',tag])
    if (f === 6) return mc(skill,d,seed,'En un estudio de una clase, ¿qué sería un individuo?','Cada estudiante',['La clase entera','Las notas de todos','El número de aprobados'],`Un individuo es cada elemento estudiado por separado.`,['estadistica',tag])
    return mc(skill,d,seed,'Completa correctamente: población = conjunto total; muestra = ...','parte seleccionada del conjunto',['característica medida','resultado más frecuente','cada dato numérico'],`La muestra es una parte seleccionada de la población.`,['estadistica',tag])
  }

  if (d === 2) {
    if (f === 0) return mc(skill,d,seed,`Una ciudad tiene ${N*10} habitantes y se encuesta a ${n}. Identifica población y muestra.`,`Población: ${N*10}; muestra: ${n}`,[`Población: ${n}; muestra: ${N*10}`,`Población: la encuesta; muestra: la ciudad`,`Ambas son ${n}`],`El total es la población y quienes responden forman la muestra.`,['estadistica',tag])
    if (f === 1) return mc(skill,d,seed,'Se estudia el tiempo de pantalla de todos los alumnos de un centro. ¿Cuál es el individuo?','Cada alumno',['El centro','El tiempo de pantalla','Todos los alumnos juntos'],`Cada alumno es una unidad individual del estudio.`,['estadistica',tag])
    if (f === 2) return mc(skill,d,seed,'¿Qué muestra representa mejor a todo un colegio?','Alumnos elegidos al azar de varios cursos',['Solo alumnos del equipo de fútbol','Solo alumnos de una clase','Solo quienes quieran responder en el recreo'],`Incluir distintos cursos sin favorecer un grupo reduce el sesgo.`,['estadistica',tag])
    if (f === 3) return mc(skill,d,seed,'Para estudiar cómo llegan los alumnos al centro, ¿cuál es la variable?','El medio de transporte',['Los alumnos del centro','Los alumnos encuestados','Cada alumno'],`La variable es la característica que se registra.`,['estadistica',tag])
    if (f === 4) return mc(skill,d,seed,`De ${N} familias se eligen ${n} al azar. ¿Cuál afirmación es correcta?`,`Las ${n} familias son una muestra de las ${N}`,[`Las ${N} familias son una muestra de las ${n}`,`Cada familia es una población`,`La población es la pregunta realizada`],`La muestra está contenida en la población.`,['estadistica',tag])
    if (f === 5) return mc(skill,d,seed,'¿Qué relación debe cumplirse en un estudio por muestreo?','La muestra forma parte de la población',['La población forma parte de la muestra','Muestra y variable significan lo mismo','Un individuo contiene toda la población'],`La muestra es un subconjunto de la población.`,['estadistica',tag])
    if (f === 6) return mc(skill,d,seed,'Un supermercado pregunta solo a clientes que compran por la mañana. ¿Qué problema puede haber?','La muestra puede no representar a todos los clientes',['No existe población','No hay individuos','La variable deja de poder medirse'],`Excluir sistemáticamente a otros clientes puede introducir sesgo.`,['estadistica',tag])
    return mc(skill,d,seed,'¿Cuál es la mejor descripción de “individuo” en estadística?','Cada elemento sobre el que se recoge información',['El conjunto total estudiado','Solo quienes quedan fuera de la muestra','La característica que se mide'],`El individuo es cada unidad observada.`,['estadistica',tag])
  }

  if (d === 3) {
    if (f === 0) return mc(skill,d,seed,'Para conocer la opinión de todo un instituto se encuesta solo al alumnado de 1.º. ¿Qué falla?','La muestra puede estar sesgada',['La población es demasiado pequeña','No existe ninguna variable','Cada curso debería ser un individuo'],`Un solo curso puede no representar al conjunto del instituto.`,['estadistica',tag])
    if (f === 1) return mc(skill,d,seed,'¿Qué procedimiento produce normalmente una muestra más representativa?','Elegir al azar alumnos de todos los niveles',['Preguntar solo a los primeros que llegan','Elegir solo alumnos con notas altas','Preguntar únicamente a voluntarios de una actividad'],`Dar presencia a distintos grupos reduce sesgos de selección.`,['estadistica',tag])
    if (f === 2) return mc(skill,d,seed,`Una empresa tiene ${N} trabajadores: ${n} responden una encuesta sobre satisfacción. ¿Qué es la satisfacción laboral?`,'La variable',['La población','La muestra','El individuo'],`Es la característica que se quiere observar en cada trabajador.`,['estadistica',tag])
    if (f === 3) return mc(skill,d,seed,'Un estudio quiere saber cuánto leen los adolescentes de una provincia. ¿Cuál sería una población adecuada?','Todos los adolescentes de la provincia',['Solo 40 lectores de una biblioteca','Los libros de una biblioteca','Las horas de lectura registradas'],`La población debe coincidir con el grupo sobre el que se quiere concluir.`,['estadistica',tag])
    if (f === 4) return mc(skill,d,seed,'Se eligen 100 números al azar del listado completo de alumnos y se encuesta a esos alumnos. ¿Qué ventaja tiene?','Reduce la selección intencionada de participantes',['Garantiza que todos responderán igual','Convierte la muestra en población','Elimina la necesidad de definir una variable'],`La selección aleatoria ayuda a evitar preferencias del investigador.`,['estadistica',tag])
    if (f === 5) return mc(skill,d,seed,'¿Cuál de estas conclusiones es la más prudente si la muestra es muy pequeña?','Puede no reflejar bien a toda la población',['Siempre representa perfectamente a la población','Deja de existir población','La variable se convierte en individuo'],`Una muestra pequeña puede tener mayor variabilidad y ser menos representativa.`,['estadistica',tag])
    if (f === 6) return mc(skill,d,seed,'En una encuesta escolar participan alumnos de todos los cursos en proporción al tamaño de cada curso. ¿Qué se intenta mejorar?','La representatividad de la muestra',['El número de variables','La definición de individuo','La unidad de medida'],`Mantener presencia proporcional de los grupos ayuda a representar el conjunto.`,['estadistica',tag])
    return mc(skill,d,seed,'¿Qué afirmación distingue correctamente muestra e individuo?','La muestra contiene varios individuos seleccionados',['Cada individuo contiene una muestra','La muestra es la característica medida','Individuo y población son sinónimos'],`Una muestra está formada por individuos de la población.`,['estadistica',tag])
  }

  if (d === 4) {
    if (f === 0) return mc(skill,d,seed,'Una encuesta sobre transporte se publica en una app que usan sobre todo jóvenes. ¿Qué riesgo existe?','Sesgo de selección',['Que no haya variable','Que cada respuesta sea una población','Que la muestra sea mayor que la población por definición'],`El canal de encuesta puede favorecer a un tipo de participante.`,['estadistica',tag])
    if (f === 1) return mc(skill,d,seed,'Para estimar hábitos de toda una ciudad, ¿qué diseño es mejor?','Seleccionar al azar personas de distintos barrios y edades',['Encuestar solo en un gimnasio','Preguntar solo en una universidad','Usar únicamente seguidores de una cuenta concreta'],`Una selección diversa y aleatoria representa mejor a la población.`,['estadistica',tag])
    if (f === 2) return mc(skill,d,seed,'Una muestra aleatoria grande encuentra que el 62% prefiere autobús. ¿Cuál conclusión es razonable?','La muestra aporta una estimación sobre la población, no una certeza exacta',['Exactamente el 62% de toda la población debe preferir autobús','La muestra pasa a ser la población','No puede decirse nada sobre la población'],`Una muestra permite estimar características poblacionales con incertidumbre.`,['estadistica',tag])
    if (f === 3) return mc(skill,d,seed,'Dos estudios investigan el mismo colegio: A elige 80 alumnos al azar; B pregunta a 80 miembros del club de ciencias. ¿Cuál es preferible para representar al colegio?','A',['B','Son necesariamente equivalentes','Ninguno tiene población'],`A no restringe la selección a un grupo con una característica concreta.`,['estadistica',tag])
    if (f === 4) return mc(skill,d,seed,'¿Por qué una muestra de voluntarios puede introducir sesgo?','Quienes deciden participar pueden diferir del resto',['Porque una muestra nunca puede tener más de 10 personas','Porque los voluntarios dejan de ser individuos','Porque desaparece la variable'],`La autoselección puede producir un grupo distinto de la población general.`,['estadistica',tag])
    if (f === 5) return mc(skill,d,seed,'Se quiere comparar dos barrios. Se toman 200 personas de uno y 10 del otro aunque tienen tamaños parecidos. ¿Qué conviene revisar?','El diseño y equilibrio de la muestra',['La existencia de individuos','Si la variable es siempre cualitativa','Si ambos barrios son una sola persona'],`Una representación muy desigual puede perjudicar la comparación.`,['estadistica',tag])
    if (f === 6) return mc(skill,d,seed,'¿Qué información es imprescindible para decidir si una muestra es representativa?','Cómo se seleccionó respecto a la población',['Solo el nombre del encuestador','Solo el día de la semana','Solo el título del estudio'],`La representatividad depende de la relación entre el método de selección y la población.`,['estadistica',tag])
    return mc(skill,d,seed,'Un estudio excluye sin querer a quienes no tienen internet. ¿Qué tipo de problema aparece?','Parte de la población tiene menos posibilidad de ser seleccionada',['La muestra se convierte en variable','Cada individuo pasa a ser una población','La población deja de existir'],`La cobertura incompleta puede sesgar la muestra.`,['estadistica',tag])
  }

  if (f === 0) return mc(skill,d,seed,'Un sondeo electoral usa únicamente respuestas de una web concreta. ¿Por qué no basta con tener miles de respuestas?','Un tamaño grande no corrige necesariamente un método de selección sesgado',['Toda muestra grande es exacta','Las respuestas dejan de ser individuos','La población debe tener el mismo tamaño que la muestra'],`Muchos datos de un grupo sesgado pueden seguir sin representar a la población.`,['estadistica',tag])
  if (f === 1) return mc(skill,d,seed,'¿Cuál permite generalizar con mayor fundamento a una población?','Una muestra aleatoria y bien cubierta de los grupos relevantes',['Una muestra enorme tomada de un único grupo','Una muestra elegida por comodidad','Una muestra formada solo por casos extremos'],`La calidad del diseño de muestreo es esencial para generalizar.`,['estadistica',tag])
  if (f === 2) return mc(skill,d,seed,'Dos muestras tienen 500 personas. Una es aleatoria; la otra procede de una encuesta voluntaria en redes. ¿Qué puede afirmarse?','El mismo tamaño no implica la misma representatividad',['Ambas tienen necesariamente el mismo sesgo','La voluntaria es siempre mejor','La aleatoria deja de ser una muestra'],`El método de selección importa además del tamaño.`,['estadistica',tag])
  if (f === 3) return mc(skill,d,seed,'Una investigación concluye sobre todos los adolescentes usando solo estudiantes de centros privados. ¿Cuál es la principal objeción?','La población objetivo es más amplia que el grupo del que procede la muestra',['No existe individuo','La variable no puede medirse','Toda muestra debe incluir a toda la población'],`La muestra puede no cubrir adecuadamente la población sobre la que se concluye.`,['estadistica',tag])
  if (f === 4) return mc(skill,d,seed,'¿Qué cambio mejora más un estudio sesgado por entrevistar solo por la mañana?','Incluir franjas horarias diversas con un método de selección definido',['Duplicar solo las entrevistas de mañana','Eliminar la definición de población','Preguntar dos veces a cada participante'],`Ampliar la cobertura reduce la exclusión sistemática de ciertos grupos.`,['estadistica',tag])
  if (f === 5) return mc(skill,d,seed,'Si no sabemos cómo se eligieron los participantes, ¿podemos asegurar que la muestra representa a la población?','No; falta información sobre el método de selección',['Sí, siempre','Sí, si hay más de 50 participantes','No, porque ninguna muestra puede representar una población'],`Sin conocer el muestreo no puede evaluarse bien la representatividad.`,['estadistica',tag])
  if (f === 6) return mc(skill,d,seed,'Un estudio separa la población por edades y selecciona al azar dentro de cada grupo. ¿Qué objetivo persigue?','Asegurar presencia de los distintos grupos de edad',['Convertir las edades en individuos','Eliminar la población','Hacer que todos tengan la misma respuesta'],`Seleccionar dentro de grupos ayuda a cubrir segmentos relevantes de la población.`,['estadistica',tag])
  return mc(skill,d,seed,'¿Cuál es el mejor argumento contra “la muestra es grande, por tanto no puede estar sesgada”?','El sesgo depende del modo de selección, no solo del número de participantes',['Toda muestra grande es una población','El tamaño elimina cualquier error posible','Una muestra sesgada siempre tiene menos de 20 individuos'],`Un mecanismo de selección defectuoso puede sesgar incluso muestras muy grandes.`,['estadistica',tag])
}
// M14S02 · Variables estadísticas
if (key === 'stats_variables') {
  const f = pickFamily(seed, 8)
  const tag = `family:m14-var:d${d}:f${f}`

  if (f === 0) {
    const variants = d <= 2
      ? [
          ['El color de ojos de una persona', 'Cualitativa'],
          ['El número de hermanos de un alumno', 'Cuantitativa discreta'],
          ['La altura de una persona', 'Cuantitativa continua'],
        ]
      : [
          ['El código postal de una vivienda', 'Cualitativa'],
          ['El número de mensajes recibidos en un día', 'Cuantitativa discreta'],
          ['El tiempo empleado en una carrera', 'Cuantitativa continua'],
        ]
    const v = variants[ri(0, variants.length - 1)]
    return mc(skill,d,seed,`${v[0]} es una variable...`,v[1],[ 'Cualitativa','Cuantitativa discreta','Cuantitativa continua','No estadística' ].filter(x=>x!==v[1]),`La clasificación correcta es ${v[1].toLowerCase()}.`,['variables_estadisticas',tag])
  }
  if (f === 1) return mc(skill,d,seed,'¿Cuál de estas variables es cualitativa?','El medio de transporte habitual',['La temperatura corporal','El número de mascotas','La distancia recorrida'],`El medio de transporte describe categorías, no cantidades.`,['variables_estadisticas',tag])
  if (f === 2) return mc(skill,d,seed,'¿Cuál de estas variables es cuantitativa discreta?','El número de libros leídos en un mes',['La masa corporal','El color favorito','El tiempo de viaje'],`Los libros se cuentan mediante valores enteros.`,['variables_estadisticas',tag])
  if (f === 3) return mc(skill,d,seed,'¿Cuál de estas variables es cuantitativa continua?','La temperatura de una habitación',['El número de alumnos','La marca de móvil','El número de goles'],`La temperatura puede tomar valores intermedios en una escala continua.`,['variables_estadisticas',tag])
  if (f === 4) return mc(skill,d,seed,'¿Qué pareja está correctamente clasificada?','Número de llamadas: discreta; duración de llamadas: continua',['Número de llamadas: continua; duración: discreta','Color del teléfono: continua; duración: cualitativa','Marca del teléfono: discreta; número de llamadas: cualitativa'],`Contar llamadas produce una variable discreta; medir duración produce una continua.`,['variables_estadisticas',tag])
  if (f === 5) return mc(skill,d,seed,'Se estudia si los alumnos van andando, en bici, autobús o coche. ¿Cuál es la variable?','El medio de transporte utilizado',['Los alumnos encuestados','El número total de alumnos','El instituto'],`La variable es la característica registrada en cada individuo.`,['variables_estadisticas',tag])
  if (f === 6) return mc(skill,d,seed,'¿Qué clasificación es incorrecta?','Altura: cuantitativa discreta',['Número de hermanos: cuantitativa discreta','Deporte favorito: cualitativa','Temperatura: cuantitativa continua'],`La altura se mide de forma continua, no mediante conteos enteros.`,['variables_estadisticas',tag])
  return mc(skill,d,seed,'Un dorsal de corredor está escrito con números. ¿Por qué no es necesariamente una variable cuantitativa?','Porque puede funcionar solo como una etiqueta o identificador',['Porque todos los números son cualitativos','Porque una variable cuantitativa nunca usa enteros','Porque los identificadores siempre son continuos'],`Que algo use cifras no implica que represente una cantidad medible.`,['variables_estadisticas','razonamiento',tag])
}

// M14S03 · Tabla de frecuencias
if (key === 'frequency_table') {
  const f = pickFamily(seed, 8)
  const tag = `family:m14-freq:d${d}:f${f}`
  const a = ri(2, 5 + d)
  const b = ri(2, 5 + d)
  const c = ri(2, 5 + d)
  const total = a + b + c

  if (f === 0) {
    const target = ri(2, 6)
    const values = [target, target+1, target, target+2, target, target+1, target]
    return mc(skill,d,seed,`En los datos ${values.join(', ')}, ¿cuál es la frecuencia absoluta de ${target}?`,'4',['2','3','7'],`${target} aparece 4 veces.`,['tabla_frecuencias',tag])
  }
  if (f === 1) return mc(skill,d,seed,`Una tabla tiene frecuencias ${a}, ${b} y ${c}. ¿Cuántos datos hay en total?`,String(total),[String(total-1),String(total+1),String(Math.max(a,b,c))],`Sumamos las frecuencias: ${a}+${b}+${c}=${total}.`,['tabla_frecuencias',tag])
  if (f === 2) {
    const n = 4 * (d + 2)
    const fav = n / 4
    return mc(skill,d,seed,`Una categoría aparece ${fav} veces entre ${n} datos. ¿Cuál es su frecuencia relativa?`,'0,25',['0,50','0,75',String(fav)],`${fav}/${n}=0,25.`,['tabla_frecuencias','frecuencia_relativa',tag])
  }
  if (f === 3) {
    const n = 20 * (d + 1)
    const fav = n / 5
    return mc(skill,d,seed,`En un grupo de ${n} personas, ${fav} pertenecen a una categoría. ¿Qué porcentaje representan?`,'20%',['5%','25%','80%'],`${fav}/${n}=0,20=20%.`,['tabla_frecuencias','porcentaje',tag])
  }
  if (f === 4) {
    const missing = ri(2, 7)
    const grand = a + b + missing
    return mc(skill,d,seed,`Las frecuencias de tres categorías son ${a}, ${b} y una desconocida. Si hay ${grand} datos en total, ¿qué frecuencia falta?`,String(missing),[String(missing+1),String(Math.max(1,missing-1)),String(a+b)],`${grand}-${a}-${b}=${missing}.`,['tabla_frecuencias','frecuencia_desconocida',tag])
  }
  if (f === 5) {
    const freqs = [a, a+3, a+1]
    return mc(skill,d,seed,`Las frecuencias de A, B y C son ${freqs.join(', ')}. ¿Qué categoría es la más frecuente?`,'B',['A','C','Todas igual'],`B tiene frecuencia ${a+3}, la mayor de las tres.`,['tabla_frecuencias','interpretacion',tag])
  }
  if (f === 6) {
    const n = 40 + 10*d
    const rel = 0.4
    const abs = Math.round(n*rel)
    return mc(skill,d,seed,`Una frecuencia relativa es 0,4 en un conjunto de ${n} datos. ¿Cuál es la frecuencia absoluta?`,String(abs),[String(n),String(abs+10),String(Math.max(1,abs-10))],`0,4×${n}=${abs}.`,['tabla_frecuencias','frecuencia_relativa',tag])
  }
  const firstTwo = a+b
  return mc(skill,d,seed,`En una tabla ordenada, las dos primeras categorías tienen frecuencias ${a} y ${b}. ¿Cuál es su frecuencia acumulada hasta la segunda categoría?`,String(firstTwo),[String(a),String(b),String(total)],`Frecuencia acumulada = ${a}+${b}=${firstTwo}.`,['tabla_frecuencias','acumulada',tag])
}

// M14S04 · Gráficos estadísticos
if (key === 'stat_charts') {
  const f = pickFamily(seed, 8)
  const tag = `family:m14-chart:d${d}:f${f}`
  if (f === 0) return mc(skill,d,seed,'¿Qué gráfico es especialmente adecuado para comparar cantidades entre categorías?','Gráfico de barras',['Gráfico de líneas','Diagrama de dispersión','Plano cartesiano'],`Las barras permiten comparar visualmente categorías.`,['graficos_estadisticos',tag])
  if (f === 1) return mc(skill,d,seed,'¿Qué gráfico muestra bien cómo se reparte un total entre varias categorías?','Diagrama de sectores',['Gráfico de líneas','Diagrama de dispersión','Recta numérica'],`Los sectores representan partes de un total.`,['graficos_estadisticos',tag])
  if (f === 2) return mc(skill,d,seed,'¿Qué gráfico es adecuado para mostrar cómo cambia una temperatura durante varias horas?','Gráfico de líneas',['Diagrama de sectores','Pictograma','Diagrama de dispersión'],`Las líneas muestran bien una evolución temporal.`,['graficos_estadisticos',tag])
  if (f === 3) return mc(skill,d,seed,'¿Qué gráfico usarías para estudiar la relación entre horas de estudio y nota obtenida por muchos alumnos?','Diagrama de dispersión',['Diagrama de sectores','Pictograma','Gráfico circular'],`La dispersión permite observar la relación entre dos variables cuantitativas.`,['graficos_estadisticos',tag])
  if (f === 4) return mc(skill,d,seed,'¿Qué gráfico es apropiado para representar alturas agrupadas en intervalos?','Histograma',['Diagrama de sectores','Gráfico de líneas temporal','Pictograma'],`El histograma representa frecuencias de una variable cuantitativa agrupada.`,['graficos_estadisticos',tag])
  if (f === 5) return mc(skill,d,seed,'¿Qué puede hacer engañoso un gráfico de barras?','Empezar el eje vertical muy por encima de cero para exagerar diferencias',['Indicar las unidades','Poner un título claro','Usar la misma escala en todas las barras'],`Un eje truncado puede exagerar visualmente diferencias pequeñas.`,['graficos_estadisticos','lectura_critica',tag])
  if (f === 6) return mc(skill,d,seed,'Se quieren comparar las ventas de 6 tiendas en un mismo mes. ¿Qué representación es más directa?','Gráfico de barras',['Gráfico de líneas de una sola serie temporal','Diagrama de dispersión sin segunda variable','Circunferencia geométrica'],`Se comparan categorías independientes: las tiendas.`,['graficos_estadisticos',tag])
  return mc(skill,d,seed,'En un gráfico de barras con la misma escala, una barra mide aproximadamente el doble que otra. ¿Qué indica?','Que su frecuencia es aproximadamente el doble',['Que su frecuencia es la mitad','Que ambas frecuencias son iguales','Que no se pueden comparar'],`Con una escala común, la altura representa proporcionalmente la frecuencia.`,['graficos_estadisticos','interpretacion',tag])
}

// M14S05 · Media aritmética
if (key === 'mean') {
  const f = pickFamily(seed, 8)
  const tag = `family:m14-mean:d${d}:f${f}`
  const m = ri(6, 10 + d*2)
  const x = ri(1, 2 + d)

  if (f === 0) {
    const vals = [m-x, m, m+x]
    return mc(skill,d,seed,`Calcula la media de ${vals.join(', ')}`,String(m),[String(m-1),String(m+1),String(m+x)],`La suma es ${3*m}; dividimos entre 3 y obtenemos ${m}.`,['media_aritmetica',tag])
  }
  if (f === 1) {
    const count = 4+d
    const sum = count*m
    return mc(skill,d,seed,`La suma de ${count} datos es ${sum}. ¿Cuál es su media?`,String(m),[String(count),String(sum),String(m+1)],`${sum}/${count}=${m}.`,['media_aritmetica',tag])
  }
  if (f === 2) {
    const vals = [m-2,m,m+1]
    const missing = 4*m - vals.reduce((s,v)=>s+v,0)
    return mc(skill,d,seed,`La media de 4 números es ${m}. Tres son ${vals.join(', ')}. ¿Cuál falta?`,String(missing),[String(m),String(missing-1),String(missing+1)],`La suma total debe ser ${4*m}; restamos los tres conocidos.`,['media_aritmetica','dato_desconocido',tag])
  }
  if (f === 3) return mc(skill,d,seed,`Un conjunto tiene media ${m}. Si a todos los datos se les suma ${x}, ¿cuál será la nueva media?`,String(m+x),[String(m),String(m-x),String(m+2*x)],`Sumar ${x} a todos los datos aumenta la media exactamente en ${x}.`,['media_aritmetica','transformacion',tag])
  if (f === 4) return mc(skill,d,seed,`Dos grupos del mismo tamaño tienen medias ${m} y ${m+4}. ¿Cuál es la media al reunirlos?`,String(m+2),[String(m),String(m+4),String(m+1)],`Al tener el mismo tamaño, la media conjunta es el promedio de las dos medias.`,['media_aritmetica','grupos',tag])
  if (f === 5) {
    const a = m-2, b = m+1
    const weighted = (2*a + 3*b)/5
    return mc(skill,d,seed,`En una tabla, el valor ${a} aparece 2 veces y ${b} aparece 3 veces. ¿Cuál es la media?`,String(weighted),[String((a+b)/2),String(b),String(a)],`Media = (2×${a}+3×${b})/5=${weighted}.`,['media_aritmetica','frecuencias',tag])
  }
  if (f === 6) return mc(skill,d,seed,'¿Qué medida suele cambiar más al añadir un valor extremadamente grande a un conjunto?','La media',['La mediana','La moda necesariamente','El número de datos no cambia'],`La media utiliza todos los valores y es sensible a valores extremos.`,['media_aritmetica','razonamiento',tag])
  const old = m
  const newVal = m + 4 + d
  const newMean = (4*old + newVal)/5
  return mc(skill,d,seed,`Cuatro valores tienen media ${old}. Se añade el valor ${newVal}. ¿Cuál es la nueva media?`,String(newMean),[String(old),String(newVal),String((old+newVal)/2)],`La suma inicial es ${4*old}; añadimos ${newVal} y dividimos entre 5: ${newMean}.`,['media_aritmetica','actualizar_media',tag])
}

// M14S06 · Mediana
if (key === 'median') {
  const f = pickFamily(seed, 8)
  const tag = `family:m14-med:d${d}:f${f}`
  const m = ri(8, 14 + d)

  if (f === 0) return mc(skill,d,seed,`¿Cuál es la mediana de ${m-4}, ${m-2}, ${m}, ${m+2}, ${m+5}?`,String(m),[String(m-2),String(m+2),String(m+5)],`Con 5 datos ordenados, la mediana es el tercero.`,['mediana',tag])
  if (f === 1) return mc(skill,d,seed,`Ordena mentalmente: ${m+3}, ${m-4}, ${m+1}, ${m}, ${m-2}. ¿Cuál es la mediana?`,String(m),[String(m-2),String(m+1),String(m+3)],`Al ordenar, ${m} queda en la posición central.`,['mediana','datos_desordenados',tag])
  if (f === 2) return mc(skill,d,seed,`¿Cuál es la mediana de ${m-5}, ${m-3}, ${m-1}, ${m+1}, ${m+3}, ${m+5}?`,String(m),[String(m-1),String(m+1),String(m+2)],`Con 6 datos promediamos los dos centrales: (${m-1}+${m+1})/2=${m}.`,['mediana','numero_par_datos',tag])
  if (f === 3) return mc(skill,d,seed,`Los datos ordenados son 2, 5, ${m}, 20, 25. Se añade 100. ¿Cómo se calcula ahora la mediana?`,'Promediando los dos valores centrales',['Tomando siempre '+m,'Tomando 100','Sumando todos los datos'],`Con 6 datos, la mediana es la media de los dos centrales.`,['mediana','cambio_tamano',tag])
  if (f === 4) return mc(skill,d,seed,'¿Qué afirmación sobre la mediana es correcta?','Suele ser menos sensible que la media a valores extremos',['Siempre coincide con la media','Solo existe con un número impar de datos','Siempre es el valor más frecuente'],`La mediana depende de la posición central y suele resistir mejor los extremos.`,['mediana','razonamiento',tag])
  if (f === 5) return mc(skill,d,seed,`Un conjunto ordenado es ${m-4}, ${m-1}, ${m}, ${m+3}, ${m+7}. Si se elimina el mayor valor, ¿qué ocurre?`,'La nueva mediana es el promedio de los dos valores centrales restantes',['La mediana sigue siendo necesariamente '+m,'La mediana pasa a ser el menor valor','Ya no existe mediana'],`Quedan 4 datos, así que se promedian los dos centrales.`,['mediana','eliminar_dato',tag])
  if (f === 6) return mc(skill,d,seed,'Para describir salarios cuando hay unos pocos sueldos extremadamente altos, ¿qué medida central suele ser más robusta?','La mediana',['La media siempre','La suma','La frecuencia absoluta'],`Los valores extremos afectan menos a la mediana.`,['mediana','contexto',tag])
  return mc(skill,d,seed,`En los datos 4, 4, ${m}, ${m+2}, ${m+2}, ¿cuál es la mediana?`,String(m),['4',String(m+2),String((m+2+4)/2)],`Al ordenar cinco datos, el tercero es ${m}.`,['mediana','repeticiones',tag])
}

// M14S07 · Moda
if (key === 'mode') {
  const f = pickFamily(seed, 8)
  const tag = `family:m14-mode:d${d}:f${f}`
  const a = ri(3, 8 + d)

  if (f === 0) return mc(skill,d,seed,`¿Cuál es la moda de ${a}, ${a+1}, ${a}, ${a+2}, ${a}?`,String(a),[String(a+1),String(a+2),'No hay moda'],`${a} es el valor que más se repite.`,['moda',tag])
  if (f === 1) return mc(skill,d,seed,`En los datos ${a}, ${a}, ${a+2}, ${a+2}, ${a+5}, ¿qué ocurre?`,`Hay dos modas: ${a} y ${a+2}`,[`La moda es ${a+5}`,'No hay moda',`La moda es ${a+1}`],`Los valores ${a} y ${a+2} comparten la frecuencia máxima.`,['moda','bimodal',tag])
  if (f === 2) return mc(skill,d,seed,`En los datos ${a}, ${a+1}, ${a+2}, ${a+3}, cada valor aparece una vez. ¿Cuál es la moda?`,'No hay moda',[String(a),String(a+1),String(a+3)],`Ningún valor aparece más veces que los demás.`,['moda','sin_moda',tag])
  if (f === 3) return mc(skill,d,seed,`Una tabla indica A→${a}, B→${a+3}, C→${a+1}. ¿Cuál es la moda?`,'B',['A','C','No hay moda'],`B tiene la frecuencia más alta: ${a+3}.`,['moda','tabla',tag])
  if (f === 4) return mc(skill,d,seed,'En una encuesta sobre color favorito, ¿puede calcularse la moda?','Sí, es la categoría más frecuente',['No, porque la moda solo sirve con números','Solo si hay exactamente dos colores','Solo si todas las frecuencias son iguales'],`La moda puede utilizarse con variables cualitativas.`,['moda','cualitativa',tag])
  if (f === 5) return mc(skill,d,seed,`Los datos son ${a}, ${a}, ${a+1}, ${a+2}. Si añadimos otro ${a+1}, ¿qué ocurre?`,`Hay dos modas: ${a} y ${a+1}`,[`La única moda es ${a}`,`La única moda es ${a+2}`,'No hay moda'],`Tras añadir ${a+1}, ${a} y ${a+1} aparecen dos veces.`,['moda','cambio_datos',tag])
  if (f === 6) return mc(skill,d,seed,'¿Cuál es la diferencia esencial entre moda y mediana?','La moda depende de la frecuencia; la mediana de la posición ordenada',['Ambas significan siempre lo mismo','La moda solo existe con números continuos','La mediana es siempre el valor más frecuente'],`Son medidas distintas: frecuencia frente a posición central.`,['moda','comparacion',tag])
  return mc(skill,d,seed,`En los datos ${a}, ${a}, ${a+1}, ${a+1}, ${a+1}, ${a+2}, ${a+2}, ¿qué valor es la moda y cuántas veces aparece?`,`${a+1}, 3 veces`,[`${a}, 2 veces`,`${a+2}, 2 veces`,`${a+1}, 2 veces`],`${a+1} aparece 3 veces, más que cualquier otro valor.`,['moda','frecuencia',tag])
}

// M15 · PROBABILIDAD
// =========================

// M15S01 · Experimentos aleatorios
if (key === 'random_experiments') {
  const f = (seed >>> 0) & 7
  const tag = `family:m15-random:d${d}:f${f}`

  if (f === 0) {
    const contexts = d <= 2
      ? [
          ['Lanzar un dado y observar el resultado', 'Calcular 8 + 7', 'Contar las patas de una mesa', 'Escribir el número 20'],
          ['Sacar una carta de una baraja mezclada', 'Medir un segmento ya dibujado', 'Calcular 24 ÷ 6', 'Contar 12 lápices'],
          ['Girar una ruleta y observar dónde se detiene', 'Hallar el doble de 9', 'Leer la hora de un reloj parado', 'Ordenar 3, 5 y 8 de menor a mayor'],
        ]
      : [
          ['Registrar cuántas caras aparecen al lanzar tres monedas', 'Calcular el área de un cuadrado de lado 7', 'Resolver 3x=18', 'Convertir 2 m a cm'],
          ['Extraer dos bolas sin mirar y anotar sus colores', 'Calcular 15% de 200', 'Ordenar una lista ya conocida', 'Sumar 125 + 375'],
          ['Lanzar dos dados y anotar la suma', 'Calcular el perímetro de un triángulo conocido', 'Simplificar 12/18', 'Resolver 9-4'],
        ]
    const v = contexts[pickFamily(seed ^ 0x11111111, contexts.length)]
    return mc(skill,d,seed,'¿Cuál de estas situaciones es un experimento aleatorio?',v[0],[v[1],v[2],v[3]],'En un experimento aleatorio conocemos los resultados posibles, pero no podemos saber con certeza cuál ocurrirá antes de realizarlo.',['experimentos_aleatorios',tag])
  }

  if (f === 1) {
    if (d <= 2) return mc(skill,d,seed,'¿Cuál es el conjunto de resultados posibles al lanzar una moneda una vez?','{cara, cruz}',['{1, 2}','{cara}','{cara, cruz, borde}'],'Una moneda ordinaria tiene dos resultados posibles: cara o cruz.',['experimentos_aleatorios','espacio_muestral',tag])
    if (d === 3) return mc(skill,d,seed,'Se lanza un dado y se anota si el resultado es par o impar. ¿Cuáles son los resultados posibles de lo que se anota?','{par, impar}',['{1,2,3,4,5,6}','{2,4,6}','{1,3,5}'],'Aunque el dado tiene seis caras, el registro final solo distingue dos resultados: par o impar.',['experimentos_aleatorios','espacio_muestral_reducido',tag])
    return mc(skill,d,seed,'Se lanzan dos monedas y solo se anota el número de caras obtenidas. ¿Cuál es el espacio de resultados del registro?','{0, 1, 2}',['{cara, cruz}','{0, 1}','{1, 2, 3}'],'El número de caras puede ser 0, 1 o 2.',['experimentos_aleatorios','espacio_muestral',tag])
  }

  if (f === 2) {
    if (d <= 2) return mc(skill,d,seed,'¿Por qué lanzar un dado es aleatorio?','Porque antes de lanzarlo no sabemos qué cara saldrá',['Porque el dado no tiene números','Porque siempre sale el mismo número','Porque no existen resultados posibles'],'La incertidumbre sobre cuál de los resultados posibles ocurrirá caracteriza al experimento aleatorio.',['experimentos_aleatorios','concepto',tag])
    const multiplier = d + 1
    return mc(skill,d,seed,`Se lanza un dado y luego se multiplica por ${multiplier} el resultado. ¿Por qué el resultado final sigue siendo aleatorio?`,'Porque depende del resultado incierto del dado',['Porque multiplicar siempre introduce azar','Porque todos los resultados finales son iguales','Porque no puede calcularse ningún resultado posible'],`La regla ×${multiplier} es determinista, pero se aplica a un resultado del dado que no conocemos de antemano.`,['experimentos_aleatorios','transformacion',tag])
  }

  if (f === 3) {
    const trials = 5 + d
    if (d <= 2) return mc(skill,d,seed,`Se lanza una moneda ${trials} veces. Antes de empezar, ¿podemos saber exactamente cuántas caras saldrán?`,'No',['Sí, siempre la mitad','Sí, siempre salen todas cara','Solo si la moneda se lanza rápido'],`Conocemos los resultados posibles de cada lanzamiento, pero no la secuencia concreta de ${trials} resultados.`,['experimentos_aleatorios','repeticiones',tag])
    return mc(skill,d,seed,`Una moneda se lanza ${trials} veces. ¿Qué afirmación es correcta antes de realizar los lanzamientos?`,'Podemos describir resultados posibles, pero no asegurar la secuencia exacta',['Sabemos que habrá exactamente la mitad de caras','La primera tirada determina todas las demás','No podemos describir ningún resultado posible'],'Repetir un experimento no elimina la incertidumbre sobre la secuencia concreta.',['experimentos_aleatorios','repeticiones','razonamiento',tag])
  }

  if (f === 4) {
    const n = 4 + d
    return mc(skill,d,seed,`Una bolsa contiene ${n} fichas numeradas y se extrae una sin mirar. Después se devuelve y se repite. ¿Qué parte del proceso hace que sea aleatorio?`,'No saber qué ficha se extraerá en cada intento',['Devolver la ficha a la bolsa','Que las fichas tengan números','Contar el número de intentos'],'La incertidumbre está en cuál de las fichas posibles aparecerá en cada extracción.',['experimentos_aleatorios','identificar_azar',tag])
  }

  if (f === 5) {
    if (d <= 2) return mc(skill,d,seed,'¿Cuál de estos pares contiene dos experimentos aleatorios?','Lanzar una moneda y girar una ruleta',['Sumar 4+5 y lanzar un dado','Medir una mesa y contar libros','Resolver 12÷3 y ordenar números'],'Ambas acciones del par correcto tienen un resultado incierto antes de realizarlas.',['experimentos_aleatorios','comparacion',tag])
    return mc(skill,d,seed,'¿Cuál de estos procesos contiene una parte aleatoria y después una parte determinista?','Lanzar un dado y sumar 10 al resultado',['Calcular 6×8 y después dividir entre 2','Medir un lado y calcular un perímetro','Ordenar una lista y contar sus elementos'],'El lanzamiento introduce azar; sumar 10 al valor obtenido es una regla fija.',['experimentos_aleatorios','proceso_mixto',tag])
  }

  if (f === 6) {
    if (d <= 3) return mc(skill,d,seed,'Una ruleta tiene sectores rojo, azul y verde. ¿Qué podemos conocer antes de girarla?','Los colores que podrían salir',['El color exacto que saldrá','El número exacto de giros hasta rojo','Que siempre saldrá el mismo color'],'Podemos conocer los resultados posibles, pero no cuál ocurrirá en un giro concreto.',['experimentos_aleatorios','posibles_vs_real',tag])
    return mc(skill,d,seed,'¿Qué información NO basta para convertir un experimento aleatorio en determinista?','Conocer todos sus resultados posibles',['Conocer de antemano el resultado que ocurrirá','Fijar una regla que determine un único resultado','Eliminar toda incertidumbre del proceso'],'Conocer el espacio muestral no nos dice qué resultado concreto aparecerá.',['experimentos_aleatorios','razonamiento',tag])
  }

  return mc(skill,d,seed,d <= 2 ? '¿Cuál de estas acciones NO depende del azar?' : '¿Cuál de estas situaciones es determinista aunque pueda parecer complicada?',d <= 2 ? 'Calcular 9 × 6' : 'Calcular el área de una figura cuando todas sus medidas son conocidas',d <= 2 ? ['Sacar una bola sin mirar','Lanzar un dado','Girar una ruleta'] : ['Elegir al azar una persona de una lista','Lanzar dos dados y sumar','Extraer una carta de una baraja mezclada'],'Un proceso determinista queda completamente fijado por los datos y las reglas; no depende de un resultado azaroso.',['experimentos_aleatorios','determinista',tag])
}

// M15S02 · Sucesos
if (key === 'events') {
  const f = (seed >>> 0) & 7
  const tag = `family:m15-events:d${d}:f${f}`

  if (f === 0) {
    const target = d <= 2 ? 8 : 10 + d
    return mc(skill,d,seed,`Al lanzar un dado normal, ¿qué tipo de suceso es obtener ${target}?`,'Imposible',['Seguro','Posible pero no seguro','Compuesto'],`Un dado normal solo puede mostrar valores del 1 al 6; ${target} no puede aparecer.`,['sucesos','imposible',tag])
  }

  if (f === 1) {
    const limit = 6 + d
    return mc(skill,d,seed,`Al lanzar un dado, ¿qué tipo de suceso es obtener un número menor que ${limit}?`,'Seguro',['Imposible','Posible pero no seguro','Simple pero imposible'],`Todos los resultados 1, 2, 3, 4, 5 y 6 son menores que ${limit}.`,['sucesos','seguro',tag])
  }

  if (f === 2) {
    if (d <= 2) return mc(skill,d,seed,'Al lanzar un dado, ¿cuál es un suceso simple?','Obtener un 4',['Obtener un número par','Obtener un número mayor que 3','Obtener 1, 2 o 3'],'Un suceso simple contiene un único resultado elemental: salir 4.',['sucesos','simple',tag])
    return mc(skill,d,seed,'Al extraer una carta numerada del 1 al 10, ¿cuál es un suceso simple?','Obtener el 7',['Obtener un número par','Obtener un número mayor que 6','Obtener un múltiplo de 3'],'“Obtener el 7” corresponde a un único resultado del espacio muestral.',['sucesos','simple',tag])
  }

  if (f === 3) {
    if (d <= 2) return mc(skill,d,seed,'Al lanzar un dado, ¿cuál es un suceso compuesto?','Obtener un número par',['Obtener un 2','Obtener un 5','Obtener un 1'],'El suceso “par” contiene tres resultados: 2, 4 y 6.',['sucesos','compuesto',tag])
    return mc(skill,d,seed,'Se extrae una ficha numerada del 1 al 12. ¿Cuál es un suceso compuesto?','Obtener un múltiplo de 3',['Obtener exactamente 7','Obtener exactamente 11','Obtener exactamente 2'],'Los múltiplos de 3 son 3, 6, 9 y 12: varios resultados favorables.',['sucesos','compuesto',tag])
  }

  if (f === 4) {
    if (d <= 2) return mc(skill,d,seed,'Al lanzar un dado, A = “obtener un número par”. ¿Cuál es el suceso contrario de A?','Obtener un número impar',['Obtener un 2','Obtener un número mayor que 3','Obtener un 6'],'El complementario de “par” contiene los resultados que no son pares: 1, 3 y 5.',['sucesos','complementario',tag])
    return mc(skill,d,seed,'Se elige un número del 1 al 10. A = “obtener un número mayor que 6”. ¿Cuál es el complementario de A?','Obtener un número menor o igual que 6',['Obtener un número menor que 6','Obtener un número mayor o igual que 6','Obtener exactamente 6'],'El complementario contiene todos los resultados que no pertenecen a A: 1, 2, 3, 4, 5 y 6.',['sucesos','complementario',tag])
  }

  if (f === 5) {
    if (d <= 3) return mc(skill,d,seed,'Al lanzar un dado, A = “par” y B = “mayor que 3”. ¿Qué resultados pertenecen a A y B a la vez?','4 y 6',['2, 4 y 6','4, 5 y 6','2 y 3'],'La intersección exige cumplir ambas condiciones: ser par y mayor que 3.',['sucesos','interseccion',tag])
    return mc(skill,d,seed,'Se elige un número del 1 al 12. A = “múltiplo de 2” y B = “múltiplo de 3”. ¿Cuál es A ∩ B?','{6, 12}',['{2,4,6,8,10,12}','{3,6,9,12}','{2,3,6,12}'],'Los números que son múltiplos de 2 y de 3 a la vez son los múltiplos de 6: 6 y 12.',['sucesos','interseccion',tag])
  }

  if (f === 6) {
    if (d <= 3) return mc(skill,d,seed,'Al lanzar un dado, A = “obtener 1 o 2” y B = “obtener 5 o 6”. ¿Qué puede afirmarse?','A y B no pueden ocurrir a la vez',['A está contenido en B','A y B son el mismo suceso','A es un suceso seguro'],'Un único lanzamiento no puede pertenecer simultáneamente a {1,2} y {5,6}.',['sucesos','incompatibles',tag])
    return mc(skill,d,seed,'Se elige una ficha del 1 al 10. A = “par” y B = “impar”. ¿Qué relación hay entre A y B?','Son incompatibles y complementarios',['Pueden ocurrir a la vez','A está contenido en B','B está contenido en A'],'Todo número del 1 al 10 es par o impar, y ninguno puede ser ambas cosas a la vez.',['sucesos','relacion',tag])
  }

  return mc(skill,d,seed,d <= 2 ? 'Al lanzar dos monedas, ¿cuál de estos es un suceso?' : 'Al lanzar dos monedas, A = “obtener exactamente una cara”. ¿Qué resultados forman A?',d <= 2 ? 'Obtener exactamente una cara' : '{cara-cruz, cruz-cara}',d <= 2 ? ['Calcular 5+4','Medir una mesa','Escribir 12'] : ['{cara-cara}','{cruz-cruz}','{cara-cara, cruz-cruz}'],'Un suceso es un conjunto de resultados del experimento; exactamente una cara ocurre en cara-cruz o cruz-cara.',['sucesos','dos_etapas',tag])
}

// M15S03 · Casos favorables y posibles
if (key === 'favorable_possible') {
  const f = (seed >>> 0) & 7
  const tag = `family:m15-fav:d${d}:f${f}`

  if (f === 0) {
    return mc(skill,d,seed,'Al lanzar un dado normal, ¿cuántos resultados posibles hay?','6',['1','3','12'],'El espacio muestral es {1,2,3,4,5,6}: seis resultados posibles.',['casos_favorables_posibles','posibles',tag])
  }

  if (f === 1) {
    const threshold = d <= 2 ? 3 : 2 + Math.min(d, 4)
    const favorable = 6 - threshold
    return mc(skill,d,seed,`Al lanzar un dado, ¿cuántos casos favorables tiene el suceso “obtener un número mayor que ${threshold}”?`,String(favorable),[String(favorable+1),String(Math.max(1,favorable-1)),'6'],`Los valores mayores que ${threshold} entre 1 y 6 son ${Array.from({length:favorable},(_,i)=>threshold+1+i).join(', ')}: ${favorable} casos.`,['casos_favorables_posibles','dado',tag])
  }

  if (f === 2) {
    const red = ri(2, 5 + d)
    const blue = ri(2, 5 + d)
    const green = ri(1, 4 + d)
    const total = red + blue + green
    return mc(skill,d,seed,`Una bolsa contiene ${red} rojas, ${blue} azules y ${green} verdes. Para “sacar azul”, ¿cuántos casos favorables y posibles hay?`,`${blue} favorables y ${total} posibles`,[`${red} favorables y ${total} posibles`,`${total} favorables y ${blue} posibles`,`${blue} favorables y ${red+green} posibles`],`Hay ${blue} bolas azules entre ${total} bolas en total.`,['casos_favorables_posibles','bolsa',tag])
  }

  if (f === 3) {
    const sectors = 6 + d
    const favorable = Math.max(2, Math.floor(sectors/3))
    return mc(skill,d,seed,`Una ruleta tiene ${sectors} sectores iguales y ${favorable} son rojos. ¿Cuántos casos favorables y posibles hay para caer en rojo?`,`${favorable} favorables y ${sectors} posibles`,[`${sectors} favorables y ${favorable} posibles`,`${sectors-favorable} favorables y ${sectors} posibles`,`${favorable} favorables y ${sectors-favorable} posibles`],`Cada sector es un resultado posible; ${favorable} de ellos son rojos.`,['casos_favorables_posibles','ruleta',tag])
  }

  if (f === 4) {
    if (d <= 2) return mc(skill,d,seed,'Se lanzan dos monedas. ¿Cuántos resultados posibles hay distinguiendo el resultado de cada moneda?','4',['2','3','8'],'Los resultados son CC, CX, XC y XX: cuatro posibilidades.',['casos_favorables_posibles','dos_monedas',tag])
    return mc(skill,d,seed,'Se lanzan tres monedas. ¿Cuántos resultados posibles hay distinguiendo cada lanzamiento?','8',['3','6','9'],'Cada moneda tiene 2 resultados y hay 3 lanzamientos: 2×2×2=8.',['casos_favorables_posibles','tres_monedas',tag])
  }

  if (f === 5) {
    const sum = d <= 2 ? 7 : (d % 2 === 0 ? 8 : 9)
    const counts: Record<number,number> = {7:6,8:5,9:4}
    const favorable = counts[sum]
    return mc(skill,d,seed,`Se lanzan dos dados. De los 36 resultados ordenados posibles, ¿cuántos tienen suma ${sum}?`,String(favorable),[String(favorable+1),String(favorable+2),String(36-favorable)],`Al enumerar las parejas que suman ${sum}, se obtienen ${favorable} casos favorables de 36 posibles.`,['casos_favorables_posibles','dos_dados',tag])
  }

  if (f === 6) {
    const max = 8 + d
    const even = Math.floor(max / 2)
    return mc(skill,d,seed,`Se elige al azar una tarjeta numerada del 1 al ${max}. ¿Cuántos casos favorables hay para obtener un número par?`,String(even),[String(max-even),String(max),String(Math.max(1,even-1))],`Los pares entre 1 y ${max} son ${even} en total.`,['casos_favorables_posibles','tarjetas',tag])
  }

  const total = 8 + d
  const bad = 2 + Math.floor(d/2)
  const good = total - bad
  return mc(skill,d,seed,`De ${total} fichas, ${bad} son negras y las demás blancas. Para el suceso “no sacar negra”, ¿cuántos casos favorables hay?`,String(good),[String(bad),String(total),String(Math.max(1,good-1))],`“No negra” significa blanca: ${total}-${bad}=${good} fichas favorables.`,['casos_favorables_posibles','complementario',tag])
}

// M15S04 · Probabilidad de Laplace básica
if (key === 'laplace_basic') {
  const f = (seed >>> 0) & 7
  const tag = `family:m15-laplace:d${d}:f${f}`

  if (f === 0) {
    const possible = 6 + d
    const favorable = 1 + (pickFamily(seed ^ 0x22222222, Math.min(4, possible-1)))
    return mc(skill,d,seed,`En una experiencia equiprobable hay ${possible} resultados posibles y ${favorable} favorables. ¿Cuál es la probabilidad?`,`${favorable}/${possible}`,[`${possible}/${favorable}`,`${possible-favorable}/${possible}`,`${favorable}/${possible+1}`],`Por la regla de Laplace, P = favorables/posibles = ${favorable}/${possible}.`,['probabilidad_laplace','formula',tag])
  }

  if (f === 1) {
    const favorable = d <= 2 ? 3 : (d % 2 === 0 ? 2 : 4)
    const label = favorable === 3 ? 'número par' : favorable === 2 ? 'múltiplo de 3' : 'número mayor que 2'
    return mc(skill,d,seed,`Se lanza un dado normal. ¿Cuál es la probabilidad de obtener un ${label}?`,`${favorable}/6`,[`${6-favorable}/6`,`6/${favorable}`,`${favorable}/5`],`Hay ${favorable} resultados favorables entre 6 caras equiprobables.`,['probabilidad_laplace','dado',tag])
  }

  if (f === 2) {
    const red = ri(2, 5 + d)
    const blue = ri(2, 5 + d)
    const total = red + blue
    return mc(skill,d,seed,`Una bolsa tiene ${red} bolas rojas y ${blue} azules. ¿Cuál es la probabilidad de sacar roja?`,`${red}/${total}`,[`${blue}/${total}`,`${total}/${red}`,`${red}/${blue}`],`Hay ${red} casos favorables de ${total} posibles.`,['probabilidad_laplace','bolsa',tag])
  }

  if (f === 3) {
    const sectors = 6 + d
    const favorable = 2 + (d % 3)
    return mc(skill,d,seed,`Una ruleta tiene ${sectors} sectores iguales y ${favorable} llevan una estrella. ¿Cuál es la probabilidad de caer en estrella?`,`${favorable}/${sectors}`,[`${sectors-favorable}/${sectors}`,`${sectors}/${favorable}`,`${favorable}/${sectors+1}`],`Hay ${favorable} sectores favorables de ${sectors} equiprobables.`,['probabilidad_laplace','ruleta',tag])
  }

  if (f === 4) {
    const red = 2 + d
    const blue = 3 + d
    const green = 1 + Math.floor(d/2)
    const total = red + blue + green
    const favorable = red + blue
    return mc(skill,d,seed,`Una bolsa contiene ${red} rojas, ${blue} azules y ${green} verdes. ¿Cuál es la probabilidad de NO sacar verde?`,`${favorable}/${total}`,[`${green}/${total}`,`${total}/${favorable}`,`${red}/${total}`],`No verde significa roja o azul: ${red}+${blue}=${favorable} casos de ${total}.`,['probabilidad_laplace','complementario',tag])
  }

  if (f === 5) {
    if (d <= 2) return mc(skill,d,seed,'Se lanzan dos monedas equilibradas. ¿Cuál es la probabilidad de obtener exactamente una cara?','2/4',['1/4','3/4','1/2 de 4'],'Los resultados equiprobables son CC, CX, XC y XX; dos tienen exactamente una cara.',['probabilidad_laplace','dos_monedas',tag])
    return mc(skill,d,seed,'Se lanzan tres monedas equilibradas. ¿Cuál es la probabilidad de obtener exactamente tres caras?','1/8',['3/8','1/3','7/8'],'Hay 8 secuencias equiprobables y solo CCC tiene tres caras.',['probabilidad_laplace','tres_monedas',tag])
  }

  if (f === 6) {
    const sum = d <= 2 ? 7 : (d <= 4 ? 8 : 9)
    const favorable = sum === 7 ? 6 : sum === 8 ? 5 : 4
    return mc(skill,d,seed,`Se lanzan dos dados normales. ¿Cuál es la probabilidad de que la suma sea ${sum}?`,`${favorable}/36`,[`${sum}/36`,`${favorable}/12`,`1/36`],`Hay 36 parejas ordenadas equiprobables y ${favorable} de ellas suman ${sum}.`,['probabilidad_laplace','dos_dados',tag])
  }

  if (d <= 2) return mc(skill,d,seed,'¿Cuál de estas probabilidades representa un suceso más probable?','4/6',['1/6','2/6','3/6'],'Con el mismo denominador, una fracción con mayor numerador representa mayor probabilidad.',['probabilidad_laplace','comparar',tag])
  if (d <= 4) return mc(skill,d,seed,'Dos sucesos equiprobables tienen probabilidades 3/8 y 5/8. ¿Cuál es más probable?','El de 5/8',['El de 3/8','Son igual de probables','No puede compararse'],'Tienen el mismo denominador y 5>3, así que 5/8 es mayor.',['probabilidad_laplace','comparar',tag])
  return mc(skill,d,seed,'En una experiencia equiprobable, un suceso tiene probabilidad 7/12. ¿Cuál es la probabilidad de que NO ocurra?','5/12',['7/12','1/12','19/12'],'La probabilidad del complementario es 1−7/12=5/12.',['probabilidad_laplace','complementario','razonamiento',tag])
}

// =========================
// COMPATIBILIDAD CON CLAVES ACTIVAS DE SUPABASE
// Recuperadas para evitar que habilidades activas caigan al fallback.
// =========================

if (key === 'integers_order') {
    const a = -ri(2, 20)
    const b = -ri(2, 20)
    const answer = a > b ? '>' : a < b ? '<' : '='

    return mc(
      skill,
      d,
      seed,
      `Completa: ${a} __ ${b}`,
      answer,
      ['<', '>', '=', '≠'].filter((x) => x !== answer),
      `En la recta numérica, el número que está más a la derecha es mayor.`,
      ['orden_enteros']
    )
  }

if (key === 'absolute_opposite') {
  if (d === 1) {
    const n = ri(2, 20)
    return mc(
      skill, d, seed,
      `¿Cuál es el valor absoluto de -${n}?`,
      String(n),
      [String(-n), '0', String(n + 1)],
      `El valor absoluto es la distancia al 0: |-${n}|=${n}.`,
      ['valor_absoluto']
    )
  }

  if (d === 2) {
    const n = ri(-25, 25) || 7
    return mc(
      skill, d, seed,
      `¿Cuál es el opuesto de ${n}?`,
      String(-n),
      [String(n), '0', String(-n + 1)],
      `El opuesto tiene el mismo valor absoluto y signo contrario: ${-n}.`,
      ['opuesto_enteros']
    )
  }

  if (d === 3) {
    const a = ri(3, 20)
    const b = ri(a + 1, a + 12)
    return mc(
      skill, d, seed,
      `¿Qué número tiene mayor valor absoluto: -${a} o ${b}?`,
      String(b),
      [String(-a), String(a), String(-b)],
      `|-${a}|=${a} y |${b}|=${b}; como ${b}>${a}, el mayor valor absoluto corresponde a ${b}.`,
      ['valor_absoluto', 'comparacion']
    )
  }

  if (d === 4) {
    const n = ri(4, 25)
    return mc(
      skill, d, seed,
      `¿Qué pareja contiene todos los enteros cuyo valor absoluto es ${n}?`,
      `${-n} y ${n}`,
      [
        `${n} y ${n + 1}`,
        `${-n} y ${-(n + 1)}`,
        `0 y ${n}`,
      ],
      `Los dos números situados a distancia ${n} del 0 son ${-n} y ${n}.`,
      ['valor_absoluto', 'simetria']
    )
  }

  const n = ri(5, 30)
  return mc(
    skill, d, seed,
    `¿Cuál es el opuesto de |-${n}|?`,
    String(-n),
    [String(n), '0', String(-(n + 1))],
    `Primero |-${n}|=${n}. El opuesto de ${n} es ${-n}.`,
    ['valor_absoluto', 'opuesto', 'dificultad_alta']
  )
}

if (key === 'integers_mixed') {
    const a = ri(-10, 10)
    const b = ri(2, 8)
    const c = ri(-6, 6)
    const result = a + b * c

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a} + ${b} × (${c})`,
      String(result),
      [
        String((a + b) * c),
        String(a + b + c),
        String(a - b * c),
      ],
      `Primero ${b}×(${c})=${b * c}; después sumamos ${a}.`,
      ['jerarquia_enteros']
    )
  }

if (key === 'algebra_translate') {
    const k = ri(2, 9)

    return mc(
      skill,
      d,
      seed,
      `¿Cómo se escribe "el doble de un número más ${k}"?`,
      `2x + ${k}`,
      [
        `2(x + ${k})`,
        `x + ${k * 2}`,
        `x² + ${k}`,
      ],
      `El doble de x es 2x; después sumamos ${k}.`,
      ['lenguaje_algebraico']
    )
  }

if (key === 'like_terms') {
    const a = ri(2, 7)
    const b = ri(2, 7)

    return mc(
      skill,
      d,
      seed,
      `Simplifica ${a}x + ${b}x`,
      `${a + b}x`,
      [
        `${a * b}x`,
        `${a + b}x²`,
        `${a}x + ${b}`,
      ],
      `Son términos semejantes: (${a}+${b})x = ${a + b}x.`,
      ['terminos_semejantes']
    )
  }

if (key === 'equation_multi_step') {
    const x = ri(2, 8)
    const a = ri(2, 5)
    const b = ri(1, 8)
    const total = a * x + b

    return mc(
      skill,
      d,
      seed,
      `Resuelve ${a}x + ${b} = ${total}`,
      String(x),
      [
        String(total - b),
        String(total / a),
        String(x + 1),
      ],
      `${a}x=${total - b}; x=${total - b}/${a}=${x}.`,
      ['ecuacion_varios_pasos']
    )
  }

if (key === 'equation_check') {
  if (d === 1) {
    const x = ri(2, 12)
    const k = ri(2, 9)
    const total = x + k
    return mc(
      skill, d, seed,
      `¿Es x = ${x} solución de x + ${k} = ${total}?`,
      'Sí',
      ['No', 'Solo si x=0', 'No se puede comprobar'],
      `${x}+${k}=${total}, por tanto sí es solución.`,
      ['comprobar_ecuacion']
    )
  }

  if (d === 2) {
    const solution = ri(2, 12)
    const candidate = solution + ri(1, 3)
    const k = ri(2, 9)
    const total = solution + k
    return mc(
      skill, d, seed,
      `¿Es x = ${candidate} solución de x + ${k} = ${total}?`,
      'No',
      ['Sí', 'Solo si x=0', 'No se puede comprobar'],
      `${candidate}+${k}=${candidate + k}, que no es ${total}.`,
      ['comprobar_ecuacion', 'sustitucion']
    )
  }

  if (d === 3) {
    const x = ri(-6, 10)
    const a = ri(2, 6)
    const b = ri(-8, 8)
    const total = a * x + b
    const isCorrect = ri(0, 1) === 1
    const candidate = isCorrect ? x : x + (x === 0 ? 2 : 1)
    return mc(
      skill, d, seed,
      `¿Es x = ${candidate} solución de ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${total}?`,
      isCorrect ? 'Sí' : 'No',
      [isCorrect ? 'No' : 'Sí', 'No se puede comprobar', 'Solo si x es positivo'],
      `Sustituimos x=${candidate}: el lado izquierdo vale ${a * candidate + b}. ${isCorrect ? 'Coincide' : 'No coincide'} con ${total}.`,
      ['comprobar_ecuacion', 'sustitucion']
    )
  }

  if (d === 4) {
    const x = ri(1, 9)
    const a = ri(2, 5)
    const b = ri(1, 6)
    const total = a * (x + b)
    const isCorrect = ri(0, 1) === 1
    const candidate = isCorrect ? x : x + 1
    return mc(
      skill, d, seed,
      `¿Es x = ${candidate} solución de ${a}(x + ${b}) = ${total}?`,
      isCorrect ? 'Sí' : 'No',
      [isCorrect ? 'No' : 'Sí', 'No se puede comprobar', 'Solo si se elimina el paréntesis'],
      `Al sustituir, el lado izquierdo vale ${a * (candidate + b)}. ${isCorrect ? 'Es igual' : 'No es igual'} a ${total}.`,
      ['comprobar_ecuacion', 'parentesis']
    )
  }

  const x = ri(-5, 8)
  const a = ri(3, 7)
  const c = ri(1, a - 1)
  const b = ri(-6, 6)
  const right = (a - c) * x + b
  const isCorrect = ri(0, 1) === 1
  const candidate = isCorrect ? x : x + 1
  const leftValue = a * candidate + b
  const rightValue = c * candidate + right
  return mc(
    skill, d, seed,
    `¿Es x = ${candidate} solución de ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c}x ${right >= 0 ? '+' : '-'} ${Math.abs(right)}?`,
    isCorrect ? 'Sí' : 'No',
    [isCorrect ? 'No' : 'Sí', 'No se puede comprobar', 'Solo si x=0'],
    `Sustituyendo x=${candidate}, obtenemos ${leftValue} y ${rightValue}. ${isCorrect ? 'Son iguales' : 'No son iguales'}.`,
    ['comprobar_ecuacion', 'ambos_lados', 'dificultad_alta']
  )
}

if (key === 'triangle_sides') {
  if (d === 1) {
    const type = ri(0, 2)
    const a = ri(4, 12)
    const sides =
      type === 0
        ? [a, a, a]
        : type === 1
          ? [a, a, ri(Math.max(2, a - 3), a - 1)]
          : [a, a + 1, a + 2]
    const answer = type === 0 ? 'Equilátero' : type === 1 ? 'Isósceles' : 'Escaleno'
    const prompts = [
      `Un triángulo tiene lados de ${sides[0]} cm, ${sides[1]} cm y ${sides[2]} cm. ¿Cómo se clasifica según sus lados?`,
      `Según sus lados, ¿qué tipo de triángulo tiene medidas ${sides[0]} cm, ${sides[1]} cm y ${sides[2]} cm?`,
      `Observa las longitudes ${sides[0]} cm, ${sides[1]} cm y ${sides[2]} cm. ¿Es equilátero, isósceles o escaleno?`,
      `¿Qué clasificación por lados corresponde al triángulo ${sides[0]}-${sides[1]}-${sides[2]} cm?`,
    ]

    return mc(
      skill, d, seed,
      prompts[ri(0, prompts.length - 1)],
      answer,
      ['Equilátero', 'Isósceles', 'Escaleno', 'No se puede determinar'].filter((x) => x !== answer),
      `Por la igualdad de sus lados, el triángulo es ${answer.toLowerCase()}.`,
      ['clasificacion_triangulos_lados']
    )
  }

  if (d === 2) {
    const variants = [
      ['Tiene los tres lados iguales.', 'Equilátero'],
      ['Tiene exactamente dos lados iguales.', 'Isósceles'],
      ['Tiene los tres lados de distinta longitud.', 'Escaleno'],
    ] as const
    const v = variants[ri(0, variants.length - 1)]
    return mc(
      skill, d, seed,
      `${v[0]} ¿Cómo se clasifica el triángulo según sus lados?`,
      v[1],
      ['Equilátero', 'Isósceles', 'Escaleno', 'Rectángulo'].filter((x) => x !== v[1]),
      `La descripción corresponde a un triángulo ${v[1].toLowerCase()}.`,
      ['clasificacion_triangulos_lados', 'propiedades']
    )
  }

  if (d === 3) {
    const a = ri(5, 12)
    const perimeter = a * 2 + ri(3, a - 1)
    const third = perimeter - 2 * a
    return mc(
      skill, d, seed,
      `Un triángulo tiene dos lados de ${a} cm y un perímetro de ${perimeter} cm. El tercer lado mide ${third} cm. ¿Cómo se clasifica por sus lados?`,
      'Isósceles',
      ['Equilátero', 'Escaleno', 'Rectángulo'],
      `Tiene exactamente dos lados iguales de ${a} cm, por tanto es isósceles.`,
      ['clasificacion_triangulos_lados', 'perimetro']
    )
  }

  if (d === 4) {
    const a = ri(4, 10)
    return mc(
      skill, d, seed,
      `Un triángulo tiene lados ${a} cm, ${a + 1} cm y ${a + 2} cm. ¿Qué afirmación es correcta?`,
      'Es escaleno',
      ['Es equilátero', 'Es isósceles', 'No forma un triángulo'],
      'Los tres lados son diferentes y cumplen la desigualdad triangular, así que es escaleno.',
      ['clasificacion_triangulos_lados', 'razonamiento']
    )
  }

  return mc(
    skill, d, seed,
    '¿Cuál de estas afirmaciones es necesariamente cierta?',
    'Todo triángulo equilátero es también isósceles si entendemos isósceles como “al menos dos lados iguales”',
    [
      'Todo triángulo isósceles es equilátero',
      'Todo triángulo escaleno tiene dos lados iguales',
      'La clasificación por lados depende de los ángulos',
    ],
    'Un equilátero tiene tres lados iguales, así que también tiene al menos dos lados iguales.',
    ['clasificacion_triangulos_lados', 'razonamiento', 'dificultad_alta']
  )
}

if (key === 'triangle_angles') {
  const classify = (angles: [number, number, number]) => {
    const max = Math.max(...angles)
    return max === 90 ? 'Rectángulo' : max > 90 ? 'Obtusángulo' : 'Acutángulo'
  }

  const makeAcute = (): [number, number, number] => {
    const a = ri(45, 70)
    const bMin = Math.max(35, 91 - a)
    const bMax = Math.min(75, 134 - a)
    const b = ri(bMin, Math.max(bMin, bMax))
    return [a, b, 180 - a - b]
  }

  const makeRight = (): [number, number, number] => {
    const a = ri(20, 70)
    return [90, a, 90 - a]
  }

  const makeObtuse = (): [number, number, number] => {
    const a = ri(95, 125)
    const b = ri(20, Math.min(55, 159 - a))
    return [a, b, 180 - a - b]
  }

  const triangleFor = (type: 'Acutángulo' | 'Rectángulo' | 'Obtusángulo') =>
    type === 'Acutángulo' ? makeAcute() : type === 'Rectángulo' ? makeRight() : makeObtuse()

  const allTypes = ['Acutángulo', 'Rectángulo', 'Obtusángulo'] as const
  const formatAngles = (a: [number, number, number]) => `${a[0]}°, ${a[1]}° y ${a[2]}°`

  // 25 familias pedagógicas reales: 5 por nivel de dificultad.
  if (d === 1) {
    const family = ri(0, 4)

    if (family === 0) {
      const answer = allTypes[ri(0, 2)]
      const angles = triangleFor(answer)
      return mc(
        skill, d, seed,
        `Un triángulo tiene ángulos de ${formatAngles(angles)}. ¿Cómo se clasifica según sus ángulos?`,
        answer,
        ['Acutángulo', 'Rectángulo', 'Obtusángulo', 'No se puede determinar'].filter((x) => x !== answer),
        answer === 'Rectángulo'
          ? 'Tiene un ángulo de 90°, por tanto es rectángulo.'
          : answer === 'Obtusángulo'
            ? 'Tiene un ángulo mayor de 90°, por tanto es obtusángulo.'
            : 'Sus tres ángulos son menores de 90°, por tanto es acutángulo.',
        ['clasificacion_triangulos_angulos', 'family:direct_classification']
      )
    }

    if (family === 1) {
      const answer = allTypes[ri(0, 2)]
      const clue = answer === 'Rectángulo'
        ? 'tiene un ángulo recto'
        : answer === 'Obtusángulo'
          ? 'tiene un ángulo mayor de 90°'
          : 'tiene sus tres ángulos menores de 90°'
      return mc(
        skill, d, seed,
        `Un triángulo ${clue}. ¿Cómo se clasifica según sus ángulos?`,
        answer,
        ['Acutángulo', 'Rectángulo', 'Obtusángulo', 'Equilátero'].filter((x) => x !== answer),
        `Esa propiedad define a un triángulo ${answer.toLowerCase()}.`,
        ['clasificacion_triangulos_angulos', 'family:property_to_name']
      )
    }

    if (family === 2) {
      const target = allTypes[ri(0, 2)]
      const correct = triangleFor(target)
      const other1 = triangleFor(allTypes[(allTypes.indexOf(target) + 1) % 3])
      const other2 = triangleFor(allTypes[(allTypes.indexOf(target) + 2) % 3])
      return mc(
        skill, d, seed,
        `¿Cuál de estos conjuntos de ángulos corresponde a un triángulo ${target.toLowerCase()}?`,
        formatAngles(correct),
        [formatAngles(other1), formatAngles(other2), '90°, 90° y 20°'],
        `Un triángulo ${target.toLowerCase()} cumple la propiedad correspondiente a sus ángulos.`,
        ['clasificacion_triangulos_angulos', 'family:choose_example']
      )
    }

    if (family === 3) {
      const target = allTypes[ri(0, 2)]
      const angles = triangleFor(target)
      const largest = Math.max(...angles)
      return mc(
        skill, d, seed,
        `El ángulo mayor de un triángulo mide ${largest}°. ¿Cómo se clasifica el triángulo?`,
        target,
        ['Acutángulo', 'Rectángulo', 'Obtusángulo', 'No se puede determinar'].filter((x) => x !== target),
        `El ángulo mayor mide ${largest}°, así que el triángulo es ${target.toLowerCase()}.`,
        ['clasificacion_triangulos_angulos', 'family:classify_from_maximum']
      )
    }

    const target = allTypes[ri(0, 2)]
    const definition = target === 'Acutángulo'
      ? 'Sus tres ángulos son menores de 90°'
      : target === 'Rectángulo'
        ? 'Tiene exactamente un ángulo de 90°'
        : 'Tiene exactamente un ángulo mayor de 90°'
    return mc(
      skill, d, seed,
      `¿Qué descripción corresponde a un triángulo ${target.toLowerCase()}?`,
      definition,
      [
        'Tiene necesariamente dos ángulos de 90°',
        'Sus tres ángulos son siempre iguales',
        'Su clasificación depende únicamente de la longitud de sus lados',
      ],
      `La descripción correcta de un triángulo ${target.toLowerCase()} se basa en la medida de sus ángulos.`,
      ['clasificacion_triangulos_angulos', 'family:match_definition']
    )
  }

  if (d === 2) {
    const family = ri(0, 4)

    if (family === 0) {
      const answer = allTypes[ri(0, 2)]
      const angles = triangleFor(answer)
      const shuffled = [angles[1], angles[2], angles[0]] as [number, number, number]
      return mc(
        skill, d, seed,
        `Observa los ángulos ${formatAngles(shuffled)}. ¿Qué tipo de triángulo forman?`,
        answer,
        ['Acutángulo', 'Rectángulo', 'Obtusángulo', 'No forman un triángulo'].filter((x) => x !== answer),
        `El mayor ángulo permite clasificarlo como ${answer.toLowerCase()}.`,
        ['clasificacion_triangulos_angulos', 'family:direct_classification']
      )
    }

    if (family === 1) {
      const target = allTypes[ri(0, 2)]
      const correct = triangleFor(target)
      const fmt = (a: [number, number, number]) => `${a[0]}° + ${a[1]}° + ${a[2]}°`
      return mc(
        skill, d, seed,
        `Quieres construir un triángulo ${target.toLowerCase()}. ¿Qué opción elegirías?`,
        fmt(correct),
        [fmt(triangleFor(allTypes[(allTypes.indexOf(target) + 1) % 3])), fmt(triangleFor(allTypes[(allTypes.indexOf(target) + 2) % 3])), '100° + 60° + 40°'],
        `La opción correcta suma 180° y corresponde a un triángulo ${target.toLowerCase()}.`,
        ['clasificacion_triangulos_angulos', 'family:construct_example']
      )
    }

    if (family === 2) {
      const answer = allTypes[ri(0, 2)]
      const angles = triangleFor(answer)
      return mc(
        skill, d, seed,
        `El ángulo mayor de un triángulo mide ${Math.max(...angles)}°. ¿Qué clasificación es compatible con esos ángulos?`,
        answer,
        ['Acutángulo', 'Rectángulo', 'Obtusángulo', 'No se puede determinar'].filter((x) => x !== answer),
        'El ángulo mayor determina si el triángulo es acutángulo, rectángulo u obtusángulo.',
        ['clasificacion_triangulos_angulos', 'family:largest_angle']
      )
    }

    if (family === 3) {
      return mc(
        skill, d, seed,
        'Un alumno afirma que 100°, 50° y 40° son los ángulos de un triángulo obtusángulo. ¿Qué falla en su afirmación?',
        'Los tres ángulos suman más de 180°',
        ['Ningún ángulo es obtuso', 'Todo triángulo obtusángulo debe tener 90°', 'Los ángulos deberían ser todos iguales'],
        'En cualquier triángulo los ángulos interiores suman exactamente 180°.',
        ['clasificacion_triangulos_angulos', 'family:error_detection']
      )
    }

    const answer = allTypes[ri(0, 2)]
    const angles = triangleFor(answer)
    const statements = [
      `El triángulo de ${formatAngles(angles)} es ${answer.toLowerCase()}.`,
      `El triángulo de ${formatAngles(angles)} es siempre equilátero.`,
      `El triángulo de ${formatAngles(angles)} no puede existir.`,
      `La clasificación angular no puede deducirse conociendo los tres ángulos.`,
    ]
    return mc(
      skill, d, seed,
      `¿Cuál de estas afirmaciones sobre el triángulo de ${formatAngles(angles)} es correcta?`,
      statements[0],
      statements.slice(1),
      `La medida de sus tres ángulos permite clasificarlo como ${answer.toLowerCase()}.`,
      ['clasificacion_triangulos_angulos', 'family:select_true_statement']
    )
  }

  if (d === 3) {
    const family = ri(0, 4)

    if (family === 0) {
      const a = ri(30, 70)
      const b = ri(30, 70)
      const c = 180 - a - b
      const answer = classify([a, b, c])
      return mc(
        skill, d, seed,
        `Dos ángulos de un triángulo miden ${a}° y ${b}°. Sin dibujarlo, ¿cómo se clasifica según sus ángulos?`,
        answer,
        ['Acutángulo', 'Rectángulo', 'Obtusángulo', 'No se puede determinar'].filter((x) => x !== answer),
        `El tercer ángulo mide ${c}°. Con ese dato se clasifica como ${answer.toLowerCase()}.`,
        ['clasificacion_triangulos_angulos', 'family:missing_angle_then_classify']
      )
    }

    if (family === 1) {
      const target = allTypes[ri(0, 2)]
      const correct = triangleFor(target)
      const wrongType = allTypes[(allTypes.indexOf(target) + 1) % 3]
      return mc(
        skill, d, seed,
        `¿Qué afirmación clasifica correctamente el triángulo de ángulos ${formatAngles(correct)}?`,
        `Es ${target.toLowerCase()}`,
        [`Es ${wrongType.toLowerCase()}`, 'Es equilátero por sus ángulos', 'No puede existir'],
        `Los ángulos suman 180° y la clasificación correcta es ${target.toLowerCase()}.`,
        ['clasificacion_triangulos_angulos', 'family:verify_statement']
      )
    }

    if (family === 2) {
      const t1 = makeAcute()
      const t2 = makeObtuse()
      return mc(
        skill, d, seed,
        `Compara A = (${t1.join('°, ')}°) y B = (${t2.join('°, ')}°). ¿Cuál es la clasificación correcta?`,
        'A es acutángulo y B es obtusángulo',
        ['A es obtusángulo y B es acutángulo', 'Los dos son rectángulos', 'Los dos son acutángulos'],
        'En A todos los ángulos son menores de 90°. En B hay un ángulo mayor de 90°.',
        ['clasificacion_triangulos_angulos', 'family:compare_triangles']
      )
    }

    if (family === 3) {
      return mc(
        skill, d, seed,
        '¿Cuál de estas condiciones basta por sí sola para asegurar que un triángulo es rectángulo?',
        'Uno de sus ángulos mide 90°',
        ['Dos lados son iguales', 'Un ángulo mide 60°', 'Sus tres ángulos son distintos'],
        'Por definición, un triángulo rectángulo tiene un ángulo de 90°.',
        ['clasificacion_triangulos_angulos', 'family:sufficient_condition']
      )
    }

    const vertex = ri(92, 118)
    const base = (180 - vertex) / 2
    const answer = 'Obtusángulo'
    return mc(
      skill, d, seed,
      `Un triángulo isósceles tiene un ángulo desigual de ${vertex}°. Los otros dos ángulos son iguales. ¿Cómo se clasifica según sus ángulos?`,
      answer,
      ['Acutángulo', 'Rectángulo', 'No se puede determinar'],
      `El ángulo desigual mide ${vertex}°, que es mayor de 90°. Los otros dos miden ${base}° cada uno, así que es obtusángulo.`,
      ['clasificacion_triangulos_angulos', 'family:isosceles_vertex_angle']
    )
  }

  if (d === 4) {
    const family = ri(0, 4)

    if (family === 0) {
      const exterior = ri(100, 150)
      const interior = 180 - exterior
      const other = ri(20, Math.min(70, 159 - interior))
      const third = 180 - interior - other
      const answer = classify([interior, other, third])
      return mc(
        skill, d, seed,
        `Un ángulo exterior de un triángulo mide ${exterior}°. El interior adyacente mide ${interior}° y otro interior mide ${other}°. ¿Cómo se clasifica el triángulo según sus ángulos?`,
        answer,
        ['Acutángulo', 'Rectángulo', 'Obtusángulo', 'No se puede determinar'].filter((x) => x !== answer),
        `El tercer ángulo es ${third}°. Por tanto el triángulo es ${answer.toLowerCase()}.`,
        ['clasificacion_triangulos_angulos', 'family:exterior_angle']
      )
    }

    if (family === 1) {
      return mc(
        skill, d, seed,
        'Un triángulo tiene dos ángulos agudos. ¿Qué podemos concluir sobre su clasificación?',
        'Puede ser acutángulo, rectángulo u obtusángulo',
        ['Tiene que ser acutángulo', 'Tiene que ser rectángulo', 'Tiene que ser obtusángulo'],
        'Todo triángulo tiene al menos dos ángulos agudos; el tercero determina la clasificación.',
        ['clasificacion_triangulos_angulos', 'family:insufficient_information']
      )
    }

    if (family === 2) {
      const angles = makeObtuse()
      return mc(
        skill, d, seed,
        `Un estudiante clasifica como acutángulo un triángulo de ${formatAngles(angles)}. ¿Cómo corregirías su respuesta?`,
        'Es obtusángulo porque tiene un ángulo mayor de 90°',
        ['Es rectángulo porque los ángulos suman 180°', 'Es acutángulo porque dos ángulos son agudos', 'No se puede clasificar'],
        `El ángulo de ${Math.max(...angles)}° es obtuso, así que el triángulo es obtusángulo.`,
        ['clasificacion_triangulos_angulos', 'family:correct_misconception']
      )
    }

    if (family === 3) {
      return mc(
        skill, d, seed,
        '¿Cuál de estas afirmaciones es falsa?',
        'Todo triángulo con dos ángulos agudos es acutángulo',
        ['Un triángulo rectángulo tiene dos ángulos agudos', 'Un triángulo obtusángulo tiene dos ángulos agudos', 'Un triángulo no puede tener dos ángulos obtusos'],
        'Los triángulos rectángulos y obtusángulos también tienen dos ángulos agudos.',
        ['clasificacion_triangulos_angulos', 'family:logic_statement']
      )
    }

    const equal = ri(25, 44)
    const third = 180 - 2 * equal
    const answer = classify([equal, equal, third])
    return mc(
      skill, d, seed,
      `Dos ángulos de un triángulo miden lo mismo: ${equal}° cada uno. ¿Cómo se clasifica el triángulo según sus ángulos?`,
      answer,
      ['Acutángulo', 'Rectángulo', 'Obtusángulo', 'No se puede determinar'].filter((x) => x !== answer),
      `El tercer ángulo mide 180° - 2×${equal}° = ${third}°. Por tanto es ${answer.toLowerCase()}.`,
      ['clasificacion_triangulos_angulos', 'family:equal_angles_deduction']
    )
  }

  const family = ri(0, 4)

  if (family === 0) {
    return mc(
      skill, d, seed,
      '¿Cuál de estas combinaciones es imposible para un triángulo?',
      'Dos ángulos obtusos',
      ['Tres ángulos agudos', 'Un ángulo recto y dos agudos', 'Un ángulo obtuso y dos agudos'],
      'Dos ángulos obtusos sumarían más de 180°, así que no pueden pertenecer al mismo triángulo.',
      ['clasificacion_triangulos_angulos', 'family:impossibility_reasoning']
    )
  }

  if (family === 1) {
    const a = ri(25, 55)
    const b = 90 - a
    return mc(
      skill, d, seed,
      `Un triángulo tiene dos ángulos de ${a}° y ${b}°. ¿Qué dato sobre el tercer ángulo permite clasificarlo sin ambigüedad?`,
      'El tercer ángulo mide 90°',
      ['El tercer ángulo es mayor que 0°', 'Los tres lados son distintos', 'El perímetro es conocido'],
      `Como ${a}+${b}=90°, el tercer ángulo debe ser 90° y el triángulo es rectángulo.`,
      ['clasificacion_triangulos_angulos', 'family:deduction']
    )
  }

  if (family === 2) {
    return mc(
      skill, d, seed,
      '¿Qué relación entre clasificación por lados y por ángulos es siempre correcta?',
      'Un equilátero es siempre acutángulo',
      ['Un isósceles es siempre rectángulo', 'Un escaleno es siempre obtusángulo', 'Un rectángulo es siempre isósceles'],
      'Un triángulo equilátero tiene tres ángulos de 60°, por tanto es acutángulo.',
      ['clasificacion_triangulos_angulos', 'family:connect_classifications']
    )
  }

  if (family === 3) {
    return mc(
      skill, d, seed,
      'Un triángulo no es acutángulo y tampoco es obtusángulo. ¿Qué clasificación angular tiene necesariamente?',
      'Rectángulo',
      ['Acutángulo', 'Obtusángulo', 'No se puede determinar'],
      'Las tres categorías son excluyentes: si no es acutángulo ni obtusángulo, debe ser rectángulo.',
      ['clasificacion_triangulos_angulos', 'family:elimination_reasoning']
    )
  }

  const original = [100, 40, 40] as [number, number, number]
  return mc(
    skill, d, seed,
    `El triángulo A tiene ángulos ${formatAngles(original)}. ¿Qué cambio produciría un triángulo rectángulo manteniendo la suma total de 180°?`,
    'Cambiar los ángulos a 90°, 45° y 45°',
    ['Cambiar los ángulos a 95°, 45° y 40°', 'Cambiar los ángulos a 80°, 60° y 40°', 'Cambiar los ángulos a 100°, 50° y 30°'],
    'Un triángulo rectángulo necesita exactamente un ángulo de 90° y los otros dos deben sumar 90°.',
    ['clasificacion_triangulos_angulos', 'family:transform_classification']
  )
}


if (key === 'triangle_angle_sum') {
  const makeMissing = () => {
    const a = ri(20, 80)
    const b = ri(20, Math.min(100, 150 - a))
    const c = 180 - a - b
    return [a, b, c] as const
  }

  if (d === 1) {
    const family = ri(0, 4)

    if (family === 0) {
      const [a, b, c] = makeMissing()
      return mc(
        skill, d, seed,
        `Dos ángulos de un triángulo miden ${a}° y ${b}°. ¿Cuánto mide el tercero?`,
        `${c}°`,
        [`${a + b}°`, `${c + 10}°`, `${Math.max(5, c - 10)}°`],
        `Los ángulos interiores suman 180°: 180-${a}-${b}=${c}°.` ,
        ['suma_angulos_triangulo', 'family:missing_direct']
      )
    }

    if (family === 1) {
      const [a, b, c] = makeMissing()
      return mc(
        skill, d, seed,
        `¿Cuál de estas ternas puede ser la medida de los tres ángulos de un triángulo?`,
        `${a}°, ${b}° y ${c}°`,
        [`${a}°, ${b}° y ${c + 10}°`, `${a}°, ${b + 20}° y ${c}°`, `${a + 15}°, ${b}° y ${c + 5}°`],
        'Los tres ángulos de un triángulo deben sumar exactamente 180°.',
        ['suma_angulos_triangulo', 'family:valid_triple']
      )
    }

    if (family === 2) {
      return mc(
        skill, d, seed,
        '¿Cuánto suman siempre los tres ángulos interiores de cualquier triángulo?',
        '180°',
        ['90°', '270°', '360°'],
        'La suma de los ángulos interiores de todo triángulo es 180°.',
        ['suma_angulos_triangulo', 'family:sum_rule']
      )
    }

    if (family === 3) {
      const a = ri(25, 70)
      const b = 90 - a
      return mc(
        skill, d, seed,
        `Un triángulo rectángulo tiene un ángulo agudo de ${a}°. ¿Cuánto mide el otro ángulo agudo?`,
        `${b}°`,
        [`${90 + a}°`, `${180 - a}°`, `${a}°`],
        `Como ya hay un ángulo de 90°, los otros dos suman 90°: 90-${a}=${b}°.` ,
        ['suma_angulos_triangulo', 'family:right_triangle_easy']
      )
    }

    const base = ri(40, 80)
    const vertex = 180 - 2 * base
    return mc(
      skill, d, seed,
      `Un triángulo isósceles tiene dos ángulos iguales de ${base}°. ¿Cuánto mide el tercer ángulo?`,
      `${vertex}°`,
      [`${180 - base}°`, `${base}°`, `${vertex + 10}°`],
      `El tercer ángulo es 180-${base}-${base}=${vertex}°.` ,
      ['suma_angulos_triangulo', 'family:isosceles_easy']
    )
  }

  if (d === 2) {
    const family = ri(0, 4)

    if (family === 0) {
      const [a, b, c] = makeMissing()
      return mc(
        skill, d, seed,
        `En un triángulo, dos ángulos miden ${a}° y ${b}°. ¿Qué operación calcula correctamente el tercero?`,
        `180° - ${a}° - ${b}°`,
        [`${a}° + ${b}°`, `180° - ${a}° + ${b}°`, `360° - ${a}° - ${b}°`],
        `El tercero mide ${c}° porque la suma interior debe ser 180°.` ,
        ['suma_angulos_triangulo', 'family:choose_operation']
      )
    }

    if (family === 1) {
      const c = ri(30, 100)
      const remaining = 180 - c
      return mc(
        skill, d, seed,
        `Un triángulo tiene un ángulo de ${c}°. ¿Cuánto deben sumar los otros dos ángulos?`,
        `${remaining}°`,
        [`${c}°`, `${180 + c}°`, `${90 - Math.min(c, 90)}°`],
        `Los otros dos deben sumar 180-${c}=${remaining}°.` ,
        ['suma_angulos_triangulo', 'family:remaining_pair_sum']
      )
    }

    if (family === 2) {
      const equal = ri(35, 75)
      const vertex = 180 - 2 * equal
      return mc(
        skill, d, seed,
        `Un triángulo isósceles tiene dos ángulos iguales. Si cada uno mide ${equal}°, ¿cuánto mide el ángulo desigual?`,
        `${vertex}°`,
        [`${180 - equal}°`, `${equal / 2}°`, `${vertex + equal}°`],
        `El ángulo desigual mide 180-2×${equal}=${vertex}°.` ,
        ['suma_angulos_triangulo', 'family:isosceles_vertex']
      )
    }

    if (family === 3) {
      const first = ri(20, 65)
      const second = ri(20, 65)
      const third = 180 - first - second
      const wrongThird = third + 10
      return mc(
        skill, d, seed,
        `Un alumno afirma que un triángulo con ángulos ${first}°, ${second}° y ${wrongThird}° es posible. ¿Qué ocurre?`,
        'No es posible porque no suman 180°',
        ['Sí es posible', 'Solo sería posible si fuera isósceles', 'Solo sería posible si fuera rectángulo'],
        `La suma es ${first + second + wrongThird}°, no 180°.` ,
        ['suma_angulos_triangulo', 'family:detect_invalid_sum']
      )
    }

    const acute = ri(20, 70)
    const other = 90 - acute
    return mc(
      skill, d, seed,
      `En un triángulo rectángulo, los dos ángulos agudos suman 90°. Si uno mide ${acute}°, ¿cuánto mide el otro?`,
      `${other}°`,
      [`${180 - acute}°`, `${acute}°`, `${90 + acute}°`],
      `90-${acute}=${other}°.` ,
      ['suma_angulos_triangulo', 'family:right_triangle_pair']
    )
  }

  if (d === 3) {
    const family = ri(0, 4)

    if (family === 0) {
      const x = ri(20, 50)
      const y = x + ri(10, 30)
      const z = 180 - x - y
      return mc(
        skill, d, seed,
        `Un triángulo tiene ángulos ${x}°, ${y}° y uno desconocido. ¿Cuál es el desconocido y cómo se clasifica el triángulo por sus ángulos?`,
        `${z}°; ${z === 90 ? 'rectángulo' : z > 90 ? 'obtusángulo' : 'acutángulo'}`,
        [`${x + y}°; acutángulo`, `${180 - y}°; rectángulo`, `${z + 10}°; obtusángulo`],
        `El tercer ángulo es ${z}°. Con ello se determina la clasificación.` ,
        ['suma_angulos_triangulo', 'family:missing_and_classify']
      )
    }

    if (family === 1) {
      const exterior = ri(100, 150)
      const adjacent = 180 - exterior
      const remote1 = ri(20, exterior - 20)
      const remote2 = exterior - remote1
      return mc(
        skill, d, seed,
        `Un ángulo exterior de un triángulo mide ${exterior}°. Uno de los interiores no adyacentes mide ${remote1}°. ¿Cuánto mide el otro interior no adyacente?`,
        `${remote2}°`,
        [`${adjacent}°`, `${180 - remote1}°`, `${remote1}°`],
        `Un ángulo exterior es igual a la suma de los dos interiores no adyacentes: ${exterior}-${remote1}=${remote2}°.` ,
        ['suma_angulos_triangulo', 'family:exterior_remote']
      )
    }

    if (family === 2) {
      const base = ri(30, 70)
      const vertex = 180 - 2 * base
      return mc(
        skill, d, seed,
        `En un triángulo isósceles, el ángulo del vértice mide ${vertex}°. ¿Cuánto mide cada ángulo de la base?`,
        `${base}°`,
        [`${180 - vertex}°`, `${vertex / 2}°`, `${90 - base}°`],
        `Los dos ángulos de la base son iguales y suman ${180 - vertex}°; cada uno mide ${base}°.` ,
        ['suma_angulos_triangulo', 'family:isosceles_base']
      )
    }

    if (family === 3) {
      const a = ri(25, 70)
      let b = ri(25, 70)
      if (b === a) b = b === 70 ? 69 : b + 1
      if (a + b === 90) b = b === 70 ? 69 : b + 1
      const c = 180 - a - b
      return mc(
        skill, d, seed,
        `¿Cuál de estas afirmaciones es necesariamente cierta para un triángulo con dos ángulos de ${a}° y ${b}°?`,
        `El tercer ángulo mide ${c}°`,
        [`El tercer ángulo mide ${a + b}°`, 'El triángulo tiene que ser isósceles', 'El triángulo tiene que ser rectángulo'],
        `La suma interior obliga a que el tercero sea 180-${a}-${b}=${c}°.` ,
        ['suma_angulos_triangulo', 'family:necessary_statement']
      )
    }

    const a = ri(25, 55)
    const b = ri(25, 55)
    const c = 180 - a - b
    return mc(
      skill, d, seed,
      `Un triángulo tiene ángulos ${a}°, ${b}° y ${c}°. Si aumentamos el primero 10°, ¿qué debe ocurrir para que siga siendo un triángulo?`,
      'Disminuir en total 10° entre los otros dos ángulos',
      ['Aumentar también 10° otro ángulo', 'No cambiar ningún otro ángulo', 'Hacer que la suma total sea 190°'],
      'La suma debe seguir siendo 180°, así que cualquier aumento debe compensarse con una disminución igual.' ,
      ['suma_angulos_triangulo', 'family:preserve_sum']
    )
  }

  if (d === 4) {
    const family = ri(0, 4)

    if (family === 0) {
      const x = ri(20, 50)
      const second = 2 * x
      const third = 180 - x - second
      return mc(
        skill, d, seed,
        `En un triángulo, el segundo ángulo mide el doble que el primero. Si el primero mide ${x}°, ¿cuánto mide el tercero?`,
        `${third}°`,
        [`${180 - x}°`, `${x + second}°`, `${third + x}°`],
        `Los dos conocidos suman ${x + second}°. El tercero mide 180-${x + second}=${third}°.` ,
        ['suma_angulos_triangulo', 'family:double_relation']
      )
    }

    if (family === 1) {
      const x = ri(20, 40)
      const second = x + 20
      const third = 180 - x - second
      return mc(
        skill, d, seed,
        `Dos ángulos de un triángulo se diferencian en 20°. El menor mide ${x}°. ¿Cuánto mide el tercero si el otro mide ${second}°?`,
        `${third}°`,
        [`${180 - x}°`, `${x + second}°`, `${third - 20}°`],
        `El tercer ángulo es 180-${x}-${second}=${third}°.` ,
        ['suma_angulos_triangulo', 'family:difference_relation']
      )
    }

    if (family === 2) {
      const exterior = ri(110, 150)
      const adjacent = 180 - exterior
      return mc(
        skill, d, seed,
        `Un ángulo exterior de un triángulo mide ${exterior}°. ¿Cuánto mide el ángulo interior adyacente?`,
        `${adjacent}°`,
        [`${exterior}°`, `${180 + exterior}°`, `${adjacent + 10}°`],
        `Son suplementarios: 180-${exterior}=${adjacent}°.` ,
        ['suma_angulos_triangulo', 'family:exterior_adjacent']
      )
    }

    if (family === 3) {
      const equal = ri(35, 70)
      const vertex = 180 - 2 * equal
      return mc(
        skill, d, seed,
        `Un triángulo isósceles tiene un ángulo exterior en el vértice de ${180 - vertex}°. ¿Cuánto mide cada ángulo de la base?`,
        `${equal}°`,
        [`${vertex}°`, `${180 - equal}°`, `${equal / 2}°`],
        `El ángulo interior del vértice es ${vertex}°. Los otros dos son iguales y miden ${equal}° cada uno.` ,
        ['suma_angulos_triangulo', 'family:isosceles_exterior']
      )
    }

    const a = ri(20, 60)
    const b = ri(20, 60)
    const c = 180 - a - b
    return mc(
      skill, d, seed,
      `Un alumno calcula el tercer ángulo como 180-${a}=${180 - a}°, olvidando restar también ${b}°. ¿Cuál debería ser el resultado correcto?`,
      `${c}°`,
      [`${180 - a}°`, `${a + b}°`, `${180 - b}°`],
      `Hay que restar los dos ángulos conocidos: 180-${a}-${b}=${c}°.` ,
      ['suma_angulos_triangulo', 'family:spot_calculation_error']
    )
  }

  const family = ri(0, 4)

  if (family === 0) {
    const x = ri(20, 40)
    const second = 2 * x
    const third = 180 - 3 * x
    return mc(
      skill, d, seed,
      `Los ángulos de un triángulo son x, 2x y ${third}°. Si x=${x}°, ¿qué comprobación demuestra que los datos son coherentes?`,
      `${x}+${second}+${third}=180°`,
      [`${x}+${second}=180°`, `${second}+${third}=90°`, `${x}+${third}=180°`],
      'La comprobación correcta es verificar que los tres ángulos suman 180°.',
      ['suma_angulos_triangulo', 'family:algebraic_check']
    )
  }

  if (family === 1) {
    const ratioA = 2
    const ratioB = 3
    const ratioC = 4
    const unit = 180 / (ratioA + ratioB + ratioC)
    return mc(
      skill, d, seed,
      'Los ángulos de un triángulo están en razón 2:3:4. ¿Cuánto mide el ángulo mayor?',
      `${ratioC * unit}°`,
      [`${ratioA * unit}°`, `${ratioB * unit}°`, '90°'],
      `Hay 9 partes en total; cada parte mide 20°. El mayor ocupa 4 partes: 80°.` ,
      ['suma_angulos_triangulo', 'family:ratio_angles']
    )
  }

  if (family === 2) {
    return mc(
      skill, d, seed,
      '¿Cuál de estas situaciones es imposible en un triángulo?',
      'Tener dos ángulos de 100°',
      ['Tener dos ángulos de 40°', 'Tener un ángulo de 90°', 'Tener tres ángulos de 60°'],
      'Dos ángulos de 100° ya sumarían 200°, superando los 180° totales.' ,
      ['suma_angulos_triangulo', 'family:impossibility_reasoning']
    )
  }

  if (family === 3) {
    const a = ri(25, 60)
    const b = ri(25, 60)
    const c = 180 - a - b
    return mc(
      skill, d, seed,
      `Un triángulo tiene ángulos ${a}°, ${b}° y ${c}°. Se aumenta el primero 15° y se reduce el tercero 15°. ¿Qué ocurre con la suma total?`,
      'Sigue siendo 180°',
      ['Pasa a 195°', 'Pasa a 165°', 'No se puede saber'],
      'Los cambios +15° y -15° se compensan; la suma sigue siendo 180°.' ,
      ['suma_angulos_triangulo', 'family:compensating_changes']
    )
  }

  const exterior = ri(110, 150)
  const remote1 = ri(20, exterior - 20)
  const remote2 = exterior - remote1
  const adjacent = 180 - exterior
  return mc(
    skill, d, seed,
    `Un ángulo exterior mide ${exterior}° y uno de los interiores no adyacentes mide ${remote1}°. ¿Qué pareja de medidas completa correctamente el triángulo?`,
    `${remote2}° para el otro remoto y ${adjacent}° para el adyacente`,
    [`${adjacent}° y ${remote2}°`, `${exterior}° y ${adjacent}°`, `${remote1}° y ${180 - remote1}°`],
    `El otro remoto mide ${exterior}-${remote1}=${remote2}° y el adyacente mide 180-${exterior}=${adjacent}°.` ,
    ['suma_angulos_triangulo', 'family:combined_exterior']
  )
}

if (key === 'quadrilaterals') {
  const variants = [
    {
      clue: 'Tiene cuatro lados iguales y cuatro ángulos rectos.',
      answer: 'Cuadrado',
      solution: 'Un cuadrado tiene cuatro lados iguales y cuatro ángulos de 90°.',
    },
    {
      clue: 'Tiene cuatro ángulos rectos y sus lados opuestos son iguales.',
      answer: 'Rectángulo',
      solution: 'Un rectángulo tiene cuatro ángulos rectos y lados opuestos iguales.',
    },
    {
      clue: 'Tiene cuatro lados iguales, pero no necesariamente cuatro ángulos rectos.',
      answer: 'Rombo',
      solution: 'Un rombo se caracteriza por tener sus cuatro lados iguales.',
    },
    {
      clue: 'Tiene solamente un par de lados paralelos.',
      answer: 'Trapecio',
      solution: 'Un trapecio tiene un par de lados paralelos.',
    },
  ]

  const v = variants[seed % variants.length]

  return mc(
    skill,
    d,
    seed,
    `${v.clue} ¿Qué cuadrilátero es?`,
    v.answer,
    ['Cuadrado', 'Rectángulo', 'Rombo', 'Trapecio'].filter(x => x !== v.answer),
    v.solution,
    ['cuadrilateros']
  )
}

if (key === 'regular_polygons') {
  const family = ri(0, 4)

  if (d === 1) {
    if (family === 0) {
      const variants = [
        [3, 'Triángulo'],
        [4, 'Cuadrilátero'],
        [5, 'Pentágono'],
        [6, 'Hexágono'],
        [8, 'Octógono'],
      ] as const
      const v = variants[ri(0, variants.length - 1)]
      return mc(
        skill, d, seed,
        `Un polígono tiene ${v[0]} lados. ¿Cómo se llama?`,
        v[1],
        ['Triángulo', 'Cuadrilátero', 'Pentágono', 'Hexágono', 'Octógono']
          .filter((x) => x !== v[1]).slice(0, 3),
        `Un polígono de ${v[0]} lados se llama ${v[1].toLowerCase()}.`,
        ['poligonos_regulares', 'family:nombre_por_lados']
      )
    }

    if (family === 1) {
      const variants = [
        ['Pentágono', 5], ['Hexágono', 6], ['Octógono', 8], ['Triángulo', 3],
      ] as const
      const v = variants[ri(0, variants.length - 1)]
      return mc(
        skill, d, seed,
        `¿Cuántos lados tiene un ${v[0].toLowerCase()}?`,
        String(v[1]),
        [String(Math.max(2, v[1] - 1)), String(v[1] + 1), String(v[1] + 2)],
        `Un ${v[0].toLowerCase()} tiene ${v[1]} lados.`,
        ['poligonos_regulares', 'family:lados_por_nombre']
      )
    }

    if (family === 2) {
      return mc(
        skill, d, seed,
        '¿Qué significa que un polígono sea regular?',
        'Que todos sus lados y todos sus ángulos son iguales',
        [
          'Que solo sus lados son iguales',
          'Que todos sus ángulos son rectos',
          'Que tiene exactamente cuatro lados',
        ],
        'En un polígono regular son iguales todos los lados y todos los ángulos interiores.',
        ['poligonos_regulares', 'family:definicion_regular']
      )
    }

    if (family === 3) {
      return mc(
        skill, d, seed,
        '¿Cuál de estas figuras es necesariamente un polígono regular?',
        'Un cuadrado',
        ['Un rectángulo no cuadrado', 'Un triángulo escaleno', 'Un trapecio'],
        'El cuadrado tiene todos sus lados iguales y todos sus ángulos iguales.',
        ['poligonos_regulares', 'family:identificar_regular']
      )
    }

    return mc(
      skill, d, seed,
      'Un triángulo tiene sus tres lados iguales. ¿Qué podemos afirmar?',
      'Es equilátero y regular',
      ['Es escaleno', 'Es rectángulo necesariamente', 'No puede ser regular'],
      'Un triángulo equilátero tiene tres lados y tres ángulos iguales.',
      ['poligonos_regulares', 'family:triangulo_regular']
    )
  }

  if (d === 2) {
    if (family === 0) {
      const sides = [3, 4, 5, 6, 8][ri(0, 4)]
      const side = ri(2, 8)
      const perimeter = sides * side
      return mc(
        skill, d, seed,
        `Un polígono regular de ${sides} lados tiene cada lado de ${side} cm. ¿Cuál es su perímetro?`,
        `${perimeter} cm`,
        [`${sides + side} cm`, `${side * 2} cm`, `${perimeter + side} cm`],
        `Perímetro = ${sides}×${side}=${perimeter} cm.`,
        ['poligonos_regulares', 'family:perimetro_directo']
      )
    }

    if (family === 1) {
      const sides = [3, 4, 5, 6, 8][ri(0, 4)]
      const side = ri(2, 8)
      const perimeter = sides * side
      return mc(
        skill, d, seed,
        `Un polígono regular de ${sides} lados tiene perímetro ${perimeter} cm. ¿Cuánto mide cada lado?`,
        `${side} cm`,
        [`${perimeter - sides} cm`, `${sides} cm`, `${side * 2} cm`],
        `Cada lado mide ${perimeter}÷${sides}=${side} cm.`,
        ['poligonos_regulares', 'family:lado_desde_perimetro']
      )
    }

    if (family === 2) {
      const sides = [4, 5, 6, 8][ri(0, 3)]
      const sideA = ri(2, 6)
      const sideB = sideA + ri(1, 3)
      return mc(
        skill, d, seed,
        `Dos polígonos regulares tienen ${sides} lados. Uno tiene lado ${sideA} cm y el otro ${sideB} cm. ¿Cuál tiene mayor perímetro?`,
        `El de lado ${sideB} cm`,
        [`El de lado ${sideA} cm`, 'Tienen el mismo perímetro', 'No se puede saber'],
        'Con el mismo número de lados, el que tiene lados más largos tiene mayor perímetro.',
        ['poligonos_regulares', 'family:comparar_perimetros']
      )
    }

    if (family === 3) {
      const sides = [4, 5, 6, 8][ri(0, 3)]
      const increase = ri(1, 3)
      return mc(
        skill, d, seed,
        `Cada lado de un polígono regular de ${sides} lados aumenta ${increase} cm. ¿Cuánto aumenta su perímetro?`,
        `${sides * increase} cm`,
        [`${increase} cm`, `${sides + increase} cm`, `${sides * increase + increase} cm`],
        `El aumento total es ${sides}×${increase}=${sides * increase} cm.`,
        ['poligonos_regulares', 'family:cambio_perimetro']
      )
    }

    return mc(
      skill, d, seed,
      'Un cuadrilátero tiene sus cuatro lados iguales, pero sus ángulos no son todos iguales. ¿Es regular?',
      'No',
      ['Sí', 'Solo si tiene una diagonal', 'Solo si su perímetro es entero'],
      'Para ser regular deben ser iguales tanto los lados como los ángulos.',
      ['poligonos_regulares', 'family:regularidad_dos_condiciones']
    )
  }

  if (d === 3) {
    if (family === 0) {
      const choices = [
        [3, 60], [4, 90], [6, 120],
      ] as const
      const v = choices[ri(0, choices.length - 1)]
      return mc(
        skill, d, seed,
        `¿Cuánto mide cada ángulo interior de un ${v[0] === 3 ? 'triángulo equilátero' : v[0] === 4 ? 'cuadrado' : 'hexágono regular'}?`,
        `${v[1]}°`,
        [`${180 - v[1]}°`, `${v[1] - 20}°`, `${Math.min(170, v[1] + 20)}°`],
        `En esa figura regular, cada ángulo interior mide ${v[1]}°.`,
        ['poligonos_regulares', 'family:angulo_interior_familiar']
      )
    }

    if (family === 1) {
      const choices = [
        [4, 90], [6, 60], [8, 45],
      ] as const
      const v = choices[ri(0, choices.length - 1)]
      return mc(
        skill, d, seed,
        `¿Cuánto mide cada ángulo exterior de un polígono regular de ${v[0]} lados?`,
        `${v[1]}°`,
        [`${180 - v[1]}°`, `${v[1] + 15}°`, `${Math.max(10, v[1] - 15)}°`],
        `Los ángulos exteriores suman 360°: 360÷${v[0]}=${v[1]}°.`,
        ['poligonos_regulares', 'family:exterior_basico']
      )
    }

    if (family === 2) {
      const choices = [
        [4, 90], [6, 60], [8, 45],
      ] as const
      const v = choices[ri(0, choices.length - 1)]
      return mc(
        skill, d, seed,
        `Un polígono regular de ${v[0]} lados se divide desde el centro en ${v[0]} partes iguales. ¿Cuánto mide cada ángulo central?`,
        `${v[1]}°`,
        [`${180 - v[1]}°`, `${v[1] * 2}°`, `${v[1] / 2}°`],
        `Una vuelta son 360°: 360÷${v[0]}=${v[1]}°.`,
        ['poligonos_regulares', 'family:central_basico']
      )
    }

    if (family === 3) {
      const sides = [4, 5, 6, 8][ri(0, 3)]
      const side = ri(3, 8)
      const perimeter = sides * side
      return mc(
        skill, d, seed,
        `Un polígono regular de ${sides} lados tiene perímetro ${perimeter} cm. Si todos sus lados son iguales, ¿cuánto mide uno?`,
        `${side} cm`,
        [`${perimeter - sides} cm`, `${side + 1} cm`, `${sides} cm`],
        `Dividimos el perímetro entre los ${sides} lados: ${perimeter}÷${sides}=${side} cm.`,
        ['poligonos_regulares', 'family:perimetro_inverso_medio']
      )
    }

    return mc(
      skill, d, seed,
      '¿Cuál de estas afirmaciones es correcta?',
      'En un polígono regular, todos los ángulos exteriores tienen la misma medida',
      [
        'Todos los polígonos regulares tienen cuatro lados',
        'Todos los ángulos interiores de cualquier polígono regular miden 90°',
        'Un polígono regular puede tener lados de distinta longitud',
      ],
      'La regularidad implica igualdad de lados y de ángulos correspondientes.',
      ['poligonos_regulares', 'family:propiedad_media']
    )
  }

  if (d === 4) {
    if (family === 0) {
      const sides = ri(5, 10)
      const sum = (sides - 2) * 180
      return mc(
        skill, d, seed,
        `¿Cuánto suman los ángulos interiores de un polígono de ${sides} lados?`,
        `${sum}°`,
        [`${sides * 180}°`, `${(sides - 1) * 180}°`, `${sum + 180}°`],
        `La suma es (${sides}-2)×180=${sum}°.`,
        ['poligonos_regulares', 'family:suma_angulos']
      )
    }

    if (family === 1) {
      const choices = [
        [5, 72], [6, 60], [8, 45], [9, 40], [10, 36], [12, 30],
      ] as const
      const v = choices[ri(0, choices.length - 1)]
      return mc(
        skill, d, seed,
        `Cada ángulo exterior de un polígono regular mide ${v[1]}°. ¿Cuántos lados tiene?`,
        String(v[0]),
        [String(v[0] - 1), String(v[0] + 1), String(v[0] + 2)],
        `Número de lados = 360÷${v[1]}=${v[0]}.`,
        ['poligonos_regulares', 'family:lados_desde_exterior']
      )
    }

    if (family === 2) {
      const choices = [
        [5, 108], [6, 120], [8, 135], [10, 144], [12, 150],
      ] as const
      const v = choices[ri(0, choices.length - 1)]
      return mc(
        skill, d, seed,
        `Cada ángulo interior de un polígono regular mide ${v[1]}°. ¿Cuántos lados tiene?`,
        String(v[0]),
        [String(v[0] - 1), String(v[0] + 1), String(v[0] + 3)],
        `El exterior mide 180-${v[1]}=${180 - v[1]}°. Entonces n=360÷${180 - v[1]}=${v[0]}.`,
        ['poligonos_regulares', 'family:lados_desde_interior']
      )
    }

    if (family === 3) {
      const sides = ri(5, 10)
      const diagonalsFromVertex = sides - 3
      return mc(
        skill, d, seed,
        `Desde un vértice de un polígono de ${sides} lados, ¿cuántas diagonales se pueden trazar?`,
        String(diagonalsFromVertex),
        [String(sides - 2), String(sides - 1), String(sides)],
        `No se une consigo mismo ni con los dos vértices vecinos: ${sides}-3=${diagonalsFromVertex}.`,
        ['poligonos_regulares', 'family:diagonales_desde_vertice']
      )
    }

    const sides = ri(5, 9)
    const side = ri(4, 10)
    const perimeter = sides * side
    const newSide = side + 2
    const newPerimeter = sides * newSide
    return mc(
      skill, d, seed,
      `Un polígono regular de ${sides} lados tiene perímetro ${perimeter} cm. Si cada lado aumenta 2 cm, ¿cuál será el nuevo perímetro?`,
      `${newPerimeter} cm`,
      [`${perimeter + 2} cm`, `${perimeter + sides} cm`, `${newSide * 2} cm`],
      `El lado inicial mide ${side} cm y pasa a ${newSide} cm. Nuevo perímetro: ${sides}×${newSide}=${newPerimeter} cm.`,
      ['poligonos_regulares', 'family:perimetro_dos_pasos']
    )
  }

  if (family === 0) {
    const sides = ri(5, 10)
    const diagonals = (sides * (sides - 3)) / 2
    return mc(
      skill, d, seed,
      `¿Cuántas diagonales tiene en total un polígono de ${sides} lados?`,
      String(diagonals),
      [String(sides - 3), String(sides * (sides - 3)), String(diagonals + sides)],
      `Diagonales = n(n-3)/2 = ${sides}×${sides - 3}÷2=${diagonals}.`,
      ['poligonos_regulares', 'family:diagonales_totales', 'dificultad_alta']
    )
  }

  if (family === 1) {
    const choices = [
      [5, 5], [6, 9], [7, 14], [8, 20], [9, 27], [10, 35],
    ] as const
    const v = choices[ri(0, choices.length - 1)]
    return mc(
      skill, d, seed,
      `Un polígono tiene ${v[1]} diagonales. ¿Cuántos lados tiene?`,
      String(v[0]),
      [String(v[0] - 1), String(v[0] + 1), String(v[0] + 2)],
      `Con n=${v[0]}, n(n-3)/2=${v[1]}.`,
      ['poligonos_regulares', 'family:lados_desde_diagonales', 'dificultad_alta']
    )
  }

  if (family === 2) {
    const n1 = ri(5, 8)
    const n2 = n1 + ri(1, 3)
    const d1 = (n1 * (n1 - 3)) / 2
    const d2 = (n2 * (n2 - 3)) / 2
    return mc(
      skill, d, seed,
      `¿Cuántas diagonales más tiene un polígono de ${n2} lados que uno de ${n1} lados?`,
      String(d2 - d1),
      [String(n2 - n1), String(d2), String(d1)],
      `Tienen ${d2} y ${d1} diagonales; la diferencia es ${d2 - d1}.`,
      ['poligonos_regulares', 'family:comparar_diagonales', 'dificultad_alta']
    )
  }

  if (family === 3) {
    const choices = [
      [5, 72], [6, 60], [8, 45], [9, 40], [10, 36], [12, 30],
    ] as const
    const v = choices[ri(0, choices.length - 1)]
    const side = ri(4, 9)
    const perimeter = v[0] * side
    return mc(
      skill, d, seed,
      `Un polígono regular tiene ángulo central de ${v[1]}° y cada lado mide ${side} cm. ¿Cuál es su perímetro?`,
      `${perimeter} cm`,
      [`${side * 2} cm`, `${perimeter + side} cm`, `${v[0] + side} cm`],
      `Tiene 360÷${v[1]}=${v[0]} lados. Perímetro=${v[0]}×${side}=${perimeter} cm.`,
      ['poligonos_regulares', 'family:central_y_perimetro', 'dificultad_alta']
    )
  }

  return mc(
    skill, d, seed,
    '¿Cuál de estas afirmaciones sobre polígonos regulares es siempre cierta?',
    'La suma de sus ángulos exteriores, tomando uno por vértice, es 360°',
    [
      'Todos sus ángulos interiores miden 90°',
      'Todos tienen el mismo número de diagonales que de lados',
      'Su perímetro siempre es 360 unidades',
    ],
    'Al recorrer un polígono completo, los giros exteriores suman una vuelta: 360°.',
    ['poligonos_regulares', 'family:razonamiento_exteriores', 'dificultad_alta']
  )
}
if (key === 'geometry_classification') {
  type ClassificationVariant = {
    prompt: string
    answer: string
    distractors: string[]
    solution: string
    tag: string
  }

  const variantsByDifficulty: Record<number, ClassificationVariant[]> = {
    1: [
      {
        prompt: 'Una figura tiene 4 lados iguales y 4 ángulos rectos. ¿Cuál es la clasificación más precisa?',
        answer: 'Cuadrado',
        distractors: ['Rectángulo', 'Rombo', 'Trapecio'],
        solution: 'Cuatro lados iguales y cuatro ángulos rectos definen un cuadrado.',
        tag: 'cuadrado_basico',
      },
      {
        prompt: 'Una figura tiene 4 ángulos rectos y sus lados opuestos son iguales. ¿Cuál es?',
        answer: 'Rectángulo',
        distractors: ['Rombo', 'Trapecio', 'Triángulo'],
        solution: 'Un cuadrilátero con cuatro ángulos rectos es un rectángulo.',
        tag: 'rectangulo_basico',
      },
      {
        prompt: 'Un triángulo tiene exactamente dos lados iguales. ¿Cómo se clasifica por sus lados?',
        answer: 'Isósceles',
        distractors: ['Equilátero', 'Escaleno', 'Rectángulo'],
        solution: 'Un triángulo con exactamente dos lados iguales es isósceles.',
        tag: 'isosceles_basico',
      },
      {
        prompt: 'Un triángulo tiene sus tres lados diferentes. ¿Cómo se clasifica por sus lados?',
        answer: 'Escaleno',
        distractors: ['Equilátero', 'Isósceles', 'Rectángulo'],
        solution: 'Si los tres lados son distintos, es escaleno.',
        tag: 'escaleno_basico',
      },
      {
        prompt: 'Un triángulo tiene sus tres lados iguales. ¿Cómo se clasifica por sus lados?',
        answer: 'Equilátero',
        distractors: ['Isósceles', 'Escaleno', 'Rectángulo'],
        solution: 'Tres lados iguales definen un triángulo equilátero.',
        tag: 'equilatero_basico',
      },
      {
        prompt: 'Una figura tiene un solo par de lados paralelos. ¿Qué cuadrilátero es?',
        answer: 'Trapecio',
        distractors: ['Cuadrado', 'Rombo', 'Rectángulo'],
        solution: 'Un cuadrilátero con un solo par de lados paralelos es un trapecio.',
        tag: 'trapecio_basico',
      },
      {
        prompt: 'Una figura tiene cuatro lados iguales, pero no todos sus ángulos son rectos. ¿Cuál puede ser?',
        answer: 'Rombo',
        distractors: ['Rectángulo', 'Trapecio', 'Triángulo'],
        solution: 'Un rombo tiene cuatro lados iguales y no necesita cuatro ángulos rectos.',
        tag: 'rombo_basico',
      },
      {
        prompt: '¿Cuál de estas figuras tiene exactamente tres lados?',
        answer: 'Triángulo',
        distractors: ['Cuadrado', 'Pentágono', 'Trapecio'],
        solution: 'Todo triángulo tiene exactamente tres lados.',
        tag: 'tres_lados',
      },
      {
        prompt: '¿Cuál de estas figuras tiene cuatro lados?',
        answer: 'Cuadrilátero',
        distractors: ['Triángulo', 'Pentágono', 'Hexágono'],
        solution: 'Los cuadriláteros tienen cuatro lados.',
        tag: 'cuatro_lados',
      },
      {
        prompt: '¿Qué figura tiene cuatro lados iguales y puede no tener ángulos rectos?',
        answer: 'Rombo',
        distractors: ['Rectángulo', 'Trapecio', 'Triángulo'],
        solution: 'La propiedad característica indicada es la de un rombo.',
        tag: 'rombo_definicion',
      },
    ],
    2: [
      {
        prompt: 'Un triángulo tiene un ángulo de 90°. ¿Cómo se clasifica según sus ángulos?',
        answer: 'Rectángulo',
        distractors: ['Acutángulo', 'Obtusángulo', 'Equilátero'],
        solution: 'Un triángulo con un ángulo de 90° es rectángulo.',
        tag: 'triangulo_rectangulo',
      },
      {
        prompt: 'Un triángulo tiene un ángulo de 120°. ¿Cómo se clasifica según sus ángulos?',
        answer: 'Obtusángulo',
        distractors: ['Acutángulo', 'Rectángulo', 'Equilátero'],
        solution: 'Al tener un ángulo mayor de 90°, es obtusángulo.',
        tag: 'triangulo_obtuso',
      },
      {
        prompt: 'Un triángulo tiene sus tres ángulos menores de 90°. ¿Cómo se clasifica?',
        answer: 'Acutángulo',
        distractors: ['Rectángulo', 'Obtusángulo', 'Escaleno'],
        solution: 'Si los tres ángulos son agudos, el triángulo es acutángulo.',
        tag: 'triangulo_agudo',
      },
      {
        prompt: 'Una figura tiene dos pares de lados opuestos paralelos y cuatro ángulos rectos. ¿Cuál puede ser?',
        answer: 'Rectángulo',
        distractors: ['Trapecio', 'Triángulo', 'Pentágono'],
        solution: 'Un rectángulo tiene dos pares de lados paralelos y cuatro ángulos rectos.',
        tag: 'rectangulo_propiedades',
      },
      {
        prompt: '¿Cuál de estas descripciones corresponde a un cuadrado?',
        answer: 'Cuatro lados iguales y cuatro ángulos rectos',
        distractors: ['Dos lados iguales y un ángulo recto', 'Un solo par de lados paralelos', 'Tres lados iguales'],
        solution: 'Un cuadrado tiene cuatro lados iguales y cuatro ángulos rectos.',
        tag: 'describir_cuadrado',
      },
      {
        prompt: '¿Cuál de estas descripciones corresponde a un rombo?',
        answer: 'Cuatro lados iguales',
        distractors: ['Exactamente tres lados', 'Cuatro ángulos rectos obligatoriamente', 'Un solo par de lados paralelos'],
        solution: 'La propiedad básica de un rombo es tener cuatro lados iguales.',
        tag: 'describir_rombo',
      },
      {
        prompt: 'Un triángulo tiene ángulos de 50°, 60° y 70°. ¿Cómo se clasifica según sus ángulos?',
        answer: 'Acutángulo',
        distractors: ['Rectángulo', 'Obtusángulo', 'Equilátero'],
        solution: 'Los tres ángulos son menores de 90°.',
        tag: 'angulos_50_60_70',
      },
      {
        prompt: 'Un triángulo tiene ángulos de 30°, 60° y 90°. ¿Cómo se clasifica según sus ángulos?',
        answer: 'Rectángulo',
        distractors: ['Acutángulo', 'Obtusángulo', 'Isósceles'],
        solution: 'Tiene un ángulo de 90°, así que es rectángulo.',
        tag: 'angulos_30_60_90',
      },
      {
        prompt: 'Un triángulo tiene ángulos de 100°, 40° y 40°. ¿Cómo se clasifica según sus ángulos?',
        answer: 'Obtusángulo',
        distractors: ['Acutángulo', 'Rectángulo', 'Equilátero'],
        solution: 'Tiene un ángulo de 100°, mayor de 90°.',
        tag: 'angulos_100_40_40',
      },
      {
        prompt: 'Un cuadrilátero tiene dos pares de lados paralelos y cuatro lados iguales. ¿Cuál puede ser?',
        answer: 'Rombo',
        distractors: ['Trapecio', 'Triángulo', 'Pentágono'],
        solution: 'Cuatro lados iguales y lados opuestos paralelos describen un rombo.',
        tag: 'rombo_paralelos',
      },
    ],
    3: [
      {
        prompt: '¿Cuál de estas afirmaciones es correcta?',
        answer: 'Todo cuadrado es también un rectángulo',
        distractors: ['Todo rectángulo es un cuadrado', 'Todo rombo tiene cuatro ángulos rectos', 'Todo trapecio tiene cuatro lados iguales'],
        solution: 'Un cuadrado cumple todas las propiedades de un rectángulo.',
        tag: 'inclusion_cuadrado_rectangulo',
      },
      {
        prompt: '¿Cuál de estas afirmaciones es correcta sobre un cuadrado?',
        answer: 'También puede clasificarse como rombo',
        distractors: ['Nunca es un rectángulo', 'Tiene solo un par de lados paralelos', 'Sus lados no tienen por qué ser iguales'],
        solution: 'Tiene cuatro lados iguales, por lo que también cumple la definición de rombo.',
        tag: 'inclusion_cuadrado_rombo',
      },
      {
        prompt: 'Un cuadrilátero tiene cuatro lados iguales y cuatro ángulos rectos. ¿Qué nombre es el más específico?',
        answer: 'Cuadrado',
        distractors: ['Rombo', 'Rectángulo', 'Paralelogramo'],
        solution: 'Aunque cumple varias categorías, cuadrado es la más específica.',
        tag: 'nombre_mas_especifico',
      },
      {
        prompt: 'Un triángulo tiene lados 5 cm, 5 cm y 8 cm. ¿Cuál es su clasificación por lados?',
        answer: 'Isósceles',
        distractors: ['Equilátero', 'Escaleno', 'Rectángulo'],
        solution: 'Tiene exactamente dos lados iguales.',
        tag: 'clasificar_lados_5_5_8',
      },
      {
        prompt: 'Un triángulo tiene lados 4 cm, 5 cm y 6 cm. ¿Cómo se clasifica por sus lados?',
        answer: 'Escaleno',
        distractors: ['Equilátero', 'Isósceles', 'Rectángulo'],
        solution: 'Los tres lados tienen longitudes distintas.',
        tag: 'clasificar_lados_4_5_6',
      },
      {
        prompt: 'Un triángulo tiene ángulos 45°, 45° y 90°. ¿Cuál es su clasificación completa?',
        answer: 'Isósceles rectángulo',
        distractors: ['Escaleno rectángulo', 'Equilátero acutángulo', 'Isósceles obtusángulo'],
        solution: 'Tiene dos ángulos iguales y uno recto.',
        tag: 'isosceles_rectangulo',
      },
      {
        prompt: '¿Qué propiedad basta para asegurar que un triángulo es equilátero?',
        answer: 'Que sus tres lados sean iguales',
        distractors: ['Que tenga dos lados iguales', 'Que tenga un ángulo recto', 'Que tenga dos ángulos agudos'],
        solution: 'Tres lados iguales definen un triángulo equilátero.',
        tag: 'condicion_equilatero',
      },
      {
        prompt: '¿Qué propiedad basta para asegurar que un cuadrilátero es un rectángulo?',
        answer: 'Que tenga cuatro ángulos rectos',
        distractors: ['Que tenga dos lados iguales', 'Que tenga cuatro lados', 'Que tenga una diagonal'],
        solution: 'Un cuadrilátero con cuatro ángulos rectos es un rectángulo.',
        tag: 'condicion_rectangulo',
      },
      {
        prompt: 'Un cuadrado comparte con un rectángulo la propiedad de...',
        answer: 'Tener cuatro ángulos rectos',
        distractors: ['Tener siempre cuatro lados de distinta longitud', 'Tener un solo par de lados paralelos', 'Tener tres vértices'],
        solution: 'Ambos tienen cuatro ángulos de 90°.',
        tag: 'propiedad_comun_rectangulo',
      },
      {
        prompt: 'Un cuadrado comparte con un rombo la propiedad de...',
        answer: 'Tener cuatro lados iguales',
        distractors: ['Tener siempre cuatro ángulos rectos', 'Tener un solo par de lados paralelos', 'Tener tres lados'],
        solution: 'Tanto cuadrado como rombo tienen cuatro lados iguales.',
        tag: 'propiedad_comun_rombo',
      },
    ],
    4: [
      {
        prompt: 'Una figura tiene cuatro lados iguales, lados opuestos paralelos y ningún ángulo recto. ¿Cuál es la clasificación más precisa?',
        answer: 'Rombo',
        distractors: ['Cuadrado', 'Rectángulo', 'Trapecio'],
        solution: 'Tiene cuatro lados iguales pero no ángulos rectos, así que es rombo y no cuadrado.',
        tag: 'rombo_preciso',
      },
      {
        prompt: '¿Qué información adicional permite asegurar que un rectángulo es también un cuadrado?',
        answer: 'Que sus cuatro lados sean iguales',
        distractors: ['Que tenga cuatro ángulos rectos', 'Que sus lados opuestos sean paralelos', 'Que tenga dos diagonales'],
        solution: 'Para pasar de rectángulo a cuadrado hace falta que los cuatro lados sean iguales.',
        tag: 'rectangulo_a_cuadrado',
      },
      {
        prompt: '¿Cuál de estas descripciones es imposible para un triángulo?',
        answer: 'Tener dos ángulos de 100°',
        distractors: ['Tener un ángulo de 90°', 'Tener tres ángulos de 60°', 'Tener un ángulo de 120°'],
        solution: 'Dos ángulos de 100° ya sumarían 200°.',
        tag: 'descripcion_imposible',
      },
      {
        prompt: 'Un cuadrilátero tiene exactamente un par de lados paralelos. ¿Qué clasificación es la más adecuada?',
        answer: 'Trapecio',
        distractors: ['Rectángulo', 'Rombo', 'Cuadrado'],
        solution: 'Con exactamente un par de lados paralelos se clasifica como trapecio.',
        tag: 'trapecio_preciso',
      },
      {
        prompt: 'Un triángulo tiene dos lados iguales y un ángulo de 100°. ¿Qué podemos afirmar?',
        answer: 'Es isósceles y obtusángulo',
        distractors: ['Es equilátero y acutángulo', 'Es escaleno y rectángulo', 'Es isósceles y rectángulo'],
        solution: 'Dos lados iguales lo hacen isósceles; un ángulo mayor de 90° lo hace obtusángulo.',
        tag: 'doble_clasificacion',
      },
      {
        prompt: 'Un triángulo tiene dos ángulos de 45°. ¿Cuál es su clasificación completa?',
        answer: 'Isósceles rectángulo',
        distractors: ['Equilátero acutángulo', 'Escaleno rectángulo', 'Isósceles obtusángulo'],
        solution: 'El tercer ángulo es 90° y los dos ángulos iguales implican dos lados iguales.',
        tag: '45_45_clasificacion',
      },
      {
        prompt: '¿Cuál de estas condiciones NO basta por sí sola para asegurar que un cuadrilátero sea cuadrado?',
        answer: 'Tener cuatro lados iguales',
        distractors: ['Tener cuatro lados iguales y cuatro ángulos rectos', 'Ser rectángulo y tener cuatro lados iguales', 'Ser rombo y tener un ángulo recto'],
        solution: 'Cuatro lados iguales también pueden describir un rombo no cuadrado.',
        tag: 'condicion_no_suficiente',
      },
      {
        prompt: 'Un cuadrilátero es rectángulo y además sus lados consecutivos tienen la misma longitud. ¿Qué figura es?',
        answer: 'Cuadrado',
        distractors: ['Trapecio', 'Rombo no cuadrado', 'Triángulo'],
        solution: 'Un rectángulo con lados consecutivos iguales tiene los cuatro lados iguales: es cuadrado.',
        tag: 'rectangulo_lados_iguales',
      },
      {
        prompt: 'Un rombo tiene un ángulo de 90°. ¿Qué clasificación más específica recibe?',
        answer: 'Cuadrado',
        distractors: ['Trapecio', 'Rectángulo no cuadrado', 'Triángulo'],
        solution: 'En un rombo, un ángulo recto obliga a que los cuatro sean rectos; por tanto es cuadrado.',
        tag: 'rombo_angulo_recto',
      },
      {
        prompt: 'Un triángulo tiene lados 6 cm, 6 cm y 6 cm. ¿Qué clasificación por ángulos se deduce?',
        answer: 'Acutángulo',
        distractors: ['Rectángulo', 'Obtusángulo', 'No se puede saber'],
        solution: 'Todo equilátero tiene tres ángulos de 60°, así que es acutángulo.',
        tag: 'equilatero_a_acutangulo',
      },
    ],
    5: [
      {
        prompt: '¿Qué información adicional permite distinguir con seguridad un cuadrado de un rectángulo no cuadrado?',
        answer: 'Que los cuatro lados tengan la misma longitud',
        distractors: ['Que tenga cuatro ángulos rectos', 'Que tenga dos pares de lados paralelos', 'Que tenga cuatro vértices'],
        solution: 'Ambos tienen ángulos rectos; el cuadrado además tiene los cuatro lados iguales.',
        tag: 'distinguir_cuadrado_rectangulo',
      },
      {
        prompt: 'Sabemos que un cuadrilátero tiene cuatro lados iguales. ¿Qué NO podemos asegurar?',
        answer: 'Que tenga cuatro ángulos rectos',
        distractors: ['Que es un rombo', 'Que sus cuatro lados tienen la misma longitud', 'Que tiene cuatro vértices'],
        solution: 'Un rombo puede no tener ángulos rectos.',
        tag: 'informacion_insuficiente',
      },
      {
        prompt: '¿Qué ejemplo demuestra que la afirmación “todo rectángulo es un cuadrado” es falsa?',
        answer: 'Un rectángulo de 6 cm por 4 cm',
        distractors: ['Un cuadrado de lado 5 cm', 'Un rombo de lado 4 cm', 'Un triángulo equilátero'],
        solution: 'Tiene cuatro ángulos rectos, pero no cuatro lados iguales.',
        tag: 'contraejemplo_rectangulo',
      },
      {
        prompt: 'Un cuadrilátero tiene lados opuestos paralelos y todos sus ángulos iguales. ¿Cuál es la conclusión más precisa sin conocer la longitud de sus lados?',
        answer: 'Es un rectángulo, pero no podemos asegurar que sea cuadrado',
        distractors: ['Es necesariamente un cuadrado', 'Es necesariamente un rombo', 'Es un trapecio con un solo par de lados paralelos'],
        solution: 'Cuatro ángulos iguales son rectos; sin lados iguales no puede asegurarse que sea cuadrado.',
        tag: 'conclusion_precisa',
      },
      {
        prompt: '¿Cuál de estas afirmaciones sobre la clasificación geométrica es falsa?',
        answer: 'Todo rombo es un cuadrado',
        distractors: ['Todo cuadrado es un rombo', 'Todo cuadrado es un rectángulo', 'Todo cuadrado es un cuadrilátero'],
        solution: 'Un rombo no necesita tener ángulos rectos.',
        tag: 'afirmacion_falsa',
      },
      {
        prompt: 'Un triángulo es isósceles y uno de sus ángulos mide 100°. ¿Cuánto miden los otros dos ángulos?',
        answer: '40° y 40°',
        distractors: ['80° y 0°', '50° y 30°', '100° y 100°'],
        solution: 'Quedan 80° y, al ser isósceles, se reparten en dos ángulos iguales de 40°.',
        tag: 'isosceles_100',
      },
      {
        prompt: 'Un cuadrilátero es a la vez rectángulo y rombo. ¿Qué figura debe ser?',
        answer: 'Cuadrado',
        distractors: ['Trapecio', 'Paralelogramo no rectangular', 'Triángulo'],
        solution: 'Ser rectángulo aporta ángulos rectos y ser rombo aporta cuatro lados iguales.',
        tag: 'interseccion_rectangulo_rombo',
      },
      {
        prompt: '¿Cuál es el mejor contraejemplo para “todo cuadrilátero con cuatro lados iguales tiene cuatro ángulos rectos”?',
        answer: 'Un rombo no cuadrado',
        distractors: ['Un cuadrado', 'Un rectángulo de 6 por 4', 'Un trapecio'],
        solution: 'Un rombo no cuadrado tiene cuatro lados iguales y no tiene cuatro ángulos rectos.',
        tag: 'contraejemplo_cuatro_lados',
      },
      {
        prompt: 'Un triángulo tiene dos ángulos iguales y ninguno mide 90°. ¿Qué podemos asegurar sobre sus lados?',
        answer: 'Tiene al menos dos lados iguales',
        distractors: ['Los tres lados son distintos', 'Los tres lados son iguales necesariamente', 'Tiene un lado de longitud 90'],
        solution: 'Ángulos iguales se oponen a lados iguales; por tanto es al menos isósceles.',
        tag: 'angulos_iguales_lados',
      },
      {
        prompt: '¿Qué conjunto de propiedades describe necesariamente un cuadrado?',
        answer: 'Cuatro lados iguales, cuatro ángulos rectos y dos pares de lados paralelos',
        distractors: ['Cuatro lados iguales y un solo par de lados paralelos', 'Cuatro ángulos rectos y tres lados iguales', 'Dos lados iguales y ningún lado paralelo'],
        solution: 'El cuadrado reúne simultáneamente esas tres propiedades.',
        tag: 'propiedades_necesarias_cuadrado',
      },
    ],
  }

  const variants = variantsByDifficulty[d]
  const v = variants[ri(0, variants.length - 1)]

  return mc(
    skill,
    d,
    seed,
    v.prompt,
    v.answer,
    v.distractors,
    v.solution,
    [
      'clasificacion_geometrica_razonada',
      `family:${v.tag}`,
      `dificultad_${d}`,
    ]
  )
}

// Generador de reserva para habilidades aún no implementadas.
return mc(
  skill,
  d,
  seed,
  `¿Qué opción representa correctamente la habilidad "${skill.name}"?`,
  'Opción correcta',
  [
    'Distractor A',
    'Distractor B',
    'Distractor C',
  ],
  'Esta habilidad necesita todavía una plantilla específica.',
  ['fallback_generator']
)
}
