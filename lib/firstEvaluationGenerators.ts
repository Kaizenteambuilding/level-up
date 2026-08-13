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

  if (key === 'natural_place_value') {
    const thousands = ri(1, 9)
    const hundreds = ri(0, 9)
    const tens = ri(0, 9)
    const units = ri(0, 9)

    const n =
      thousands * 1000 +
      hundreds * 100 +
      tens * 10 +
      units

    return mc(
      skill,
      d,
      seed,
      `En el número ${n}, ¿qué cifra ocupa las centenas?`,
      String(hundreds),
      [
        String(thousands),
        String(tens),
        String(units),
      ],
      `La cifra de las centenas es ${hundreds}.`,
      ['valor_posicional']
    )
  }

  if (key === 'natural_compare') {
    const a = ri(100, 9999)
    const b = ri(100, 9999)
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
    const a = ri(100, 5000 * d)
    const b = ri(50, a)
    const add = seed % 2 === 0
    const result = add ? a + b : a - b

    return mc(
      skill,
      d,
      seed,
      add
        ? `Calcula ${a} + ${b}`
        : `Calcula ${a} - ${b}`,
      String(result),
      [
        String(result + 10),
        String(Math.abs(a - b)),
        String(result - 1),
      ],
      `Resultado: ${result}.`,
      ['calculo_naturales']
    )
  }

  if (key === 'natural_mult_div') {
    const a = ri(2, 12 + d)
    const b = ri(2, 12 + d)

    if (seed % 2 === 0) {
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

    const n = a * b

    return mc(
      skill,
      d,
      seed,
      `Calcula ${n} ÷ ${a}`,
      String(b),
      [
        String(a),
        String(b + 1),
        String(n - a),
      ],
      `${n} ÷ ${a} = ${b}.`,
      ['division']
    )
  }

  if (key === 'operation_priority') {
    const a = ri(2, 9)
    const b = ri(2, 8)
    const c = ri(2, 7)
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
      `Primero ${b}×${c}=${b * c}; después sumamos ${a}. Resultado: ${result}.`,
      ['jerarquia_operaciones']
    )
  }

  if (key === 'natural_word_problem') {
    const boxes = ri(3, 8 + d)
    const perBox = ri(10, 30 + d * 5)
    const loose = ri(1, 20)
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
      `${boxes}×${perBox}+${loose}=${result}.`,
      ['modelizacion_naturales']
    )
  }

  // =========================
  // M02 · POTENCIAS Y RAÍCES
  // =========================

  if (key === 'powers_meaning') {
    const base = ri(2, 7)
    const exponent = ri(2, 4)
    const answer =
      Array(exponent).fill(String(base)).join(' × ')

    return mc(
      skill,
      d,
      seed,
      `¿Qué significa ${base}^${exponent}?`,
      answer,
      [
        `${base} × ${exponent}`,
        `${exponent} × ${exponent}`,
        `${base} + ${base}`,
      ],
      `Es multiplicar ${base} por sí mismo ${exponent} veces.`,
      ['potencia_significado']
    )
  }

  if (key === 'powers_compute') {
    const base = ri(2, 5 + d)
    const exponent = ri(2, 3 + (d > 3 ? 1 : 0))
    const result = base ** exponent

    return mc(
      skill,
      d,
      seed,
      `Calcula ${base}^${exponent}`,
      String(result),
      [
        String(base * exponent),
        String(result + base),
        String(base ** (exponent - 1)),
      ],
      `${base}^${exponent} = ${result}.`,
      ['potencias']
    )
  }

  if (key === 'powers_ten') {
    const exponent = ri(1, 5)
    const result = 10 ** exponent

    return mc(
      skill,
      d,
      seed,
      `¿Cuánto vale 10^${exponent}?`,
      String(result),
      [
        String(exponent * 10),
        String(10 ** (exponent - 1)),
        String(result + 10),
      ],
      `10^${exponent} es 1 seguido de ${exponent} ceros.`,
      ['potencias_base_10']
    )
  }

  if (key === 'powers_properties') {
    const base = ri(2, 5)
    const m = ri(2, 4)
    const n = ri(1, 3)
    const answer = `${base}^${m + n}`

    return mc(
      skill,
      d,
      seed,
      `Simplifica ${base}^${m} × ${base}^${n}`,
      answer,
      [
        `${base}^${m * n}`,
        `${base * 2}^${m + n}`,
        `${base}^${m - n}`,
      ],
      `Al multiplicar potencias de la misma base, se suman los exponentes: ${m}+${n}=${m + n}.`,
      ['propiedades_potencias']
    )
  }

  if (key === 'sqrt_exact') {
    const root = ri(2, 12)
    const n = root * root

    return mc(
      skill,
      d,
      seed,
      `Calcula √${n}`,
      String(root),
      [
        String(root * 2),
        String(n / 2),
        String(root - 1),
      ],
      `Porque ${root}×${root}=${n}.`,
      ['raiz_cuadrada']
    )
  }

  // =========================
  // M03 · DIVISIBILIDAD
  // =========================

  if (key === 'multiples') {
    const n = ri(2, 12)
    const k = ri(3, 8)
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
        String(n + k),
      ],
      `${n}×${k}=${answer}.`,
      ['multiplos']
    )
  }

  if (key === 'divisors') {
    const n = ri(3, 12)
    const k = ri(2, 8)
    const total = n * k

    return mc(
      skill,
      d,
      seed,
      `¿Cuál de estos números es divisor de ${total}?`,
      String(n),
      [
        String(n + 1),
        String(k + 1),
        String(total - 1),
      ],
      `${total} ÷ ${n} = ${k}, sin resto.`,
      ['divisores']
    )
  }

  if (key === 'divisibility_rules') {
    const n = ri(10, 99) * 3

    return mc(
      skill,
      d,
      seed,
      `¿Es ${n} divisible entre 3?`,
      'Sí',
      [
        'No',
        'Solo entre 2',
        'Solo entre 5',
      ],
      `La suma de sus cifras es múltiplo de 3.`,
      ['criterio_divisibilidad_3']
    )
  }

  if (key === 'prime_numbers') {
    const primes = [2,3,5,7,11,13,17,19,23,29]
    const p = primes[ri(0, primes.length - 1)]

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
      `${p} solo tiene dos divisores positivos: 1 y ${p}.`,
      ['primos']
    )
  }

  if (key === 'prime_factorization') {
    const a = [2,3,5][ri(0, 2)]
    const b = [2,3,5,7][ri(0, 3)]
    const n = a * b

    return mc(
      skill,
      d,
      seed,
      `Una descomposición en factores primos de ${n} es:`,
      `${a} × ${b}`,
      [
        `1 × ${n}`,
        `${n} × 1`,
        `${a + b} × 1`,
      ],
      `${n}=${a}×${b}.`,
      ['factorizacion']
    )
  }

  if (key === 'gcd') {
    const g = ri(2, 6)
    const a = g * ri(2, 5)
    const b = g * ri(2, 5)

    const divisors: number[] = []

    for (let x = 1; x <= Math.min(a, b); x++) {
      if (a % x === 0 && b % x === 0) {
        divisors.push(x)
      }
    }

    const result = Math.max(...divisors)

    return mc(
      skill,
      d,
      seed,
      `Calcula MCD(${a}, ${b})`,
      String(result),
      [
        String(g),
        String(a * b),
        String(Math.min(a, b)),
      ].filter((x) => x !== String(result)),
      `El mayor divisor común es ${result}.`,
      ['mcd']
    )
  }

  if (key === 'lcm') {
    const a = ri(2, 8)
    const b = ri(2, 8)

    const gcd = (x: number, y: number) => {
      while (y) {
        ;[x, y] = [y, x % y]
      }
      return x
    }

    const result =
      Math.abs(a * b) / gcd(a, b)

    return mc(
      skill,
      d,
      seed,
      `Calcula mcm(${a}, ${b})`,
      String(result),
      [
        String(a * b),
        String(Math.max(a, b)),
        String(gcd(a, b)),
      ],
      `El mínimo común múltiplo es ${result}.`,
      ['mcm']
    )
  }

  // =========================
  // M04 · NÚMEROS ENTEROS
  // =========================

  if (key === 'integers_context') {
    const t = ri(1, 12)

    return mc(
      skill,
      d,
      seed,
      `La temperatura está ${t} grados bajo cero. ¿Qué número entero la representa?`,
      String(-t),
      [
        String(t),
        '0',
        String(-t - 1),
      ],
      `Bajo cero se representa con signo negativo: ${-t}.`,
      ['enteros_contexto']
    )
  }

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
    const n = ri(2, 30)

    return mc(
      skill,
      d,
      seed,
      `¿Cuál es el valor absoluto de -${n}?`,
      String(n),
      [
        String(-n),
        String(n + 1),
        '0',
      ],
      `|-${n}|=${n}.`,
      ['valor_absoluto']
    )
  }

  if (key === 'integers_add') {
    const a = ri(-20, 20)
    const b = ri(-20, 20)
    const result = a + b

    return mc(
      skill,
      d,
      seed,
      `Calcula (${a}) + (${b})`,
      String(result),
      [
        String(a - b),
        String(-result),
        String(Math.abs(a) + Math.abs(b)),
      ],
      `Resultado: ${result}.`,
      ['suma_enteros']
    )
  }

  if (key === 'integers_sub') {
    const a = ri(-20, 20)
    const b = ri(-20, 20)
    const result = a - b

    return mc(
      skill,
      d,
      seed,
      `Calcula (${a}) - (${b})`,
      String(result),
      [
        String(a + b),
        String(-result),
        String(b - a),
      ],
      `Restar ${b} equivale a sumar su opuesto. Resultado: ${result}.`,
      ['resta_enteros']
    )
  }

  if (key === 'integers_mult_div') {
    const a = ri(-10, 10) || 2
    const b = ri(-10, 10) || 3
    const result = a * b

    return mc(
      skill,
      d,
      seed,
      `Calcula (${a}) × (${b})`,
      String(result),
      [
        String(Math.abs(result)),
        String(-result),
        String(a + b),
      ],
      `Aplicamos la regla de signos. Resultado: ${result}.`,
      ['producto_enteros', 'regla_signos']
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

  // =========================
  // M05 · NÚMEROS DECIMALES
  // =========================

  if (key === 'decimal_place_value') {
    const integerPart = ri(1, 99)
    const tenths = ri(0, 9)
    const hundredths = ri(0, 9)
    const n = `${integerPart}.${tenths}${hundredths}`

    return mc(
      skill,
      d,
      seed,
      `En ${n}, ¿qué cifra ocupa las décimas?`,
      String(tenths),
      [
        String(hundredths),
        String(integerPart % 10),
        '0',
      ],
      `La cifra de las décimas es ${tenths}.`,
      ['valor_posicional_decimal']
    )
  }

  if (key === 'decimal_compare') {
    const a = (ri(10, 999) / 100).toFixed(2)
    const b = (ri(10, 999) / 100).toFixed(2)

    const answer =
      Number(a) > Number(b)
        ? '>'
        : Number(a) < Number(b)
          ? '<'
          : '='

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

  if (key === 'decimal_add_sub') {
    const a = ri(100, 999) / 10
    const b = ri(10, 500) / 10
    const add = seed % 2 === 0
    const result = add ? a + b : a - b

    return mc(
      skill,
      d,
      seed,
      add
        ? `Calcula ${a.toFixed(1)} + ${b.toFixed(1)}`
        : `Calcula ${a.toFixed(1)} - ${b.toFixed(1)}`,
      result.toFixed(1),
      [
        (result + 1).toFixed(1),
        (result - 0.1).toFixed(1),
        String(Math.round(result)),
      ],
      `Alineamos las comas. Resultado: ${result.toFixed(1)}.`,
      ['suma_resta_decimales']
    )
  }

  if (key === 'decimal_mult_div') {
    const a = ri(12, 99) / 10
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
      `Resultado: ${result.toFixed(1)}.`,
      ['producto_decimales']
    )
  }

  if (key === 'decimal_round') {
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
      `Resultado: ${answer}.`,
      ['redondeo']
    )
  }

  // =========================
  // M06 · SISTEMA MÉTRICO Y MEDIDA
  // =========================

  if (key === 'metric_length') {
    const metres = ri(2, 90)
    const answer = String(metres * 100)

    return mc(
      skill,
      d,
      seed,
      `Convierte ${metres} m a centímetros`,
      answer,
      [
        String(metres * 10),
        String(metres * 1000),
        String(metres),
      ],
      `${metres} m = ${answer} cm.`,
      ['conversion_longitud']
    )
  }

  if (key === 'metric_mass') {
    const kg = ri(2, 20)
    const answer = String(kg * 1000)

    return mc(
      skill,
      d,
      seed,
      `Convierte ${kg} kg a gramos`,
      answer,
      [
        String(kg * 100),
        String(kg * 10),
        String(kg),
      ],
      `${kg} kg = ${answer} g.`,
      ['conversion_masa']
    )
  }

  if (key === 'metric_capacity') {
    const litres = ri(2, 15)
    const answer = String(litres * 1000)

    return mc(
      skill,
      d,
      seed,
      `Convierte ${litres} L a mililitros`,
      answer,
      [
        String(litres * 100),
        String(litres * 10),
        String(litres),
      ],
      `${litres} L = ${answer} mL.`,
      ['conversion_capacidad']
    )
  }

  if (key === 'metric_area_units') {
    const m2 = ri(2, 12)
    const answer = String(m2 * 10000)

    return mc(
      skill,
      d,
      seed,
      `Convierte ${m2} m² a cm²`,
      answer,
      [
        String(m2 * 100),
        String(m2 * 1000),
        String(m2 * 10),
      ],
      `1 m² = 10000 cm². Resultado: ${answer} cm².`,
      ['conversion_superficie']
    )
  }

  if (key === 'sexagesimal_time') {
    const hours = ri(1, 5)
    const minutes = ri(1, 50)
    const answer = String(hours * 60 + minutes)

    return mc(
      skill,
      d,
      seed,
      `¿Cuántos minutos son ${hours} h y ${minutes} min?`,
      answer,
      [
        String(hours * 100 + minutes),
        String(hours * 60),
        String(hours + minutes),
      ],
      `${hours}×60 + ${minutes} = ${answer} minutos.`,
      ['sistema_sexagesimal']
    )
  }

  // =========================
  // M07 · FRACCIONES
  // =========================

  if (key === 'fraction_meaning') {
    const den = ri(3, 9)
    const num = ri(1, den - 1)

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
      ['significado_fraccion']
    )
  }

  if (key === 'fraction_equivalent') {
    const den = ri(3, 8)
    const num = ri(1, den - 1)
    const k = ri(2, 5)
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

  if (key === 'fraction_simplify') {
    const baseNum = ri(1, 5)
    const baseDen = ri(baseNum + 1, 9)
    const k = ri(2, 5)
    const num = baseNum * k
    const den = baseDen * k
    const answer = `${baseNum}/${baseDen}`

    return mc(
      skill,
      d,
      seed,
      `Simplifica ${num}/${den}`,
      answer,
      [
        `${num - k}/${den - k}`,
        `${baseNum}/${den}`,
        `${num}/${baseDen}`,
      ],
      `Dividimos numerador y denominador entre ${k}: ${answer}.`,
      ['simplificacion_fracciones']
    )
  }

  if (key === 'fraction_compare') {
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
      `Con el mismo denominador, comparamos numeradores: ${a} < ${b}.`,
      ['comparacion_fracciones']
    )
  }

  if (key === 'fraction_add_sub') {
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
        `${a + b}/${den + 1}`,
      ],
      `Mismo denominador: sumamos numeradores. Resultado: ${answer}.`,
      ['suma_fracciones']
    )
  }

  if (key === 'fraction_multiply') {
    const a = ri(1, 5)
    const b = ri(2, 7)
    const c = ri(1, 5)
    const e = ri(2, 7)
    const answer = `${a * c}/${b * e}`

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
      `Multiplicamos numeradores y denominadores: ${answer}.`,
      ['multiplicacion_fracciones']
    )
  }

  if (key === 'fraction_divide') {
    const a = ri(1, 5)
    const b = ri(2, 7)
    const c = ri(1, 5)
    const e = ri(2, 7)
    const answer = `${a * e}/${b * c}`

    return mc(
      skill,
      d,
      seed,
      `Calcula ${a}/${b} ÷ ${c}/${e}`,
      answer,
      [
        `${a * c}/${b * e}`,
        `${a + c}/${b + e}`,
        `${b * c}/${a * e}`,
      ],
      `Multiplicamos por la inversa: ${a}/${b} × ${e}/${c} = ${answer}.`,
      ['division_fracciones']
    )
  }

  if (key === 'fraction_word_problem') {
    const den = ri(3, 8)
    const num = ri(1, den - 1)
    const reps = ri(2, 4)
    const answer = `${num * reps}/${den}`

    return mc(
      skill,
      d,
      seed,
      `Cada vuelta mide ${num}/${den} km. Si haces ${reps} vueltas, ¿qué distancia recorres?`,
      answer,
      [
        `${num}/${den * reps}`,
        `${num + reps}/${den}`,
        `${num}/${den}`,
      ],
      `${num}/${den} × ${reps} = ${answer} km.`,
      ['problema_fracciones']
    )
  }

  // =========================
  // M08 · PROPORCIONALIDAD Y PORCENTAJES
  // =========================

  if (key === 'ratio') {
    const a = ri(2, 8)
    const b = ri(2, 8)

    return mc(
      skill,
      d,
      seed,
      `En una clase hay ${a} chicos por cada ${b} chicas. ¿Cuál es la razón chicos:chicas?`,
      `${a}:${b}`,
      [
        `${b}:${a}`,
        `${a + b}:1`,
        `${a * b}:1`,
      ],
      `La razón es ${a}:${b}.`,
      ['razon']
    )
  }

  if (key === 'direct_proportion_recognize') {
    return mc(
      skill,
      d,
      seed,
      `Si compras el doble de cuadernos al mismo precio unitario, ¿pagas el doble?`,
      'Sí',
      [
        'No',
        'Solo a veces',
        'No se puede saber',
      ],
      `Es una relación de proporcionalidad directa.`,
      ['proporcionalidad_directa']
    )
  }

  if (key === 'direct_proportion_table') {
    const x = ri(2, 8)
    const factor = ri(2, 6)
    const answer = String(x * factor)

    return mc(
      skill,
      d,
      seed,
      `Si 1 unidad cuesta ${factor} €, ¿cuánto cuestan ${x} unidades?`,
      answer,
      [
        String(x + factor),
        String(x * factor + factor),
        String(factor),
      ],
      `${x} × ${factor} = ${answer} €.`,
      ['tabla_proporcional']
    )
  }

  if (key === 'rule_of_three') {
    const units = ri(2, 6)
    const price = ri(2, 8)
    const target = ri(2, 6)
    const total = units * price
    const answer = String(target * price)

    return mc(
      skill,
      d,
      seed,
      `Si ${units} unidades cuestan ${total} €, ¿cuánto cuestan ${target} unidades?`,
      answer,
      [
        String(total + target),
        String(total * target),
        String(price),
      ],
      `Cada unidad cuesta ${price} €. Entonces ${target} cuestan ${answer} €.`,
      ['regla_de_tres']
    )
  }

  if (key === 'percentage_of') {
    const p = [10, 20, 25, 50][ri(0, 3)]
    const amount = ri(2, 10) * 20
    const answer = String(
      (p * amount) / 100
    )

    return mc(
      skill,
      d,
      seed,
      `¿Cuánto es el ${p}% de ${amount}?`,
      answer,
      [
        String(amount - p),
        String(amount + p),
        String(
          ((100 - p) * amount) / 100
        ),
      ],
      `${p}/100 × ${amount} = ${answer}.`,
      ['porcentaje']
    )
  }

  if (key === 'percentage_change') {
    const price = ri(4, 12) * 20
    const discount = [10, 20, 25][ri(0, 2)]
    const saving =
      (price * discount) / 100
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
      `Descuento: ${saving} €. Precio final: ${finalPrice} €.`,
      ['descuento_porcentual']
    )
  }

  if (key === 'proportion_word_problem') {
    const people = ri(2, 5)
    const portions = people * 2
    const target = ri(
      people + 1,
      people + 4
    )
    const answer = String(target * 2)

    return mc(
      skill,
      d,
      seed,
      `Para ${people} personas hacen falta ${portions} porciones. ¿Cuántas hacen falta para ${target} personas?`,
      answer,
      [
        String(portions + target),
        String(portions * target),
        String(target),
      ],
      `Son 2 porciones por persona. ${target}×2=${answer}.`,
      ['problema_proporcionalidad']
    )
  }

  // =========================
  // M09 · ÁLGEBRA Y ECUACIONES
  // =========================

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

  if (key === 'algebra_evaluate') {
    const x = ri(2, 8)
    const a = ri(2, 6)
    const b = ri(1, 9)
    const answer = String(a * x + b)

    return mc(
      skill,
      d,
      seed,
      `Si x = ${x}, calcula ${a}x + ${b}`,
      answer,
      [
        String(a + x + b),
        String(a * (x + b)),
        String(x + b),
      ],
      `${a}×${x}+${b}=${answer}.`,
      ['valor_numerico']
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

  if (key === 'equation_one_step') {
    const x = ri(2, 12)
    const k = ri(2, 10)
    const total = x + k

    return mc(
      skill,
      d,
      seed,
      `Resuelve x + ${k} = ${total}`,
      String(x),
      [
        String(total + k),
        String(k),
        String(total - k - 1),
      ],
      `x = ${total} - ${k} = ${x}.`,
      ['ecuacion_un_paso']
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
    const x = ri(2, 9)
    const k = ri(2, 8)
    const total = x + k

    return mc(
      skill,
      d,
      seed,
      `¿Es x = ${x} solución de x + ${k} = ${total}?`,
      'Sí',
      [
        'No',
        'Solo si x=0',
        'No se puede comprobar',
      ],
      `${x}+${k}=${total}, por tanto sí.`,
      ['comprobar_ecuacion']
    )
  }

  if (key === 'equation_word_problem') {
    const x = ri(2, 12)
    const k = ri(2, 10)
    const total = x + k

    return mc(
      skill,
      d,
      seed,
      `Pienso un número. Le sumo ${k} y obtengo ${total}. ¿Qué número pensé?`,
      String(x),
      [
        String(total + k),
        String(k),
        String(total - 1),
      ],
      `Planteamos x + ${k} = ${total}. Entonces x=${x}.`,
      ['problema_ecuacion']
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
    ['Equilátero', 'Isósceles', 'Escaleno'].filter(x => x !== v.answer),
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
    ['Acutángulo', 'Rectángulo', 'Obtusángulo'].filter(x => x !== v.answer),
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
    ['Pentágono', 'Hexágono', 'Octógono'].filter(x => x !== v.answer),
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
