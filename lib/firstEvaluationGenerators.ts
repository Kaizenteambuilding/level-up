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
  const r = rng(seed)

  const pool = [answer, ...distractors].filter(
    (v, i, a) => a.indexOf(v) === i
  )

  // Garantiza siempre cuatro opciones distintas. Algunos distractores
  // pueden coincidir con la respuesta para ciertos valores aleatorios.
  const fractionMatch = answer.match(/^(-?\d+)\/(\d+)(.*)$/)
  const numberMatch = answer.match(/^(-?\d+(?:[.,]\d+)?)(.*)$/)
  let fallbackStep = 1

  while (pool.length < 4) {
    let candidate: string

    if (fractionMatch) {
      const numerator = Number(fractionMatch[1])
      const denominator = Number(fractionMatch[2])
      const suffix = fractionMatch[3]
      candidate = `${numerator + fallbackStep}/${denominator}${suffix}`
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

  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt,
    options,
    answerIndex: options.indexOf(answer),
    solution,
    tags,
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
  // M01 · NÚMEROS NATURALES
  // =========================

 // =========================
// M01 · NÚMEROS NATURALES
// =========================

if (key === 'natural_place_value') {
  const digitsByDifficulty = [3, 4, 5, 6, 7]
  const digits = digitsByDifficulty[d - 1]

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

  const position = positions[ri(0, positions.length - 1)]
  const answer = Math.floor(n / position.divisor) % 10

  const distractors = shuffle(r, [
    String((answer + 1) % 10),
    String((answer + 2) % 10),
    String((answer + 5) % 10),
    String(Math.floor(n / 10) % 10),
  ])
    .filter((x) => x !== String(answer))
    .slice(0, 3)

  return mc(
    skill,
    d,
    seed,
    `En el número ${n}, ¿qué cifra ocupa las ${position.label}?`,
    String(answer),
    distractors,
    `La cifra que ocupa las ${position.label} es ${answer}.`,
    ['valor_posicional']
  )
}

if (key === 'natural_compare') {
  const ranges = [
    [10, 99],
    [100, 999],
    [1000, 9999],
    [10000, 99999],
    [100000, 999999],
  ]

  const [min, max] = ranges[d - 1]

  let a = ri(min, max)
  let b = ri(min, max)

  if (d >= 4 && seed % 2 === 0) {
    const base = ri(min, max - 20)
    a = base + ri(1, 9)
    b = base + ri(10, 19)
  }

  const answer = a > b ? '>' : a < b ? '<' : '='

  return mc(
    skill,
    d,
    seed,
    `Completa: ${a} __ ${b}`,
    answer,
    ['<', '>', '=', '≠'].filter((x) => x !== answer),
    `${a} ${answer} ${b}.`,
    ['comparacion']
  )
}

if (key === 'natural_add_sub') {
  const maxByDifficulty = [
    100,
    1000,
    10000,
    100000,
    1000000,
  ]

  const max = maxByDifficulty[d - 1]
  const add = seed % 2 === 0

  if (add) {
    const a = ri(Math.floor(max / 10), max)
    const b = ri(Math.floor(max / 20), max)
    const result = a + b

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a} + ${b}`,
      String(result),
      [
        String(result + 10),
        String(result - 10),
        String(Math.abs(a - b)),
      ],
      `${a} + ${b} = ${result}.`,
      ['suma_naturales']
    )
  }

  const a = ri(Math.floor(max / 2), max)
  const b = ri(1, a)
  const result = a - b

  return mc(
    skill,
    d,
    seed,
    `Calcula ${a} - ${b}`,
    String(result),
    [
      String(a + b),
      String(Math.abs(b - a)),
      String(result + 10),
    ],
    `${a} - ${b} = ${result}.`,
    ['resta_naturales']
  )
}

if (key === 'natural_mult_div') {
  if (d === 1) {
    const a = ri(2, 10)
    const b = ri(2, 10)
    const result = a * b

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a} × ${b}`,
      String(result),
      [
        String(a + b),
        String(result + a),
        String(result - b),
      ],
      `${a} × ${b} = ${result}.`,
      ['multiplicacion']
    )
  }

  if (d === 2) {
    const a = ri(2, 12)
    const b = ri(2, 20)
    const result = a * b

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a} × ${b}`,
      String(result),
      [
        String(result + a),
        String(a + b),
        String(result - b),
      ],
      `${a} × ${b} = ${result}.`,
      ['multiplicacion']
    )
  }

  if (d === 3) {
    const divisor = ri(2, 12)
    const quotient = ri(2, 25)
    const dividend = divisor * quotient

    return mc(
      skill,
      d,
      seed,
      `Calcula ${dividend} ÷ ${divisor}`,
      String(quotient),
      [
        String(divisor),
        String(quotient + 1),
        String(dividend - divisor),
      ],
      `${dividend} ÷ ${divisor} = ${quotient}.`,
      ['division']
    )
  }

  if (d === 4) {
    const a = ri(12, 99)
    const b = ri(2, 15)
    const result = a * b

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a} × ${b}`,
      String(result),
      [
        String(result + b),
        String(a + b),
        String(result - a),
      ],
      `${a} × ${b} = ${result}.`,
      ['multiplicacion_avanzada']
    )
  }

  const divisor = ri(11, 25)
  const quotient = ri(12, 50)
  const dividend = divisor * quotient

  return mc(
    skill,
    d,
    seed,
    `Calcula ${dividend} ÷ ${divisor}`,
    String(quotient),
    [
      String(quotient + 1),
      String(quotient - 1),
      String(divisor),
    ],
    `${dividend} ÷ ${divisor} = ${quotient}.`,
    ['division_avanzada']
  )
}

if (key === 'operation_priority') {
  if (d === 1) {
    const a = ri(2, 10)
    const b = ri(2, 10)
    const c = ri(2, 10)
    const result = a + b * c

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a} + ${b} × ${c}`,
      String(result),
      [
        String((a + b) * c),
        String(a + b + c),
        String(a * b + c),
      ],
      `Primero ${b} × ${c} = ${b * c}; después sumamos ${a}. Resultado: ${result}.`,
      ['jerarquia_operaciones']
    )
  }

  if (d === 2) {
    const a = ri(2, 15)
    const b = ri(2, 10)
    const c = ri(2, 10)
    const result = a * b + c

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a} × ${b} + ${c}`,
      String(result),
      [
        String(a * (b + c)),
        String(a + b + c),
        String(a * b - c),
      ],
      `Primero multiplicamos: ${a} × ${b} = ${a * b}. Después sumamos ${c}. Resultado: ${result}.`,
      ['jerarquia_operaciones']
    )
  }

  if (d === 3) {
    const a = ri(10, 30)
    const b = ri(2, 8)
    const c = ri(2, 8)
    const result = a - b * c

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a} - ${b} × ${c}`,
      String(result),
      [
        String((a - b) * c),
        String(a - b - c),
        String(a + b * c),
      ],
      `Primero ${b} × ${c} = ${b * c}; después ${a} - ${b * c} = ${result}.`,
      ['jerarquia_operaciones']
    )
  }

  if (d === 4) {
    const a = ri(2, 9)
    const b = ri(2, 9)
    const c = ri(2, 9)
    const e = ri(2, 9)
    const result = (a + b) * c - e

    return mc(
      skill,
      d,
      seed,
      `Calcula (${a} + ${b}) × ${c} - ${e}`,
      String(result),
      [
        String(a + b * c - e),
        String((a + b) * (c - e)),
        String(result + c),
      ],
      `Primero resolvemos el paréntesis: ${a} + ${b} = ${a + b}. Después multiplicamos por ${c} y finalmente restamos ${e}. Resultado: ${result}.`,
      ['jerarquia_operaciones', 'parentesis']
    )
  }

  const a = ri(2, 10)
  const b = ri(2, 10)
  const c = ri(2, 8)
  const e = ri(2, 8)
  const f = ri(1, 10)
  const result = a * (b + c) - e * f

  return mc(
    skill,
    d,
    seed,
    `Calcula ${a} × (${b} + ${c}) - ${e} × ${f}`,
    String(result),
    [
      String(a * b + c - e * f),
      String((a + b + c) * e),
      String(result + f),
    ],
    `Primero resolvemos el paréntesis y las multiplicaciones. Resultado: ${result}.`,
    ['jerarquia_operaciones', 'parentesis', 'operaciones_combinadas']
  )
}

if (key === 'natural_word_problem') {
  if (d <= 2) {
    const boxes = ri(2, 6 + d)
    const perBox = ri(5, 20 + d * 5)
    const result = boxes * perBox

    return mc(
      skill,
      d,
      seed,
      `Hay ${boxes} cajas con ${perBox} cromos en cada caja. ¿Cuántos cromos hay en total?`,
      String(result),
      [
        String(boxes + perBox),
        String(result - perBox),
        String(result + boxes),
      ],
      `${boxes} × ${perBox} = ${result}.`,
      ['problema_naturales']
    )
  }

  if (d === 3) {
    const boxes = ri(3, 10)
    const perBox = ri(10, 40)
    const loose = ri(5, 30)
    const result = boxes * perBox + loose

    return mc(
      skill,
      d,
      seed,
      `Hay ${boxes} cajas con ${perBox} cromos cada una y además ${loose} cromos sueltos. ¿Cuántos cromos hay en total?`,
      String(result),
      [
        String(boxes + perBox + loose),
        String(boxes * perBox),
        String(result - loose),
      ],
      `${boxes} × ${perBox} + ${loose} = ${result}.`,
      ['problema_naturales', 'dos_operaciones']
    )
  }

  if (d === 4) {
    const boxes = ri(4, 12)
    const perBox = ri(15, 50)
    const sold = ri(10, 50)
    const total = boxes * perBox
    const result = total - sold

    return mc(
      skill,
      d,
      seed,
      `Una tienda recibe ${boxes} cajas con ${perBox} cromos cada una. Después vende ${sold} cromos. ¿Cuántos quedan?`,
      String(result),
      [
        String(total),
        String(total + sold),
        String(boxes + perBox - sold),
      ],
      `Primero ${boxes} × ${perBox} = ${total}. Después ${total} - ${sold} = ${result}.`,
      ['problema_naturales', 'dos_operaciones']
    )
  }

  const groups = ri(3, 8)
  const boxesPerGroup = ri(2, 6)
  const perBox = ri(10, 30)
  const used = ri(10, 50)

  const total = groups * boxesPerGroup * perBox
  const result = total - used

  return mc(
    skill,
    d,
    seed,
    `Hay ${groups} grupos con ${boxesPerGroup} cajas cada uno y cada caja contiene ${perBox} piezas. Se utilizan ${used} piezas. ¿Cuántas quedan?`,
    String(result),
    [
      String(total),
      String(groups * boxesPerGroup + perBox - used),
      String(total + used),
    ],
    `Total inicial: ${groups} × ${boxesPerGroup} × ${perBox} = ${total}. Después restamos ${used}. Resultado: ${result}.`,
    ['problema_naturales', 'varias_operaciones']
  )
}

  // =========================
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
        String(den * k),
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
    const den1 = ri(5, 12)
    const den2 = ri(5, 12)
    const num1 = ri(1, den1 - 1)
    const num2 = ri(1, den2 - 1)

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

  const den1 = ri(7, 15)
  const den2 = ri(7, 15)
  const den3 = ri(7, 15)

  const fractions = [
    { n: ri(1, den1 - 1), d: den1 },
    { n: ri(1, den2 - 1), d: den2 },
    { n: ri(1, den3 - 1), d: den3 },
  ]

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
    return mc(
      skill,
      d,
      seed,
      '¿Qué expresión representa "un número más 5"?',
      'x + 5',
      ['5x', 'x - 5', '5 - x'],
      'Si llamamos x al número, sumarle 5 se escribe x + 5.',
      ['lenguaje_algebraico']
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

    if (family === 0) return mc(skill, d, seed,
      '¿Qué condición basta por sí sola para asegurar que un paralelogramo es un rectángulo?',
      'Uno de sus ángulos es recto', ['Dos lados consecutivos son distintos', 'Sus lados opuestos son paralelos', 'Tiene dos diagonales'],
      'En un paralelogramo, si un ángulo es de 90°, los consecutivos también lo son y los cuatro resultan rectos.', ['cuadrilateros', 'family:sufficient_rectangle'])

    if (family === 1) return mc(skill, d, seed,
      '¿Qué condición basta por sí sola para asegurar que un rectángulo es un cuadrado?',
      'Dos lados consecutivos tienen la misma longitud', ['Sus diagonales son iguales', 'Tiene cuatro ángulos rectos', 'Sus lados opuestos son paralelos'],
      'En un rectángulo los lados opuestos ya son iguales; si dos consecutivos también lo son, los cuatro lados quedan iguales.', ['cuadrilateros', 'family:sufficient_square'])

    if (family === 2) {
      const x = ri(20, 55)
      const a = 2*x, b = 180-a
      return mc(skill, d, seed,
        `En un paralelogramo, dos ángulos consecutivos miden 2x y ${b}°. ¿Cuánto vale x?`, `${x}°`,
        [`${x+10}°`, `${Math.max(5,x-10)}°`, `${90-x}°`],
        `Los consecutivos suman 180°: 2x+${b}=180, por lo que 2x=${180-b} y x=${x}.`, ['cuadrilateros', 'family:solve_x_parallelogram'])
    }

    if (family === 3) return mc(skill, d, seed,
      'Un alumno afirma: «Si un cuadrilátero tiene cuatro lados iguales, entonces es un cuadrado». ¿Cuál es el mejor análisis?',
      'Es falso: puede ser un rombo sin ángulos rectos', ['Es verdadero por definición', 'Es falso porque un cuadrado no tiene lados iguales', 'Es verdadero solo si tiene exactamente un par de lados paralelos'],
      'Tener cuatro lados iguales no obliga a que los cuatro ángulos sean de 90°; un rombo es un contraejemplo.', ['cuadrilateros', 'family:error_analysis_equal_sides'])

    return mc(skill, d, seed,
      'Ordena de más específica a más general la clasificación de una figura con cuatro lados iguales y cuatro ángulos rectos.',
      'Cuadrado → rectángulo/paralelogramo y rombo → cuadrilátero',
      ['Cuadrilátero → cuadrado → triángulo', 'Trapecio → rombo → cuadrado', 'Rectángulo → triángulo → cuadrado'],
      'El cuadrado pertenece a varias clases más generales: es rectángulo, rombo, paralelogramo y cuadrilátero.', ['cuadrilateros', 'family:classification_hierarchy'])
  }

  const family = ri(0, 4)

  if (family === 0) {
    const x = ri(20, 40)
    const angles = [x, 2*x, 3*x, 360-6*x]
    return mc(skill, d, seed,
      `Tres ángulos de un cuadrilátero miden x, 2x y 3x. El cuarto mide ${angles[3]}°. ¿Cuánto vale x?`, `${x}°`,
      [`${x+5}°`, `${Math.max(5,x-5)}°`, `${2*x}°`],
      `x+2x+3x+${angles[3]}=360; entonces 6x=${360-angles[3]} y x=${x}.`, ['cuadrilateros', 'family:multi_step_angle_equation'])
  }

  if (family === 1) return mc(skill, d, seed,
    'Un cuadrilátero tiene diagonales de la misma longitud. ¿Podemos concluir necesariamente que es un rectángulo?',
    'No; esa propiedad por sí sola no basta', ['Sí, siempre', 'Sí, y además tiene que ser un cuadrado', 'No, porque ningún rectángulo tiene diagonales iguales'],
    'La igualdad de las diagonales aparece en los rectángulos, pero por sí sola no caracteriza a todos los cuadriláteros.', ['cuadrilateros', 'family:converse_diagonals'])

  if (family === 2) {
    const k = ri(15, 30)
    const angles = [2*k, 3*k, 2*k, 3*k]
    return mc(skill, d, seed,
      `Los ángulos de un paralelogramo están en la razón 2:3:2:3. ¿Cuánto mide el ángulo menor?`, `${2*36}°`,
      ['60°', '90°', '108°'],
      'Hay 10 partes en total y suman 360°, así que cada parte vale 36°. El ángulo menor mide 2×36°=72°.', ['cuadrilateros', 'family:angle_ratio'])
  }

  if (family === 3) return mc(skill, d, seed,
    'Se sabe que una figura es a la vez rectángulo y rombo. ¿Qué se puede concluir necesariamente?',
    'Es un cuadrado', ['Es un trapecio con un solo par de lados paralelos', 'No puede existir', 'Tiene algún ángulo distinto de 90°'],
    'Ser rectángulo aporta cuatro ángulos rectos y ser rombo aporta cuatro lados iguales; juntas son las propiedades de un cuadrado.', ['cuadrilateros', 'family:intersection_classes'])

  return mc(skill, d, seed,
    '¿Cuál es el contraejemplo más directo a la afirmación «todo paralelogramo con lados opuestos iguales es un rectángulo»?',
    'Un paralelogramo oblicuo sin ángulos rectos', ['Un cuadrado', 'Un rectángulo', 'Un triángulo rectángulo'],
    'Todo paralelogramo ya tiene lados opuestos iguales; uno oblicuo muestra que esa propiedad no obliga a tener ángulos rectos.', ['cuadrilateros', 'family:counterexample_parallelogram'])
}

if (key === 'circle_elements') {
  // En modo prueba la semilla avanza con un LCG. Sus 3 bits bajos recorren
  // los 8 valores antes de repetirse, así que esta selección evita quedarse
  // atrapado en una sola familia al pulsar "Generar otra".
  const family = (seed >>> 0) & 7

  if (d === 1) {
    if (family === 0) return mc(skill, d, seed,
      'El segmento que une el centro de una circunferencia con uno de sus puntos se llama...',
      'Radio', ['Diámetro', 'Cuerda', 'Arco'],
      'El radio une el centro con un punto de la circunferencia.',
      ['circunferencia', 'elementos', 'family:circle_d1_radius'])

    if (family === 1) return mc(skill, d, seed,
      '¿Cómo se llama el segmento que une dos puntos de una circunferencia y pasa por el centro?',
      'Diámetro', ['Radio', 'Arco', 'Tangente'],
      'Un diámetro es una cuerda que pasa por el centro.',
      ['circunferencia', 'elementos', 'family:circle_d1_diameter'])

    if (family === 2) return mc(skill, d, seed,
      'Un segmento une dos puntos de una circunferencia, pero no tiene por qué pasar por el centro. ¿Qué es?',
      'Cuerda', ['Radio', 'Diámetro', 'Arco'],
      'Cualquier segmento con extremos en la circunferencia es una cuerda.',
      ['circunferencia', 'elementos', 'family:circle_d1_chord'])

    if (family === 3) return mc(skill, d, seed,
      'Una parte curva de la circunferencia comprendida entre dos puntos se llama...',
      'Arco', ['Radio', 'Cuerda', 'Centro'],
      'Un arco es una porción de la propia circunferencia.',
      ['circunferencia', 'elementos', 'family:circle_d1_arc'])

    if (family === 4) return mc(skill, d, seed,
      '¿Qué punto está a la misma distancia de todos los puntos de una circunferencia?',
      'El centro', ['Un extremo de un diámetro', 'Un punto cualquiera del círculo', 'El punto medio de cualquier arco'],
      'El centro es el punto equidistante de todos los puntos de la circunferencia.',
      ['circunferencia', 'elementos', 'family:circle_d1_center'])

    if (family === 5) {
      const radius = ri(2, 10)
      return mc(skill, d, seed,
        `Un círculo tiene radio de ${radius} cm. ¿Cuánto mide su diámetro?`,
        `${radius * 2} cm`, [`${radius} cm`, `${radius + 2} cm`, `${radius * 3} cm`],
        `El diámetro mide el doble que el radio: ${radius}×2=${radius * 2} cm.`,
        ['circunferencia', 'radio_diametro', 'family:circle_d1_double'])
    }

    if (family === 6) return mc(skill, d, seed,
      '¿Cuál de estos elementos tiene uno de sus extremos en el centro y el otro en la circunferencia?',
      'Un radio', ['Una cuerda', 'Un arco', 'Una secante'],
      'Esa es exactamente la definición de radio.',
      ['circunferencia', 'elementos', 'family:circle_d1_endpoint'])

    return mc(skill, d, seed,
      '¿Cuál de estas afirmaciones es correcta?',
      'Un diámetro está formado por dos radios alineados',
      ['Un radio mide el doble que un diámetro', 'Toda cuerda pasa por el centro', 'Un arco es un segmento recto'],
      'El centro divide cualquier diámetro en dos radios iguales.',
      ['circunferencia', 'elementos', 'family:circle_d1_two_radii'])
  }

  if (d === 2) {
    if (family === 0) {
      const radius = ri(3, 15)
      return mc(skill, d, seed,
        `El radio de una circunferencia mide ${radius} cm. ¿Cuánto mide su diámetro?`,
        `${radius * 2} cm`, [`${radius} cm`, `${radius + 2} cm`, `${radius * 4} cm`],
        `Diámetro = 2×radio = ${radius * 2} cm.`,
        ['circunferencia', 'radio_diametro', 'family:circle_d2_radius_to_diameter'])
    }

    if (family === 1) {
      const radius = ri(3, 15)
      const diameter = radius * 2
      return mc(skill, d, seed,
        `Una circunferencia tiene ${diameter} cm de diámetro. ¿Cuál es su radio?`,
        `${radius} cm`, [`${diameter} cm`, `${diameter * 2} cm`, `${radius + 2} cm`],
        `El radio es la mitad del diámetro: ${diameter}÷2=${radius} cm.`,
        ['circunferencia', 'radio_diametro', 'family:circle_d2_diameter_to_radius'])
    }

    if (family === 2) return mc(skill, d, seed,
      '¿Cuál de estos elementos es siempre también una cuerda?',
      'El diámetro', ['El radio', 'El arco', 'El centro'],
      'Todo diámetro une dos puntos de la circunferencia, así que es una cuerda especial.',
      ['circunferencia', 'propiedades', 'family:circle_d2_diameter_chord'])

    if (family === 3) return mc(skill, d, seed,
      'Una cuerda pasa por el centro de la circunferencia. ¿Cómo se llama entonces?',
      'Diámetro', ['Radio', 'Arco', 'Tangente'],
      'La cuerda que pasa por el centro es el diámetro.',
      ['circunferencia', 'propiedades', 'family:circle_d2_center_chord'])

    if (family === 4) return mc(skill, d, seed,
      '¿Qué diferencia hay entre un círculo y una circunferencia?',
      'La circunferencia es el borde y el círculo incluye también el interior',
      ['Son exactamente lo mismo', 'El círculo es solo el borde', 'La circunferencia incluye el interior y el círculo no'],
      'La circunferencia es una línea curva cerrada; el círculo es la región interior junto con su borde.',
      ['circunferencia', 'conceptos', 'family:circle_d2_circle_vs_circumference'])

    if (family === 5) return mc(skill, d, seed,
      'Si A y B son los extremos de un diámetro y O es el centro, ¿qué relación hay entre OA y OB?',
      'Tienen la misma longitud', ['OA mide el doble que OB', 'OB mide el doble que OA', 'No se puede comparar'],
      'OA y OB son radios de la misma circunferencia.',
      ['circunferencia', 'radio_diametro', 'family:circle_d2_equal_radii'])

    if (family === 6) return mc(skill, d, seed,
      '¿Cuál de estos segmentos puede ser una cuerda sin ser un diámetro?',
      'Uno que une dos puntos de la circunferencia sin pasar por el centro',
      ['Uno que une el centro con la circunferencia', 'Uno que toca la circunferencia en un único punto desde fuera', 'Un arco de la circunferencia'],
      'Una cuerda no necesita pasar por el centro; si pasa, sería diámetro.',
      ['circunferencia', 'cuerda', 'family:circle_d2_non_diameter_chord'])

    return mc(skill, d, seed,
      'Un diámetro divide una circunferencia en dos arcos iguales. ¿Cómo se llama cada uno de esos arcos?',
      'Semicircunferencia', ['Radio', 'Sector', 'Cuerda'],
      'Cada mitad de una circunferencia determinada por un diámetro es una semicircunferencia.',
      ['circunferencia', 'arcos', 'family:circle_d2_semicircle'])
  }

  if (d === 3) {
    if (family === 0) {
      const r = ri(4, 12)
      const d2 = r * 2
      return mc(skill, d, seed,
        `El segmento AB es un diámetro de ${d2} cm y O es el centro. ¿Cuánto mide AO?`,
        `${r} cm`, [`${d2} cm`, `${r * 2 + 2} cm`, `${Math.max(1, r - 2)} cm`],
        `AO es un radio, así que mide la mitad del diámetro: ${r} cm.`,
        ['circunferencia', 'razonamiento', 'family:circle_d3_half_diameter'])
    }

    if (family === 1) return mc(skill, d, seed,
      '¿Cuál de estas afirmaciones es siempre cierta?',
      'Todos los radios de una misma circunferencia miden lo mismo',
      ['Todas las cuerdas miden lo mismo', 'Todo radio es un diámetro', 'Todo arco es una semicircunferencia'],
      'La igualdad de los radios es una propiedad básica de la circunferencia.',
      ['circunferencia', 'propiedades', 'family:circle_d3_equal_radii'])

    if (family === 2) return mc(skill, d, seed,
      'Una recta toca una circunferencia en un único punto. ¿Cómo se llama esa recta?',
      'Tangente', ['Secante', 'Diámetro', 'Cuerda'],
      'Una tangente tiene exactamente un punto común con la circunferencia.',
      ['circunferencia', 'rectas', 'family:circle_d3_tangent'])

    if (family === 3) return mc(skill, d, seed,
      'Una recta corta una circunferencia en dos puntos distintos. ¿Cómo se llama?',
      'Secante', ['Tangente', 'Radio', 'Arco'],
      'Una secante atraviesa la circunferencia y tiene dos puntos de corte.',
      ['circunferencia', 'rectas', 'family:circle_d3_secant'])

    if (family === 4) return mc(skill, d, seed,
      '¿Qué afirmación distingue correctamente una tangente de una secante?',
      'La tangente tiene un punto común con la circunferencia y la secante tiene dos',
      ['La tangente tiene dos puntos comunes y la secante uno', 'Ambas tienen siempre dos puntos comunes', 'Ninguna toca la circunferencia'],
      'La cantidad de puntos de intersección permite distinguirlas.',
      ['circunferencia', 'rectas', 'family:circle_d3_tangent_vs_secant'])

    if (family === 5) return mc(skill, d, seed,
      'Si una cuerda no pasa por el centro, ¿podemos afirmar que es un diámetro?',
      'No', ['Sí, siempre', 'Solo si es corta', 'Solo si sus extremos están dentro del círculo'],
      'Para ser diámetro, una cuerda debe pasar necesariamente por el centro.',
      ['circunferencia', 'razonamiento', 'family:circle_d3_not_diameter'])

    if (family === 6) return mc(skill, d, seed,
      'Un punto P está en la circunferencia y O es el centro. ¿Qué tipo de segmento es OP?',
      'Radio', ['Diámetro', 'Cuerda que no pasa por el centro', 'Tangente'],
      'OP une el centro con un punto de la circunferencia.',
      ['circunferencia', 'elementos', 'family:circle_d3_point_radius'])

    return mc(skill, d, seed,
      '¿Cuál de estos elementos pertenece a la circunferencia como línea curva y no es un segmento recto?',
      'Un arco', ['Un radio', 'Un diámetro', 'Una cuerda'],
      'El arco es una porción curva de la circunferencia.',
      ['circunferencia', 'elementos', 'family:circle_d3_arc_not_segment'])
  }

  if (d === 4) {
    if (family === 0) return mc(skill, d, seed,
      '¿Cuál de estas afirmaciones es siempre cierta?',
      'Todo diámetro es una cuerda, pero no toda cuerda es un diámetro',
      ['Toda cuerda es un diámetro', 'Todo radio es una cuerda', 'Todo diámetro es un arco'],
      'El diámetro es una cuerda especial que pasa por el centro.',
      ['circunferencia', 'razonamiento', 'family:circle_d4_inclusion'])

    if (family === 1) return mc(skill, d, seed,
      'Una tangente toca la circunferencia en P y OP es un radio. ¿Qué relación forman la tangente y OP en P?',
      'Son perpendiculares', ['Son paralelos', 'Forman siempre 45°', 'Coinciden en la misma recta'],
      'El radio al punto de tangencia es perpendicular a la tangente.',
      ['circunferencia', 'tangente', 'family:circle_d4_tangent_perpendicular'])

    if (family === 2) return mc(skill, d, seed,
      'Desde el centro O se traza un segmento perpendicular a una cuerda AB. ¿Qué ocurre con AB?',
      'Queda dividida en dos partes iguales', ['Se convierte en un diámetro necesariamente', 'Deja de ser una cuerda', 'Su longitud se duplica'],
      'La perpendicular trazada desde el centro a una cuerda la biseca.',
      ['circunferencia', 'cuerdas', 'family:circle_d4_perpendicular_bisects'])

    if (family === 3) return mc(skill, d, seed,
      'Dos cuerdas de una misma circunferencia tienen la misma longitud. ¿Qué puede decirse de su distancia al centro?',
      'Es la misma', ['La cuerda más alta está siempre más cerca', 'Una debe pasar por el centro', 'No existe ninguna relación'],
      'Cuerdas iguales de una misma circunferencia están a igual distancia del centro.',
      ['circunferencia', 'cuerdas', 'family:circle_d4_equal_chords'])

    if (family === 4) return mc(skill, d, seed,
      '¿Cuál es la cuerda de mayor longitud que puede trazarse en una circunferencia?',
      'El diámetro', ['Cualquier radio', 'Una tangente', 'El arco mayor'],
      'La cuerda máxima es la que pasa por el centro: el diámetro.',
      ['circunferencia', 'cuerdas', 'family:circle_d4_longest_chord'])

    if (family === 5) return mc(skill, d, seed,
      'Una recta tiene exactamente dos puntos comunes con una circunferencia. ¿Cuál de estas opciones la describe correctamente?',
      'Es secante', ['Es tangente', 'Es un radio', 'Es necesariamente un diámetro'],
      'Una recta secante corta la circunferencia en dos puntos.',
      ['circunferencia', 'rectas', 'family:circle_d4_two_intersections'])

    if (family === 6) return mc(skill, d, seed,
      'Una recta es tangente a una circunferencia. ¿Cuántos puntos tienen en común?',
      '1', ['0', '2', 'Infinitos'],
      'Por definición, una tangente toca la circunferencia en un único punto.',
      ['circunferencia', 'rectas', 'family:circle_d4_one_intersection'])

    return mc(skill, d, seed,
      '¿Qué condición basta para asegurar que una cuerda es un diámetro?',
      'Que pase por el centro de la circunferencia', ['Que sea horizontal', 'Que mida lo mismo que un radio', 'Que sus extremos estén muy próximos'],
      'Toda cuerda que pasa por el centro es un diámetro.',
      ['circunferencia', 'razonamiento', 'family:circle_d4_condition_diameter'])
  }

  if (family === 0) return mc(skill, d, seed,
    'Una cuerda pasa exactamente por el centro de una circunferencia. ¿Qué podemos afirmar?',
    'Esa cuerda es un diámetro', ['Esa cuerda es un radio', 'La cuerda deja de pertenecer a la circunferencia', 'Su longitud es la mitad del radio'],
    'Una cuerda que pasa por el centro es precisamente un diámetro.',
    ['circunferencia', 'razonamiento', 'family:circle_d5_center_chord'])

  if (family === 1) return mc(skill, d, seed,
    'Una cuerda AB no pasa por el centro O. Se traza desde O una perpendicular a AB que la corta en M. ¿Qué afirmación es correcta?',
    'AM y MB tienen la misma longitud', ['AM es siempre el doble de MB', 'M debe coincidir con O', 'AB deja de ser una cuerda'],
    'La perpendicular desde el centro a una cuerda la divide en dos partes iguales.',
    ['circunferencia', 'cuerdas', 'family:circle_d5_bisector'])

  if (family === 2) return mc(skill, d, seed,
    'Una recta t es tangente a una circunferencia en P. Si O es el centro, ¿cuánto mide el ángulo entre OP y t?',
    '90°', ['45°', '60°', '180°'],
    'El radio al punto de tangencia es perpendicular a la tangente.',
    ['circunferencia', 'tangente', 'family:circle_d5_tangent_angle'])

  if (family === 3) return mc(skill, d, seed,
    'Dos cuerdas de una misma circunferencia están a distinta distancia del centro. ¿Cuál será más larga?',
    'La que esté más cerca del centro', ['La que esté más lejos del centro', 'Siempre miden lo mismo', 'La que tenga un extremo más alto'],
    'En una misma circunferencia, las cuerdas más próximas al centro son más largas.',
    ['circunferencia', 'cuerdas', 'family:circle_d5_chord_distance'])

  if (family === 4) return mc(skill, d, seed,
    '¿Cuál de estas cadenas de inclusión es correcta?',
    'Todo diámetro es una cuerda, pero no toda cuerda es un diámetro',
    ['Todo radio es un diámetro', 'Toda tangente es una secante', 'Todo arco es una cuerda'],
    'El diámetro pertenece a la familia de las cuerdas, con la condición adicional de pasar por el centro.',
    ['circunferencia', 'razonamiento', 'family:circle_d5_inclusion'])

  if (family === 5) return mc(skill, d, seed,
    'Una recta corta a una circunferencia en A y B. Si además pasa por el centro O, ¿qué segmento es AB?',
    'Un diámetro', ['Un radio', 'Una tangente', 'Un arco'],
    'AB es una cuerda que pasa por el centro, por lo que es un diámetro.',
    ['circunferencia', 'razonamiento', 'family:circle_d5_secant_center'])

  if (family === 6) return mc(skill, d, seed,
    'Si una cuerda es la más larga de todas las cuerdas posibles de una circunferencia, ¿qué debe cumplir?',
    'Pasar por el centro', ['Ser tangente', 'Tener la misma longitud que un radio', 'Formar siempre 45° con un radio'],
    'La cuerda de máxima longitud es el diámetro y, por tanto, pasa por el centro.',
    ['circunferencia', 'cuerdas', 'family:circle_d5_max_chord'])

  return mc(skill, d, seed,
    'Se afirma: «Toda recta que toca una circunferencia es tangente». ¿Qué corrección hace precisa la afirmación?',
    'Debe tocarla en exactamente un punto',
    ['Debe pasar por el centro', 'Debe cortarla en dos puntos', 'Debe medir lo mismo que el diámetro'],
    'Una tangente se caracteriza por tener un único punto común con la circunferencia.',
    ['circunferencia', 'razonamiento', 'family:circle_d5_definition_precision'])
}
if (key === 'symmetry') {
  const family = ri(0, 4)
  const familyTag = `family:symmetry_d${d}_f${family}`

  if (d === 1) {
    if (family === 0) {
      return mc(
        skill,
        d,
        seed,
        'Una línea divide una figura en dos mitades que coinciden exactamente al doblarla. ¿Cómo se llama esa línea?',
        'Eje de simetría',
        ['Diagonal', 'Radio', 'Secante'],
        'Un eje de simetría divide una figura en dos partes que se superponen exactamente.',
        ['simetria', familyTag]
      )
    }

    if (family === 1) {
      return mc(
        skill,
        d,
        seed,
        '¿Cuántos ejes de simetría tiene un cuadrado?',
        '4',
        ['1', '2', '3'],
        'El cuadrado tiene dos ejes que pasan por los puntos medios de lados opuestos y dos diagonales: 4 en total.',
        ['simetria', 'cuadrado', familyTag]
      )
    }

    if (family === 2) {
      return mc(
        skill,
        d,
        seed,
        '¿Cuántos ejes de simetría tiene un rectángulo que no es cuadrado?',
        '2',
        ['1', '3', '4'],
        'Un rectángulo no cuadrado tiene dos ejes de simetría: uno horizontal y otro vertical por su centro.',
        ['simetria', 'rectangulo', familyTag]
      )
    }

    if (family === 3) {
      return mc(
        skill,
        d,
        seed,
        '¿Cuántos ejes de simetría tiene un triángulo equilátero?',
        '3',
        ['0', '1', '2'],
        'Cada vértice y el punto medio del lado opuesto determinan un eje de simetría: hay 3.',
        ['simetria', 'triangulo_equilatero', familyTag]
      )
    }

    return mc(
      skill,
      d,
      seed,
      '¿Cuál de estas figuras tiene infinitos ejes de simetría?',
      'Círculo',
      ['Cuadrado', 'Rectángulo', 'Triángulo equilátero'],
      'Cualquier recta que pase por el centro de un círculo puede actuar como eje de simetría.',
      ['simetria', 'circulo', familyTag]
    )
  }

  if (d === 2) {
    if (family === 0) {
      return mc(
        skill,
        d,
        seed,
        'Un triángulo tiene exactamente un eje de simetría. ¿Qué tipo puede ser?',
        'Isósceles no equilátero',
        ['Escaleno', 'Equilátero', 'Ningún triángulo'],
        'Un triángulo isósceles no equilátero tiene un único eje de simetría.',
        ['simetria', 'triangulos', familyTag]
      )
    }

    if (family === 1) {
      return mc(
        skill,
        d,
        seed,
        '¿Cuál de estos triángulos no tiene ningún eje de simetría?',
        'Escaleno',
        ['Equilátero', 'Isósceles', 'Ninguno'],
        'Un triángulo escaleno tiene sus tres lados distintos y no posee ejes de simetría.',
        ['simetria', 'triangulos', familyTag]
      )
    }

    if (family === 2) {
      return mc(
        skill,
        d,
        seed,
        'Una figura tiene 4 ejes de simetría y cuatro lados iguales. ¿Qué figura encaja con esa descripción?',
        'Cuadrado',
        ['Rectángulo no cuadrado', 'Rombo no cuadrado', 'Trapecio'],
        'El cuadrado tiene cuatro lados iguales y cuatro ejes de simetría.',
        ['simetria', 'clasificacion', familyTag]
      )
    }

    if (family === 3) {
      const sides = [5, 6, 8][ri(0, 2)]
      const names: Record<number, string> = {
        5: 'pentágono regular',
        6: 'hexágono regular',
        8: 'octógono regular',
      }
      return mc(
        skill,
        d,
        seed,
        `¿Cuántos ejes de simetría tiene un ${names[sides]}?`,
        String(sides),
        [String(sides - 1), String(sides + 1), String(Math.floor(sides / 2))],
        `Un polígono regular de ${sides} lados tiene ${sides} ejes de simetría.`,
        ['simetria', 'poligono_regular', familyTag]
      )
    }

    return mc(
      skill,
      d,
      seed,
      '¿Qué afirmación es correcta?',
      'Un triángulo equilátero tiene más ejes de simetría que un isósceles no equilátero',
      [
        'Un triángulo escaleno tiene un eje de simetría',
        'Un rectángulo no cuadrado tiene cuatro ejes de simetría',
        'Un círculo tiene exactamente ocho ejes de simetría',
      ],
      'El equilátero tiene 3 ejes; un isósceles no equilátero tiene 1.',
      ['simetria', 'comparacion', familyTag]
    )
  }

  if (d === 3) {
    if (family === 0) {
      const x = ri(1, 7)
      const y = ri(1, 7)
      return mc(
        skill,
        d,
        seed,
        `El punto P = (${x}, ${y}) se refleja respecto del eje Y. ¿Dónde queda P'?`,
        `(${-x}, ${y})`,
        [`(${x}, ${-y})`, `(${-x}, ${-y})`, `(${y}, ${x})`],
        `Reflejar respecto del eje Y cambia el signo de x y mantiene y: (${-x}, ${y}).`,
        ['simetria', 'coordenadas', familyTag]
      )
    }

    if (family === 1) {
      const x = ri(1, 7)
      const y = ri(1, 7)
      return mc(
        skill,
        d,
        seed,
        `El punto A = (${-x}, ${y}) se refleja respecto del eje X. ¿Cuáles son las coordenadas de su imagen?`,
        `(${-x}, ${-y})`,
        [`(${x}, ${y})`, `(${x}, ${-y})`, `(${-y}, ${-x})`],
        `Al reflejar respecto del eje X, x se mantiene y cambia el signo de y: (${-x}, ${-y}).`,
        ['simetria', 'coordenadas', familyTag]
      )
    }

    if (family === 2) {
      return mc(
        skill,
        d,
        seed,
        '¿Cuál de estas figuras tiene exactamente dos ejes de simetría?',
        'Rectángulo no cuadrado',
        ['Triángulo equilátero', 'Cuadrado', 'Triángulo escaleno'],
        'Un rectángulo no cuadrado tiene exactamente dos ejes de simetría.',
        ['simetria', 'clasificacion', familyTag]
      )
    }

    if (family === 3) {
      return mc(
        skill,
        d,
        seed,
        '¿Cuál de estas figuras tiene exactamente un eje de simetría?',
        'Triángulo isósceles no equilátero',
        ['Cuadrado', 'Círculo', 'Triángulo escaleno'],
        'Un triángulo isósceles no equilátero tiene un único eje: el que pasa por el vértice principal y el punto medio de la base.',
        ['simetria', 'clasificacion', familyTag]
      )
    }

    const n = [5, 6, 7, 8][ri(0, 3)]
    return mc(
      skill,
      d,
      seed,
      `Un polígono regular tiene ${n} ejes de simetría. ¿Cuántos lados tiene?`,
      String(n),
      [String(n - 1), String(n + 1), String(n * 2)],
      `En un polígono regular, el número de ejes de simetría coincide con el número de lados: ${n}.`,
      ['simetria', 'poligono_regular', 'razonamiento', familyTag]
    )
  }

  if (d === 4) {
    if (family === 0) {
      const x = ri(-7, 7)
      const y = ri(-7, 7)
      return mc(
        skill,
        d,
        seed,
        `El punto P = (${x}, ${y}) se refleja primero respecto del eje X y después respecto del eje Y. ¿Dónde termina?`,
        `(${-x}, ${-y})`,
        [`(${x}, ${-y})`, `(${-x}, ${y})`, `(${y}, ${x})`],
        `La primera reflexión cambia y; la segunda cambia x. El resultado es (${-x}, ${-y}).`,
        ['simetria', 'coordenadas', 'doble_reflexion', familyTag]
      )
    }

    if (family === 1) {
      const x = ri(-7, 7)
      const y = ri(-7, 7)
      return mc(
        skill,
        d,
        seed,
        `El punto Q = (${x}, ${y}) se refleja dos veces seguidas respecto del eje Y. ¿Cuál es el resultado final?`,
        `(${x}, ${y})`,
        [`(${-x}, ${y})`, `(${x}, ${-y})`, `(${-x}, ${-y})`],
        'Dos reflexiones sucesivas respecto del mismo eje devuelven cada punto a su posición inicial.',
        ['simetria', 'doble_reflexion', familyTag]
      )
    }

    if (family === 2) {
      return mc(
        skill,
        d,
        seed,
        'Una figura tiene exactamente 3 ejes de simetría. ¿Cuál de estas opciones puede ser?',
        'Triángulo equilátero',
        ['Cuadrado', 'Rectángulo no cuadrado', 'Triángulo isósceles no equilátero'],
        'El triángulo equilátero tiene exactamente tres ejes de simetría.',
        ['simetria', 'deduccion', familyTag]
      )
    }

    if (family === 3) {
      return mc(
        skill,
        d,
        seed,
        '¿Qué información permite asegurar que un rectángulo es además un cuadrado usando simetrías?',
        'Que tiene 4 ejes de simetría',
        ['Que tiene 2 ejes de simetría', 'Que tiene centro', 'Que tiene diagonales'],
        'Un rectángulo no cuadrado tiene 2 ejes; si tiene 4, debe ser un cuadrado.',
        ['simetria', 'razonamiento', familyTag]
      )
    }

    return mc(
      skill,
      d,
      seed,
      'Un polígono regular tiene un número impar de lados. ¿Qué afirmación es cierta sobre sus ejes de simetría?',
      'Cada eje pasa por un vértice y por el punto medio del lado opuesto',
      [
        'Cada eje pasa por dos vértices opuestos',
        'No tiene ejes de simetría',
        'Solo tiene un eje de simetría',
      ],
      'En un polígono regular con número impar de lados, cada eje une un vértice con el punto medio del lado opuesto.',
      ['simetria', 'poligono_regular', 'razonamiento', familyTag]
    )
  }

  if (family === 0) {
    const x = ri(-8, 8)
    const y = ri(-8, 8)
    return mc(
      skill,
      d,
      seed,
      `P = (${x}, ${y}) se refleja respecto del eje Y y luego respecto del eje X. ¿Qué transformación única produce el mismo resultado?`,
      'Una rotación de 180° alrededor del origen',
      [
        'Una traslación horizontal',
        'Una rotación de 90° alrededor del origen',
        'Una sola reflexión respecto del eje X',
      ],
      `Las dos reflexiones llevan P a (${-x}, ${-y}), igual que una rotación de 180° alrededor del origen.`,
      ['simetria', 'transformaciones', 'dificultad_alta', familyTag]
    )
  }

  if (family === 1) {
    const n = [5, 7, 9][ri(0, 2)]
    return mc(
      skill,
      d,
      seed,
      `Un polígono regular tiene ${n} lados. ¿Cuántos ejes de simetría tiene y qué característica comparten?`,
      `${n}; cada eje pasa por un vértice y el punto medio del lado opuesto`,
      [
        `${n - 1}; cada eje pasa por dos vértices`,
        `${n}; cada eje pasa por dos lados completos`,
        `1; pasa por el centro`,
      ],
      `Al ser regular y tener un número impar de lados, tiene ${n} ejes, cada uno desde un vértice al punto medio del lado opuesto.`,
      ['simetria', 'poligono_regular', 'dificultad_alta', familyTag]
    )
  }

  if (family === 2) {
    return mc(
      skill,
      d,
      seed,
      '¿Cuál de estas afirmaciones es necesariamente verdadera?',
      'Si una figura tiene un eje de simetría, reflejarla respecto de ese eje no cambia su apariencia',
      [
        'Toda figura con centro tiene un eje de simetría',
        'Toda figura con cuatro lados tiene al menos dos ejes de simetría',
        'Una figura solo puede tener un número finito de ejes de simetría',
      ],
      'La definición de eje de simetría exige que la figura coincida consigo misma después de reflejarse respecto de él.',
      ['simetria', 'razonamiento', 'dificultad_alta', familyTag]
    )
  }

  if (family === 3) {
    return mc(
      skill,
      d,
      seed,
      'Un cuadrado se deforma manteniendo solo los lados opuestos paralelos y deja de tener lados iguales. ¿Qué figura puede resultar y cuántos ejes de simetría conserva si sus ángulos siguen siendo rectos?',
      'Un rectángulo no cuadrado, con 2 ejes',
      [
        'Un rombo, con 4 ejes',
        'Un trapecio, con 3 ejes',
        'Un triángulo, con 1 eje',
      ],
      'Si conserva cuatro ángulos rectos pero ya no tiene todos los lados iguales, es un rectángulo no cuadrado, que tiene 2 ejes de simetría.',
      ['simetria', 'clasificacion', 'dificultad_alta', familyTag]
    )
  }

  return mc(
    skill,
    d,
    seed,
    '¿Qué dato basta para descartar que una figura sea un cuadrado?',
    'Que tenga exactamente 2 ejes de simetría',
    [
      'Que tenga 4 ejes de simetría',
      'Que tenga diagonales',
      'Que tenga cuatro vértices',
    ],
    'Todo cuadrado tiene 4 ejes de simetría. Si una figura tiene exactamente 2, no puede ser un cuadrado.',
    ['simetria', 'contraejemplo', 'dificultad_alta', familyTag]
  )
}

if (key === 'solid_figures') {
  if (d === 1) {
    const variants = [
      {
        prompt: 'Un cuerpo geométrico tiene 6 caras cuadradas iguales. ¿Cuál es?',
        answer: 'Cubo',
      },
      {
        prompt: 'Un cuerpo tiene dos bases circulares iguales y una superficie lateral curva. ¿Cuál es?',
        answer: 'Cilindro',
      },
      {
        prompt: 'Un cuerpo tiene una base circular y termina en un vértice. ¿Cuál es?',
        answer: 'Cono',
      },
      {
        prompt: 'Un cuerpo es completamente redondo y todos sus puntos están a la misma distancia del centro. ¿Cuál es?',
        answer: 'Esfera',
      },
    ]

    const v = variants[ri(0, variants.length - 1)]

    return mc(
      skill,
      d,
      seed,
      v.prompt,
      v.answer,
      ['Cubo', 'Cilindro', 'Cono', 'Esfera'].filter((x) => x !== v.answer),
      `La descripción corresponde a ${v.answer.toLowerCase()}.`,
      ['cuerpos_geometricos']
    )
  }

  if (d === 2) {
    return mc(
      skill,
      d,
      seed,
      '¿Qué cuerpo geométrico puede rodar y además tiene dos bases circulares planas?',
      'Cilindro',
      ['Cubo', 'Pirámide', 'Prisma rectangular'],
      'El cilindro tiene una superficie curva y dos bases circulares.',
      ['cuerpos_geometricos', 'propiedades']
    )
  }

  if (d === 3) {
    return mc(
      skill,
      d,
      seed,
      '¿Cuál de estos cuerpos NO tiene vértices?',
      'Esfera',
      ['Cubo', 'Pirámide', 'Prisma triangular'],
      'La esfera no tiene caras planas, aristas ni vértices.',
      ['cuerpos_geometricos', 'vertices']
    )
  }

  if (d === 4) {
    return mc(
      skill,
      d,
      seed,
      'Un cuerpo tiene dos bases poligonales iguales y paralelas unidas por caras laterales. ¿Qué familia de cuerpos describe?',
      'Prismas',
      ['Pirámides', 'Conos', 'Esferas'],
      'Los prismas tienen dos bases iguales y paralelas.',
      ['cuerpos_geometricos', 'prismas']
    )
  }

  return mc(
    skill,
    d,
    seed,
    '¿Qué diferencia esencial existe entre un prisma y una pirámide?',
    'El prisma tiene dos bases iguales y paralelas; la pirámide tiene una base y un vértice común para las caras laterales',
    [
      'El prisma siempre tiene base circular',
      'La pirámide tiene dos bases iguales y paralelas',
      'Todos los prismas tienen seis caras cuadradas',
    ],
    'La estructura de las bases permite distinguir prismas y pirámides.',
    ['cuerpos_geometricos', 'razonamiento', 'dificultad_alta']
  )
}

// =========================
// M12 · PERÍMETROS Y ÁREAS
// =========================

// M12S01 · Perímetro de polígonos
if (key === 'perimeter') {
  if (d === 1) {
    const side = ri(3, 12)
    const result = side * 4

    return mc(
      skill, d, seed,
      `Un cuadrado tiene ${side} cm de lado. ¿Cuál es su perímetro?`,
      `${result} cm`,
      [
        `${side * side} cm`,
        `${side * 2} cm`,
        `${result + side} cm`,
      ],
      `Perímetro = 4 × ${side} = ${result} cm.`,
      ['perimetro', 'cuadrado']
    )
  }

  if (d === 2) {
    const width = ri(3, 12)
    const height = ri(2, 10)
    const result = 2 * (width + height)

    return mc(
      skill, d, seed,
      `Un rectángulo mide ${width} cm de largo y ${height} cm de ancho. ¿Cuál es su perímetro?`,
      `${result} cm`,
      [
        `${width * height} cm`,
        `${width + height} cm`,
        `${result + 2} cm`,
      ],
      `Perímetro = 2 × (${width} + ${height}) = ${result} cm.`,
      ['perimetro', 'rectangulo']
    )
  }

  if (d === 3) {
    const a = ri(3, 9)
    const b = ri(3, 9)
    const c = ri(3, 9)
    const result = a + b + c

    return mc(
      skill, d, seed,
      `Un terreno triangular tiene lados de ${a} m, ${b} m y ${c} m. ¿Cuántos metros de valla hacen falta para rodearlo?`,
      `${result} m`,
      [
        `${a * b} m`,
        `${result + c} m`,
        `${a + b} m`,
      ],
      `Hay que calcular el perímetro: ${a}+${b}+${c}=${result} m.`,
      ['perimetro', 'problema']
    )
  }

  if (d === 4) {
    const width = ri(4, 12)
    const height = ri(3, 10)
    const perimeter = 2 * (width + height)

    return mc(
      skill, d, seed,
      `Un rectángulo tiene ${width} cm de largo y un perímetro de ${perimeter} cm. ¿Cuánto mide su ancho?`,
      `${height} cm`,
      [
        `${perimeter - width} cm`,
        `${width + height} cm`,
        `${height * 2} cm`,
      ],
      `La mitad del perímetro es ${perimeter / 2}. Entonces el ancho es ${perimeter / 2}-${width}=${height} cm.`,
      ['perimetro', 'medida_desconocida']
    )
  }

  const side = ri(4, 15)
  const perimeter = side * 4

  return mc(
    skill, d, seed,
    `Una parcela cuadrada necesita ${perimeter} m de valla para cerrar todo su contorno. ¿Cuánto mide cada lado?`,
    `${side} m`,
    [
      `${perimeter / 2} m`,
      `${side * 2} m`,
      `${perimeter - 4} m`,
    ],
    `En un cuadrado los cuatro lados son iguales: ${perimeter}÷4=${side} m.`,
    ['perimetro', 'problema_inverso', 'dificultad_alta']
  )
}

// M12S02 · Área de rectángulo y cuadrado
if (key === 'rectangle_square_area') {
  if (d === 1) {
    const side = ri(3, 12)
    const result = side * side

    return mc(
      skill, d, seed,
      `Un cuadrado tiene ${side} cm de lado. ¿Cuál es su área?`,
      `${result} cm²`,
      [
        `${side * 4} cm²`,
        `${side * 2} cm²`,
        `${result + side} cm²`,
      ],
      `Área = lado × lado = ${side} × ${side} = ${result} cm².`,
      ['area_cuadrado']
    )
  }

  if (d === 2) {
    const base = ri(4, 14)
    const height = ri(3, 10)
    const result = base * height

    return mc(
      skill, d, seed,
      `Un rectángulo mide ${base} cm de base y ${height} cm de altura. ¿Cuál es su área?`,
      `${result} cm²`,
      [
        `${2 * (base + height)} cm²`,
        `${base + height} cm²`,
        `${result + base} cm²`,
      ],
      `Área = ${base} × ${height} = ${result} cm².`,
      ['area_rectangulo']
    )
  }

  if (d === 3) {
    const base = ri(4, 15)
    const height = ri(3, 10)
    const result = base * height

    const contexts = [
      `Una pared rectangular mide ${base} m de largo y ${height} m de alto. ¿Qué superficie tiene?`,
      `Un jardín rectangular mide ${base} m por ${height} m. ¿Cuál es su área?`,
      `Una pista rectangular mide ${base} m de largo y ${height} m de ancho. ¿Qué superficie ocupa?`,
    ]

    return mc(
      skill, d, seed,
      contexts[ri(0, contexts.length - 1)],
      `${result} m²`,
      [
        `${2 * (base + height)} m²`,
        `${base + height} m²`,
        `${result + height} m²`,
      ],
      `Área = ${base} × ${height} = ${result} m².`,
      ['area_rectangulo', 'problema']
    )
  }

  if (d === 4) {
    const height = ri(3, 10)
    const base = ri(4, 14)
    const area = base * height

    return mc(
      skill, d, seed,
      `Un rectángulo tiene un área de ${area} cm² y una altura de ${height} cm. ¿Cuánto mide su base?`,
      `${base} cm`,
      [
        `${area - height} cm`,
        `${base + height} cm`,
        `${height * 2} cm`,
      ],
      `Base = área ÷ altura = ${area}÷${height}=${base} cm.`,
      ['area_rectangulo', 'medida_desconocida']
    )
  }

  const side = ri(4, 12)
  const area = side * side
  const perimeter = side * 4

  return mc(
    skill, d, seed,
    `Un cuadrado tiene un área de ${area} cm². ¿Cuál es su perímetro?`,
    `${perimeter} cm`,
    [
      `${area * 4} cm`,
      `${side * 2} cm`,
      `${area / 2} cm`,
    ],
    `Si el área es ${area} cm², el lado mide ${side} cm. Perímetro = 4×${side}=${perimeter} cm.`,
    ['area_cuadrado', 'perimetro', 'varios_pasos', 'dificultad_alta']
  )
}

// M12S03 · Área de triángulo
if (key === 'triangle_area') {
  if (d <= 2) {
    const base = ri(3, 12) * 2
    const height = ri(2, 10)
    const result = (base * height) / 2

    return mc(
      skill, d, seed,
      `Un triángulo tiene ${base} cm de base y ${height} cm de altura. ¿Cuál es su área?`,
      `${result} cm²`,
      [
        `${base * height} cm²`,
        `${base + height} cm²`,
        `${result + height} cm²`,
      ],
      `Área = (${base} × ${height}) ÷ 2 = ${result} cm².`,
      ['area_triangulo']
    )
  }

  if (d === 3) {
    const base = ri(4, 14) * 2
    const height = ri(3, 10)
    const result = (base * height) / 2

    return mc(
      skill, d, seed,
      `Una parcela triangular tiene ${base} m de base y ${height} m de altura. ¿Qué superficie ocupa?`,
      `${result} m²`,
      [
        `${base * height} m²`,
        `${base + height} m²`,
        `${result * 2 + height} m²`,
      ],
      `Área del triángulo = (${base}×${height})÷2=${result} m².`,
      ['area_triangulo', 'problema']
    )
  }

  if (d === 4) {
    const height = ri(3, 10)
    const base = ri(3, 12) * 2
    const area = (base * height) / 2

    return mc(
      skill, d, seed,
      `Un triángulo tiene un área de ${area} cm² y una altura de ${height} cm. ¿Cuánto mide su base?`,
      `${base} cm`,
      [
        `${area / height} cm`,
        `${area - height} cm`,
        `${base / 2} cm`,
      ],
      `Base = (2×área)÷altura = (2×${area})÷${height}=${base} cm.`,
      ['area_triangulo', 'medida_desconocida']
    )
  }

  const base = ri(4, 12) * 2
  const height = ri(3, 10)
  const rectangleArea = base * height
  const triangleArea = rectangleArea / 2

  return mc(
    skill, d, seed,
    `Un rectángulo de ${base} cm por ${height} cm se corta por una diagonal formando dos triángulos iguales. ¿Cuál es el área de cada triángulo?`,
    `${triangleArea} cm²`,
    [
      `${rectangleArea} cm²`,
      `${base + height} cm²`,
      `${triangleArea * 2 + height} cm²`,
    ],
    `El rectángulo ocupa ${rectangleArea} cm². La diagonal lo divide en dos partes iguales: ${rectangleArea}÷2=${triangleArea} cm².`,
    ['area_triangulo', 'razonamiento', 'dificultad_alta']
  )
}

// M12S04 · Área de paralelogramo y trapecio
if (key === 'quadrilateral_area') {
  if (d <= 2) {
    const base = ri(4, 14)
    const height = ri(3, 10)
    const result = base * height

    return mc(
      skill, d, seed,
      `Un paralelogramo tiene ${base} cm de base y ${height} cm de altura. ¿Cuál es su área?`,
      `${result} cm²`,
      [
        `${2 * (base + height)} cm²`,
        `${base + height} cm²`,
        `${result + height} cm²`,
      ],
      `Área = base × altura = ${base}×${height}=${result} cm².`,
      ['area_paralelogramo']
    )
  }

  if (d === 3) {
    const base1 = ri(6, 14)
    const base2 = ri(2, base1 - 2)
    const height = ri(2, 8) * 2
    const result = ((base1 + base2) * height) / 2

    return mc(
      skill, d, seed,
      `Un trapecio tiene bases de ${base1} cm y ${base2} cm y altura de ${height} cm. ¿Cuál es su área?`,
      `${result} cm²`,
      [
        `${(base1 + base2) * height} cm²`,
        `${base1 * base2} cm²`,
        `${base1 + base2 + height} cm²`,
      ],
      `Área = ((${base1}+${base2})×${height})÷2=${result} cm².`,
      ['area_trapecio']
    )
  }

  if (d === 4) {
    const base = ri(5, 14)
    const height = ri(3, 10)
    const area = base * height

    return mc(
      skill, d, seed,
      `Un paralelogramo tiene un área de ${area} cm² y una base de ${base} cm. ¿Cuál es su altura?`,
      `${height} cm`,
      [
        `${area - base} cm`,
        `${base + height} cm`,
        `${height * 2} cm`,
      ],
      `Altura = área ÷ base = ${area}÷${base}=${height} cm.`,
      ['area_paralelogramo', 'medida_desconocida']
    )
  }

  const base1 = ri(8, 16)
  const base2 = ri(3, base1 - 2)
  const height = ri(2, 7) * 2
  const area = ((base1 + base2) * height) / 2

  return mc(
    skill, d, seed,
    `Una parcela con forma de trapecio tiene bases de ${base1} m y ${base2} m y altura de ${height} m. Si cada metro cuadrado cuesta 2 €, ¿cuánto cuesta cubrir toda la parcela?`,
    `${area * 2} €`,
    [
      `${area} €`,
      `${(base1 + base2) * height * 2} €`,
      `${area + 2} €`,
    ],
    `Primero calculamos el área: ${area} m². Después: ${area}×2=${area * 2} €.`,
    ['area_trapecio', 'problema', 'varios_pasos', 'dificultad_alta']
  )
}

// M12S05 · Circunferencia y círculo
if (key === 'circle_measure') {
  if (d === 1) {
    const radius = ri(2, 10)
    const diameter = radius * 2

    return mc(
      skill, d, seed,
      `Un círculo tiene radio de ${radius} cm. ¿Cuál es su diámetro?`,
      `${diameter} cm`,
      [
        `${radius} cm`,
        `${radius * 3} cm`,
        `${diameter + 1} cm`,
      ],
      `Diámetro = 2×radio = 2×${radius}=${diameter} cm.`,
      ['diametro_circulo']
    )
  }

  if (d === 2) {
    const diameter = ri(2, 10) * 2
    const radius = diameter / 2

    return mc(
      skill, d, seed,
      `Una circunferencia tiene ${diameter} cm de diámetro. ¿Cuál es su radio?`,
      `${radius} cm`,
      [
        `${diameter} cm`,
        `${diameter * 2} cm`,
        `${radius + 2} cm`,
      ],
      `Radio = diámetro÷2 = ${diameter}÷2=${radius} cm.`,
      ['radio_circulo']
    )
  }

  if (d === 3) {
    const diameter = ri(2, 10) * 2
    const result = 3.14 * diameter

    return mc(
      skill, d, seed,
      `Una circunferencia tiene diámetro de ${diameter} cm. Usando π ≈ 3,14, ¿cuánto mide aproximadamente su longitud?`,
      `${result.toFixed(2)} cm`,
      [
        `${(3.14 * (diameter / 2)).toFixed(2)} cm`,
        `${(diameter * 2).toFixed(2)} cm`,
        `${(diameter + 3.14).toFixed(2)} cm`,
      ],
      `Longitud ≈ π×diámetro = 3,14×${diameter}=${result.toFixed(2)} cm.`,
      ['longitud_circunferencia']
    )
  }

  if (d === 4) {
    const radius = ri(2, 10)
    const area = 3.14 * radius * radius

    return mc(
      skill, d, seed,
      `Un círculo tiene radio de ${radius} cm. Usando π ≈ 3,14, ¿cuál es aproximadamente su área?`,
      `${area.toFixed(2)} cm²`,
      [
        `${(3.14 * radius * 2).toFixed(2)} cm²`,
        `${(3.14 * radius).toFixed(2)} cm²`,
        `${(radius * radius).toFixed(2)} cm²`,
      ],
      `Área ≈ π×r² = 3,14×${radius}²=${area.toFixed(2)} cm².`,
      ['area_circulo']
    )
  }

  const radius = ri(2, 8)
  const circumference = 2 * 3.14 * radius
  const area = 3.14 * radius * radius

  return mc(
    skill, d, seed,
    `Una pista circular tiene radio de ${radius} m. Usando π ≈ 3,14, ¿qué pareja indica correctamente su longitud exterior y su área?`,
    `${circumference.toFixed(2)} m y ${area.toFixed(2)} m²`,
    [
      `${area.toFixed(2)} m y ${circumference.toFixed(2)} m²`,
      `${(3.14 * radius).toFixed(2)} m y ${area.toFixed(2)} m²`,
      `${circumference.toFixed(2)} m y ${(radius * radius).toFixed(2)} m²`,
    ],
    `Longitud = 2πr ≈ ${circumference.toFixed(2)} m. Área = πr² ≈ ${area.toFixed(2)} m².`,
    ['circulo', 'longitud', 'area', 'dificultad_alta']
  )
}

// M12S06 · Figuras compuestas
if (key === 'composite_area') {
  if (d <= 2) {
    const width1 = ri(3, 8)
    const height1 = ri(2, 6)
    const width2 = ri(2, 6)
    const height2 = ri(2, 5)
    const area1 = width1 * height1
    const area2 = width2 * height2
    const result = area1 + area2

    return mc(
      skill, d, seed,
      `Una figura está formada por dos rectángulos sin solaparse. Uno mide ${width1} cm × ${height1} cm y el otro ${width2} cm × ${height2} cm. ¿Cuál es el área total?`,
      `${result} cm²`,
      [
        `${area1} cm²`,
        `${area2} cm²`,
        `${result + width2} cm²`,
      ],
      `Área total = ${area1}+${area2}=${result} cm².`,
      ['figuras_compuestas']
    )
  }

  if (d === 3) {
    const bigW = ri(7, 12)
    const bigH = ri(6, 10)
    const cutW = ri(2, 4)
    const cutH = ri(2, 4)
    const result = bigW * bigH - cutW * cutH

    return mc(
      skill, d, seed,
      `Una figura se obtiene de un rectángulo de ${bigW} cm × ${bigH} cm quitando una esquina rectangular de ${cutW} cm × ${cutH} cm. ¿Qué área queda?`,
      `${result} cm²`,
      [
        `${bigW * bigH} cm²`,
        `${cutW * cutH} cm²`,
        `${result + cutW * cutH} cm²`,
      ],
      `Área = ${bigW}×${bigH} - ${cutW}×${cutH} = ${result} cm².`,
      ['figuras_compuestas', 'resta_areas']
    )
  }

  if (d === 4) {
    const rectW = ri(5, 10)
    const rectH = ri(3, 7)
    const triBase = ri(3, 8) * 2
    const triHeight = ri(2, 6)
    const rectArea = rectW * rectH
    const triArea = (triBase * triHeight) / 2
    const result = rectArea + triArea

    return mc(
      skill, d, seed,
      `Una figura está formada por un rectángulo de ${rectW} cm × ${rectH} cm y un triángulo de base ${triBase} cm y altura ${triHeight} cm, sin solaparse. ¿Cuál es el área total?`,
      `${result} cm²`,
      [
        `${rectArea} cm²`,
        `${rectArea + triBase * triHeight} cm²`,
        `${triArea} cm²`,
      ],
      `Rectángulo: ${rectArea} cm². Triángulo: ${triArea} cm². Total: ${result} cm².`,
      ['figuras_compuestas', 'rectangulo_triangulo']
    )
  }

  const bigW = ri(8, 14)
  const bigH = ri(7, 12)
  const cutW = ri(2, 5)
  const cutH = ri(2, 5)
  const remainingArea = bigW * bigH - cutW * cutH
  const price = ri(2, 5)
  const cost = remainingArea * price

  return mc(
    skill, d, seed,
    `Un suelo rectangular de ${bigW} m × ${bigH} m tiene una zona de ${cutW} m × ${cutH} m que no se va a cubrir. Si cubrir cada m² cuesta ${price} €, ¿cuál es el coste total?`,
    `${cost} €`,
    [
      `${bigW * bigH * price} €`,
      `${remainingArea} €`,
      `${cutW * cutH * price} €`,
    ],
    `Área útil = ${bigW * bigH}-${cutW * cutH}=${remainingArea} m². Coste = ${remainingArea}×${price}=${cost} €.`,
    ['figuras_compuestas', 'problema', 'varios_pasos', 'dificultad_alta']
  )
} 
// =========================
// M13 · TABLAS Y GRÁFICAS
// =========================

// M13S01 · Coordenadas cartesianas
if (key === 'coordinates') {
  if (d === 1) {
    const x = ri(0, 6)
    const y = ri(0, 6)

    return mc(
      skill,
      d,
      seed,
      `¿Qué coordenadas tiene el punto P si está en x = ${x} e y = ${y}?`,
      `(${x}, ${y})`,
      [
        `(${y}, ${x})`,
        `(${-x}, ${y})`,
        `(${x}, ${-y})`,
      ],
      `Las coordenadas se escriben como (x, y). P = (${x}, ${y}).`,
      ['coordenadas_cartesianas']
    )
  }

  if (d === 2) {
    let x = ri(-6, 6)
    let y = ri(-6, 6)

    if (x === 0) x = 2
    if (y === 0) y = -3

    return mc(
      skill,
      d,
      seed,
      `Un punto está ${Math.abs(x)} unidades ${x > 0 ? 'a la derecha' : 'a la izquierda'} del origen y ${Math.abs(y)} unidades ${y > 0 ? 'por encima' : 'por debajo'}. ¿Cuáles son sus coordenadas?`,
      `(${x}, ${y})`,
      [
        `(${y}, ${x})`,
        `(${-x}, ${y})`,
        `(${x}, ${-y})`,
      ],
      `El desplazamiento horizontal da x=${x} y el vertical y=${y}.`,
      ['coordenadas_cartesianas', 'signos']
    )
  }

  if (d === 3) {
    const quadrant = ri(1, 4)

    const answer =
      quadrant === 1
        ? 'x positiva, y positiva'
        : quadrant === 2
          ? 'x negativa, y positiva'
          : quadrant === 3
            ? 'x negativa, y negativa'
            : 'x positiva, y negativa'

    return mc(
      skill,
      d,
      seed,
      `¿Qué signos tienen las coordenadas de un punto situado en el cuadrante ${quadrant}?`,
      answer,
      [
        'x positiva, y positiva',
        'x negativa, y positiva',
        'x negativa, y negativa',
        'x positiva, y negativa',
      ].filter((x) => x !== answer),
      `En el cuadrante ${quadrant}, los signos son: ${answer}.`,
      ['coordenadas_cartesianas', 'cuadrantes']
    )
  }

  if (d === 4) {
    const x = ri(-6, 6)
    const y = ri(-6, 6)
    const moveX = ri(2, 6)
    const moveY = ri(2, 6)

    const newX = x + moveX
    const newY = y - moveY

    return mc(
      skill,
      d,
      seed,
      `El punto P está en (${x}, ${y}). Se desplaza ${moveX} unidades a la derecha y ${moveY} hacia abajo. ¿Dónde queda?`,
      `(${newX}, ${newY})`,
      [
        `(${x - moveX}, ${y - moveY})`,
        `(${x + moveX}, ${y + moveY})`,
        `(${newY}, ${newX})`,
      ],
      `Derecha: x+${moveX}. Abajo: y-${moveY}. Resultado: (${newX}, ${newY}).`,
      ['coordenadas_cartesianas', 'desplazamientos']
    )
  }

  const x = ri(-8, 8)
  const y = ri(-8, 8)
  const reflectedX = -x

  return mc(
    skill,
    d,
    seed,
    `El punto P = (${x}, ${y}) se refleja respecto del eje Y. ¿Cuáles son las coordenadas de su imagen?`,
    `(${reflectedX}, ${y})`,
    [
      `(${x}, ${-y})`,
      `(${-x}, ${-y})`,
      `(${y}, ${x})`,
    ],
    `Al reflejar respecto del eje Y cambia el signo de x y se conserva y: (${reflectedX}, ${y}).`,
    ['coordenadas_cartesianas', 'simetria', 'dificultad_alta']
  )
}

// M13S02 · Leer tablas de valores
if (key === 'value_tables') {
  if (d === 1) {
    const factor = ri(2, 5)
    const x = ri(2, 8)
    const y = x * factor

    return mc(
      skill,
      d,
      seed,
      `En una tabla se cumple y = ${factor}x. ¿Cuánto vale y cuando x = ${x}?`,
      String(y),
      [
        String(x + factor),
        String(x),
        String(y + factor),
      ],
      `y = ${factor} × ${x} = ${y}.`,
      ['lectura_tablas']
    )
  }

  if (d === 2) {
    const factor = ri(2, 6)
    const x1 = ri(1, 4)
    const x2 = x1 + ri(2, 5)
    const y1 = x1 * factor
    const y2 = x2 * factor

    return mc(
      skill,
      d,
      seed,
      `Una tabla contiene (${x1}, ${y1}) y sigue la regla y = ${factor}x. ¿Qué pareja corresponde a x = ${x2}?`,
      `(${x2}, ${y2})`,
      [
        `(${x2}, ${y1})`,
        `(${y2}, ${x2})`,
        `(${x2}, ${x2 + factor})`,
      ],
      `Para x=${x2}: y=${factor}×${x2}=${y2}.`,
      ['lectura_tablas', 'pares_valores']
    )
  }

  if (d === 3) {
    const factor = ri(2, 7)
    const x = ri(2, 8)
    const y = factor * x

    return mc(
      skill,
      d,
      seed,
      `En una tabla de proporcionalidad aparece x=${x}, y=${y}. ¿Cuál es la constante y/x?`,
      String(factor),
      [
        String(x),
        String(y),
        String(x + factor),
      ],
      `${y}÷${x}=${factor}.`,
      ['lectura_tablas', 'constante']
    )
  }

  if (d === 4) {
    const a = ri(2, 5)
    const b = ri(1, 8)
    const x = ri(2, 8)
    const y = a * x + b

    return mc(
      skill,
      d,
      seed,
      `Una tabla sigue la regla y = ${a}x + ${b}. ¿Qué valor de y corresponde a x = ${x}?`,
      String(y),
      [
        String(a + x + b),
        String(a * (x + b)),
        String(y - b),
      ],
      `Sustituimos x=${x}: y=${a}×${x}+${b}=${y}.`,
      ['lectura_tablas', 'regla_lineal']
    )
  }

  const a = ri(2, 5)
  const b = ri(-6, 6)
  const x1 = ri(1, 5)
  const x2 = x1 + 2

  const y1 = a * x1 + b
  const y2 = a * x2 + b

  return mc(
    skill,
    d,
    seed,
    `Una tabla contiene los pares (${x1}, ${y1}) y (${x2}, ${y2}). ¿Qué regla los relaciona?`,
    `y = ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`,
    [
      `y = ${a + 1}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`,
      `y = ${a}x ${b >= 0 ? '-' : '+'} ${Math.abs(b)}`,
      `y = x + ${a}`,
    ],
    `Los dos pares cumplen y = ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}.`,
    ['lectura_tablas', 'deducir_regla', 'dificultad_alta']
  )
}

// M13S03 · Elegir representación gráfica
if (key === 'plot_graph') {
  const easy = [
    {
      situation: 'mostrar cómo cambia la temperatura a lo largo de un día',
      answer: 'Gráfico de líneas',
      solution: 'El gráfico de líneas muestra bien la evolución de una magnitud con el tiempo.',
      distractors: ['Gráfico de barras', 'Diagrama de sectores', 'Pictograma'],
    },
    {
      situation: 'comparar el número de alumnos que prefieren fútbol, baloncesto y tenis',
      answer: 'Gráfico de barras',
      solution: 'Las barras permiten comparar fácilmente categorías diferentes.',
      distractors: ['Gráfico de líneas', 'Diagrama de sectores', 'Plano cartesiano'],
    },
    {
      situation: 'mostrar qué porcentaje del presupuesto corresponde a cada categoría',
      answer: 'Diagrama de sectores',
      solution: 'Un diagrama de sectores representa partes de un total.',
      distractors: ['Gráfico de líneas', 'Gráfico de barras', 'Plano cartesiano'],
    },
  ]

  const medium = [
    {
      situation: 'comparar las ventas de cinco tiendas durante el mismo mes',
      answer: 'Gráfico de barras',
      solution: 'Se comparan categorías independientes: las cinco tiendas.',
      distractors: ['Gráfico de líneas', 'Plano cartesiano', 'Diagrama de dispersión'],
    },
    {
      situation: 'seguir la evolución del número de visitantes de una web durante doce meses',
      answer: 'Gráfico de líneas',
      solution: 'Nos interesa observar cómo cambia una variable a lo largo del tiempo.',
      distractors: ['Diagrama de sectores', 'Pictograma', 'Gráfico circular'],
    },
    {
      situation: 'mostrar cómo se reparte el tiempo diario entre dormir, estudiar, ocio y deporte',
      answer: 'Diagrama de sectores',
      solution: 'Las categorías forman partes de un total diario.',
      distractors: ['Gráfico de líneas', 'Plano cartesiano', 'Diagrama de dispersión'],
    },
  ]

  const hard = [
    {
      situation: 'estudiar si existe relación entre las horas de estudio y la nota obtenida por distintos alumnos',
      answer: 'Diagrama de dispersión',
      solution: 'Un diagrama de dispersión permite estudiar la relación entre dos variables numéricas.',
      distractors: ['Diagrama de sectores', 'Pictograma', 'Gráfico de barras'],
    },
    {
      situation: 'representar la trayectoria de puntos definidos mediante parejas (x, y)',
      answer: 'Plano cartesiano',
      solution: 'Las parejas ordenadas se representan mediante coordenadas en un plano cartesiano.',
      distractors: ['Diagrama de sectores', 'Pictograma', 'Gráfico circular'],
    },
    {
      situation: 'comparar frecuencias de varias categorías y detectar rápidamente cuál es la mayor',
      answer: 'Gráfico de barras',
      solution: 'Las alturas de las barras permiten comparar las frecuencias directamente.',
      distractors: ['Diagrama de dispersión', 'Plano cartesiano', 'Gráfico de líneas'],
    },
  ]

  const pool = d <= 2 ? easy : d <= 4 ? medium : hard
  const v = pool[ri(0, pool.length - 1)]

  return mc(
    skill,
    d,
    seed,
    `¿Qué tipo de gráfica es más adecuada para ${v.situation}?`,
    v.answer,
    v.distractors,
    v.solution,
    ['representacion_grafica', `dificultad_${d}`]
  )
}

// M13S04 · Interpretar gráficas
if (key === 'graph_interpret') {
  if (d === 1) {
    const a = ri(10, 25)
    const b = ri(10, 25)
    const c = Math.max(a, b) + ri(2, 8)

    return mc(
      skill,
      d,
      seed,
      `Un gráfico de barras muestra: fútbol ${a}, baloncesto ${b} y tenis ${c}. ¿Qué deporte tiene mayor frecuencia?`,
      'Tenis',
      ['Fútbol', 'Baloncesto', 'Todos igual'],
      `El valor mayor es ${c}, correspondiente a tenis.`,
      ['interpretacion_graficas', 'maximo']
    )
  }

  if (d === 2) {
    const monday = ri(10, 30)
    const tuesday = monday + ri(3, 10)
    const wednesday = ri(8, monday)
    const difference = tuesday - wednesday

    return mc(
      skill,
      d,
      seed,
      `Una gráfica muestra ventas de ${monday} el lunes, ${tuesday} el martes y ${wednesday} el miércoles. ¿Cuántas ventas más hubo el martes que el miércoles?`,
      String(difference),
      [
        String(tuesday + wednesday),
        String(tuesday - monday),
        String(monday - wednesday),
      ],
      `${tuesday}-${wednesday}=${difference}.`,
      ['interpretacion_graficas', 'diferencia']
    )
  }

  if (d === 3) {
    const jan = ri(10, 20)
    const feb = jan + ri(2, 8)
    const mar = feb + ri(2, 8)
    const increase = mar - jan

    return mc(
      skill,
      d,
      seed,
      `Un gráfico de líneas registra ${jan} unidades en enero, ${feb} en febrero y ${mar} en marzo. ¿Cuánto ha aumentado desde enero hasta marzo?`,
      String(increase),
      [
        String(mar + jan),
        String(feb - jan),
        String(mar),
      ],
      `${mar}-${jan}=${increase}.`,
      ['interpretacion_graficas', 'evolucion']
    )
  }

  if (d === 4) {
    const values = [
      ri(10, 30),
      ri(10, 30),
      ri(10, 30),
      ri(10, 30),
    ]

    const total = values.reduce((sum, value) => sum + value, 0)
    const average = total / values.length

    return mc(
      skill,
      d,
      seed,
      `Una gráfica muestra cuatro valores: ${values.join(', ')}. ¿Cuál es su media?`,
      String(average),
      [
        String(total),
        String(Math.max(...values)),
        String(Math.min(...values)),
      ],
      `Sumamos: ${total}. Dividimos entre 4: ${total}÷4=${average}.`,
      ['interpretacion_graficas', 'media']
    )
  }

  const start = ri(20, 40)
  const peak = start + ri(8, 20)
  const end = peak - ri(3, 10)
  const netChange = end - start

  return mc(
    skill,
    d,
    seed,
    `Una gráfica de líneas comienza en ${start}, sube hasta ${peak} y termina en ${end}. ¿Cuál es el cambio neto entre el inicio y el final?`,
    String(netChange),
    [
      String(peak - start),
      String(peak - end),
      String(end + start),
    ],
    `El cambio neto compara únicamente el valor final con el inicial: ${end}-${start}=${netChange}.`,
    ['interpretacion_graficas', 'cambio_neto', 'dificultad_alta']
  )
}
// =========================
// M14 · ESTADÍSTICA
// =========================

// M14S01 · Población, muestra e individuo
if (key === 'stats_population') {
  const easy = [
    {
      prompt:
        'En un instituto se quiere estudiar la altura de todos los alumnos de 1º ESO. ¿Cuál es la población?',
      answer: 'Todos los alumnos de 1º ESO',
      distractors: [
        'Un alumno cualquiera',
        'Los 20 alumnos medidos',
        'Las alturas obtenidas',
      ],
      solution:
        'La población es el conjunto completo que se quiere estudiar.',
    },
    {
      prompt:
        'De 500 clientes se eligen 50 para responder una encuesta. ¿Qué son esos 50 clientes?',
      answer: 'La muestra',
      distractors: [
        'La población',
        'La variable',
        'La frecuencia',
      ],
      solution:
        'La muestra es una parte de la población utilizada para realizar el estudio.',
    },
    {
      prompt:
        'En un estudio sobre hábitos deportivos, cada persona encuestada es...',
      answer: 'Un individuo',
      distractors: [
        'Una muestra',
        'Una variable',
        'Una frecuencia',
      ],
      solution:
        'Cada elemento de la población es un individuo.',
    },
  ]

  if (d <= 2) {
    const v = easy[ri(0, easy.length - 1)]

    return mc(
      skill,
      d,
      seed,
      v.prompt,
      v.answer,
      v.distractors,
      v.solution,
      ['poblacion_muestra_individuo']
    )
  }

  if (d === 3) {
    return mc(
      skill,
      d,
      seed,
      'Una ciudad tiene 20.000 habitantes. Se entrevista a 400 para estudiar sus hábitos de transporte. ¿Cuál es la muestra?',
      'Los 400 habitantes entrevistados',
      [
        'Los 20.000 habitantes',
        'Los medios de transporte',
        'Una sola persona entrevistada',
      ],
      'La muestra está formada por las 400 personas seleccionadas.',
      ['poblacion_muestra_individuo', 'contexto']
    )
  }

  if (d === 4) {
    return mc(
      skill,
      d,
      seed,
      'En un estudio sobre el tiempo de uso del móvil de todos los alumnos de un centro, se seleccionan 80 alumnos. ¿Cuál es la población?',
      'Todos los alumnos del centro',
      [
        'Los 80 alumnos seleccionados',
        'El tiempo de uso del móvil',
        'Cada teléfono móvil',
      ],
      'La población es el conjunto total sobre el que se desea obtener información.',
      ['poblacion_muestra_individuo', 'razonamiento']
    )
  }

  return mc(
    skill,
    d,
    seed,
    'Se estudia el consumo eléctrico de todas las viviendas de una ciudad usando datos de 600 viviendas seleccionadas. ¿Qué afirmación es correcta?',
    'Las viviendas de la ciudad forman la población y las 600 seleccionadas forman la muestra',
    [
      'Las 600 viviendas forman la población',
      'El consumo eléctrico es la muestra',
      'Cada ciudad es un individuo',
    ],
    'La población es el conjunto completo y la muestra es el subconjunto observado.',
    ['poblacion_muestra_individuo', 'razonamiento', 'dificultad_alta']
  )
}

// M14S02 · Variables estadísticas
if (key === 'stats_variables') {
  if (d === 1) {
    const variants = [
      {
        prompt:
          'La altura de una persona, medida en centímetros, es una variable...',
        answer: 'Cuantitativa',
        distractors: [
          'Cualitativa',
          'No estadística',
          'Nominal',
        ],
        solution:
          'La altura se expresa mediante números.',
      },
      {
        prompt:
          'El color favorito de una persona es una variable...',
        answer: 'Cualitativa',
        distractors: [
          'Cuantitativa',
          'Continua',
          'Numérica',
        ],
        solution:
          'El color favorito describe una categoría.',
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
      v.solution,
      ['variables_estadisticas']
    )
  }

  if (d === 2) {
    const variants = [
      {
        prompt:
          'El número de hermanos de un alumno es una variable...',
        answer: 'Cuantitativa discreta',
        distractors: [
          'Cualitativa',
          'Cuantitativa continua',
          'No estadística',
        ],
        solution:
          'Es numérica y solo puede tomar valores enteros contables.',
      },
      {
        prompt:
          'El número de libros leídos durante un mes es una variable...',
        answer: 'Cuantitativa discreta',
        distractors: [
          'Cualitativa',
          'Cuantitativa continua',
          'Nominal',
        ],
        solution:
          'Los libros se cuentan mediante números enteros.',
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
      v.solution,
      ['variables_estadisticas', 'discreta']
    )
  }

  if (d === 3) {
    const variants = [
      'La masa de una persona medida con precisión',
      'La temperatura de una habitación',
      'El tiempo empleado en recorrer una distancia',
    ]

    const variable = variants[ri(0, variants.length - 1)]

    return mc(
      skill,
      d,
      seed,
      `${variable} es una variable...`,
      'Cuantitativa continua',
      [
        'Cuantitativa discreta',
        'Cualitativa',
        'No estadística',
      ],
      'Puede tomar cualquier valor dentro de un intervalo, por eso es continua.',
      ['variables_estadisticas', 'continua']
    )
  }

  if (d === 4) {
    return mc(
      skill,
      d,
      seed,
      '¿Cuál de estas variables es cualitativa?',
      'El medio de transporte utilizado para ir al instituto',
      [
        'La distancia recorrida en kilómetros',
        'El número de hermanos',
        'La temperatura corporal',
      ],
      'El medio de transporte describe categorías, no cantidades numéricas.',
      ['variables_estadisticas', 'clasificacion']
    )
  }

  return mc(
    skill,
    d,
    seed,
    '¿Qué pareja está correctamente clasificada?',
    'Número de mascotas: cuantitativa discreta; altura: cuantitativa continua',
    [
      'Número de mascotas: continua; altura: discreta',
      'Color de ojos: cuantitativa; altura: cualitativa',
      'Temperatura: discreta; deporte favorito: cuantitativa',
    ],
    'Las mascotas se cuentan y la altura se mide sobre una escala continua.',
    ['variables_estadisticas', 'razonamiento', 'dificultad_alta']
  )
}

// M14S03 · Tabla de frecuencias
if (key === 'frequency_table') {
  if (d === 1) {
    const target = ri(1, 5)
    const frequency = ri(2, 5)

    const values = [
      target,
      target + 1,
      target,
      target + 2,
      target,
      target + 3,
    ]

    if (frequency >= 4) values.push(target)
    if (frequency >= 5) values.push(target)

    return mc(
      skill,
      d,
      seed,
      `En los datos ${values.join(', ')}, ¿cuál es la frecuencia del valor ${target}?`,
      String(frequency),
      [
        String(Math.max(1, frequency - 1)),
        String(frequency + 1),
        String(values.length),
      ],
      `El valor ${target} aparece ${frequency} veces.`,
      ['tabla_frecuencias']
    )
  }

  if (d === 2) {
    const a = ri(1, 4)
    const b = a + 1
    const c = a + 2

    const freqA = ri(1, 3)
    const freqB = ri(3, 5)
    const freqC = ri(1, 2)

    const total = freqA + freqB + freqC

    return mc(
      skill,
      d,
      seed,
      `Una tabla muestra: ${a} aparece ${freqA} veces, ${b} aparece ${freqB} veces y ${c} aparece ${freqC} veces. ¿Cuántos datos hay en total?`,
      String(total),
      [
        String(freqB),
        String(a + b + c),
        String(total + 1),
      ],
      `Sumamos las frecuencias: ${freqA}+${freqB}+${freqC}=${total}.`,
      ['tabla_frecuencias', 'frecuencia_total']
    )
  }

  if (d === 3) {
    const total = ri(20, 50)
    const frequency = ri(5, total - 5)
    const relative = frequency / total

    return mc(
      skill,
      d,
      seed,
      `En un grupo de ${total} personas, ${frequency} eligen una opción. ¿Cuál es su frecuencia relativa?`,
      String(relative),
      [
        String(frequency),
        String(total - frequency),
        String(total / frequency),
      ],
      `Frecuencia relativa = ${frequency}/${total} = ${relative}.`,
      ['tabla_frecuencias', 'frecuencia_relativa']
    )
  }

  if (d === 4) {
    const values = [2, 3, 4, 5]
    const winnerIndex = ri(0, values.length - 1)
    const frequencies = [
      ri(1, 4),
      ri(1, 4),
      ri(1, 4),
      ri(1, 4),
    ]
    const maxOther = Math.max(
      ...frequencies.filter((_, index) => index !== winnerIndex)
    )
    frequencies[winnerIndex] = maxOther + ri(1, 3)

    const maxFreq = frequencies[winnerIndex]
    const answer = String(values[winnerIndex])

    return mc(
      skill,
      d,
      seed,
      `Una tabla tiene valores ${values.join(', ')} con frecuencias ${frequencies.join(', ')} respectivamente. ¿Qué valor tiene mayor frecuencia?`,
      answer,
      values
        .map(String)
        .filter((x) => x !== answer),
      `La frecuencia mayor es ${maxFreq}, correspondiente al valor ${answer}.`,
      ['tabla_frecuencias', 'interpretacion']
    )
  }

  const f1 = ri(2, 6)
  const f2 = ri(2, 6)
  const f3 = ri(2, 6)
  const knownTotal = f1 + f2 + f3
  const missing = ri(2, 6)
  const total = knownTotal + missing

  return mc(
    skill,
    d,
    seed,
    `Una tabla de frecuencias tiene valores con frecuencias ${f1}, ${f2}, ${f3} y una frecuencia desconocida. Si hay ${total} datos en total, ¿cuál es la frecuencia que falta?`,
    String(missing),
    [
      String(total),
      String(knownTotal),
      String(missing + 1),
    ],
    `Frecuencia desconocida = ${total}-(${f1}+${f2}+${f3})=${missing}.`,
    ['tabla_frecuencias', 'frecuencia_desconocida', 'dificultad_alta']
  )
}

// M14S04 · Gráficos estadísticos
if (key === 'stat_charts') {
  const easy = [
    {
      situation:
        'comparar el número de alumnos que eligen cada deporte',
      answer: 'Gráfico de barras',
      distractors: [
        'Gráfico de líneas',
        'Diagrama de sectores',
        'Plano cartesiano',
      ],
      solution:
        'Las barras permiten comparar categorías.',
    },
    {
      situation:
        'mostrar cómo se reparte un total entre varias categorías',
      answer: 'Diagrama de sectores',
      distractors: [
        'Gráfico de líneas',
        'Gráfico de barras',
        'Plano cartesiano',
      ],
      solution:
        'Los sectores representan partes de un total.',
    },
    {
      situation:
        'mostrar cómo cambia una temperatura durante varias horas',
      answer: 'Gráfico de líneas',
      distractors: [
        'Diagrama de sectores',
        'Gráfico de barras',
        'Pictograma',
      ],
      solution:
        'Las líneas permiten observar cambios a lo largo del tiempo.',
    },
  ]

  const hard = [
    {
      situation:
        'representar la distribución de alturas agrupadas en intervalos',
      answer: 'Histograma',
      distractors: [
        'Diagrama de sectores',
        'Pictograma',
        'Plano cartesiano',
      ],
      solution:
        'El histograma es apropiado para datos cuantitativos agrupados en intervalos.',
    },
    {
      situation:
        'estudiar la relación entre horas de estudio y nota obtenida',
      answer: 'Diagrama de dispersión',
      distractors: [
        'Diagrama de sectores',
        'Histograma',
        'Pictograma',
      ],
      solution:
        'El diagrama de dispersión permite analizar la relación entre dos variables numéricas.',
    },
  ]

  const pool = d <= 3 ? easy : hard
  const v = pool[ri(0, pool.length - 1)]

  return mc(
    skill,
    d,
    seed,
    `¿Qué gráfico es más adecuado para ${v.situation}?`,
    v.answer,
    v.distractors,
    v.solution,
    ['graficos_estadisticos', `dificultad_${d}`]
  )
}

// M14S05 · Media aritmética
if (key === 'mean') {
  if (d <= 2) {
    const result = ri(3, 10)
    const a = result - ri(0, 2)
    const b = result + ri(0, 2)
    const c = result - ri(0, 2)
    const d4 = result * 4 - a - b - c

    const values = [a, b, c, d4]
    const total = values.reduce((sum, value) => sum + value, 0)

    return mc(
      skill,
      d,
      seed,
      `Calcula la media de ${values.join(', ')}`,
      String(result),
      [
        String(total),
        String(Math.max(...values)),
        String(Math.min(...values)),
      ],
      `Sumamos ${total} y dividimos entre 4: ${total}/4=${result}.`,
      ['media_aritmetica']
    )
  }

  if (d === 3) {
    const result = ri(5, 15)
    const values = [
      result - 4,
      result - 2,
      result,
      result + 2,
      result + 4,
    ]

    return mc(
      skill,
      d,
      seed,
      `¿Cuál es la media de ${values.join(', ')}?`,
      String(result),
      [
        String(result + 2),
        String(values[0]),
        String(values[4]),
      ],
      `Los valores están equilibrados alrededor de ${result}, que es su media.`,
      ['media_aritmetica', 'cinco_datos']
    )
  }

  if (d === 4) {
    const mean = ri(6, 15)
    const known = [mean - 2, mean, mean + 3]
    const totalNeeded = mean * 4
    const missing =
      totalNeeded -
      known.reduce((sum, value) => sum + value, 0)

    return mc(
      skill,
      d,
      seed,
      `La media de cuatro números es ${mean}. Tres de ellos son ${known.join(', ')}. ¿Cuál es el cuarto número?`,
      String(missing),
      [
        String(mean),
        String(totalNeeded),
        String(missing + 2),
      ],
      `La suma total debe ser ${mean}×4=${totalNeeded}. Restamos los tres conocidos y obtenemos ${missing}.`,
      ['media_aritmetica', 'dato_desconocido']
    )
  }

  const oldMean = ri(6, 12)
  const count = ri(4, 6)
  const oldTotal = oldMean * count
  const newValue = ri(oldMean + 2, oldMean + 8)
  const newMean = (oldTotal + newValue) / (count + 1)

  return mc(
    skill,
    d,
    seed,
    `La media de ${count} valores es ${oldMean}. Se añade un nuevo valor ${newValue}. ¿Cuál es la nueva media?`,
    String(newMean),
    [
      String(oldMean),
      String(newValue),
      String((oldMean + newValue) / 2),
    ],
    `La suma inicial es ${oldMean}×${count}=${oldTotal}. Añadimos ${newValue} y dividimos entre ${count + 1}: ${newMean}.`,
    ['media_aritmetica', 'actualizar_media', 'dificultad_alta']
  )
}

// M14S06 · Mediana
if (key === 'median') {
  if (d <= 2) {
    const values = [
      ri(1, 5),
      ri(6, 10),
      ri(11, 15),
      ri(16, 20),
      ri(21, 25),
    ]

    const answer = String(values[2])

    return mc(
      skill,
      d,
      seed,
      `¿Cuál es la mediana de ${values.join(', ')}?`,
      answer,
      [
        String(values[0]),
        String(values[4]),
        String(values[1]),
      ],
      `Hay 5 datos ordenados, así que la mediana es el valor central: ${answer}.`,
      ['mediana']
    )
  }

  if (d === 3) {
    const values = [
      ri(1, 5),
      ri(6, 10),
      ri(11, 15),
      ri(16, 20),
      ri(21, 25),
    ]

    const shuffled = [
      values[3],
      values[0],
      values[4],
      values[1],
      values[2],
    ]

    return mc(
      skill,
      d,
      seed,
      `¿Cuál es la mediana de ${shuffled.join(', ')}?`,
      String(values[2]),
      [
        String(values[0]),
        String(values[4]),
        String(values[1]),
      ],
      `Primero ordenamos los datos. El valor central es ${values[2]}.`,
      ['mediana', 'datos_desordenados']
    )
  }

  if (d === 4) {
    const values = [
      ri(1, 4),
      ri(5, 8),
      ri(9, 12),
      ri(13, 16),
      ri(17, 20),
      ri(21, 24),
    ]

    const result = (values[2] + values[3]) / 2

    return mc(
      skill,
      d,
      seed,
      `¿Cuál es la mediana de ${values.join(', ')}?`,
      String(result),
      [
        String(values[2]),
        String(values[3]),
        String(values[2] + values[3]),
      ],
      `Hay 6 datos. La mediana es la media de los dos centrales: (${values[2]}+${values[3]})/2=${result}.`,
      ['mediana', 'numero_par_datos']
    )
  }

  const values = [
    ri(1, 5),
    ri(6, 10),
    ri(11, 15),
    ri(16, 20),
    ri(21, 25),
    ri(26, 30),
  ]

  const shuffled = [
    values[4],
    values[1],
    values[5],
    values[0],
    values[3],
    values[2],
  ]

  const result = (values[2] + values[3]) / 2

  return mc(
    skill,
    d,
    seed,
    `Los datos son ${shuffled.join(', ')}. ¿Cuál es la mediana?`,
    String(result),
    [
      String(values[2]),
      String(values[3]),
      String(values[0]),
    ],
    `Ordenamos los seis datos y calculamos la media de los dos centrales: ${result}.`,
    ['mediana', 'datos_desordenados', 'dificultad_alta']
  )
}

// M14S07 · Moda
if (key === 'mode') {
  if (d <= 2) {
    const repeated = ri(2, 9)

    const values = [
      repeated,
      repeated + 1,
      repeated,
      repeated + 2,
      repeated,
      repeated + 3,
    ]

    return mc(
      skill,
      d,
      seed,
      `¿Cuál es la moda de ${values.join(', ')}?`,
      String(repeated),
      [
        String(repeated + 1),
        String(repeated + 2),
        String(repeated + 3),
      ],
      `La moda es el valor que más se repite. ${repeated} aparece 3 veces.`,
      ['moda']
    )
  }

  if (d === 3) {
    const a = ri(2, 6)
    const b = a + ri(2, 4)

    const values = [
      a,
      b,
      a,
      b,
      a,
      b,
      a + 1,
    ]

    return mc(
      skill,
      d,
      seed,
      `¿Cuál es la moda de ${values.join(', ')}?`,
      'Hay dos modas',
      [
        String(a),
        String(b),
        'No hay moda',
      ],
      `${a} y ${b} aparecen el mismo número máximo de veces. La distribución es bimodal.`,
      ['moda', 'bimodal']
    )
  }

  if (d === 4) {
    const start = ri(2, 7)

    const values = [
      start,
      start + 1,
      start + 2,
      start + 3,
      start + 4,
    ]

    return mc(
      skill,
      d,
      seed,
      `¿Cuál es la moda de ${values.join(', ')}?`,
      'No hay moda',
      [
        String(start),
        String(start + 2),
        String(start + 4),
      ],
      'Todos los valores aparecen una sola vez, por lo que no existe moda.',
      ['moda', 'sin_moda']
    )
  }

  const a = ri(2, 6)
  const b = a + 1
  const c = a + 2

  const values = [
    a,
    b,
    a,
    c,
    b,
    a,
    b,
    b,
  ]

  return mc(
    skill,
    d,
    seed,
    `En los datos ${values.join(', ')}, ¿qué valor es la moda y cuántas veces aparece?`,
    `${b}, 4 veces`,
    [
      `${a}, 3 veces`,
      `${c}, 1 vez`,
      `${b}, 3 veces`,
    ],
    `${b} aparece 4 veces, más que cualquier otro valor.`,
    ['moda', 'frecuencia', 'dificultad_alta']
  )
}
// =========================
// M15 · PROBABILIDAD
// =========================

// M15S01 · Experimentos aleatorios
if (key === 'random_experiments') {
  if (d <= 2) {
    const variants = [
      {
        prompt: '¿Cuál de estas situaciones es un experimento aleatorio?',
        answer: 'Lanzar un dado y observar el resultado',
        distractors: [
          'Calcular 7 + 5',
          'Contar las patas de una silla',
          'Escribir el número 10',
        ],
        solution:
          'Antes de lanzar el dado no podemos saber con certeza qué resultado aparecerá.',
      },
      {
        prompt: '¿Cuál de estas situaciones tiene un resultado imprevisible antes de realizarla?',
        answer: 'Sacar una carta de una baraja mezclada',
        distractors: [
          'Sumar 3 + 4',
          'Contar 10 monedas',
          'Calcular el doble de 6',
        ],
        solution:
          'No sabemos qué carta saldrá antes de realizar la extracción.',
      },
      {
        prompt: '¿Cuál de estas acciones representa un experimento aleatorio?',
        answer: 'Girar una ruleta y observar dónde se detiene',
        distractors: [
          'Medir un segmento ya dibujado',
          'Resolver 20 ÷ 4',
          'Contar cinco libros',
        ],
        solution:
          'El resultado de la ruleta no se conoce con certeza de antemano.',
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
      v.solution,
      ['experimentos_aleatorios']
    )
  }

  if (d === 3) {
    return mc(
      skill,
      d,
      seed,
      '¿Cuál de estas situaciones NO es aleatoria?',
      'Calcular el perímetro de un cuadrado de lado 5 cm',
      [
        'Lanzar dos monedas',
        'Extraer una bola de una bolsa sin mirar',
        'Elegir una carta de una baraja mezclada',
      ],
      'El perímetro se determina exactamente mediante un cálculo; no depende del azar.',
      ['experimentos_aleatorios', 'clasificacion']
    )
  }

  if (d === 4) {
    return mc(
      skill,
      d,
      seed,
      'Se lanza un dado y después se multiplica por 2 el número obtenido. ¿Por qué sigue siendo un experimento aleatorio?',
      'Porque el número inicial del dado no se conoce antes del lanzamiento',
      [
        'Porque multiplicar por 2 siempre es aleatorio',
        'Porque todos los resultados finales son iguales',
        'Porque no se puede calcular ningún resultado posible',
      ],
      'La transformación es conocida, pero el resultado del dado sigue siendo incierto.',
      ['experimentos_aleatorios', 'razonamiento']
    )
  }

  return mc(
    skill,
    d,
    seed,
    '¿Qué característica distingue esencialmente un experimento aleatorio de uno determinista?',
    'Que conocemos los resultados posibles pero no podemos asegurar cuál ocurrirá antes de realizarlo',
    [
      'Que no conocemos ningún resultado posible',
      'Que siempre produce resultados numéricos',
      'Que necesariamente tiene dos resultados',
    ],
    'En un experimento aleatorio podemos describir los posibles resultados, pero no predecir con certeza cuál sucederá.',
    ['experimentos_aleatorios', 'razonamiento', 'dificultad_alta']
  )
}

// M15S02 · Sucesos
if (key === 'events') {
  if (d === 1) {
    const variants = [
      {
        prompt: 'Al lanzar un dado, ¿cuál de estos es un suceso posible?',
        answer: 'Obtener un número par',
        distractors: [
          'Obtener un 8',
          'Obtener un 0',
          'Obtener un número mayor que 10',
        ],
        solution:
          'En un dado pueden salir 1, 2, 3, 4, 5 o 6; algunos son pares.',
      },
      {
        prompt: 'Al lanzar una moneda, ¿cuál es un suceso seguro?',
        answer: 'Obtener cara o cruz',
        distractors: [
          'Obtener un 3',
          'Obtener dos caras a la vez',
          'No obtener ningún resultado',
        ],
        solution:
          'En una moneda necesariamente se obtiene uno de sus dos resultados posibles.',
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
      v.solution,
      ['sucesos']
    )
  }

  if (d === 2) {
    const target = ri(7, 12)

    return mc(
      skill,
      d,
      seed,
      `Se lanza un dado normal. ¿Qué tipo de suceso es obtener ${target}?`,
      'Imposible',
      [
        'Seguro',
        'Posible pero no seguro',
        'Equiprobable',
      ],
      'Un dado normal solo puede mostrar valores del 1 al 6.',
      ['sucesos', 'imposible']
    )
  }

  if (d === 3) {
    return mc(
      skill,
      d,
      seed,
      'Al lanzar un dado, ¿qué tipo de suceso es obtener un número menor que 7?',
      'Seguro',
      [
        'Imposible',
        'Posible pero no seguro',
        'Nunca ocurre',
      ],
      'Todos los resultados posibles del dado, del 1 al 6, son menores que 7.',
      ['sucesos', 'seguro']
    )
  }

  if (d === 4) {
    return mc(
      skill,
      d,
      seed,
      'Se extrae una bola de una bolsa que contiene bolas rojas, azules y verdes. ¿Cuál de estos sucesos es compuesto?',
      'Obtener una bola roja o azul',
      [
        'Obtener una bola roja',
        'Obtener una bola verde',
        'Obtener una única bola',
      ],
      'El suceso incluye más de un resultado favorable: rojo o azul.',
      ['sucesos', 'suceso_compuesto']
    )
  }

  return mc(
    skill,
    d,
    seed,
    'Al lanzar un dado, A = “obtener número par” y B = “obtener número mayor que 3”. ¿Qué resultados pertenecen a A y B a la vez?',
    '4 y 6',
    [
      '2, 4 y 6',
      '4, 5 y 6',
      '2 y 3',
    ],
    'Los pares son 2, 4 y 6; los mayores que 3 son 4, 5 y 6. La intersección es 4 y 6.',
    ['sucesos', 'interseccion', 'dificultad_alta']
  )
}

// M15S03 · Casos favorables y posibles
if (key === 'favorable_possible') {
  if (d === 1) {
    return mc(
      skill,
      d,
      seed,
      'Al lanzar un dado normal, ¿cuántos resultados posibles hay?',
      '6',
      ['1', '3', '12'],
      'Los posibles resultados son 1, 2, 3, 4, 5 y 6.',
      ['casos_favorables_posibles']
    )
  }

  if (d === 2) {
    return mc(
      skill,
      d,
      seed,
      'Al lanzar un dado normal, ¿cuántos casos favorables tiene el suceso “obtener un número par”?',
      '3',
      ['2', '4', '6'],
      'Los resultados favorables son 2, 4 y 6: hay 3.',
      ['casos_favorables_posibles', 'dado']
    )
  }

  if (d === 3) {
    const red = ri(2, 6)
    const blue = ri(2, 6)
    const green = ri(1, 5)
    const total = red + blue + green

    return mc(
      skill,
      d,
      seed,
      `Una bolsa contiene ${red} bolas rojas, ${blue} azules y ${green} verdes. Si queremos sacar una bola azul, ¿cuántos casos favorables y posibles hay?`,
      `${blue} favorables y ${total} posibles`,
      [
        `${total} favorables y ${blue} posibles`,
        `${red} favorables y ${total} posibles`,
        `${blue} favorables y ${red + green} posibles`,
      ],
      `Hay ${blue} bolas azules de un total de ${total} bolas.`,
      ['casos_favorables_posibles', 'bolsa']
    )
  }

  if (d === 4) {
    return mc(
      skill,
      d,
      seed,
      'Se lanzan dos monedas. ¿Cuántos resultados posibles hay si distinguimos el resultado de cada moneda?',
      '4',
      ['2', '3', '8'],
      'Los resultados son cara-cara, cara-cruz, cruz-cara y cruz-cruz.',
      ['casos_favorables_posibles', 'dos_etapas']
    )
  }

  return mc(
    skill,
    d,
    seed,
    'Se lanzan dos dados. ¿Cuántos de los 36 resultados posibles tienen suma 7?',
    '6',
    ['5', '7', '12'],
    'Las parejas son (1,6), (2,5), (3,4), (4,3), (5,2) y (6,1): 6 casos favorables.',
    ['casos_favorables_posibles', 'dos_dados', 'dificultad_alta']
  )
}

// M15S04 · Probabilidad de Laplace
if (key === 'laplace_basic') {
  if (d === 1) {
    const favorable = ri(1, 4)
    const possible = favorable + ri(2, 5)

    return mc(
      skill,
      d,
      seed,
      `En una experiencia equiprobable hay ${possible} resultados posibles y ${favorable} favorables. ¿Cuál es la probabilidad?`,
      `${favorable}/${possible}`,
      [
        `${possible}/${favorable}`,
        `${possible - favorable}/${possible}`,
        `${favorable}/${possible + 1}`,
      ],
      `Probabilidad = casos favorables / casos posibles = ${favorable}/${possible}.`,
      ['probabilidad_laplace']
    )
  }

  if (d === 2) {
    const favorable = [1, 2, 3][ri(0, 2)]

    return mc(
      skill,
      d,
      seed,
      `Se lanza un dado normal. ¿Cuál es la probabilidad de obtener uno de ${favorable} resultados favorables?`,
      `${favorable}/6`,
      [
        `6/${favorable}`,
        `${6 - favorable}/6`,
        `${favorable}/5`,
      ],
      `Hay ${favorable} casos favorables entre 6 resultados equiprobables.`,
      ['probabilidad_laplace', 'dado']
    )
  }

  if (d === 3) {
    const red = ri(2, 6)
    const blue = ri(2, 6)
    const total = red + blue

    return mc(
      skill,
      d,
      seed,
      `Una bolsa contiene ${red} bolas rojas y ${blue} azules. ¿Cuál es la probabilidad de sacar una roja?`,
      `${red}/${total}`,
      [
        `${blue}/${total}`,
        `${total}/${red}`,
        `${red}/${blue}`,
      ],
      `Hay ${red} casos favorables de ${total} posibles.`,
      ['probabilidad_laplace', 'bolsa']
    )
  }

  if (d === 4) {
    const red = ri(2, 5)
    const blue = ri(2, 5)
    const green = ri(1, 4)
    const total = red + blue + green
    const favorable = red + blue

    return mc(
      skill,
      d,
      seed,
      `Una bolsa contiene ${red} bolas rojas, ${blue} azules y ${green} verdes. ¿Cuál es la probabilidad de sacar una bola que NO sea verde?`,
      `${favorable}/${total}`,
      [
        `${green}/${total}`,
        `${total}/${favorable}`,
        `${red}/${total}`,
      ],
      `No verde significa roja o azul: ${red}+${blue}=${favorable} casos favorables de ${total}.`,
      ['probabilidad_laplace', 'suceso_compuesto']
    )
  }

  return mc(
    skill,
    d,
    seed,
    'Se lanzan dos dados normales. ¿Cuál es la probabilidad de que la suma sea 7?',
    '6/36',
    [
      '7/36',
      '6/12',
      '1/36',
    ],
    'Hay 36 parejas equiprobables y 6 suman 7, así que la probabilidad es 6/36.',
    ['probabilidad_laplace', 'dos_dados', 'dificultad_alta']
  )
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
      const b = ri(25, 70)
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