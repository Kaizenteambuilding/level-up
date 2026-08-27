'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { chooseAdaptiveSkill } from '@/lib/adaptiveEngine'
import { generateCurriculumQuestion } from '@/lib/curriculumQuestionGenerator'
import type { GeneratedQuestion } from '@/lib/firstEvaluationGenerators'
import { userFacingError } from '@/lib/userFacingError'

const SESSION_LENGTH = 10
const MODE = 'english_terminal'
const RECENT_SKILL_WINDOW = 5
const RECENT_UNIT_WINDOW = 3

type SkillRow = { id: string; name: string; generator_key: string; unit_id: string }
type SkillState = { skill_id: string; mastery: number; confidence: number; difficulty: number; priority: number; last_practiced_at?: string | null }
type PlanRow = { focus_unit_ids?: string[] | null }
type PracticeOpenResult = { data: unknown; error: { message?: string } | null }

function hashText(value: string) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function template(prompt: string) {
  return prompt.toLowerCase().replace(/\d+(?:[.,]\d+)?/g, '#').replace(/\s+/g, ' ').trim()
}

export default function EnglishTerminalSession() {
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [skills, setSkills] = useState<SkillRow[]>([])
  const [states, setStates] = useState<Record<string, SkillState>>({})
  const [focusUnitIds, setFocusUnitIds] = useState<string[]>([])
  const [allUnitIds, setAllUnitIds] = useState<string[]>([])
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
  const recentSkillIds = useRef<string[]>([])
  const recentUnitIds = useRef<string[]>([])
  const sessionUnitCounts = useRef<Record<string, number>>({})
  const questionStarted = useRef(Date.now())
  const seedBase = useMemo(() => hashText(sessionId ?? playerId ?? MODE), [sessionId, playerId])

  useEffect(() => {
    ;(async () => {
      const id = localStorage.getItem('levelup_player_id')
      setPlayerId(id)
      if (!id) { setError('No hay un jugador seleccionado.'); setLoading(false); return }
      const supabase = createSupabaseBrowserClient()
      if (!supabase) { setError('Supabase no está configurado.'); setLoading(false); return }

      const openPractice = supabase.rpc as unknown as (
        name: 'open_levelup_practice_session',
        args: { p_player_id: string; p_mode: string },
      ) => Promise<PracticeOpenResult>
      const { data: opened, error: openError } = await openPractice('open_levelup_practice_session', { p_player_id: id, p_mode: MODE })
      if (openError) { setError(userFacingError(openError, 'No se pudo abrir Terminal de palabras.')); setLoading(false); return }
      const openedId = String((opened as { session_id?: string } | null)?.session_id ?? '')
      if (!openedId) { setError('No se pudo confirmar la sesión de Inglés.'); setLoading(false); return }
      setSessionId(openedId)

      const [unitsResult, planResult, statesResult, attemptsResult] = await Promise.all([
        supabase.from('curriculum_units').select('id').eq('subject_id', 'english').eq('active', true).order('sort_order'),
        supabase.from('player_curriculum_plans').select('focus_unit_ids').eq('player_id', id).eq('subject_id', 'english').maybeSingle(),
        supabase.from('player_skill_state').select('skill_id,mastery,confidence,difficulty,priority,last_practiced_at').eq('player_id', id),
        supabase.from('attempts').select('correct,xp_awarded,skill_id,prompt_snapshot,created_at').eq('session_id', openedId).order('created_at', { ascending: true }),
      ])
      if (unitsResult.error || !unitsResult.data?.length) { setError('No se pudo cargar el currículo activo de Inglés.'); setLoading(false); return }
      if (statesResult.error) { setError(userFacingError(statesResult.error, 'No se pudo cargar el progreso de Inglés.')); setLoading(false); return }
      if (attemptsResult.error) { setError(userFacingError(attemptsResult.error, 'No se pudo recuperar la práctica.')); setLoading(false); return }

      const unitIds = unitsResult.data.map((row) => String(row.id))
      setAllUnitIds(unitIds)
      const plan = (planResult.data ?? null) as PlanRow | null
      const focus = (plan?.focus_unit_ids ?? []).filter((unitId) => unitIds.includes(unitId))
      setFocusUnitIds(focus.length ? focus : unitIds)

      const { data: skillRows, error: skillsError } = await supabase.from('skills').select('id,name,generator_key,unit_id').eq('active', true).in('unit_id', unitIds)
      if (skillsError || !skillRows?.length) { setError('No hay habilidades activas de Inglés disponibles.'); setLoading(false); return }
      const loadedSkills = skillRows as SkillRow[]
      setSkills(loadedSkills)

      const stateMap: Record<string, SkillState> = {}
      ;(statesResult.data ?? []).forEach((row) => {
        if (!row.skill_id.startsWith('E')) return
        stateMap[row.skill_id] = {
          skill_id: row.skill_id,
          mastery: Number(row.mastery ?? 50),
          confidence: Number(row.confidence ?? 50),
          difficulty: Number(row.difficulty ?? 1),
          priority: Number(row.priority ?? 50),
          last_practiced_at: row.last_practiced_at,
        }
      })
      setStates(stateMap)

      const skillToUnit = new Map(loadedSkills.map((skill) => [skill.id, skill.unit_id]))
      const attempts = attemptsResult.data ?? []
      const counts: Record<string, number> = {}
      for (const attempt of attempts) {
        const skillId = String(attempt.skill_id ?? '')
        const unitId = skillToUnit.get(skillId)
        if (!unitId) continue
        counts[unitId] = (counts[unitId] ?? 0) + 1
        recentSkillIds.current.unshift(skillId)
        recentUnitIds.current.unshift(unitId)
      }
      sessionUnitCounts.current = counts
      recentSkillIds.current = recentSkillIds.current.slice(0, RECENT_SKILL_WINDOW)
      recentUnitIds.current = recentUnitIds.current.slice(0, RECENT_UNIT_WINDOW)
      recentTemplates.current = attempts.slice(-10).map((attempt) => template(String(attempt.prompt_snapshot ?? ''))).filter(Boolean)
      setIndex(Math.min(SESSION_LENGTH, attempts.length))
      setCorrect(attempts.filter((attempt) => attempt.correct === true).length)
      setXp(attempts.reduce((sum, attempt) => sum + Number(attempt.xp_awarded ?? 0), 0))
      setLoading(false)
    })()
  }, [])

  useEffect(() => {
    if (loading || error || question || !sessionId || !skills.length || index >= SESSION_LENGTH) return
    const reviewUnitIds = allUnitIds.filter((unitId) => !focusUnitIds.includes(unitId))
    const skill = chooseAdaptiveSkill({
      skills,
      states,
      focusUnitIds,
      reviewUnitIds,
      sessionUnitCounts: sessionUnitCounts.current,
      recentSkillIds: recentSkillIds.current,
      recentUnitIds: recentUnitIds.current,
      seed: seedBase,
      questionIndex: index,
    })
    if (!skill) { setError('No se pudo elegir un reto de Inglés.'); return }
    const difficulty = states[skill.id]?.difficulty ?? 1
    let seed = (seedBase + Math.imul(index + 1, 0x9e3779b9)) >>> 0
    let generated = generateCurriculumQuestion(skill, difficulty, seed)
    for (let attempt = 0; attempt < 40 && recentTemplates.current.includes(template(generated.prompt)); attempt += 1) {
      seed = (seed + 2654435761) >>> 0
      generated = generateCurriculumQuestion(skill, difficulty, seed)
    }
    recentTemplates.current = [template(generated.prompt), ...recentTemplates.current].slice(0, 10)
    setQuestion(generated)
    setAnswered(false)
    setSelectedOption(null)
    setFeedback('')
    questionStarted.current = Date.now()
  }, [loading, error, question, sessionId, skills, states, focusUnitIds, allUnitIds, seedBase, index])

  useEffect(() => {
    if (!sessionId || index < SESSION_LENGTH || completed || closing) return
    setClosing(true)
    ;(async () => {
      const supabase = createSupabaseBrowserClient()
      if (!supabase) { setError('No se pudo conectar para cerrar la práctica.'); setClosing(false); return }
      const { data, error: closeError } = await supabase.rpc('complete_levelup_session', { p_session_id: sessionId })
      if (closeError) { setError(userFacingError(closeError, 'No se pudo cerrar Terminal de palabras.')); setClosing(false); return }
      const result = data as { completed?: boolean; attempts?: number; xp_earned?: number; coins_earned?: number }
      if (!result?.completed || Number(result.attempts) !== SESSION_LENGTH) { setError('El servidor no confirmó los 10 retos de Inglés.'); setClosing(false); return }
      setXp(Number(result.xp_earned ?? xp))
      setCompleted(true)
      setClosing(false)
    })()
  }, [index, sessionId, completed, closing, xp])

  async function submit(optionIndex: number) {
    if (answered || !question || !playerId || !sessionId) return
    setAnswered(true)
    setSelectedOption(optionIndex)
    const ok = optionIndex === question.answerIndex
    const supabase = createSupabaseBrowserClient()
    if (!supabase) { setAnswered(false); setFeedback('No se pudo conectar.'); return }
    const responseMs = Math.min(3_600_000, Math.max(1, Date.now() - questionStarted.current))
    const { data, error: submitError } = await supabase.rpc('submit_levelup_attempt', {
      p_player_id: playerId,
      p_skill_id: question.skillId,
      p_correct: ok,
      p_response_ms: responseMs,
      p_difficulty: question.difficulty,
      p_seed: question.seed,
      p_prompt: question.prompt,
      p_session_id: sessionId,
      p_diagnostic_tags: [...question.tags, 'english_terminal'],
    })
    if (submitError) { setAnswered(false); setSelectedOption(null); setFeedback(userFacingError(submitError, 'No se pudo guardar la respuesta.')); return }
    const result = data as { xp_awarded?: number; mastery?: number; confidence?: number; difficulty?: number; priority?: number }
    const unitId = skills.find((skill) => skill.id === question.skillId)?.unit_id
    if (unitId) {
      sessionUnitCounts.current = { ...sessionUnitCounts.current, [unitId]: (sessionUnitCounts.current[unitId] ?? 0) + 1 }
      recentSkillIds.current = [question.skillId, ...recentSkillIds.current.filter((id) => id !== question.skillId)].slice(0, RECENT_SKILL_WINDOW)
      recentUnitIds.current = [unitId, ...recentUnitIds.current].slice(0, RECENT_UNIT_WINDOW)
    }
    setStates((current) => ({ ...current, [question.skillId]: { skill_id: question.skillId, mastery: Number(result.mastery ?? 50), confidence: Number(result.confidence ?? 50), difficulty: Number(result.difficulty ?? 1), priority: Number(result.priority ?? 50), last_practiced_at: new Date().toISOString() } }))
    setXp((value) => value + Number(result.xp_awarded ?? 0))
    if (ok) setCorrect((value) => value + 1)
    setFeedback((ok ? '✓ Correcto' : '↻ Incorrecto') + ` · ${Number(result.xp_awarded ?? 0)} XP`)
  }

  function next() {
    if (!answered || !feedback) return
    setQuestion(null)
    setIndex((value) => value + 1)
  }

  if (loading) return <section className="card" role="status"><p className="muted">Abriendo Terminal de palabras…</p></section>
  if (error) return <section className="card" role="alert"><span className="tag">TERMINAL DE PALABRAS</span><h1>No se puede continuar</h1><p className="muted">{error}</p><div className="action-row"><button className="btn primary" type="button" onClick={() => window.location.reload()}>REINTENTAR</button><Link className="btn dark" href="/zone/english">VOLVER AL PUERTO</Link></div></section>
  if (index >= SESSION_LENGTH) {
    if (!completed) return <section className="card" role="status"><h1>{closing ? 'Validando los 10 retos…' : 'Confirmando resultados…'}</h1></section>
    const accuracy = Math.round((correct / SESSION_LENGTH) * 100)
    return <section className="card" style={{ textAlign: 'center', padding: 45 }}><div style={{ fontSize: 72 }}>🧳✅</div><span className="tag">TERMINAL SUPERADA</span><h1>Permiso de vocabulario conseguido</h1><p className="muted">10 retos de Inglés · {accuracy}% precisión · +{xp} XP</p><p className="muted">El progreso se ha guardado y alimentará la adaptación de las próximas misiones.</p><div className="action-row" style={{ justifyContent: 'center' }}><Link className="btn primary" href="/zone/english">VOLVER AL PUERTO</Link><Link className="btn dark" href="/world">VOLVER AL MUNDO</Link></div></section>
  }
  if (!question) return <section className="card" role="status"><p className="muted">Preparando el siguiente reto de Inglés…</p></section>

  const savedProgress = Math.min(SESSION_LENGTH, index + Number(answered && feedback))
  return <div className="mission-console">
    <section className="card mission-control"><div><span className="tag">🌍 INGLÉS · TERMINAL DE PALABRAS</span><h1>Control {index + 1} de {SESSION_LENGTH}</h1><p className="muted">Vocabulario y estructuras adaptados al progreso real.</p></div><Link className="btn dark mission-exit" href="/zone/english">SALIR AL PUERTO</Link><div className="energy-track" role="progressbar" aria-valuemin={0} aria-valuemax={SESSION_LENGTH} aria-valuenow={savedProgress} aria-label="Progreso de Terminal de palabras">{Array.from({ length: SESSION_LENGTH }, (_, position) => <span key={position} className={position < savedProgress ? 'charged' : position === index ? 'active' : ''}>{position < savedProgress ? '⚡' : position + 1}</span>)}</div></section>
    <div className="mission-stage"><aside className="mission-core" aria-label="Estado de la práctica"><span className="mission-avatar">🧳</span><span className="core-city">🌍</span><div className="core-orb">⚡</div><b>Terminal {Math.round((savedProgress / SESSION_LENGTH) * 100)}%</b><span>{correct} aciertos · {xp} XP</span><small>10 controles para completar el distrito</small></aside>
      <section className="card mission-question"><span className="tag">{question.label} · dificultad {question.difficulty}/5</span><p tabIndex={-1} style={{ fontSize: 24, fontWeight: 900 }}>{question.prompt}</p><div className="answers">{question.options.map((option, i) => { const isCorrect = answered && i === question.answerIndex; const isWrong = answered && i === selectedOption && !isCorrect; return <button key={i} className={`answer${isCorrect ? ' correct' : ''}${isWrong ? ' incorrect' : ''}`} disabled={answered} type="button" onClick={() => submit(i)}>{String.fromCharCode(65 + i)} · {option}{isCorrect ? ' · ✓ Correcta' : isWrong ? ' · ✕ Tu respuesta' : ''}</button> })}</div>{answered && !feedback && <div className="metric" style={{ marginTop: 16 }}><b>Guardando respuesta…</b></div>}{feedback && <div className="metric" style={{ marginTop: 16 }}><b>{feedback}</b></div>}{answered && feedback && <><div className="metric" style={{ marginTop: 10 }}><b>💡 Por qué</b><p className="muted" style={{ marginBottom: 0 }}>{question.solution}</p></div><button className="btn primary" type="button" style={{ marginTop: 14 }} onClick={next}>{index + 1 === SESSION_LENGTH ? 'VALIDAR TERMINAL' : 'SIGUIENTE CONTROL'}</button></>}</section>
    </div>
  </div>
}
