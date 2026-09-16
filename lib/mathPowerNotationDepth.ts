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

function superscript(value: number) {
  const map: Record<string, string> = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' }
  return String(value).split('').map((digit) => map[digit] ?? digit).join('')
}

function finish(skill: SkillMeta, difficulty: number, seed: number, item: Item): GeneratedQuestion {
  const options = rotate([item.answer, ...item.distractors], seed + difficulty)
  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt: item.prompt,
    options,
    answerIndex: options.indexOf(item.answer),
    solution: item.solution,
    tags: [skill.generator_key, 'math', 'power_notation_depth'],
  }
}

function build(seed: number): Item {
  const mixed = Math.imul((seed ^ (seed >>> 16)) >>> 0, 0x45d9f3b) >>> 0
  const family = (mixed >>> 3) % 18
  const base = 2 + (mixed % 8)
  const exponent = 2 + ((mixed >>> 7) % 5)
  const notation = `${base}${superscript(exponent)}`
  const expanded = Array.from({ length: exponent }, () => String(base)).join(' × ')
  const value = base ** exponent

  const items: Item[] = [
    {
      prompt: `En la potencia ${notation}, ¿qué papel cumple el número ${base}?`,
      answer: 'Es la base, el factor que se repite',
      distractors: ['Es el exponente', 'Indica cuántas sumas hay que hacer', 'Es siempre el resultado de la potencia'],
      solution: `En ${notation}, ${base} es la base y aparece repetido como factor.`,
    },
    {
      prompt: `En ${notation}, ¿qué información aporta el exponente ${exponent}?`,
      answer: `Que la base aparece ${exponent} veces como factor`,
      distractors: [`Que hay que sumar ${exponent} a la base`, `Que el resultado es ${base * exponent}`, `Que la base debe multiplicarse una sola vez por ${exponent}`],
      solution: 'El exponente cuenta cuántas veces se usa la base como factor.',
    },
    {
      prompt: `Traduce ${notation} a multiplicación repetida.`,
      answer: expanded,
      distractors: [`${base} × ${exponent}`, `${base + exponent} × ${base}`, Array.from({ length: Math.max(2, exponent - 1) }, () => String(base)).join(' × ')],
      solution: `${notation} = ${expanded}.`,
    },
    {
      prompt: `¿Qué potencia representa el producto ${expanded}?`,
      answer: notation,
      distractors: [`${exponent}${superscript(base)}`, `${base * exponent}${superscript(2)}`, `${base + exponent}`],
      solution: `Hay ${exponent} factores iguales a ${base}, así que la potencia es ${notation}.`,
    },
    {
      prompt: `Un alumno dice que ${notation} significa ${base} × ${exponent}. ¿Cuál es la corrección adecuada?`,
      answer: `Significa ${expanded}`,
      distractors: [`Significa ${base}+${exponent}`, `Significa ${exponent}${superscript(base)}`, 'La afirmación es correcta'],
      solution: 'Una potencia expresa multiplicación repetida de la base, no base por exponente.',
    },
    {
      prompt: `¿Qué afirmación describe correctamente ${notation}?`,
      answer: `Base ${base}, exponente ${exponent} y valor ${value}`,
      distractors: [`Base ${exponent}, exponente ${base} y valor ${value}`, `Base ${base}, exponente ${exponent} y valor ${base * exponent}`, `Base ${value}, exponente ${exponent}`],
      solution: `${notation} = ${expanded} = ${value}.`,
    },
    {
      prompt: `Si una potencia tiene base ${base} y exponente ${exponent}, ¿cuántos factores iguales aparecen en su desarrollo?`,
      answer: String(exponent),
      distractors: [String(base), String(base + exponent), String(base * exponent)],
      solution: 'El exponente indica el número de factores iguales.',
    },
    {
      prompt: `En el desarrollo ${expanded}, ¿qué número se repite como factor?`,
      answer: String(base),
      distractors: [String(exponent), String(value), String(base + exponent)],
      solution: `El factor repetido es ${base}; por eso esa es la base.`,
    },
    {
      prompt: `Compara ${base}${superscript(exponent)} y ${exponent}${superscript(base)}. ¿Qué cambia al intercambiar base y exponente?`,
      answer: 'Cambian el factor repetido y el número de repeticiones',
      distractors: ['No cambia nada nunca', 'Solo cambia la forma de escribir', 'El exponente deja de tener significado'],
      solution: 'Base y exponente desempeñan funciones distintas y no son intercambiables en general.',
    },
    {
      prompt: `Un cuadrado tiene lado ${base} cm. ¿Por qué su área puede escribirse como ${base}²?`,
      answer: `Porque se calcula ${base} × ${base}`,
      distractors: [`Porque se calcula ${base} × 2`, `Porque se suma ${base}+2`, `Porque el perímetro es ${base}²`],
      solution: 'El área de un cuadrado es lado por lado, una potencia de exponente 2.',
    },
    {
      prompt: `Un cubo tiene arista ${base} cm. ¿Qué expresa ${base}³ al calcular su volumen?`,
      answer: `${base} × ${base} × ${base}`,
      distractors: [`${base} × 3`, `${base} + ${base} + ${base}`, `${base} × ${base}`],
      solution: 'El volumen usa tres dimensiones iguales, por eso aparecen tres factores iguales.',
    },
    {
      prompt: `Si ${base}${superscript(exponent)} = ${value}, ¿cuál de estas frases es correcta?`,
      answer: `${value} es el valor de la potencia, no su exponente`,
      distractors: [`${value} es la base`, `${base} es el valor final`, `${exponent} es la base`],
      solution: 'Base y exponente describen la notación; el valor es el resultado de efectuar la multiplicación repetida.',
    },
    {
      prompt: `Una expresión contiene ${exponent} factores iguales a ${base}. ¿Qué determina que el exponente sea ${exponent}?`,
      answer: `El número de veces que aparece ${base} como factor`,
      distractors: [`El valor final ${value}`, `La suma ${base + exponent}`, `Que ${base} sea mayor que 1`],
      solution: 'El exponente se obtiene contando los factores iguales a la base.',
    },
    {
      prompt: `¿Cómo se lee ${base}²?`,
      answer: `${base} al cuadrado`,
      distractors: [`${base} al cubo`, `${base} por dos`, `Dos elevado a ${base}`],
      solution: 'El exponente 2 se lee habitualmente “al cuadrado”.',
    },
    {
      prompt: `¿Cómo se lee ${base}³?`,
      answer: `${base} al cubo`,
      distractors: [`${base} al cuadrado`, `${base} por tres`, `Tres elevado a ${base}`],
      solution: 'El exponente 3 se lee habitualmente “al cubo”.',
    },
    {
      prompt: `Para escribir ${expanded} de forma abreviada, ¿qué dos datos necesitas identificar?`,
      answer: `El factor repetido ${base} y que aparece ${exponent} veces`,
      distractors: [`Solo el resultado ${value}`, `La suma de todos los factores`, `El primer y el último factor únicamente`],
      solution: 'La base es el factor repetido y el exponente cuenta cuántas veces aparece.',
    },
    {
      prompt: `¿Cuál es el error conceptual en sustituir ${notation} por ${base * exponent}?`,
      answer: 'Confundir multiplicación repetida de la base con multiplicar base por exponente',
      distractors: ['Confundir suma con resta', 'Usar una base demasiado pequeña', 'Usar un exponente natural'],
      solution: `${notation} requiere ${expanded}, no ${base}×${exponent}.`,
    },
    {
      prompt: `Si aumentamos el exponente de ${base}${superscript(exponent)} a ${base}${superscript(exponent + 1)}, ¿qué cambia en el producto desarrollado?`,
      answer: `Se añade un factor ${base}`,
      distractors: [`Se suma 1 al resultado y nada más`, `La base pasa a ser ${base + 1}`, 'Se elimina un factor de la base'],
      solution: 'Aumentar el exponente en uno añade una repetición más de la misma base como factor.',
    },
  ]

  return items[family]
}

export function generateMathPowerNotationDepth(
  skill: SkillMeta,
  difficulty: number,
  seed: number,
): GeneratedQuestion | null {
  if (skill.id !== 'M02S01') return null
  const normalized = seed >>> 0
  // Use the deeper bank for three quarters of seeds. The remaining quarter keeps
  // established material in rotation so review stays varied rather than being replaced.
  if ((normalized & 3) === 3) return null
  return finish(skill, difficulty, normalized, build(normalized))
}
