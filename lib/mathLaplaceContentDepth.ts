import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }

function rotate<T>(items: T[], shift: number) {
  const offset = ((shift % items.length) + items.length) % items.length
  return items.slice(offset).concat(items.slice(0, offset))
}

function gcd(a: number, b: number) {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y) [x, y] = [y, x % y]
  return x || 1
}

function fraction(numerator: number, denominator: number) {
  const divisor = gcd(numerator, denominator)
  return `${numerator / divisor}/${denominator / divisor}`
}

function optionKey(option: string) {
  const trimmed = option.trim()
  const fractionMatch = trimmed.match(/^(-?\d+)\/(\d+)$/)
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1])
    const denominator = Number(fractionMatch[2])
    if (denominator !== 0) return `fraction:${fraction(numerator, denominator)}`
  }
  if (/^-?\d+$/.test(trimmed)) return `number:${Number(trimmed)}`
  return `text:${trimmed.toLowerCase()}`
}

function distinctDistractors(answer: string, distractors: [string, string, string]): [string, string, string] {
  const answerKey = optionKey(answer)
  const selected: string[] = []
  const seen = new Set<string>([answerKey])

  for (const distractor of distractors) {
    const key = optionKey(distractor)
    if (seen.has(key)) continue
    seen.add(key)
    selected.push(distractor)
  }

  const isFractionAnswer = /^-?\d+\/\d+$/.test(answer.trim())
  const isIntegerAnswer = /^-?\d+$/.test(answer.trim())
  const fallbackCandidates = isFractionAnswer
    ? ['0', '1', '1/2', '1/3', '2/3', '1/4', '3/4', '1/5', '2/5', '3/5', '4/5', '1/6', '5/6']
    : isIntegerAnswer
      ? Array.from({ length: 12 }, (_, index) => String(Math.max(0, Number(answer) - 5 + index)))
      : []

  for (const candidate of fallbackCandidates) {
    if (selected.length === 3) break
    const key = optionKey(candidate)
    if (seen.has(key)) continue
    seen.add(key)
    selected.push(candidate)
  }

  if (selected.length !== 3) {
    throw new Error(`Insufficient distinct M15S04 distractors for answer ${answer}`)
  }
  return selected as [string, string, string]
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
  const safeDistractors = distinctDistractors(answer, distractors)
  const uniqueOptions = [answer, ...safeDistractors]
  const semanticKeys = uniqueOptions.map(optionKey)
  if (new Set(semanticKeys).size !== semanticKeys.length) {
    throw new Error(`Duplicate M15S04 option values for seed ${seed}: ${JSON.stringify(uniqueOptions)}`)
  }
  const options = rotate(uniqueOptions, seed + difficulty)
  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt,
    options,
    answerIndex: options.indexOf(answer),
    solution,
    tags: [skill.generator_key, 'math', 'laplace_content_depth'],
  }
}

function laplace(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion {
  const family = (seed >>> 1) % 22
  const dieSides = [6, 8, 10, 12][(seed >>> 5) % 4]
  const spinnerTotal = [8, 10, 12, 16][(seed >>> 7) % 4]
  const favorable = 1 + ((seed >>> 9) % Math.max(2, Math.min(6, spinnerTotal - 1)))
  const bagRed = 2 + ((seed >>> 11) % 6)
  const bagBlue = 3 + ((seed >>> 14) % 7)
  const bagTotal = bagRed + bagBlue
  const threshold = 2 + ((seed >>> 17) % Math.max(2, dieSides - 3))
  const cardTotal = [10, 12, 15, 20][(seed >>> 20) % 4]

  if (family === 0) {
    const favorableCount = Math.max(0, dieSides - threshold)
    return q(skill, difficulty, seed,
      `Se lanza un dado equilibrado de ${dieSides} caras numeradas del 1 al ${dieSides}. ¿Cuál es la probabilidad de obtener un número mayor que ${threshold}?`,
      fraction(favorableCount, dieSides),
      [fraction(threshold, dieSides), fraction(Math.max(1, favorableCount - 1), dieSides), fraction(Math.min(dieSides - 1, favorableCount + 1), dieSides)],
      `Hay ${favorableCount} resultados mayores que ${threshold} entre ${dieSides} resultados equiprobables.`)
  }

  if (family === 1) {
    const divisor = 2 + ((seed >>> 6) % 3)
    const multiples = Math.floor(dieSides / divisor)
    return q(skill, difficulty, seed,
      `En un dado equilibrado de ${dieSides} caras, ¿cuál es la probabilidad de obtener un múltiplo de ${divisor}?`,
      fraction(multiples, dieSides),
      [fraction(divisor, dieSides), fraction(Math.max(1, multiples - 1), dieSides), fraction(Math.min(dieSides - 1, multiples + 1), dieSides)],
      `Entre 1 y ${dieSides} hay ${multiples} múltiplos de ${divisor}; se aplica favorables/posibles.`)
  }

  if (family === 2) return q(skill, difficulty, seed,
    `Una ruleta tiene ${spinnerTotal} sectores iguales y ${favorable} son verdes. ¿Cuál es P(verde)?`,
    fraction(favorable, spinnerTotal),
    [fraction(spinnerTotal - favorable, spinnerTotal), fraction(favorable + 1, spinnerTotal), fraction(favorable, spinnerTotal + 1)],
    `Hay ${favorable} sectores verdes entre ${spinnerTotal} sectores equiprobables.`)

  if (family === 3) return q(skill, difficulty, seed,
    `Una bolsa contiene ${bagRed} bolas rojas y ${bagBlue} azules, todas igual de probables al extraer una. ¿Cuál es P(roja)?`,
    fraction(bagRed, bagTotal),
    [fraction(bagBlue, bagTotal), fraction(bagRed, bagBlue), fraction(1, bagRed)],
    `Hay ${bagRed} resultados favorables entre ${bagTotal} bolas posibles.`)

  if (family === 4) {
    const evenCount = Math.floor(cardTotal / 2)
    return q(skill, difficulty, seed,
      `Se elige al azar una tarjeta numerada del 1 al ${cardTotal}. ¿Cuál es la probabilidad de obtener un número par?`,
      fraction(evenCount, cardTotal),
      [fraction(Math.ceil(cardTotal / 2), cardTotal), fraction(2, cardTotal), fraction(evenCount - 1, cardTotal)],
      `Hay ${evenCount} números pares entre las ${cardTotal} tarjetas equiprobables.`)
  }

  if (family === 5) {
    const eventFav = 1 + ((seed >>> 8) % (spinnerTotal - 2))
    const complement = spinnerTotal - eventFav
    return q(skill, difficulty, seed,
      `En un experimento equiprobable con ${spinnerTotal} resultados, el suceso A tiene ${eventFav} casos favorables. ¿Cuál es P(no A)?`,
      fraction(complement, spinnerTotal),
      [fraction(eventFav, spinnerTotal), fraction(complement - 1, spinnerTotal), fraction(eventFav, complement)],
      `El complementario contiene los ${spinnerTotal}-${eventFav}=${complement} resultados restantes.`)
  }

  if (family === 6) {
    const firstFav = 1 + ((seed >>> 6) % 4)
    const secondFav = firstFav + 1 + ((seed >>> 10) % 3)
    const total = Math.max(8, secondFav + 2)
    return q(skill, difficulty, seed,
      `Dos sucesos A y B tienen respectivamente ${firstFav} y ${secondFav} casos favorables dentro de ${total} resultados equiprobables. ¿Cuál es más probable?`,
      'B', ['A', 'Son igual de probables', 'No puede compararse sin repetir el experimento'],
      `Ambos tienen el mismo total de casos posibles y ${secondFav}>${firstFav}, así que P(B)>P(A).`)
  }

  if (family === 7) {
    const contexts = [
      'una moneda equilibrada',
      'un dado equilibrado',
      'una ruleta con sectores iguales',
      'una bolsa en la que todas las bolas tienen la misma posibilidad de salir',
    ]
    const context = contexts[(seed >>> 12) % contexts.length]
    return q(skill, difficulty, seed,
      `¿Por qué puede aplicarse directamente la regla de Laplace en ${context}?`,
      'Porque los resultados elementales son equiprobables',
      ['Porque solo hay un resultado favorable', 'Porque siempre hay exactamente dos resultados', 'Porque las probabilidades pueden superar 1'],
      'La regla de Laplace requiere comparar casos favorables y posibles equiprobables.')
  }

  if (family === 8) {
    const unequal = ['sectores de tamaños distintos', 'bolas con pesos muy diferentes', 'una moneda claramente trucada', 'resultados con probabilidades conocidas distintas']
    const situation = unequal[(seed >>> 13) % unequal.length]
    return q(skill, difficulty, seed,
      `Un experimento tiene ${situation}. ¿Qué impide usar sin más “favorables/posibles”?`,
      'Los resultados no son equiprobables',
      ['El número de casos favorables es siempre cero', 'La probabilidad deja de estar entre 0 y 1', 'Solo pueden estudiarse dados'],
      'Contar resultados solo basta cuando cada resultado elemental tiene la misma probabilidad.')
  }

  if (family === 9) {
    const total = [8, 10, 12, 16][(seed >>> 5) % 4]
    const fav = 2 + ((seed >>> 9) % Math.max(2, Math.floor(total / 2) - 1))
    return q(skill, difficulty, seed,
      `En ${total} resultados equiprobables, un suceso tiene probabilidad ${fraction(fav, total)}. ¿Cuántos casos favorables tiene?`,
      String(fav), [String(total - fav), String(fav + 1), String(total)],
      `La fracción representa ${fav} casos favorables de ${total} posibles.`)
  }

  if (family === 10) {
    const fav = 2 + ((seed >>> 7) % 4)
    const multiplier = 2 + ((seed >>> 11) % 3)
    const total = fav * multiplier
    return q(skill, difficulty, seed,
      `Un suceso tiene ${fav} casos favorables y probabilidad 1/${multiplier}. Si todos los resultados son equiprobables, ¿cuántos casos posibles hay?`,
      String(total), [String(fav + multiplier), String(multiplier), String(total - fav)],
      `${fav}/${total}=1/${multiplier}, por lo que hay ${total} casos posibles.`)
  }

  if (family === 11) return q(skill, difficulty, seed,
    `En un dado de ${dieSides} caras numeradas del 1 al ${dieSides}, ¿cuál es la probabilidad de obtener ${dieSides + 1}?`,
    '0', [fraction(1, dieSides), '1', fraction(dieSides - 1, dieSides)],
    `${dieSides + 1} no pertenece al espacio muestral, así que el suceso es imposible.`)

  if (family === 12) return q(skill, difficulty, seed,
    `En un dado de ${dieSides} caras, ¿cuál es la probabilidad de obtener un número entre 1 y ${dieSides}, ambos incluidos?`,
    '1', ['0', fraction(1, dieSides), fraction(dieSides - 1, dieSides)],
    'Todos los resultados posibles cumplen el suceso, por lo que es seguro.')

  if (family === 13) {
    const primeCount = Array.from({ length: dieSides }, (_, index) => index + 1)
      .filter((value) => value >= 2 && Array.from({ length: Math.floor(Math.sqrt(value)) - 1 }, (_, i) => i + 2).every((d) => value % d !== 0)).length
    return q(skill, difficulty, seed,
      `Se lanza un dado equilibrado de ${dieSides} caras. ¿Cuál es la probabilidad de obtener un número primo?`,
      fraction(primeCount, dieSides),
      [fraction(Math.max(1, primeCount - 1), dieSides), fraction(Math.min(dieSides - 1, primeCount + 1), dieSides), fraction(2, dieSides)],
      `Hay ${primeCount} números primos entre 1 y ${dieSides}.`)
  }

  if (family === 14) {
    const multiple = 2 + ((seed >>> 8) % 4)
    const count = Math.floor(cardTotal / multiple)
    return q(skill, difficulty, seed,
      `Se elige una tarjeta al azar entre los números 1 y ${cardTotal}. ¿Cuál es la probabilidad de obtener un múltiplo de ${multiple}?`,
      fraction(count, cardTotal),
      [fraction(multiple, cardTotal), fraction(Math.max(1, count - 1), cardTotal), fraction(Math.min(cardTotal - 1, count + 1), cardTotal)],
      `Hay ${count} múltiplos de ${multiple} entre los ${cardTotal} resultados equiprobables.`)
  }

  if (family === 15) {
    const low = 2 + ((seed >>> 7) % 3)
    const high = Math.min(dieSides, low + 2 + ((seed >>> 10) % 3))
    const count = high - low + 1
    return q(skill, difficulty, seed,
      `En un dado equilibrado de ${dieSides} caras, ¿cuál es la probabilidad de obtener un número entre ${low} y ${high}, ambos incluidos?`,
      fraction(count, dieSides),
      [fraction(high - low, dieSides), fraction(low, dieSides), fraction(high, dieSides)],
      `Los favorables son ${count} números: desde ${low} hasta ${high}.`)
  }

  if (family === 16) {
    const yellow = spinnerTotal - favorable
    return q(skill, difficulty, seed,
      `Una ruleta de ${spinnerTotal} sectores iguales tiene ${favorable} verdes y ${yellow} amarillos. ¿Cuál es la probabilidad de NO caer en verde?`,
      fraction(yellow, spinnerTotal),
      [fraction(favorable, spinnerTotal), fraction(yellow - 1, spinnerTotal), fraction(favorable + 1, spinnerTotal)],
      `No verde equivale a amarillo: ${yellow} sectores de ${spinnerTotal}.`)
  }

  if (family === 17) {
    const prizes = 1 + ((seed >>> 9) % 5)
    const tickets = prizes + 5 + ((seed >>> 12) % 8)
    return q(skill, difficulty, seed,
      `En un sorteo hay ${tickets} papeletas equiprobables y ${prizes} tienen premio. ¿Cuál es la probabilidad de premio?`,
      fraction(prizes, tickets),
      [fraction(tickets - prizes, tickets), fraction(prizes + 1, tickets), fraction(prizes, tickets - prizes)],
      `Hay ${prizes} papeletas favorables entre ${tickets} posibles.`)
  }

  if (family === 18) {
    const total = [10, 12, 15, 20][(seed >>> 6) % 4]
    const fav = 2 + ((seed >>> 10) % Math.max(2, Math.floor(total / 2) - 1))
    return q(skill, difficulty, seed,
      `Un suceso tiene ${fav} casos favorables entre ${total} casos posibles equiprobables. ¿Qué expresión aplica correctamente la regla de Laplace?`,
      fraction(fav, total), [fraction(total, fav), fraction(fav, total - fav), fraction(total - fav, fav)],
      'La probabilidad clásica es número de casos favorables dividido entre número de casos posibles.')
  }

  if (family === 19) {
    const denominator = [4, 5, 8, 10][(seed >>> 7) % 4]
    const numerator = 1 + ((seed >>> 11) % (denominator - 1))
    return q(skill, difficulty, seed,
      `En un experimento equiprobable, P(A)=${fraction(numerator, denominator)}. ¿Qué significa esa fracción?`,
      `Los casos favorables representan ${numerator} de cada ${denominator} casos posibles equivalentes`,
      ['El suceso es seguro', `Hay exactamente ${denominator} casos favorables`, 'La probabilidad es mayor que 1'],
      'La fracción expresa la proporción de casos favorables sobre casos posibles equiprobables.')
  }

  if (family === 20) {
    const invalidNumerator = spinnerTotal + 1 + ((seed >>> 9) % 4)
    return q(skill, difficulty, seed,
      `Un cálculo produce la probabilidad ${invalidNumerator}/${spinnerTotal}. ¿Qué indica?`,
      'Hay un error, porque una probabilidad no puede ser mayor que 1',
      ['Es válida porque el numerador es positivo', 'Describe un suceso seguro sin más comprobaciones', 'Significa que faltan resultados posibles'],
      `${invalidNumerator}/${spinnerTotal} es mayor que 1, fuera del intervalo válido [0,1].`)
  }

  const observed = 20 + 5 * ((seed >>> 8) % 5)
  return q(skill, difficulty, seed,
    `En ${observed} repeticiones de un experimento, una frecuencia observada se acerca a una probabilidad teórica calculada por Laplace. ¿Qué diferencia básica hay entre ambas?`,
    'Laplace usa el modelo de resultados equiprobables; la frecuencia observada procede de datos experimentales',
    ['Son siempre exactamente iguales en cualquier número de repeticiones', 'La frecuencia observada no puede expresarse como proporción', 'Laplace solo puede usarse después de experimentar'],
    'La probabilidad teórica parte del modelo; la frecuencia relativa empírica resume resultados observados.')
}

export function generateMathLaplaceContentDepth(
  skill: SkillMeta,
  difficulty: number,
  seed: number,
): GeneratedQuestion | null {
  if (skill.id !== 'M15S04') return null
  const normalized = seed >>> 0
  // Keep odd seeds on the established material for spaced review; deepen the even half.
  if ((normalized & 1) === 1) return null
  return laplace(skill, difficulty, normalized)
}
