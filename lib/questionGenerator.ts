export type Question={
  id:string; skill:string; difficulty:number; prompt:string;
  options:string[]; answerIndex:number; solution:string; diagnosticTags:string[]; xp:number;
}
function rng(seed:number){let s=seed>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296)}
function ri(r:()=>number,a:number,b:number){return Math.floor(r()*(b-a+1))+a}
function gcd(a:number,b:number){while(b){[a,b]=[b,a%b]}return a||1}
function shuffle<T>(r:()=>number,arr:T[]){const x=[...arr];for(let i=x.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}
export function generateQuestion(skill:string,difficulty:number,seed:number):Question{
  const r=rng(seed)
  if(skill==='fractions_apply'){
    const den=ri(r,3,5+difficulty), num=ri(r,1,den-1), reps=ri(r,2,2+difficulty)
    const n=num*reps,g=gcd(n,den),sn=n/g,sd=den/g
    const ans=sd===1?`${sn} km`:`${sn}/${sd} km`
    const options=shuffle(r,[ans,`${num}/${den*reps} km`,`${num+reps}/${den} km`,`${num}/${den} km`])
    return {id:`fractions_apply_${seed}`,skill,difficulty,prompt:`Una ruta mide ${num}/${den} km. Si la recorres ${reps} veces, ¿qué distancia total haces?`,options,answerIndex:options.indexOf(ans),solution:`Multiplicamos ${num}/${den} × ${reps}. Resultado: ${ans}.`,diagnosticTags:['modelizacion','multiplicacion_fracciones'],xp:15+difficulty*10}
  }
  const x=ri(r,2,8+difficulty),k=ri(r,2,10+difficulty),total=x+k
  const ans=String(x), options=shuffle(r,[ans,String(total+k),String(total-k-1),String(k)])
  return {id:`equation_${seed}`,skill:'equation_1step',difficulty,prompt:`Resuelve: x + ${k} = ${total}`,options,answerIndex:options.indexOf(ans),solution:`Restamos ${k} a ambos lados. x = ${x}.`,diagnosticTags:['equivalencia','operacion_inversa'],xp:15+difficulty*10}
}
