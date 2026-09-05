'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { chooseAdaptiveSkill } from '@/lib/adaptiveEngine'
import { generateCurriculumQuestion } from '@/lib/curriculumQuestionGenerator'
import type { GeneratedQuestion } from '@/lib/firstEvaluationGenerators'
import { userFacingError } from '@/lib/userFacingError'

const SESSION_LENGTH = 10
const MODE = 'english_conversation'
const RECENT_SKILL_WINDOW = 5
const RECENT_UNIT_WINDOW = 3
const RECENT_PROMPT_WINDOW = 80
const NETWORK_TIMEOUT_MS = 12_000
const CONVERSATION_SKILL_IDS = new Set(['E01S01','E01S04','E02S03','E03S03','E05S01','E05S03','E05S04','E06S04'])

type SkillRow = { id: string; name: string; generator_key: string; unit_id: string }
type SkillState = { skill_id: string; mastery: number; confidence: number; difficulty: number; priority: number; last_practiced_at?: string | null }
type PlanRow = { focus_unit_ids?: string[] | null }
type PracticeOpenResult = { data: unknown; error: { message?: string } | null }

async function withTimeout<T>(operation: PromiseLike<T>, label: string, timeoutMs = NETWORK_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      Promise.resolve(operation),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} agotó el tiempo de espera`)), timeoutMs)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return `${fallback} ${error.message}.`
  return fallback
}

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

export default function EnglishConversationSession() {
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
  const [completedToday, setCompletedToday] = useState(false)
  const [closing, setClosing] = useState(false)
  const recentTemplates = useRef<string[]>([])
  const recentSkillIds = useRef<string[]>([])
  const recentUnitIds = useRef<string[]>([])
  const sessionUnitCounts = useRef<Record<string, number>>({})
  const questionStarted = useRef(Date.now())
  const seedBase = useMemo(() => hashText(sessionId ?? playerId ?? MODE), [sessionId, playerId])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const id = localStorage.getItem('levelup_player_id')
        if (!active) return
        setPlayerId(id)
        if (!id) throw new Error('No hay un jugador seleccionado')
        const supabase = createSupabaseBrowserClient()
        if (!supabase) throw new Error('Supabase no está configurado')
        const openPractice = supabase.rpc.bind(supabase) as unknown as (name: 'open_levelup_practice_session', args: { p_player_id: string; p_mode: string }) => PromiseLike<PracticeOpenResult>
        const { data: opened, error: openError } = await withTimeout(openPractice('open_levelup_practice_session', { p_player_id: id, p_mode: MODE }), 'La apertura de Plaza de conversación')
        if (!active) return
        if (openError) {
          const message = (openError.message ?? '').toLowerCase()
          if (message.includes('practice already completed today')) { setCompletedToday(true); return }
          throw new Error(userFacingError(openError, 'No se pudo abrir Plaza de conversación.'))
        }
        const openedId = String((opened as { session_id?: string } | null)?.session_id ?? '')
        if (!openedId) throw new Error('El servidor no devolvió un identificador de sesión')
        setSessionId(openedId)

        const [unitsResult, planResult, statesResult, attemptsResult, historyResult] = await Promise.all([
          withTimeout(supabase.from('curriculum_units').select('id').eq('subject_id', 'english').eq('active', true).order('sort_order'), 'La carga del currículo de Inglés'),
          withTimeout(supabase.from('player_curriculum_plans').select('focus_unit_ids').eq('player_id', id).eq('subject_id', 'english').maybeSingle(), 'La carga del plan de Inglés'),
          withTimeout(supabase.from('player_skill_state').select('skill_id,mastery,confidence,difficulty,priority,last_practiced_at').eq('player_id', id), 'La carga del progreso adaptativo'),
          withTimeout(supabase.from('attempts').select('correct,xp_awarded,skill_id,prompt_snapshot,created_at').eq('session_id', openedId).order('created_at', { ascending: true }), 'La recuperación de la práctica'),
          withTimeout(supabase.from('attempts').select('skill_id,prompt_snapshot,created_at').eq('player_id', id).like('skill_id', 'E%').order('created_at', { ascending: false }).limit(RECENT_PROMPT_WINDOW), 'La carga del historial reciente de Inglés'),
        ])
        if (!active) return
        if (unitsResult.error || !unitsResult.data?.length) throw new Error('No se pudo cargar el currículo activo de Inglés')
        if (planResult.error) throw new Error(userFacingError(planResult.error, 'No se pudo cargar el plan de Inglés.'))
        if (statesResult.error) throw new Error(userFacingError(statesResult.error, 'No se pudo cargar el progreso de Inglés.'))
        if (attemptsResult.error) throw new Error(userFacingError(attemptsResult.error, 'No se pudo recuperar la práctica.'))
        if (historyResult.error) throw new Error(userFacingError(historyResult.error, 'No se pudo cargar el historial reciente de Inglés.'))

        const unitIds = unitsResult.data.map((row) => String(row.id))
        const plan = (planResult.data ?? null) as PlanRow | null
        const { data: skillRows, error: skillsError } = await withTimeout(supabase.from('skills').select('id,name,generator_key,unit_id').eq('active', true).in('unit_id', unitIds), 'La carga de habilidades de conversación')
        if (!active) return
        if (skillsError || !skillRows?.length) throw new Error('No hay habilidades activas de Inglés disponibles')
        const loadedSkills = (skillRows as SkillRow[]).filter((skill) => CONVERSATION_SKILL_IDS.has(skill.id))
        if (!loadedSkills.length) throw new Error('No hay habilidades de conversación disponibles')
        setSkills(loadedSkills)
        const availableUnitIds = Array.from(new Set(loadedSkills.map((skill) => skill.unit_id)))
        setAllUnitIds(availableUnitIds)
        const focus = (plan?.focus_unit_ids ?? []).filter((unitId) => availableUnitIds.includes(unitId))
        setFocusUnitIds(focus.length ? focus : availableUnitIds)

        const stateMap: Record<string, SkillState> = {}
        for (const row of statesResult.data ?? []) {
          const skillId = typeof row.skill_id === 'string' ? row.skill_id : ''
          if (!CONVERSATION_SKILL_IDS.has(skillId)) continue
          stateMap[skillId] = { skill_id: skillId, mastery: Number(row.mastery ?? 50), confidence: Number(row.confidence ?? 50), difficulty: Number(row.difficulty ?? 1), priority: Number(row.priority ?? 50), last_practiced_at: row.last_practiced_at }
        }
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
        recentTemplates.current = (historyResult.data ?? []).map((attempt) => template(String(attempt.prompt_snapshot ?? ''))).filter(Boolean).slice(0, RECENT_PROMPT_WINDOW)
        setIndex(Math.min(SESSION_LENGTH, attempts.length))
        setCorrect(attempts.filter((attempt) => attempt.correct === true).length)
        setXp(attempts.reduce((sum, attempt) => sum + Number(attempt.xp_awarded ?? 0), 0))
      } catch (cause) {
        if (active) setError(errorMessage(cause, 'No se pudo abrir Plaza de conversación.'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (loading || error || question || !sessionId || !skills.length || index >= SESSION_LENGTH) return
    const reviewUnitIds = allUnitIds.filter((unitId) => !focusUnitIds.includes(unitId))
    const primarySkill = chooseAdaptiveSkill({ skills, states, focusUnitIds, reviewUnitIds, sessionUnitCounts: sessionUnitCounts.current, recentSkillIds: recentSkillIds.current, recentUnitIds: recentUnitIds.current, seed: seedBase, questionIndex: index })
    if (!primarySkill) { setError('No se pudo elegir una situación de conversación.'); return }
    const alternatives = skills.filter((skill) => skill.id !== primarySkill.id).sort((a, b) => Number(recentSkillIds.current.includes(a.id)) - Number(recentSkillIds.current.includes(b.id)) || a.id.localeCompare(b.id))
    const candidates = [primarySkill, ...alternatives]
    const baseSeed = (seedBase + Math.imul(index + 1, 0x9e3779b9)) >>> 0
    let generated: GeneratedQuestion | null = null
    for (let candidateIndex = 0; candidateIndex < candidates.length && !generated; candidateIndex += 1) {
      const candidate = candidates[candidateIndex]
      const difficulty = states[candidate.id]?.difficulty ?? 1
      let seed = (baseSeed + Math.imul(candidateIndex, 0x85ebca6b)) >>> 0
      for (let attempt = 0; attempt < 16; attempt += 1) {
        const nextQuestion = generateCurriculumQuestion(candidate, difficulty, seed)
        if (!recentTemplates.current.includes(template(nextQuestion.prompt))) { generated = nextQuestion; break }
        seed = (seed + 2654435761) >>> 0
      }
    }
    if (!generated) generated = generateCurriculumQuestion(primarySkill, states[primarySkill.id]?.difficulty ?? 1, baseSeed)
    recentTemplates.current = [template(generated.prompt), ...recentTemplates.current].slice(0, RECENT_PROMPT_WINDOW)
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
      try {
        const supabase = createSupabaseBrowserClient()
        if (!supabase) throw new Error('No se pudo conectar para cerrar la práctica')
        const { data, error: closeError } = await withTimeout(supabase.rpc('complete_levelup_session', { p_session_id: sessionId }), 'El cierre de Plaza de conversación')
        if (closeError) throw new Error(userFacingError(closeError, 'No se pudo cerrar Plaza de conversación.'))
        const result = data as { completed?: boolean; attempts?: number; xp_earned?: number }
        if (!result?.completed || Number(result.attempts) !== SESSION_LENGTH) throw new Error('El servidor no confirmó los 10 turnos de conversación')
        setXp(Number(result.xp_earned ?? xp))
        setCompleted(true)
      } catch (cause) { setError(errorMessage(cause, 'No se pudo cerrar Plaza de conversación.')) } finally { setClosing(false) }
    })()
  }, [index, sessionId, completed, closing, xp])

  async function submit(optionIndex: number) {
    if (answered || !question || !playerId || !sessionId) return
    setAnswered(true)
    setSelectedOption(optionIndex)
    const ok = optionIndex === question.answerIndex
    try {
      const supabase = createSupabaseBrowserClient()
      if (!supabase) throw new Error('No se pudo conectar')
      const responseMs = Math.min(3_600_000, Math.max(1, Date.now() - questionStarted.current))
      const { data, error: submitError } = await withTimeout(supabase.rpc('submit_levelup_attempt', { p_player_id: playerId, p_skill_id: question.skillId, p_correct: ok, p_response_ms: responseMs, p_difficulty: question.difficulty, p_seed: question.seed, p_prompt: question.prompt, p_session_id: sessionId, p_diagnostic_tags: [...question.tags, 'english_conversation'] }), 'El guardado de la respuesta')
      if (submitError) throw new Error(userFacingError(submitError, 'No se pudo guardar la respuesta.'))
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
      setFeedback((ok ? '✓ Buena respuesta' : '↻ Revisa la situación') + ` · ${Number(result.xp_awarded ?? 0)} XP`)
    } catch (cause) {
      setAnswered(false)
      setSelectedOption(null)
      setFeedback(errorMessage(cause, 'No se pudo guardar la respuesta.'))
    }
  }

  function next() { if (answered && feedback) { setQuestion(null); setIndex((value) => value + 1) } }

  if (loading) return <section className="card" role="status"><p className="muted">Abriendo Plaza de conversación…</p><p className="muted">Preparando situaciones prácticas de Inglés.</p></section>
  if (completedToday) return <section className="card" style={{ textAlign: 'center', padding: 45 }}><div style={{ fontSize: 72 }}>💬✅</div><span className="tag">PLAZA COMPLETADA HOY</span><h1>Conversación de hoy terminada</h1><p className="muted">Ya completaste los 10 turnos. El progreso y las recompensas están guardados.</p><p className="muted">Mañana podrás abrir una nueva ronda.</p><div className="action-row" style={{ justifyContent: 'center' }}><Link className="btn primary" href="/zone/english">VOLVER AL PUERTO</Link><Link className="btn dark" href="/world">VOLVER AL MUNDO</Link></div></section>
  if (error) return <section className="card" role="alert"><span className="tag">PLAZA DE CONVERSACIÓN</span><h1>No se puede continuar</h1><p className="muted">{error}</p><div className="action-row"><button className="btn primary" type="button" onClick={() => window.location.reload()}>REINTENTAR</button><Link className="btn dark" href="/zone/english">VOLVER AL PUERTO</Link></div></section>
  if (index >= SESSION_LENGTH) {
    if (!completed) return <section className="card" role="status"><h1>{closing ? 'Validando los 10 turnos…' : 'Confirmando resultados…'}</h1></section>
    const accuracy = Math.round((correct / SESSION_LENGTH) * 100)
    return <section className="card" style={{ textAlign: 'center', padding: 45 }}><div style={{ fontSize: 72 }}>💬✅</div><span className="tag">PLAZA SUPERADA</span><h1>Permiso de conversación conseguido</h1><p className="muted">10 turnos de Inglés · {accuracy}% precisión · +{xp} XP</p><p className="muted">Has practicado respuestas, peticiones, planes, permisos y mediación en situaciones cotidianas.</p><div className="action-row" style={{ justifyContent: 'center' }}><Link className="btn primary" href="/zone/english">VOLVER AL PUERTO</Link><Link className="btn dark" href="/world">VOLVER AL MUNDO</Link></div></section>
  }
  if (!question) return <section className="card" role="status"><p className="muted">Preparando la siguiente situación…</p></section>

  const savedProgress = Math.min(SESSION_LENGTH, index + Number(Boolean(answered && feedback)))
  return <div className="mission-console">
    <section className="card mission-control"><div><span className="tag">🌍 INGLÉS · PLAZA DE CONVERSACIÓN</span><h1>Turno {index + 1} de {SESSION_LENGTH}</h1><p className="muted">Elige la respuesta más natural para cada situación cotidiana.</p></div><Link className="btn dark mission-exit" href="/zone/english">SALIR AL PUERTO</Link><div className="energy-track" role="progressbar" aria-valuemin={0} aria-valuemax={SESSION_LENGTH} aria-valuenow={savedProgress} aria-label="Progreso de Plaza de conversación">{Array.from({ length: SESSION_LENGTH }, (_, position) => <span key={position} className={position < savedProgress ? 'charged' : position === index ? 'active' : ''}>{position < savedProgress ? '⚡' : position + 1}</span>)}</div></section>
    <div className="mission-stage"><aside className="mission-core" aria-label="Estado de la práctica"><span className="mission-avatar">💬</span><span className="core-city">🌍</span><div className="core-orb">⚡</div><b>Plaza {Math.round((savedProgress / SESSION_LENGTH) * 100)}%</b><span>{correct} aciertos · {xp} XP</span><small>10 turnos para completar el distrito</small></aside>
      <section className="card mission-question"><span className="tag">{question.label} · dificultad {question.difficulty}/5</span><p tabIndex={-1} style={{ fontSize: 24, fontWeight: 900 }}>{question.prompt}</p><div className="answers">{question.options.map((option, i) => { const isCorrect = answered && i === question.answerIndex; const isWrong = answered && i === selectedOption && !isCorrect; return <button key={i} className={`answer${isCorrect ? ' correct' : ''}${isWrong ? ' incorrect' : ''}`} disabled={answered} type="button" onClick={() => submit(i)}>{String.fromCharCode(65 + i)} · {option}{isCorrect ? ' · ✓ Mejor opción' : isWrong ? ' · ✕ Tu respuesta' : ''}</button> })}</div>{answered && !feedback && <div className="metric" style={{ marginTop: 16 }}><b>Guardando respuesta…</b></div>}{feedback && <div className="metric" style={{ marginTop: 16 }}><b>{feedback}</b></div>}{answered && feedback && <><div className="metric" style={{ marginTop: 10 }}><b>💡 Clave comunicativa</b><p className="muted" style={{ marginBottom: 0 }}>{question.solution}</p></div><button className="btn primary" type="button" style={{ marginTop: 14 }} onClick={next}>{index + 1 === SESSION_LENGTH ? 'VALIDAR PLAZA' : 'SIGUIENTE TURNO'}</button></>}</section>
    </div>
  </div>
}
