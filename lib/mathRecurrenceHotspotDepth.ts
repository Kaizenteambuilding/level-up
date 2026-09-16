import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }

function rotate<T>(items: T[], shift: number) {
  const offset = ((shift % items.length) + items.length) % items.length
  return items.slice(offset).concat(items.slice(0, offset))
}

function mixSeed(seed: number, salt: number) {
  let value = (seed ^ salt) >>> 0
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d)
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b)
  return (value ^ (value >>> 16)) >>> 0
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
    tags: [skill.generator_key, 'math', 'recurrence_hotspot_depth'],
  }
}

function superscript(value: number) {
  const map: Record<string, string> = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' }
  return String(value).split('').map((digit) => map[digit] ?? digit).join('')
}

function powers(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion {
  const family = (seed >>> 1) % 14
  const base = 2 + (seed % 7)
  const exponent = 2 + ((seed >>> 5) % 4)
  const notation = `${base}${superscript(exponent)}`
  const expanded = Array.from({ length: exponent }, () => String(base)).join(' × ')

  if (family === 0) return q(skill, difficulty, seed,
    `En ${notation}, ¿qué número es la base?`, String(base),
    [String(exponent), String(base * exponent), String(base ** exponent)],
    `La base es el número que se repite como factor: ${base}.`)
  if (family === 1) return q(skill, difficulty, seed,
    `En ${notation}, ¿qué indica el exponente ${exponent}?`,
    `Que ${base} se usa ${exponent} veces como factor`,
    [`Que se suma ${base} exactamente ${exponent} veces`, `Que el resultado es ${base * exponent}`, `Que hay que multiplicar ${base} por ${exponent} una sola vez`],
    'El exponente indica cuántas veces aparece la base como factor.')
  if (family === 2) return q(skill, difficulty, seed,
    `¿Qué producto representa ${notation}?`, expanded,
    [`${base} × ${exponent}`, `${base} + ${base} + ${base}`, `${exponent} × ${exponent}`],
    `${notation} significa ${expanded}.`)
  if (family === 3) return q(skill, difficulty, seed,
    `El producto ${expanded} se escribe como…`, notation,
    [`${exponent}${superscript(base)}`, `${base * exponent}²`, `${base + exponent}`],
    `Hay ${exponent} factores iguales a ${base}, por eso se escribe ${notation}.`)
  if (family === 4) return q(skill, difficulty, seed,
    `¿Cuál afirmación sobre ${notation} es correcta?`,
    `Tiene base ${base} y exponente ${exponent}`,
    [`Tiene base ${exponent} y exponente ${base}`, `Significa ${base} × ${exponent}`, `Significa ${base} + ${exponent}`],
    'En una potencia, la base es el factor repetido y el exponente cuenta las repeticiones.')
  if (family === 5) return q(skill, difficulty, seed,
    `¿Por qué ${notation} no significa ${base} × ${exponent}?`,
    'Porque una potencia representa multiplicación repetida de la base',
    ['Porque las potencias representan sumas repetidas', 'Porque el exponente nunca afecta al cálculo', 'Porque la base debe ser siempre 10'],
    `${notation} representa ${expanded}, no un único producto entre base y exponente.`)
  if (family === 6) {
    const squareBase = 3 + (seed % 8)
    return q(skill, difficulty, seed,
      `Un cuadrado tiene lado ${squareBase} cm. Su área se expresa como ${squareBase}². ¿Qué representa el “²”?`,
      'Multiplicar la longitud del lado por sí misma',
      [`Sumar ${squareBase}+2`, `Duplicar solamente una medida`, 'Convertir centímetros en metros'],
      `El área es ${squareBase}×${squareBase}; por eso aparece una potencia de exponente 2.`)
  }
  if (family === 7) {
    const cubeBase = 2 + (seed % 6)
    return q(skill, difficulty, seed,
      `El volumen de un cubo de arista ${cubeBase} cm puede escribirse ${cubeBase}³. ¿Qué producto describe esa potencia?`,
      `${cubeBase} × ${cubeBase} × ${cubeBase}`,
      [`${cubeBase} × 3`, `${cubeBase} + ${cubeBase} + ${cubeBase}`, `${cubeBase} × ${cubeBase}`],
      'El exponente 3 indica tres factores iguales a la arista.')
  }
  if (family === 8) return q(skill, difficulty, seed,
    `Compara la escritura ${base}${superscript(exponent)} con ${exponent}${superscript(base)}. ¿Por qué no significan lo mismo en general?`,
    'Porque intercambiar base y exponente cambia el factor repetido y cuántas veces se repite',
    ['Porque cualquier intercambio deja igual una potencia', 'Porque solo importa el exponente', 'Porque solo importa la base'],
    'Base y exponente cumplen funciones distintas; intercambiarlos suele cambiar el valor.')
  if (family === 9) return q(skill, difficulty, seed,
    `Si ves una potencia con exponente 2, como ${base}², ¿cómo se lee habitualmente?`,
    `${base} al cuadrado`, [`${base} al cubo`, `${base} por dos`, `Dos elevado a ${base}`],
    'El exponente 2 se lee “al cuadrado”.')
  if (family === 10) return q(skill, difficulty, seed,
    `Si ves una potencia con exponente 3, como ${base}³, ¿cómo se lee habitualmente?`,
    `${base} al cubo`, [`${base} al cuadrado`, `${base} por tres`, `Tres elevado a ${base}`],
    'El exponente 3 se lee “al cubo”.')
  if (family === 11) return q(skill, difficulty, seed,
    `Una expresión tiene ${exponent} factores iguales a ${base}. ¿Qué dato determina el exponente?`,
    `El número de factores iguales, ${exponent}`,
    [`El valor de la base, ${base}`, `La suma ${base + exponent}`, `El producto ${base * exponent}`],
    'El exponente cuenta cuántas veces aparece la base como factor.')
  if (family === 12) {
    const tenExp = 2 + (seed % 4)
    return q(skill, difficulty, seed,
      `En 10${superscript(tenExp)}, ¿qué describe mejor la notación?`,
      `El producto de ${tenExp} factores iguales a 10`,
      [`El producto 10 × ${tenExp}`, `La suma de ${tenExp} dieces`, `El número 10 seguido siempre de ${tenExp + 1} ceros`],
      `10${superscript(tenExp)} significa multiplicar 10 por sí mismo ${tenExp} veces.`)
  }
  return q(skill, difficulty, seed,
    `Para traducir correctamente ${notation} a un producto, ¿qué debes identificar primero?`,
    'La base y cuántas veces la repite el exponente',
    ['Solo si el resultado es par', 'Únicamente el signo de la operación', 'La suma de base y exponente'],
    'Interpretar una potencia exige distinguir el factor repetido de la cantidad de repeticiones.')
}

function favorablePossible(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion {
  const mixed = mixSeed(seed, 0x15fa903)
  const family = mixed % 14
  const red = 2 + ((mixed >>> 3) % 5)
  const blue = 2 + ((mixed >>> 8) % 5)
  const green = 1 + ((mixed >>> 13) % 4)
  const total = red + blue + green

  if (family === 0) return q(skill, difficulty, seed,
    `Una bolsa contiene ${red} bolas rojas, ${blue} azules y ${green} verdes. Al sacar una bola, ¿cuántos casos posibles hay si cada bola cuenta como resultado elemental?`,
    String(total), [String(red + blue), '3', String(total + 1)],
    `Hay ${red}+${blue}+${green}=${total} bolas, así que hay ${total} resultados elementales equiprobables si solo difieren por la bola extraída.`)
  if (family === 1) return q(skill, difficulty, seed,
    `En una bolsa con ${red} rojas, ${blue} azules y ${green} verdes, ¿cuántos casos favorables tiene el suceso “sacar roja”?`,
    String(red), [String(total), String(blue), '1'],
    `Son favorables exactamente las ${red} bolas rojas.`)
  if (family === 2) return q(skill, difficulty, seed,
    `Con ${red} bolas rojas, ${blue} azules y ${green} verdes, ¿cuántos casos favorables tiene “sacar una bola que no sea verde”?`,
    String(red + blue), [String(green), String(total), String(red)],
    `Favorables son rojas o azules: ${red}+${blue}=${red + blue}.`)
  if (family === 3) {
    const sides = 6
    const threshold = 3 + ((mixed >>> 18) % 3)
    const favorable = sides - threshold
    return q(skill, difficulty, seed,
      `Al lanzar un dado de seis caras, ¿cuántos casos favorables hay para obtener un número mayor que ${threshold}?`,
      String(favorable), [String(threshold), String(6), String(favorable + 1)],
      `Los resultados mayores que ${threshold} son ${Array.from({length:favorable},(_,i)=>threshold+1+i).join(', ')}: hay ${favorable}.`)
  }
  if (family === 4) return q(skill, difficulty, seed,
    'Al lanzar una moneda una vez, para el suceso “sale cara”, ¿cuál es la relación correcta entre casos favorables y posibles?',
    '1 favorable de 2 posibles', ['2 favorables de 1 posible', '1 favorable de 1 posible', '2 favorables de 2 posibles'],
    'Los resultados posibles son cara y cruz; solo cara es favorable.')
  if (family === 5) return q(skill, difficulty, seed,
    'Al lanzar un dado, el suceso “obtener un número par” incluye 2, 4 y 6. ¿Cuántos casos favorables y posibles hay?',
    '3 favorables y 6 posibles', ['6 favorables y 3 posibles', '3 favorables y 3 posibles', '2 favorables y 6 posibles'],
    'El dado tiene seis resultados posibles y tres de ellos son pares.')
  if (family === 6) return q(skill, difficulty, seed,
    'En una ruleta con 8 sectores iguales numerados del 1 al 8, ¿cuántos casos favorables tiene “obtener un múltiplo de 2”?',
    '4', ['2', '6', '8'],
    'Los favorables son 2, 4, 6 y 8.')
  if (family === 7) return q(skill, difficulty, seed,
    `Una caja tiene ${total} fichas y ${red} llevan una estrella. ¿Qué dos números necesitas para aplicar “favorables / posibles” al suceso “sacar estrella”?`,
    `${red} favorables y ${total} posibles`, [`${total} favorables y ${red} posibles`, `${blue} favorables y ${green} posibles`, `${red + blue} favorables y ${red} posibles`],
    'El numerador cuenta resultados del suceso y el denominador todos los resultados posibles equiprobables.')
  if (family === 8) return q(skill, difficulty, seed,
    '¿Puede un número de casos favorables ser mayor que el número de casos posibles del mismo experimento?',
    'No, los favorables forman parte de los posibles', ['Sí, siempre', 'Sí, cuando el suceso es probable', 'Solo con dados'],
    'Todo resultado favorable pertenece al conjunto de resultados posibles.')
  if (family === 9) return q(skill, difficulty, seed,
    'Un suceso imposible, como sacar un 7 en un dado de seis caras, ¿cuántos casos favorables tiene?',
    '0', ['1', '6', '7'],
    'Ninguno de los seis resultados posibles cumple el suceso.')
  if (family === 10) return q(skill, difficulty, seed,
    'Un suceso seguro en un dado, “obtener un número del 1 al 6”, ¿cuántos casos favorables tiene?',
    '6', ['0', '1', '3'],
    'Los seis resultados posibles cumplen el suceso, así que los seis son favorables.')
  if (family === 11) return q(skill, difficulty, seed,
    'En una baraja simplificada hay 10 cartas numeradas del 1 al 10. Para “obtener un número mayor que 7”, ¿cuáles son los casos favorables?',
    '8, 9 y 10', ['1, 2 y 3', '7, 8 y 9', 'Solo 10'],
    'Los valores estrictamente mayores que 7 son 8, 9 y 10.')
  if (family === 12) return q(skill, difficulty, seed,
    'En dos lanzamientos de moneda, los resultados son CC, CX, XC y XX. ¿Cuántos casos favorables tiene “exactamente una cara”?',
    '2', ['1', '3', '4'],
    'CX y XC contienen exactamente una cara; son dos resultados favorables de cuatro posibles.')
  return q(skill, difficulty, seed,
    '¿Qué error hay en contar como “casos posibles” solo los resultados que nos interesan?',
    'El conjunto de casos posibles debe incluir todos los resultados elementales del experimento',
    ['Ninguno, posibles y favorables siempre son lo mismo', 'Los casos posibles solo cuentan resultados favorables', 'Solo importa el número de casos favorables'],
    'Primero se define todo el espacio de resultados posibles y después se identifica el subconjunto favorable.')
}

export function generateMathRecurrenceHotspotDepth(
  skill: SkillMeta,
  difficulty: number,
  seed: number,
): GeneratedQuestion | null {
  const normalized = seed >>> 0
  if (skill.id === 'M02S01') {
    if ((normalized & 1) === 1) return null
    return powers(skill, difficulty, normalized)
  }
  if (skill.id === 'M15S03') {
    if ((normalized & 3) === 3) return null
    return favorablePossible(skill, difficulty, normalized)
  }
  return null
}
