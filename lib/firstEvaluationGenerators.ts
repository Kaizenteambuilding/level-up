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
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
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

while (pool.length < 4) {
  const candidate = String(Number(answer) + pool.length + 1)

  if (!pool.includes(candidate)) {
    pool.push(candidate)
  } else {
    pool.push(String(pool.length))
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
  const ri = (a: number, b: number) => Math.floor(r() * (b - a + 1)) + a
  const d = Math.max(1, Math.min(5, difficulty))
  const key = skill.generator_key

  if (key === 'natural_place_value') {
    const th=ri(1,9), h=ri(0,9), t=ri(0,9), u=ri(0,9)
    const n=th*1000+h*100+t*10+u
    return mc(skill,d,seed,`En ${n}, ¿qué cifra ocupa las centenas?`,String(h),
      [String(th),String(t),String(u)],`La cifra de las centenas es ${h}.`,['valor_posicional'])
  }

  if (key === 'natural_compare') {
    const a=ri(100,9999), b=ri(100,9999), ans=a>b?'>':a<b?'<':'='
    return mc(skill,d,seed,`Completa: ${a} __ ${b}`,ans,
      ['<','>','='].filter(x=>x!==ans),`${a} ${ans} ${b}.`,['comparacion'])
  }

  if (key === 'natural_add_sub') {
    const a=ri(100,5000*d), b=ri(50,a), add=seed%2===0, res=add?a+b:a-b
    return mc(skill,d,seed,add?`Calcula ${a} + ${b}`:`Calcula ${a} - ${b}`,String(res),
      [String(res+10),String(Math.abs(a-b)),String(res-1)],`Resultado: ${res}.`,['calculo_naturales'])
  }

  if (key === 'natural_mult_div') {
    const a=ri(2,12+d), b=ri(2,12+d)
    if(seed%2===0){
      const res=a*b
      return mc(skill,d,seed,`Calcula ${a} × ${b}`,String(res),
        [String(res+a),String(a+b),String(res-b)],`${a} × ${b} = ${res}.`,['multiplicacion'])
    }
    const n=a*b
    return mc(skill,d,seed,`Calcula ${n} ÷ ${a}`,String(b),
      [String(a),String(b+1),String(n-a)],`${n} ÷ ${a} = ${b}.`,['division'])
  }

  if (key === 'operation_priority') {
    const a=ri(2,9), b=ri(2,8), c=ri(2,7), res=a+b*c
    return mc(skill,d,seed,`Calcula ${a} + ${b} × ${c}`,String(res),
      [String((a+b)*c),String(a+b+c),String(a*b+c)],
      `Primero ${b}×${c}=${b*c}; después +${a}: ${res}.`,['jerarquia_operaciones'])
  }

  if (key === 'natural_word_problem') {
    const cajas=ri(3,8+d), uds=ri(10,30+d*5), extra=ri(1,20), res=cajas*uds+extra
    return mc(skill,d,seed,
      `Hay ${cajas} cajas con ${uds} cromos cada una y además ${extra} cromos sueltos. ¿Cuántos hay?`,
      String(res),[String(cajas+uds+extra),String(cajas*uds),String(res-extra)],
      `${cajas}×${uds}+${extra}=${res}.`,['modelizacion_naturales'])
  }

  if (key === 'powers_meaning') {
    const b=ri(2,7), e=ri(2,4), ans=Array(e).fill(String(b)).join(' × ')
    return mc(skill,d,seed,`¿Qué significa ${b}^${e}?`,ans,
      [`${b} × ${e}`,`${e} × ${e}`,`${b} + ${b}`],
      `Es multiplicar ${b} por sí mismo ${e} veces.`,['potencia_significado'])
  }

  if (key === 'powers_compute') {
    const b=ri(2,5+d), e=ri(2,3+(d>3?1:0)), res=b**e
    return mc(skill,d,seed,`Calcula ${b}^${e}`,String(res),
      [String(b*e),String(res+b),String(b**(e-1))],`${b}^${e} = ${res}.`,['potencias'])
  }

  if (key === 'powers_ten') {
    const e=ri(1,5), res=10**e
    return mc(skill,d,seed,`¿Cuánto vale 10^${e}?`,String(res),
      [String(e*10),String(10**(e-1)),String(res+10)],
      `Es 1 seguido de ${e} ceros.`,['potencias_base_10'])
  }

  if (key === 'powers_properties') {
    const a=ri(2,5), m=ri(2,4), n=ri(1,3), ans=`${a}^${m+n}`
    return mc(skill,d,seed,`Simplifica ${a}^${m} × ${a}^${n}`,ans,
      [`${a}^${m*n}`,`${a*2}^${m+n}`,`${a}^${m-n}`],
      `Misma base: ${m}+${n}=${m+n}.`,['propiedades_potencias'])
  }

  if (key === 'sqrt_exact') {
    const root=ri(2,12), n=root*root
    return mc(skill,d,seed,`Calcula √${n}`,String(root),
      [String(root*2),String(n/2),String(root-1)],`${root}×${root}=${n}.`,['raiz_cuadrada'])
  }

  if (key === 'multiples') {
    const n=ri(2,12), k=ri(3,8), ans=n*k
    return mc(skill,d,seed,`¿Cuál es múltiplo de ${n}?`,String(ans),
      [String(ans+1),String(ans-1),String(n+k)],`${n}×${k}=${ans}.`,['multiplos'])
  }

  if (key === 'divisors') {
    const n=ri(3,12), k=ri(2,8), total=n*k
    return mc(skill,d,seed,`¿Cuál es divisor de ${total}?`,String(n),
      [String(n+1),String(k+1),String(total-1)],`${total} ÷ ${n} = ${k}.`,['divisores'])
  }

  if (key === 'divisibility_rules') {
    const n=ri(10,99)*3
    return mc(skill,d,seed,`¿Es ${n} divisible entre 3?`,'Sí',
      ['No','Solo entre 2','Solo entre 5'],
      `La suma de sus cifras es múltiplo de 3.`,['criterio_divisibilidad_3'])
  }

  if (key === 'prime_numbers') {
    const primes=[2,3,5,7,11,13,17,19,23,29], p=primes[ri(0,primes.length-1)]
    return mc(skill,d,seed,`¿Cuál es primo?`,String(p),
      [String(p*2),String(p*3),String((p+1)*2)],`${p} solo tiene divisores 1 y ${p}.`,['primos'])
  }

  if (key === 'prime_factorization') {
    const a=[2,3,5][ri(0,2)], b=[2,3,5,7][ri(0,3)], n=a*b
    return mc(skill,d,seed,`Una descomposición en factores primos de ${n} es:`,`${a} × ${b}`,
      [`1 × ${n}`,`${n} × 1`,`${a+b} × 1`],`${n}=${a}×${b}.`,['factorizacion'])
  }

  if (key === 'gcd') {
    const g=ri(2,6), a=g*ri(2,5), b=g*ri(2,5)
    const ds:number[]=[]; for(let x=1;x<=Math.min(a,b);x++) if(a%x===0&&b%x===0) ds.push(x)
    const res=Math.max(...ds)
    return mc(skill,d,seed,`Calcula MCD(${a}, ${b})`,String(res),
      [String(g),String(a*b),String(Math.min(a,b))].filter(x=>x!==String(res)),
      `El mayor divisor común es ${res}.`,['mcd'])
  }

  if (key === 'lcm') {
    const a=ri(2,8), b=ri(2,8)
    const gcd=(x:number,y:number)=>{while(y){[x,y]=[y,x%y]}return x}
    const res=Math.abs(a*b)/gcd(a,b)
    return mc(skill,d,seed,`Calcula mcm(${a}, ${b})`,String(res),
      [String(a*b),String(Math.max(a,b)),String(gcd(a,b))],`El mínimo múltiplo común es ${res}.`,['mcm'])
  }

  if (key === 'integers_context') {
    const t=ri(1,12)
    return mc(skill,d,seed,`La temperatura está ${t} grados bajo cero. ¿Qué entero la representa?`,String(-t),
      [String(t),'0',String(-t-1)],`Bajo cero: ${-t}.`,['enteros_contexto'])
  }

  if (key === 'integers_order') {
    const a=-ri(2,20), b=-ri(2,20), ans=a>b?'>':a<b?'<':'='
    return mc(skill,d,seed,`Completa: ${a} __ ${b}`,ans,
      ['<','>','='].filter(x=>x!==ans),`El que está más a la derecha es mayor.`,['orden_enteros'])
  }

  if (key === 'absolute_opposite') {
    const n=ri(2,30)
    return mc(skill,d,seed,`¿Cuál es el valor absoluto de -${n}?`,String(n),
      [String(-n),String(n+1),'0'],`|-${n}|=${n}.`,['valor_absoluto'])
  }

  if (key === 'integers_add') {
    const a=ri(-20,20), b=ri(-20,20), res=a+b
    return mc(skill,d,seed,`Calcula (${a}) + (${b})`,String(res),
      [String(a-b),String(-res),String(Math.abs(a)+Math.abs(b))],`Resultado: ${res}.`,['suma_enteros'])
  }

  if (key === 'integers_sub') {
    const a=ri(-20,20), b=ri(-20,20), res=a-b
    return mc(skill,d,seed,`Calcula (${a}) - (${b})`,String(res),
      [String(a+b),String(-res),String(b-a)],`Restar es sumar el opuesto. Resultado: ${res}.`,['resta_enteros'])
  }

  if (key === 'integers_mult_div') {
    const a=ri(-10,10)||2, b=ri(-10,10)||3, res=a*b
    return mc(skill,d,seed,`Calcula (${a}) × (${b})`,String(res),
      [String(Math.abs(res)),String(-res),String(a+b)],`Regla de signos: ${res}.`,['producto_enteros','regla_signos'])
  }

  if (key === 'integers_mixed') {
    const a=ri(-10,10), b=ri(2,8), c=ri(-6,6), res=a+b*c
    return mc(skill,d,seed,`Calcula ${a} + ${b} × (${c})`,String(res),
      [String((a+b)*c),String(a+b+c),String(a-b*c)],
      `Primero ${b}×(${c})=${b*c}; después sumamos ${a}.`,['jerarquia_enteros'])
  }

  if (key === 'decimal_place_value') {
    const t=ri(1,9), h=ri(0,9), n=`${ri(1,99)}.${t}${h}`
    return mc(skill,d,seed,`En ${n}, ¿qué cifra ocupa las décimas?`,String(t),
      [String(h),n.split('.')[0][0],'0'],`La primera cifra decimal es ${t}.`,['valor_posicional_decimal'])
  }

  if (key === 'decimal_compare') {
    const a=(ri(10,999)/100).toFixed(2), b=(ri(10,999)/100).toFixed(2)
    const ans=Number(a)>Number(b)?'>':Number(a)<Number(b)?'<':'='
    return mc(skill,d,seed,`Completa: ${a} __ ${b}`,ans,
      ['<','>','='].filter(x=>x!==ans),`${a} ${ans} ${b}.`,['comparacion_decimales'])
  }

  if (key === 'decimal_add_sub') {
    const a=ri(100,999)/10, b=ri(10,500)/10, add=seed%2===0, res=add?a+b:a-b
    return mc(skill,d,seed,
      add?`Calcula ${a.toFixed(1)} + ${b.toFixed(1)}`:`Calcula ${a.toFixed(1)} - ${b.toFixed(1)}`,
      res.toFixed(1),[(res+1).toFixed(1),(res-0.1).toFixed(1),String(Math.round(res))],
      `Alineamos las comas. Resultado: ${res.toFixed(1)}.`,['suma_resta_decimales'])
  }

  if (key === 'decimal_mult_div') {
    const a=ri(12,99)/10, b=ri(2,9), res=a*b
    return mc(skill,d,seed,`Calcula ${a.toFixed(1)} × ${b}`,res.toFixed(1),
      [(a+b).toFixed(1),(res*10).toFixed(1),(res/10).toFixed(2)],
      `Resultado: ${res.toFixed(1)}.`,['producto_decimales'])
  }

  if (key === 'decimal_round') {
    const n=ri(100,999)/100, ans=n.toFixed(1)
    return mc(skill,d,seed,`Redondea ${n.toFixed(2)} a las décimas`,ans,
      [n.toFixed(2),String(Math.floor(n)),(n+0.1).toFixed(1)],`Resultado: ${ans}.`,['redondeo'])
  }

  return mc(skill,d,seed,
    `¿Qué opción representa correctamente "${skill.name}"?`,
    'Opción correcta',['Distractor A','Distractor B','Distractor C'],
    'Esta habilidad usa un generador de reserva.',['fallback_generator'])
}
