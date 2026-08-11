'use client'
import {useMemo,useState} from 'react'
import {generateQuestion} from '@/lib/questionGenerator'
import {applyAttempt,SkillState} from '@/lib/adaptiveEngine'

export default function AdaptiveQuestion(){
  const [seed,setSeed]=useState(20260811)
  const [state,setState]=useState<SkillState>({mastery:62,confidence:58,difficulty:2,combo:0,errorTags:{}})
  const [feedback,setFeedback]=useState('')
  const q=useMemo(()=>generateQuestion('fractions_apply',state.difficulty,seed),[state.difficulty,seed])
  const answer=(i:number)=>{
    const started=performance.now()
    const correct=i===q.answerIndex
    const next=applyAttempt(state,correct,performance.now()-started,q.diagnosticTags)
    setState(next)
    setFeedback((correct?'✓ Correcto. ':'↻ Vamos a repararlo. ')+q.solution)
    setTimeout(()=>{setSeed(s=>s+37);setFeedback('')},700)
  }
  return <div className="grid two">
    <section className="card"><span className="tag">{q.skill} · dificultad {q.difficulty}/5</span><h2>{q.prompt}</h2>
      <div className="answers">{q.options.map((o,i)=><button key={i} className="answer" onClick={()=>answer(i)}>{String.fromCharCode(65+i)} · {o}</button>)}</div>
      {feedback && <p className="muted">{feedback}</p>}
    </section>
    <aside className="card"><h2>Estado del motor</h2>
      <div className="metric"><b>Dominio {state.mastery}</b><div className="bar"><i style={{width:`${state.mastery}%`}}/></div></div><br/>
      <div className="metric"><b>Confianza {state.confidence}</b><div className="bar"><i style={{width:`${state.confidence}%`}}/></div></div><br/>
      <div className="metric"><b>Dificultad {state.difficulty}/5</b><p className="muted">Combo: {state.combo}</p></div>
    </aside>
  </div>
}
