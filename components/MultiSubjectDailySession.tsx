'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { chooseAdaptiveSkill } from '@/lib/adaptiveEngine'
import { buildActiveSubjectPlans } from '@/lib/activeSubjectPlans'
import { subjectForQuestion, unitsForActiveSubjects, type ActiveSubjectPlan } from '@/lib/dailySubjectRotation'
import { generateCurriculumQuestion } from '@/lib/curriculumQuestionGenerator'
import type { GeneratedQuestion } from '@/lib/firstEvaluationGenerators'
import { subjectDefinition } from '@/lib/subjects'
import { userFacingError } from '@/lib/userFacingError'
import { reportProductEvent } from '@/lib/productTelemetry'

type SkillRow = { id: string; name: string; generator_key: string; unit_id: string }
type SkillState = {
  skill_id: string
  mastery: number
  confidence: number
  difficulty: number
  priority: number
  last_practiced_at?: string | null
}
type StoredPlan = {
  player_id: string
  subject_id: string
  academic_year_start: number
  pacing_mode: 'automatic' | 'manual'
  current_term: 1 | 2 | 3
  focus_unit_ids: string[]
  updated_at?: string
}

const SESSION_LENGTH = 10

function hashText(value: string) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function template(prompt: string) {
  return prompt.toLowerCase().replace(/\d+(?:[.,]\d+)?\/\d+(?:[.,]\d+)?/g, '#/#').replace(/\d+(?:[.,]\d+)?/g, '#').replace(/\s+/g, ' ').trim()
}

export default function MultiSubjectDailySession() {
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [plans, setPlans] = useState<ActiveSubjectPlan[]>([])
  const [skills, setSkills] = useState<SkillRow[]>([])
  const [states, setStates] = useState<Record<string, SkillState>>({})
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null)
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [xp, setXp] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)
  const [closing, setClosing] = useState(false)
  const recentTemplates = useRef<string[]>([])
  const questionStarted = useRef(Date.now())
  const sessionSeed = useMemo(() => hashText(sessionId ?? playerId ?? 'level-up'), [sessionId, playerId])

  useEffect(() => {
    ;(async () => {
      const id = localStorage.getItem('levelup_player_id')
      setPlayerId(id)
      if (!id) { setError('No hay un jugador seleccionado.'); setLoading(false); return }
      const supabase = createSupabaseBrowserClient()
      if (!supabase) { setError('Supabase no está configurado.'); setLoading(false); return }

      const { data: opened, error: openError } = await supabase.rpc('open_levelup_session', { p_player_id: id })
      if (openError) { setError(userFacingError(openError, 'No se pudo abrir la misión.')); setLoading(false); return }
      const openedId = String((opened as { session_id?: string } | null)?.session_id ?? '')
      if (!openedId) { setError('No se pudo confirmar la misión abierta.'); setLoading(false); return }
      setSessionId(openedId)
      void reportProductEvent(id, 'mission_started', '/mission')

      const [attemptsResult, unitsResult, plansResult, statesResult] = await Promise.all([
        supabase.from('attempts').select('correct,xp_awarded,skill_id,prompt_snapshot').eq('session_id', openedId).order('created_at', { ascending: true }),
        supabase.from('curriculum_units').select('id,subject_id,sort_order').eq('active', true),
        supabase.from('player_curriculum_plans').select('player_id,subject_id,academic_year_start,pacing_mode,current_term,focus_unit_ids,updated_at').eq('player_id', id),
        supabase.from('player_skill_state').select('skill_id,mastery,confidence,difficulty,priority,last_practiced_at').eq('player_id', id),
      ])

      if (attemptsResult.error) { setError(userFacingError(attemptsResult.error, 'No se pudo recuperar la misión.')); setLoading(false); return }
      if (unitsResult.error) { setError(userFacingError(unitsResult.error, 'No se pudo cargar el currículo activo.')); setLoading(false); return }
      if (plansResult.error) { setError(userFacingError(plansResult.error, 'No se pudieron cargar los planes curriculares.')); setLoading(false); return }
      if (statesResult.error) { setError(userFacingError(statesResult.error, 'No se pudo cargar el progreso adaptativo.')); setLoading(false); return }

      const activePlans = buildActiveSubjectPlans(id, unitsResult.data ?? [], (plansResult.data ?? []) as StoredPlan[])
      if (!activePlans.length) { setError('No hay materias activas disponibles.'); setLoading(false); return }
      setPlans(activePlans)

      const unitIds = unitsForActiveSubjects(activePlans)
      const { data: skillRows, error: skillsError } = await supabase
        .from('skills')
        .select('id,name,generator_key,unit_id')
        .eq('active', true)
        .in('unit_id', unitIds)
      if (skillsError) { setError(userFacingError(skillsError, 'No se pudieron cargar las habilidades activas.')); setLoading(false); return }
      if (!skillRows?.length) { setError('No hay habilidades activas para las materias disponibles.'); setLoading(false); return }
      setSkills(skillRows as SkillRow[])

      const stateMap: Record<string, SkillState> = {}
      ;(statesResult.data ?? []).forEach((row: any) => { stateMap[row.skill_id] = row })
      setStates(stateMap)

      const attempts = attemptsResult.data ?? []
      setIndex(Math.min(SESSION_LENGTH, attempts.length))
      setCorrect(attempts.filter((attempt) => attempt.correct === true).length)
      setXp(attempts.reduce((sum, attempt) => sum + Number(attempt.xp_awarded ?? 0), 0))
      recentTemplates.current = attempts.slice(-10).map((attempt) => template(String(attempt.prompt_snapshot ?? ''))).filter(Boolean)
      setLoading(false)
    })()
  }, [])

  useEffect(() => {
    if (loading || error || !skills.length || !plans.length || !sessionId || index >= SESSION_LENGTH) return
    const subjectPlan = subjectForQuestion(plans, index, sessionSeed)
    if (!subjectPlan) { setError('No se pudo elegir una materia activa.'); return }
    const subjectSkills = skills.filter((skill) => subjectPlan.availableUnitIds.includes(skill.unit_id))
    if (!subjectSkills.length) { setError(`No hay habilidades activas para ${subjectDefinition(subjectPlan.subjectId)?.name ?? subjectPlan.subjectId}.`); return }

    const skill = chooseAdaptiveSkill({
      skills: subjectSkills,
      states,
      focusUnitIds: subjectPlan.focusUnitIds,
      reviewUnitIds: subjectPlan.reviewUnitIds,
      sessionUnitCounts: {},
      recentSkillIds: [],
      recentUnitIds: [],
      seed: sessionSeed,
      questionIndex: index,
    })
    if (!skill) { setError('No se pudo elegir una habilidad para el reto.'); return }

    const difficulty = states[skill.id]?.difficulty ?? 1
    let seed = (sessionSeed + Math.imul(index + 1, 0x9e3779b9)) >>> 0
    let generated = generateCurriculumQuestion(skill, difficulty, seed)
    for (let attempt = 0; attempt < 40 && recentTemplates.current.includes(template(generated.prompt)); attempt++) {
      seed = (seed + 2654435761) >>> 0
      generated = generateCurriculumQuestion(skill, difficulty, seed)
    }
    recentTemplates.current = [template(generated.prompt), ...recentTemplates.current].slice(0, 10)
    setQuestion(generated)
    setAnswered(false)
    setSelectedOption(null)
    setFeedback('')
    questionStarted.current = Date.now()
  }, [loading, error, skills, plans, states, sessionId, sessionSeed, index])

  useEffect(() => {
    if (!sessionId || index < SESSION_LENGTH || completed || closing) return
    setClosing(true)
    ;(async () => {
      const supabase = createSupabaseBrowserClient()
      if (!supabase) { setError('No se pudo conectar para cerrar la misión.'); setClosing(false); return }
      const { data, error: closeError } = await supabase.rpc('complete_levelup_session', { p_session_id: sessionId })
      if (closeError) { setError(userFacingError(closeError, 'No se pudo cerrar la misión.')); setClosing(false); return }
      const result = data as { completed?: boolean; attempts?: number; xp_earned?: number }
      if (!result?.completed || Number(result.attempts) !== SESSION_LENGTH) { setError('El servidor no confirmó el cierre completo de la misión.'); setClosing(false); return }
      setXp(Number(result.xp_earned ?? xp))
      setCompleted(true)
      setClosing(false)
      if (playerId) void reportProductEvent(playerId, 'mission_completed', '/mission')
    })()
  }, [index, sessionId, completed, closing, playerId, xp])

  async function submit(optionIndex: number) {
    if (answered || !question || !playerId || !sessionId) return
    setAnswered(true)
    setSelectedOption(optionIndex)
    const ok = optionIndex === question.answerIndex
    const responseMs = Math.min(3_600_000, Math.max(1, Date.now() - questionStarted.current))
    const supabase = createSupabaseBrowserClient()
    if (!supabase) { setAnswered(false); setFeedback('No se pudo conectar.'); return }
    const { data, error: submitError } = await supabase.rpc('submit_levelup_attempt', {
      p_player_id: playerId,
      p_skill_id: question.skillId,
      p_correct: ok,
      p_response_ms: responseMs,
      p_difficulty: question.difficulty,
      p_seed: question.seed,
      p_prompt: question.prompt,
      p_session_id: sessionId,
      p_diagnostic_tags: question.tags,
    })
    if (submitError) { setAnswered(false); setSelectedOption(null); setFeedback(userFacingError(submitError, 'No se pudo guardar la respuesta.')); return }
    const result = data as { xp_awarded: number; mastery: number; confidence: number; difficulty: number; priority?: number }
    setXp((value) => value + Number(result.xp_awarded ?? 0))
    if (ok) setCorrect((value) => value + 1)
    setStates((current) => ({
      ...current,
      [question.skillId]: {
        skill_id: question.skillId,
        mastery: Number(result.mastery),
        confidence: Number(result.confidence),
        difficulty: Number(result.difficulty),
        priority: Number(result.priority ?? 50),
        last_practiced_at: new Date().toISOString(),
      },
    }))
    setFeedback((ok ? '✓ Correcto' : '↻ Incorrecto') + ` · ${Number(result.xp_awarded ?? 0)} XP`)
  }

  function next() {
    if (!answered || !feedback) return
    setQuestion(null)
    setIndex((value) => value + 1)
  }

  if (loading) return <section className="card loading-card" role="status"><p className="muted">Preparando misión multiasignatura…</p></section>
  if (error) return <section className="card" role="alert"><span className="tag">ERROR DE MISIÓN</span><h1>No se puede continuar</h1><p className="muted">{error}</p><div className="action-row"><button className="btn primary" type="button" onClick={() => window.location.reload()}>REINTENTAR</button><Link className="btn dark" href="/world">VOLVER AL MUNDO</Link></div></section>
  if (index >= SESSION_LENGTH) {
    if (!completed) return <section className="card"><span className="tag">GUARDANDO RESULTADOS</span><h1>{closing ? 'Cerrando la misión…' : 'Confirmando resultados…'}</h1><p className="muted">Tu progreso se está validando en el servidor.</p></section>
    const accuracy = Math.round((correct / SESSION_LENGTH) * 100)
    return <section className="card" style={{ textAlign: 'center', padding: 45 }}><div style={{ fontSize: 80 }}>🏆</div><span className="tag">MISIÓN COMPLETADA</span><h1>Sesión completada</h1><p className="muted">{SESSION_LENGTH} retos · {accuracy}% precisión · +{xp} XP</p><Link className="btn primary" href="/world">VOLVER AL MUNDO</Link></section>
  }
  if (!question) return <section className="card"><p className="muted">Preparando el siguiente reto…</p></section>

  const subject = subjectDefinition(question.skillId.startsWith('M') ? 'math' : question.skillId.startsWith('L') ? 'spanish' : question.skillId.startsWith('E') ? 'english' : question.skillId.startsWith('G') ? 'geography_history' : 'biology_geology')
  return <div className="mission-console">
    <section className="card mission-control"><div><span className="tag">{subject?.icon} {subject?.name ?? 'Currículo activo'}</span><h1>Reto {index + 1} de {SESSION_LENGTH}</h1><p className="muted">La misión rota entre las materias activas y adapta la dificultad a tu progreso.</p></div><Link className="btn dark mission-exit" href="/world">SALIR AL MAPA</Link></section>
    <section className="card mission-question">
      <span className="tag">{question.label} · dificultad {question.difficulty}/5</span>
      <p style={{ fontSize: 24, fontWeight: 900 }}>{question.prompt}</p>
      <div className="answers">{question.options.map((option, i) => {
        const isCorrect = answered && i === question.answerIndex
        const isWrong = answered && i === selectedOption && !isCorrect
        return <button key={i} className={`answer${isCorrect ? ' correct' : ''}${isWrong ? ' incorrect' : ''}`} disabled={answered} type="button" onClick={() => submit(i)}>{String.fromCharCode(65 + i)} · {option}</button>
      })}</div>
      {feedback && <div className="metric" style={{ marginTop: 16 }}><b>{feedback}</b></div>}
      {answered && feedback && <><div className="metric" style={{ marginTop: 10 }}><b>💡 Por qué</b><p className="muted">{question.solution}</p></div><button className="btn primary" type="button" style={{ marginTop: 14 }} onClick={next}>{index + 1 === SESSION_LENGTH ? 'TERMINAR SESIÓN' : 'SIGUIENTE RETO'}</button></>}
    </section>
  </div>
}
