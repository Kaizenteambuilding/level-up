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

  const numericAnswer = Number(answer)

  while (pool.length < 4) {
    if (Number.isFinite(numericAnswer)) {
      const candidate = String(
        numericAnswer + pool.length + 1
      )

      if (!pool.includes(candidate)) {
        pool.push(candidate)
      } else {
        pool.push(String(pool.length))
      }
    } else {
      const fallbackSymbols = ['<', '>', '=', '≠', '≤', '≥']

      const candidate = fallbackSymbols.find(
        (symbol) => !pool.includes(symbol)
      )

      if (candidate) {
        pool.push(candidate)
      } else {
        pool.push(`Alternativa ${pool.length + 1}`)
      }
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
  const key = skill.generator_key

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
  const variant = ri(0, 5)

  if (variant === 0) {
    const den = ri(3, 10)
    const num = ri(1, den - 1)
    const reps = ri(2, 6)
    const answer = `${num * reps}/${den}`

    return mc(
      skill,
      d,
      seed,
      `Una ruta mide ${num}/${den} km. Si recorres esa distancia ${reps} veces, ¿cuántos kilómetros recorres en total?`,
      answer,
      [
        `${num}/${den * reps}`,
        `${num + reps}/${den}`,
        `${num}/${den}`,
      ],
      `${num}/${den} × ${reps} = ${answer} km.`,
      ['problema_fracciones', 'multiplicacion']
    )
  }

  if (variant === 1) {
    const den = ri(2, 8)
    const num = ri(1, den - 1)
    const groups = ri(2, 8)
    const total = den * groups
    const answer = num * groups

    return mc(
      skill,
      d,
      seed,
      `En una caja hay ${total} cromos. ${num}/${den} de ellos son especiales. ¿Cuántos cromos especiales hay?`,
      String(answer),
      [
        String(total - answer),
        String(groups),
        String(num * den),
      ],
      `${total} ÷ ${den} = ${groups}; después ${groups} × ${num} = ${answer}.`,
      ['problema_fracciones', 'fraccion_de_cantidad']
    )
  }

  if (variant === 2) {
    const den = ri(3, 8)
    const num = ri(1, den - 1)
    const factor = ri(2, 6)
    const known = num * factor
    const total = den * factor

    return mc(
      skill,
      d,
      seed,
      `${known} alumnos representan ${num}/${den} de una clase. ¿Cuántos alumnos hay en total?`,
      String(total),
      [
        String(known * den),
        String(total - known),
        String(known + den),
      ],
      `Si ${num} partes son ${known}, cada parte vale ${factor}. Las ${den} partes son ${total}.`,
      ['problema_fracciones', 'hallar_total']
    )
  }

  if (variant === 3) {
    const den = ri(4, 10)
    const used = ri(1, den - 1)
    const remaining = den - used

    return mc(
      skill,
      d,
      seed,
      `De una tarta se han comido ${used}/${den}. ¿Qué fracción queda?`,
      `${remaining}/${den}`,
      [
        `${used}/${den}`,
        `${den}/${remaining}`,
        `${remaining}/${used}`,
      ],
      `La tarta completa es ${den}/${den}. Restamos ${used}/${den}: quedan ${remaining}/${den}.`,
      ['problema_fracciones', 'fraccion_restante']
    )
  }

  if (variant === 4) {
    const den = ri(5, 12)
    const a = ri(1, den - 2)
    const b = ri(1, den - a - 1)
    const answer = a + b

    return mc(
      skill,
      d,
      seed,
      `Por la mañana se recorren ${a}/${den} km y por la tarde ${b}/${den} km. ¿Qué fracción de kilómetro se recorre en total?`,
      `${answer}/${den}`,
      [
        `${a + b}/${den * 2}`,
        `${Math.abs(a - b)}/${den}`,
        `${a * b}/${den}`,
      ],
      `Sumamos los numeradores: ${a}+${b}=${answer}. Resultado: ${answer}/${den}.`,
      ['problema_fracciones', 'suma']
    )
  }

  const den = ri(5, 12)
  const start = ri(2, den - 1)
  const used = ri(1, start - 1)
  const answer = start - used

  return mc(
    skill,
    d,
    seed,
    `Una botella contenía ${start}/${den} de litro. Se consumieron ${used}/${den}. ¿Cuánto queda?`,
    `${answer}/${den}`,
    [
      `${start + used}/${den}`,
      `${start}/${den}`,
      `${used}/${den}`,
    ],
    `Restamos numeradores: ${start}-${used}=${answer}. Quedan ${answer}/${den}.`,
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
    return mc(
      skill,
      d,
      seed,
      `Dos rectas que nunca se cortan y mantienen siempre la misma distancia son...`,
      'Paralelas',
      [
        'Perpendiculares',
        'Secantes',
        'Segmentos',
      ],
      `Son rectas paralelas.`,
      ['rectas']
    )
  }

  if (key === 'angle_types') {
    const angle =
      [35, 90, 120, 180][ri(0, 3)]

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
      [
        'Agudo',
        'Recto',
        'Obtuso',
        'Llano',
      ].filter((x) => x !== answer),
      `Un ángulo de ${angle}° es ${answer.toLowerCase()}.`,
      ['tipo_angulo']
    )
  }

  if (key === 'angle_measure') {
  const angle1 = ri(2, 8) * 10
  const angle2 = ri(2, 8) * 10
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

  if (key === 'angle_relations') {
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

  if (key === 'parallel_angles') {
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

 // ============================================================
// M11 · FIGURAS GEOMÉTRICAS
// ============================================================

// M11S01 · Clasificar triángulos por lados
if (key === 'triangle_sides') {
  const variants = [
    {
      sides: '6 cm, 6 cm y 6 cm',
      answer: 'Equilátero',
      solution: 'Tiene sus tres lados iguales, por tanto es un triángulo equilátero.',
    },
    {
      sides: '5 cm, 5 cm y 8 cm',
      answer: 'Isósceles',
      solution: 'Tiene dos lados iguales, por tanto es un triángulo isósceles.',
    },
    {
      sides: '4 cm, 5 cm y 6 cm',
      answer: 'Escaleno',
      solution: 'Tiene los tres lados diferentes, por tanto es un triángulo escaleno.',
    },
  ]

  const v = variants[seed % variants.length]

  return mc(
    skill,
    d,
    seed,
    `Un triángulo tiene lados de ${v.sides}. ¿Cómo se clasifica según sus lados?`,
    v.answer,
    ['Equilátero', 'Isósceles', 'Escaleno', 'No se puede determinar'].filter(x => x !== v.answer),
    v.solution,
    ['clasificacion_triangulos_lados']
  )
}

// M11S02 · Clasificar triángulos por ángulos
if (key === 'triangle_angles') {
  const variants = [
    {
      angles: '60°, 60° y 60°',
      answer: 'Acutángulo',
      solution: 'Todos sus ángulos son menores de 90°, por tanto es acutángulo.',
    },
    {
      angles: '90°, 55° y 35°',
      answer: 'Rectángulo',
      solution: 'Tiene un ángulo de 90°, por tanto es rectángulo.',
    },
    {
      angles: '110°, 40° y 30°',
      answer: 'Obtusángulo',
      solution: 'Tiene un ángulo mayor de 90°, por tanto es obtusángulo.',
    },
  ]

  const v = variants[seed % variants.length]

  return mc(
    skill,
    d,
    seed,
    `Un triángulo tiene ángulos de ${v.angles}. ¿Cómo se clasifica según sus ángulos?`,
    v.answer,
   ['Acutángulo', 'Rectángulo', 'Obtusángulo', 'No se puede determinar'].filter(x => x !== v.answer),
    v.solution,
    ['clasificacion_triangulos_angulos']
  )
}

// M11S03 · Suma de ángulos de triángulo
if (key === 'triangle_angle_sum') {
  const a = ri(3, 7) * 10
  const b = ri(4, 8) * 10
  const missing = 180 - a - b

  return mc(
    skill,
    d,
    seed,
    `Dos ángulos de un triángulo miden ${a}° y ${b}°. ¿Cuánto mide el tercer ángulo?`,
    `${missing}°`,
    [
      `${missing + 10}°`,
      `${Math.max(10, missing - 10)}°`,
      `${180 - missing}°`,
    ],
    `Los ángulos de un triángulo suman 180°. Entonces 180° − ${a}° − ${b}° = ${missing}°.`,
    ['suma_angulos_triangulo']
  )
}

// M11S04 · Cuadriláteros
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

// M11S05 · Polígonos regulares
if (key === 'regular_polygons') {
  const variants = [
    { sides: 5, answer: 'Pentágono' },
    { sides: 6, answer: 'Hexágono' },
    { sides: 8, answer: 'Octógono' },
  ]

  const v = variants[seed % variants.length]

  return mc(
    skill,
    d,
    seed,
    `Un polígono regular tiene ${v.sides} lados iguales. ¿Cómo se llama?`,
    v.answer,
    ['Pentágono', 'Hexágono', 'Octógono', 'Heptágono'].filter(x => x !== v.answer),
    `Un polígono de ${v.sides} lados se llama ${v.answer.toLowerCase()}. Al ser regular, todos sus lados y ángulos son iguales.`,
    ['poligonos_regulares']
  )
}

// M11S06 · Circunferencia y círculo
if (key === 'circle_elements') {
  const variants = [
    {
      prompt: '¿Cómo se llama el segmento que une el centro de una circunferencia con un punto de ella?',
      answer: 'Radio',
      solution: 'El radio une el centro con cualquier punto de la circunferencia.',
    },
    {
      prompt: '¿Cómo se llama el segmento que une dos puntos de la circunferencia pasando por el centro?',
      answer: 'Diámetro',
      solution: 'El diámetro pasa por el centro y une dos puntos de la circunferencia.',
    },
    {
      prompt: '¿Cómo se llama la línea curva cerrada que limita un círculo?',
      answer: 'Circunferencia',
      solution: 'La circunferencia es la línea que forma el borde del círculo.',
    },
  ]

  const v = variants[seed % variants.length]

  return mc(
    skill,
    d,
    seed,
    v.prompt,
    v.answer,
    ['Radio', 'Diámetro', 'Circunferencia', 'Centro'].filter(x => x !== v.answer),
    v.solution,
    ['elementos_circulo']
  )
}

// M11S07 · Simetría
if (key === 'symmetry') {
  const variants = [
    {
      figure: 'un cuadrado',
      answer: '4',
      solution: 'Un cuadrado tiene 4 ejes de simetría.',
      distractors: ['1', '2', '3'],
    },
    {
      figure: 'un rectángulo que no es cuadrado',
      answer: '2',
      solution: 'Un rectángulo no cuadrado tiene 2 ejes de simetría.',
      distractors: ['1', '3', '4'],
    },
    {
      figure: 'un triángulo equilátero',
      answer: '3',
      solution: 'Un triángulo equilátero tiene 3 ejes de simetría.',
      distractors: ['1', '2', '4'],
    },
  ]

  const v = variants[seed % variants.length]

  return mc(
    skill,
    d,
    seed,
    `¿Cuántos ejes de simetría tiene ${v.figure}?`,
    v.answer,
    v.distractors,
    v.solution,
    ['simetria']
  )
}

// M11S08 · Clasificación geométrica razonada
if (key === 'geometry_classification') {
  const variants = [
    {
      prompt: 'Una figura tiene 4 lados iguales y 4 ángulos rectos. ¿Cuál es la clasificación más precisa?',
      answer: 'Cuadrado',
      solution: 'Al tener cuatro lados iguales y cuatro ángulos rectos, es un cuadrado.',
      distractors: ['Rectángulo', 'Rombo', 'Trapecio'],
    },
    {
      prompt: 'Un triángulo tiene lados de 7 cm, 7 cm y 10 cm. ¿Cómo se clasifica según sus lados?',
      answer: 'Isósceles',
      solution: 'Tiene exactamente dos lados iguales, por tanto es isósceles.',
      distractors: ['Equilátero', 'Escaleno', 'Rectángulo'],
    },
    {
      prompt: 'Un triángulo tiene un ángulo de 90°. ¿Qué clasificación según sus ángulos es necesariamente correcta?',
      answer: 'Rectángulo',
      solution: 'Todo triángulo que tiene un ángulo de 90° es un triángulo rectángulo.',
      distractors: ['Acutángulo', 'Obtusángulo', 'Equilátero'],
    },
  ]

  const v = variants[seed % variants.length]

  return mc(
    skill,
    d,
    seed,
    v.prompt,
    v.answer,
    v.distractors,
    v.solution,
    ['clasificacion_geometrica_razonada']
  )
}

// ============================================================
// M12 · PERÍMETROS Y ÁREAS
// ============================================================

// M12S01 · Perímetro de polígonos
if (key === 'perimeter') {
  const width = ri(3, 12)
  const height = ri(2, 10)
  const result = 2 * (width + height)

  return mc(
    skill,
    d,
    seed,
    `Un rectángulo mide ${width} cm de largo y ${height} cm de ancho. ¿Cuál es su perímetro?`,
    `${result} cm`,
    [
      `${width * height} cm`,
      `${width + height} cm`,
      `${result + 2} cm`,
    ],
    `Perímetro = 2 × (${width} + ${height}) = ${result} cm.`,
    ['perimetro']
  )
}

// M12S02 · Área de rectángulo y cuadrado
if (key === 'rectangle_square_area') {
  if (seed % 2 === 0) {
    const side = ri(3, 12)
    const result = side * side

    return mc(
      skill,
      d,
      seed,
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

  const base = ri(4, 14)
  const height = ri(3, 10)
  const result = base * height

  return mc(
    skill,
    d,
    seed,
    `Un rectángulo mide ${base} cm de base y ${height} cm de altura. ¿Cuál es su área?`,
    `${result} cm²`,
    [
      `${2 * (base + height)} cm²`,
      `${base + height} cm²`,
      `${result + base} cm²`,
    ],
    `Área = base × altura = ${base} × ${height} = ${result} cm².`,
    ['area_rectangulo']
  )
}

// M12S03 · Área de triángulo
if (key === 'triangle_area') {
  const base = ri(3, 12) * 2
  const height = ri(2, 10)
  const result = (base * height) / 2

  return mc(
    skill,
    d,
    seed,
    `Un triángulo tiene ${base} cm de base y ${height} cm de altura. ¿Cuál es su área?`,
    `${result} cm²`,
    [
      `${base * height} cm²`,
      `${base + height} cm²`,
      `${result + height} cm²`,
    ],
    `Área = (base × altura) ÷ 2 = (${base} × ${height}) ÷ 2 = ${result} cm².`,
    ['area_triangulo']
  )
}

// M12S04 · Área de paralelogramo y trapecio
if (key === 'quadrilateral_area') {
  if (seed % 2 === 0) {
    const base = ri(4, 14)
    const height = ri(3, 10)
    const result = base * height

    return mc(
      skill,
      d,
      seed,
      `Un paralelogramo tiene ${base} cm de base y ${height} cm de altura. ¿Cuál es su área?`,
      `${result} cm²`,
      [
        `${2 * (base + height)} cm²`,
        `${base + height} cm²`,
        `${result + height} cm²`,
      ],
      `Área = base × altura = ${base} × ${height} = ${result} cm².`,
      ['area_paralelogramo']
    )
  }

  const base1 = ri(6, 14)
  const base2 = ri(2, base1 - 2)
  const height = ri(2, 8) * 2
  const result = ((base1 + base2) * height) / 2

  return mc(
    skill,
    d,
    seed,
    `Un trapecio tiene bases de ${base1} cm y ${base2} cm, y altura de ${height} cm. ¿Cuál es su área?`,
    `${result} cm²`,
    [
      `${(base1 + base2) * height} cm²`,
      `${base1 * base2} cm²`,
      `${base1 + base2 + height} cm²`,
    ],
    `Área = ((B + b) × h) ÷ 2 = ((${base1} + ${base2}) × ${height}) ÷ 2 = ${result} cm².`,
    ['area_trapecio']
  )
}

// M12S05 · Circunferencia y círculo
if (key === 'circle_measure') {
  const radius = ri(2, 10)

  if (seed % 2 === 0) {
    const diameter = radius * 2

    return mc(
      skill,
      d,
      seed,
      `Un círculo tiene radio de ${radius} cm. ¿Cuál es su diámetro?`,
      `${diameter} cm`,
      [
        `${radius} cm`,
        `${radius * 3} cm`,
        `${diameter + 1} cm`,
      ],
      `El diámetro es el doble del radio: 2 × ${radius} = ${diameter} cm.`,
      ['diametro_circulo']
    )
  }

  const diameter = radius * 2
  const circumference = Math.round(Math.PI * diameter * 100) / 100

  return mc(
    skill,
    d,
    seed,
    `Una circunferencia tiene diámetro de ${diameter} cm. Usando π ≈ 3,14, ¿cuánto mide aproximadamente su longitud?`,
    `${(3.14 * diameter).toFixed(2)} cm`,
    [
      `${(3.14 * radius).toFixed(2)} cm`,
      `${diameter * 2} cm`,
      `${(diameter + 3.14).toFixed(2)} cm`,
    ],
    `Longitud ≈ π × diámetro = 3,14 × ${diameter} = ${(3.14 * diameter).toFixed(2)} cm.`,
    ['longitud_circunferencia']
  )
}

// M12S06 · Figuras compuestas
if (key === 'composite_area') {
  const width1 = ri(3, 8)
  const height1 = ri(2, 6)
  const width2 = ri(2, 6)
  const height2 = ri(2, 5)

  const area1 = width1 * height1
  const area2 = width2 * height2
  const result = area1 + area2

  return mc(
    skill,
    d,
    seed,
    `Una figura está formada por dos rectángulos sin solaparse. Uno mide ${width1} cm × ${height1} cm y el otro ${width2} cm × ${height2} cm. ¿Cuál es el área total?`,
    `${result} cm²`,
    [
      `${area1} cm²`,
      `${area2} cm²`,
      `${result + width2} cm²`,
    ],
    `Área total = ${width1}×${height1} + ${width2}×${height2} = ${area1} + ${area2} = ${result} cm².`,
    ['figuras_compuestas']
  )
}
 
// ============================================================
// M13 · TABLAS Y GRÁFICAS
// ============================================================

// M13S01 · Coordenadas cartesianas
if (key === 'coordinates') {
  const x = ri(-5, 5)
  const y = ri(-5, 5)

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
    `Las coordenadas se escriben como (x, y). Por tanto, P = (${x}, ${y}).`,
    ['coordenadas_cartesianas']
  )
}

// M13S02 · Leer tablas de valores
if (key === 'value_tables') {
  const x1 = ri(1, 4)
  const factor = ri(2, 5)
  const y1 = x1 * factor
  const x2 = x1 + 2
  const y2 = x2 * factor

  return mc(
    skill,
    d,
    seed,
    `En una tabla, cuando x = ${x1}, y = ${y1}. Si la relación es y = ${factor}x, ¿cuánto vale y cuando x = ${x2}?`,
    String(y2),
    [
      String(x2 + factor),
      String(y1),
      String(y2 + factor),
    ],
    `y = ${factor} × ${x2} = ${y2}.`,
    ['lectura_tablas']
  )
}

// M13S03 · Representar datos en gráficas
if (key === 'plot_graph') {
  const variants = [
    {
      situation: 'la evolución de la temperatura a lo largo de un día',
      answer: 'Gráfico de líneas',
      solution: 'Un gráfico de líneas permite ver claramente cómo cambia una magnitud con el tiempo.',
      distractors: ['Gráfico de barras', 'Diagrama de sectores', 'Tabla sin gráfica'],
    },
    {
      situation: 'comparar cuántos alumnos prefieren fútbol, baloncesto y tenis',
      answer: 'Gráfico de barras',
      solution: 'El gráfico de barras es adecuado para comparar cantidades entre categorías.',
      distractors: ['Gráfico de líneas', 'Diagrama de sectores', 'Plano cartesiano'],
    },
    {
      situation: 'mostrar qué porcentaje del presupuesto corresponde a cada categoría',
      answer: 'Diagrama de sectores',
      solution: 'Un diagrama de sectores representa bien las partes de un total.',
      distractors: ['Gráfico de líneas', 'Gráfico de barras', 'Plano cartesiano'],
    },
  ]

  const v = variants[seed % variants.length]

  return mc(
    skill,
    d,
    seed,
    `¿Qué tipo de gráfica es más adecuada para ${v.situation}?`,
    v.answer,
    v.distractors,
    v.solution,
    ['representacion_grafica']
  )
}

// M13S04 · Interpretar gráficas
if (key === 'graph_interpret') {
  const monday = ri(10, 30)
  const tuesday = monday + ri(2, 10)
  const wednesday = ri(8, monday)

  const maxValue = Math.max(monday, tuesday, wednesday)
  const answer =
    maxValue === monday
      ? 'Lunes'
      : maxValue === tuesday
        ? 'Martes'
        : 'Miércoles'

  return mc(
    skill,
    d,
    seed,
    `Una gráfica muestra estas ventas: lunes ${monday}, martes ${tuesday} y miércoles ${wednesday}. ¿Qué día tuvo más ventas?`,
    answer,
    ['Lunes', 'Martes', 'Miércoles', 'Todos igual'].filter(x => x !== answer),
    `El valor mayor es ${maxValue}, correspondiente a ${answer.toLowerCase()}.`,
    ['interpretacion_graficas']
  )
}

// ============================================================
// M14 · ESTADÍSTICA
// ============================================================

// M14S01 · Población, muestra e individuo
if (key === 'stats_population') {
  const variants = [
    {
      prompt: 'En un instituto se quiere estudiar la altura de todos los alumnos de 1º ESO. ¿Cuál es la población?',
      answer: 'Todos los alumnos de 1º ESO',
      distractors: ['Un alumno cualquiera', 'Los 20 alumnos medidos', 'Las alturas obtenidas'],
      solution: 'La población es el conjunto completo que queremos estudiar.',
    },
    {
      prompt: 'De 300 alumnos se eligen 30 para hacer una encuesta. ¿Qué son esos 30 alumnos?',
      answer: 'La muestra',
      distractors: ['La población', 'La variable', 'La frecuencia'],
      solution: 'La muestra es una parte de la población seleccionada para el estudio.',
    },
    {
      prompt: 'En un estudio sobre hábitos de lectura, cada alumno encuestado es...',
      answer: 'Un individuo',
      distractors: ['Una muestra', 'Una variable', 'Una frecuencia'],
      solution: 'Cada elemento de la población estudiada es un individuo.',
    },
  ]

  const v = variants[seed % variants.length]

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

// M14S02 · Variables estadísticas
if (key === 'stats_variables') {
  const variants = [
    {
      prompt: 'La altura de un alumno, medida en centímetros, es una variable...',
      answer: 'Cuantitativa',
      distractors: ['Cualitativa', 'Nominal', 'No estadística'],
      solution: 'La altura se expresa mediante números, por eso es cuantitativa.',
    },
    {
      prompt: 'El color favorito de una persona es una variable...',
      answer: 'Cualitativa',
      distractors: ['Cuantitativa', 'Continua', 'Numérica'],
      solution: 'El color favorito describe una categoría, por eso es cualitativa.',
    },
    {
      prompt: 'El número de hermanos de un alumno es una variable...',
      answer: 'Cuantitativa discreta',
      distractors: ['Cualitativa', 'Cuantitativa continua', 'Nominal'],
      solution: 'Es numérica y toma valores enteros contables, por eso es discreta.',
    },
  ]

  const v = variants[seed % variants.length]

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

// M14S03 · Tabla de frecuencias
if (key === 'frequency_table') {
  const data = [1, 2, 2, 3, 2, 4, 3, 2]
  const answer = '4'

  return mc(
    skill,
    d,
    seed,
    `En los datos 1, 2, 2, 3, 2, 4, 3, 2, ¿cuál es la frecuencia del valor 2?`,
    answer,
    ['2', '3', '5'],
    'El número 2 aparece 4 veces.',
    ['tabla_frecuencias']
  )
}

// M14S04 · Gráficos estadísticos
if (key === 'stat_charts') {
  const variants = [
    {
      situation: 'comparar el número de alumnos que eligen cada deporte',
      answer: 'Gráfico de barras',
      distractors: ['Gráfico de líneas', 'Diagrama de sectores', 'Histograma temporal'],
      solution: 'El gráfico de barras es adecuado para comparar categorías.',
    },
    {
      situation: 'mostrar cómo se reparte un total entre varias categorías',
      answer: 'Diagrama de sectores',
      distractors: ['Gráfico de líneas', 'Gráfico de barras', 'Plano cartesiano'],
      solution: 'El diagrama de sectores representa partes de un total.',
    },
    {
      situation: 'mostrar cómo cambia una temperatura durante varias horas',
      answer: 'Gráfico de líneas',
      distractors: ['Diagrama de sectores', 'Gráfico de barras', 'Pictograma'],
      solution: 'El gráfico de líneas muestra bien la evolución de una magnitud en el tiempo.',
    },
  ]

  const v = variants[seed % variants.length]

  return mc(
    skill,
    d,
    seed,
    `¿Qué gráfico es más adecuado para ${v.situation}?`,
    v.answer,
    v.distractors,
    v.solution,
    ['graficos_estadisticos']
  )
}

// M14S05 · Media aritmética
if (key === 'mean') {
  const a = ri(2, 8)
  const b = ri(2, 8)
  const c = ri(2, 8)
  const d4 = ri(2, 8)
  const total = a + b + c + d4
  const result = total / 4

  return mc(
    skill,
    d,
    seed,
    `Calcula la media de ${a}, ${b}, ${c} y ${d4}`,
    String(result),
    [
      String(total),
      String(Math.max(a, b, c, d4)),
      String(Math.min(a, b, c, d4)),
    ],
    `Sumamos: ${a}+${b}+${c}+${d4}=${total}. Dividimos entre 4: ${total}/4=${result}.`,
    ['media_aritmetica']
  )
}

// M14S06 · Mediana
if (key === 'median') {
  const values = [
    ri(1, 5),
    ri(6, 10),
    ri(11, 15),
    ri(16, 20),
    ri(21, 25),
  ].sort((a, b) => a - b)

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
    `Al haber 5 datos ordenados, la mediana es el valor central: ${answer}.`,
    ['mediana']
  )
}

// M14S07 · Moda
if (key === 'mode') {
  const repeated = ri(2, 9)
  const others = [
    repeated + 1,
    repeated + 2,
    repeated + 3,
  ]

  const values = [
    repeated,
    others[0],
    repeated,
    others[1],
    repeated,
    others[2],
  ]

  return mc(
    skill,
    d,
    seed,
    `¿Cuál es la moda de ${values.join(', ')}?`,
    String(repeated),
    others.map(String),
    `La moda es el valor que más se repite. ${repeated} aparece 3 veces.`,
    ['moda']
  )
}

// ============================================================
// M15 · PROBABILIDAD
// ============================================================

// M15S01 · Experimentos aleatorios
if (key === 'random_experiments') {
  const variants = [
    {
      prompt: '¿Cuál de estas situaciones es un experimento aleatorio?',
      answer: 'Lanzar un dado',
      distractors: [
        'Calcular 7 + 5',
        'Medir una mesa con una regla',
        'Escribir el número 10',
      ],
      solution: 'En un experimento aleatorio no sabemos de antemano qué resultado concreto ocurrirá.',
    },
    {
      prompt: '¿Cuál de estas situaciones tiene un resultado imprevisible antes de realizarla?',
      answer: 'Sacar una carta de una baraja mezclada',
      distractors: [
        'Sumar 3 + 4',
        'Contar 10 monedas',
        'Medir 1 metro',
      ],
      solution: 'Sacar una carta de una baraja mezclada es un experimento aleatorio.',
    },
  ]

  const v = variants[seed % variants.length]

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

// M15S02 · Sucesos
if (key === 'events') {
  const variants = [
    {
      prompt: 'Al lanzar un dado, ¿cuál de estos es un suceso posible?',
      answer: 'Obtener un número par',
      distractors: [
        'Obtener un 8',
        'Obtener un 0',
        'Obtener un número mayor que 10',
      ],
      solution: 'En un dado pueden salir 1, 2, 3, 4, 5 o 6. Obtener un número par es posible.',
    },
    {
      prompt: 'Al lanzar una moneda, ¿cuál es un suceso seguro?',
      answer: 'Obtener cara o cruz',
      distractors: [
        'Obtener dos caras a la vez',
        'Obtener un 3',
        'No obtener ningún resultado',
      ],
      solution: 'En una moneda, necesariamente sale cara o cruz.',
    },
  ]

  const v = variants[seed % variants.length]

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

// M15S03 · Casos favorables y posibles
if (key === 'favorable_possible') {
  const favorable = ri(1, 4)
  const possible = favorable + ri(2, 5)

  return mc(
    skill,
    d,
    seed,
    `En una experiencia hay ${possible} resultados posibles y ${favorable} son favorables. ¿Cuántos casos favorables hay?`,
    String(favorable),
    [
      String(possible),
      String(possible - favorable),
      String(favorable + 1),
    ],
    `Los casos favorables son los que cumplen la condición: ${favorable}.`,
    ['casos_favorables_posibles']
  )
}

// M15S04 · Probabilidad de Laplace básica
if (key === 'laplace_basic') {
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
