import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id:string; name:string; generator_key:string }

const PRIMES=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71]
const COMPOSITES=[4,6,8,9,10,12,14,15,16,18,20,21,22,24,25,26,27,28,30,32]
const FACTORIZATIONS=[
  {n:12,f:'2² × 3'}, {n:18,f:'2 × 3²'}, {n:20,f:'2² × 5'}, {n:24,f:'2³ × 3'},
  {n:28,f:'2² × 7'}, {n:30,f:'2 × 3 × 5'}, {n:36,f:'2² × 3²'}, {n:40,f:'2³ × 5'},
  {n:42,f:'2 × 3 × 7'}, {n:45,f:'3² × 5'}, {n:48,f:'2⁴ × 3'}, {n:50,f:'2 × 5²'},
  {n:54,f:'2 × 3³'}, {n:60,f:'2² × 3 × 5'}, {n:63,f:'3² × 7'}, {n:70,f:'2 × 5 × 7'},
]
function pick<T>(items:T[],seed:number,offset=0){return items[(seed+offset)%items.length]}
function rotate<T>(items:T[],shift:number){const k=((shift%items.length)+items.length)%items.length;return items.slice(k).concat(items.slice(0,k))}

export function generateMathPrimeDepthVariant(skill:SkillMeta,difficulty:number,seed:number):GeneratedQuestion|null {
  if(skill.id!=='M03S04') return null
  const n=seed>>>0
  const family=n%18
  const p=pick(PRIMES,n), p2=pick(PRIMES,n,5), c=pick(COMPOSITES,n,3), c2=pick(COMPOSITES,n,9)
  const fact=pick(FACTORIZATIONS,n,2)
  let prompt=''; let answer=''; let distractors:[string,string,string]=['','','']; let solution=''

  if(family===0){prompt=`¿Cuál de estos números es primo?`;answer=String(p);distractors=[String(c),String(c2),String(p*2)];solution=`${p} tiene exactamente dos divisores positivos: 1 y ${p}.`}
  else if(family===1){prompt=`¿Cuál de estos números es compuesto?`;answer=String(c);distractors=[String(p),String(p2),String(pick(PRIMES,n,11))];solution=`${c} tiene divisores distintos de 1 y de sí mismo.`}
  else if(family===2){prompt=`¿Cuántos divisores positivos tiene cualquier número primo?`;answer='2';distractors=['1','3','Depende del primo'];solution='Por definición, un primo tiene exactamente los divisores 1 y él mismo.'}
  else if(family===3){prompt=`¿Por qué ${p} es primo?`;answer=`Porque solo es divisible entre 1 y ${p}`;distractors=['Porque es impar','Porque no termina en 0','Porque es menor que 100'];solution='La primalidad depende del número de divisores, no de ser impar o pequeño.'}
  else if(family===4){prompt=`¿Cuál es la descomposición en factores primos de ${fact.n}?`;answer=fact.f;distractors=[`${fact.n/2} × 2`,`${fact.n} × 1`,`2 × ${fact.n}`];solution=`La factorización prima de ${fact.n} es ${fact.f}.`}
  else if(family===5){prompt=`El número ${c} es compuesto. ¿Qué afirmación lo justifica?`;answer='Puede escribirse como producto de dos enteros mayores que 1';distractors=['Es necesariamente impar','Tiene exactamente dos divisores','No puede factorizarse'];solution='Un entero mayor que 1 es compuesto si admite una factorización no trivial.'}
  else if(family===6){prompt=`¿Por qué 1 no es un número primo?`;answer='Porque tiene un solo divisor positivo';distractors=['Porque es impar','Porque no es natural','Porque no puede dividir a otros números'];solution='Los números primos tienen exactamente dos divisores positivos distintos; 1 solo tiene uno.'}
  else if(family===7){const q=pick(PRIMES.filter(x=>x>20),n);prompt=`¿Cuál es el menor divisor primo de ${q*2} mayor que 1?`;answer='2';distractors=[String(q),'1','4'];solution=`${q*2} es par, así que 2 es un divisor primo y es el menor posible.`}
  else if(family===8){const q=pick(PRIMES.filter(x=>x>5),n);prompt=`El producto ${p} × ${q} es mayor que 1. ¿Puede ser primo?`;answer='No, tiene al menos los factores indicados';distractors=['Sí, todo producto de primos es primo','Sí, si los factores son distintos','Solo si el producto es impar'];solution='El producto de dos enteros mayores que 1 tiene una factorización no trivial y es compuesto.'}
  else if(family===9){const a=pick(PRIMES.filter(x=>x>=11),n), next=PRIMES[PRIMES.indexOf(a)+1]??73;prompt=`¿Cuál es el menor número primo mayor que ${a}?`;answer=String(next);distractors=[String(a+1),String(a+2),String(next+1)];solution=`Probando los enteros posteriores a ${a}, ${next} es el primero con solo dos divisores.`}
  else if(family===10){const q=pick(PRIMES.filter(x=>x>3),n);prompt=`Para decidir si ${q} es primo, ¿qué basta comprobar respecto a divisores?`;answer='Que no tenga divisores distintos de 1 y de sí mismo';distractors=['Que sea impar','Que su última cifra no sea 5','Que sea mayor que 10'];solution='Ser impar o no terminar en 5 no basta; la condición decisiva es no tener divisores no triviales.'}
  else if(family===11){const q=pick(PRIMES.filter(x=>x>5),n);const sq=q*q;prompt=`${sq} = ${q}². ¿Es primo o compuesto?`;answer='Compuesto';distractors=['Primo','Ni primo ni compuesto porque es cuadrado','Primo si el factor es primo'];solution=`${sq} tiene a ${q} como divisor distinto de 1 y de sí mismo.`}
  else if(family===12){const q=pick(PRIMES.filter(x=>x>3),n);prompt=`Si un número mayor que 1 es divisible entre ${q} y es distinto de ${q}, ¿qué podemos afirmar?`;answer='Es compuesto';distractors=['Es primo','Debe ser par','Debe tener exactamente dos divisores'];solution=`Tener a ${q} como divisor propio demuestra que existe una factorización no trivial.`}
  else if(family===13){const q=pick(PRIMES.filter(x=>x>10),n);prompt=`¿Qué pareja expresa ${q*3} como producto de factores mayores que 1?`;answer=`3 × ${q}`;distractors=[`1 × ${q*3}`,`${q} + 3`,`2 × ${q}`];solution=`3 × ${q} = ${q*3}, lo que además muestra que el número es compuesto.`}
  else if(family===14){const q=pick(PRIMES.filter(x=>x>5),n);prompt=`Un alumno afirma: “${q} es primo porque es impar”. ¿Qué respuesta es mejor?`;answer='Ser impar no basta; hay impares compuestos';distractors=['La afirmación es siempre correcta','Todo impar mayor que 3 es primo','Ser impar y mayor que 5 garantiza primalidad'];solution='Por ejemplo, 9, 15 y 21 son impares pero compuestos.'}
  else if(family===15){const q=pick(PRIMES.filter(x=>x>5),n);prompt=`Si ${q} es primo, ¿cuál es su factorización prima?`;answer=String(q);distractors=[`1 × ${q}`,`${q}²`,`2 × ${q}`];solution='Un primo ya es un factor primo y no se descompone en factores primos menores.'}
  else if(family===16){const f=pick(FACTORIZATIONS,n,7);prompt=`La factorización ${f.f} corresponde a…`;answer=String(f.n);distractors=[String(f.n+2),String(f.n-2),String(f.n*2)];solution=`Multiplicando los factores de ${f.f} se obtiene ${f.n}.`}
  else {const q=pick(PRIMES.filter(x=>x>7),n);prompt=`¿Cuál de estas afirmaciones sobre ${q} es correcta?`;answer=`Sus únicos divisores positivos son 1 y ${q}`;distractors=['Tiene al menos tres divisores positivos','Puede escribirse como producto de dos enteros mayores que 1','Es divisible entre 2 o 3'];solution=`Como ${q} es primo, tiene exactamente dos divisores positivos.`}

  const options=rotate([answer,...distractors],n+difficulty)
  return {skillId:skill.id,label:skill.name,difficulty,seed,prompt,options,answerIndex:options.indexOf(answer),solution,tags:[skill.generator_key,'math','prime_course_depth']}
}
