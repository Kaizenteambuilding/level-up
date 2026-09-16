import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta={id:string;name:string;generator_key:string}
function rotate<T>(items:T[],shift:number){const k=((shift%items.length)+items.length)%items.length;return items.slice(k).concat(items.slice(0,k))}

export function generateMathNaturalOperationsDepthVariant(skill:SkillMeta,difficulty:number,seed:number):GeneratedQuestion|null{
  if(skill.id!=='M01S04') return null
  const n=seed>>>0
  const family=n%18
  const a=12+(n%28), b=3+((n>>>4)%8), c=2+((n>>>7)%7)
  let prompt='';let answer='';let distractors:[string,string,string]=['','',''];let solution=''
  if(family===0){const r=a*b;prompt=`Calcula ${a} × ${b}.`;answer=String(r);distractors=[String(r-b),String(r+a),String(a+b)];solution=`${a} × ${b} = ${r}.`}
  else if(family===1){const dividend=a*b;prompt=`Calcula ${dividend} ÷ ${b}.`;answer=String(a);distractors=[String(b),String(a-1),String(a+b)];solution=`Como ${a} × ${b} = ${dividend}, ${dividend} ÷ ${b} = ${a}.`}
  else if(family===2){const r=a*b;prompt=`Hay ${b} cajas con ${a} piezas en cada una. ¿Cuántas piezas hay en total?`;answer=String(r);distractors=[String(a+b),String(r-a),String(r+b)];solution=`Se multiplican grupos iguales: ${b} × ${a} = ${r}.`}
  else if(family===3){const total=a*b;prompt=`Se reparten ${total} cromos por igual entre ${b} personas. ¿Cuántos recibe cada una?`;answer=String(a);distractors=[String(b),String(a+b),String(a-2)];solution=`${total} ÷ ${b} = ${a}.`}
  else if(family===4){const total=a*b;prompt=`${total} objetos se colocan en grupos de ${a}. ¿Cuántos grupos completos se forman?`;answer=String(b);distractors=[String(a),String(b+1),String(total-a)];solution=`${total} ÷ ${a} = ${b}.`}
  else if(family===5){const x=a*b;prompt=`Completa: □ × ${b} = ${x}.`;answer=String(a);distractors=[String(b),String(a+b),String(x-b)];solution=`El factor que falta es ${x} ÷ ${b} = ${a}.`}
  else if(family===6){const x=a*b;prompt=`Completa: ${x} ÷ □ = ${a}.`;answer=String(b);distractors=[String(a),String(x),String(a-b)];solution=`El divisor es ${b} porque ${a} × ${b} = ${x}.`}
  else if(family===7){const r=(a+b)*c;prompt=`Calcula (${a} + ${b}) × ${c}.`;answer=String(r);distractors=[String(a+b*c),String((a+b)+c),String(a*c+b)];solution=`Primero ${a}+${b}=${a+b}; después ${a+b}×${c}=${r}.`}
  else if(family===8){const r=a*b+a*c;prompt=`Usa la distributiva: ${a} × (${b} + ${c}).`;answer=String(r);distractors=[String(a*b+c),String((a+b)*c),String(a+b+c)];solution=`${a}×${b} + ${a}×${c} = ${a*b}+${a*c}=${r}.`}
  else if(family===9){const r=a*b;prompt=`Sin recalcular desde cero: si ${a} × ${b} = ${r}, ¿cuánto vale ${b} × ${a}?`;answer=String(r);distractors=[String(r+a),String(r-b),String(a+b)];solution='La multiplicación es conmutativa: cambiar el orden de los factores no cambia el producto.'}
  else if(family===10){const x=a*b;prompt=`¿Qué operación comprueba que ${x} ÷ ${b} = ${a}?`;answer=`${a} × ${b} = ${x}`;distractors=[`${a} + ${b} = ${x}`,`${x} × ${b} = ${a}`,`${x} - ${b} = ${a}`];solution='La división se comprueba multiplicando cociente por divisor.'}
  else if(family===11){const q=a,r=1+((n>>>7)%(b-1)),dividend=q*b+r;prompt=`Al dividir ${dividend} entre ${b}, ¿cuál es el cociente entero?`;answer=String(Math.floor(dividend/b));distractors=[String(q+1),String(b),String(r)];solution=`${dividend} = ${b}×${q} + ${r}, con 0 < ${r} < ${b}; el cociente es ${q}.`}
  else if(family===12){const q=a,r=1+((n>>>7)%(b-1)),dividend=q*b+r;prompt=`Al dividir ${dividend} entre ${b}, ¿cuál es el resto?`;answer=String(dividend%b);distractors=[String(q),String(b),String((r%(b-1))+1)];if(distractors[2]===answer)distractors[2]='0';solution=`${dividend} = ${b}×${q} + ${r}; por tanto el resto es ${r}, que es menor que ${b}.`}
  else if(family===13){const x=a*b;prompt=`¿Cuál de estas divisiones es exacta?`;answer=`${x} ÷ ${b}`;distractors=[`${x+1} ÷ ${b}`,`${x+2} ÷ ${b}`,`${x+b+1} ÷ ${b}`];solution=`${x} es múltiplo de ${b}, porque ${x}=${a}×${b}; las otras divisiones dejan resto.`}
  else if(family===14){const r=a*10;prompt=`Calcula mentalmente ${a} × 10.`;answer=String(r);distractors=[String(a+10),String(a*100),String(a)];solution=`Multiplicar un natural por 10 da ${r}.`}
  else if(family===15){const x=a*100;prompt=`Calcula ${x} ÷ 100.`;answer=String(a);distractors=[String(a*10),String(a+100),String(x-100)];solution=`${x} contiene ${a} centenas; ${x} ÷ 100 = ${a}.`}
  else if(family===16){const packs=b,each=a,total=packs*each,extra=c;prompt=`Una tienda prepara ${packs} paquetes de ${each} unidades y añade ${extra} unidades sueltas. ¿Cuántas unidades hay?`;answer=String(total+extra);distractors=[String(total),String((a+extra)*packs),String(a+packs+extra)];solution=`Primero ${packs}×${each}=${total}; después ${total}+${extra}=${total+extra}.`}
  else {const rows=b,cols=c,each=a,total=rows*cols*each;prompt=`Hay ${rows} filas con ${cols} cajas por fila y ${a} objetos por caja. ¿Cuántos objetos hay en total?`;answer=String(total);distractors=[String(rows+cols+a),String(rows*cols+a),String(rows*(cols+a))];solution=`Hay ${rows}×${cols}=${rows*cols} cajas; ${rows*cols}×${a}=${total} objetos.`}
  const options=rotate([answer,...distractors],n+difficulty)
  return {skillId:skill.id,label:skill.name,difficulty,seed,prompt,options,answerIndex:options.indexOf(answer),solution,tags:[skill.generator_key,'math','natural_operations_course_depth']}
}
