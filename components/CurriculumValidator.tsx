'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import {
  generateFirstEvaluationQuestion,
  GeneratedQuestion,
} from '@/lib/firstEvaluationGenerators'

type UnitRow = { id: string; name: string; sort_order: number }
type SkillRow = { id: string; name: string; generator_key: string; unit_id: string }

export default function CurriculumValidator() {
  const [units, setUnits] = useState<UnitRow[]>([])
  const [skills, setSkills] = useState<SkillRow[]>([])
  const [unitId, setUnitId] = useState('M01')
  const [skillId, setSkillId] = useState('')
  const [difficulty, setDifficulty] = useState(2)
  const [seed, setSeed] = useState(20260812)
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const supabase = createSupabaseBrowserClient()
      if (!supabase) { setMessage('Supabase no configurado.'); setLoading(false); return }

      const { data, error } = await supabase
        .from('curriculum_units')
        .select('id,name,sort_order')
        .eq('active', true)
        .order('sort_order')

      if (error) { setMessage(error.message); setLoading(false); return }

      setUnits((data ?? []) as UnitRow[])
      if (data?.[0]?.id) setUnitId(data[0].id)
      setLoading(false)
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      if (!unitId) return
      const supabase = createSupabaseBrowserClient()
      if (!supabase) return

      const { data, error } = await supabase
        .from('skills')
        .select('id,name,generator_key,unit_id')
        .eq('unit_id', unitId)
        .eq('active', true)
        .order('sort_order')

      if (error) { setMessage(error.message); return }

      const rows = (data ?? []) as SkillRow[]
      setSkills(rows)
      setSkillId(rows[0]?.id ?? '')
      setQuestion(null)
    })()
  }, [unitId])

  const currentSkill = useMemo(
    () => skills.find((skill) => skill.id === skillId) ?? null,
    [skills, skillId]
  )

  function generate() {
    if (!currentSkill) return
    setQuestion(generateFirstEvaluationQuestion(currentSkill, difficulty, seed))
    setSeed((value) => value + 37)
  }

  if (loading) {
    return <section className="card"><p className="muted">Cargando validador curricular...</p></section>
  }

  return (
    <>
      <section className="card">
        <span className="tag">🧪 VALIDADOR CURRICULAR</span>
        <h1>Probar habilidades</h1>
        <p className="muted">
          Elige unidad, habilidad y dificultad. LEVEL UP genera una pregunta al instante.
        </p>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12}}>
          <label>Unidad
            <select value={unitId} onChange={(e)=>setUnitId(e.target.value)}
              style={{width:'100%',padding:12,marginTop:6}}>
              {units.map((u)=><option key={u.id} value={u.id}>{u.id} · {u.name}</option>)}
            </select>
          </label>

          <label>Habilidad
            <select value={skillId} onChange={(e)=>{setSkillId(e.target.value);setQuestion(null)}}
              style={{width:'100%',padding:12,marginTop:6}}>
              {skills.map((s)=><option key={s.id} value={s.id}>{s.id} · {s.name}</option>)}
            </select>
          </label>

          <label>Dificultad
            <select value={difficulty} onChange={(e)=>{setDifficulty(Number(e.target.value));setQuestion(null)}}
              style={{width:'100%',padding:12,marginTop:6}}>
              {[1,2,3,4,5].map((d)=><option key={d} value={d}>{d}/5</option>)}
            </select>
          </label>
        </div>

        <button className="btn primary" style={{marginTop:18}} onClick={generate} disabled={!currentSkill}>
          GENERAR PREGUNTA
        </button>

        {message && <p className="muted">{message}</p>}
      </section>

      {question && (
        <section className="card">
          <span className="tag">{question.skillId} · {question.label}</span>
          <h2>{question.prompt}</h2>

          <div className="answers">
            {question.options.map((option,index)=>(
              <div key={index} className="answer" style={{cursor:'default'}}>
                {String.fromCharCode(65+index)} · {option}
              </div>
            ))}
          </div>

          <div className="metric" style={{marginTop:16}}>
            <b>Respuesta correcta: {question.options[question.answerIndex]}</b>
            <p className="muted">{question.solution}</p>
            <p className="muted">Etiquetas: {question.tags.join(', ')}</p>
          </div>

          <button className="btn primary" style={{marginTop:14}} onClick={generate}>
            GENERAR OTRA
          </button>
        </section>
      )}

      <section className="card">
        <h2>Uso</h2>
        <p className="muted">
          Esta pantalla es solo para desarrollo. No modifica XP, dominio ni progreso.
        </p>
        <Link href="/player" className="btn dark">VOLVER A JUGAR</Link>
      </section>
    </>
  )
}
