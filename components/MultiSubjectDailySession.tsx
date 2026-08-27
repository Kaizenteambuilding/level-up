'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { chooseAdaptiveSkill } from '@/lib/adaptiveEngine'
import { buildActiveSubjectPlans } from '@/lib/activeSubjectPlans'
import { subjectForQuestion, unitsForActiveSubjects, type ActiveSubjectPlan } from '@/lib/dailySubjectRotation'
import { generateCurriculumQuestion } from '@/lib/curriculumQuestionGenerator'
import type { GeneratedQuestion } from '@/lib/firstEvaluationGenerators'
import { buildMissionRecap, type MissionSkillResult } from '@/lib/missionRecap'
import { awardDemoMission, demoAvatarById, demoStorageKey, normalizeDemoState } from '@/lib/demoGame'
import { playDemoSound } from '@/lib/demoSound'
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
const RECENT_SKILL_WINDOW = 5
const RECENT_UNIT_WINDOW = 3

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function retryJwtFuture<T extends { error?: { message?: string } | null }>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let result = await operation()
  for (let attempt = 1; attempt < attempts; attempt++) {
    const message = result.error?.message ?? ''
    if (!message.toLowerCase().includes('jwt issued at future')) break
    await sleep(700 * attempt)
    result = await operation()
  }
  return result
}

function isTransientSubmitError(error?: { message?: string; code?: string } | null) {
  const message = (error?.message ?? '').toLowerCase()
  const code = (error?.code ?? '').toUpperCase()
  return (
    message.includes('jwt issued at future') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network request failed') ||
    message.includes('load failed') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    ['PGRST000', 'PGRST001', 'PGRST002', 'PGRST003'].includes(code)
  )
}

async function retryIdempotentSubmit<T extends { error?: { message?: string; code?: string } | null }>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let result = await operation()
  for (let attempt = 1; attempt < attempts; attempt++) {
    if (!isTransientSubmitError(result.error)) break
    await sleep(700 * attempt)
    result = await operation()
  }
  return result
}

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
  const [sessionSkillResults, setSessionSkillResults] = useState<Record<string, MissionSkillResult>>({})
  const [answered, setAnswered] = useState(false)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)
  const [closing, setClosing] = useState(false)
  const [coinsAwarded, setCoinsAwarded] = useState(0)
  const [newGameLevel, setNewGameLevel] = useState<number | null>(null)
  const [missionAvatar, setMissionAvatar] = useState('🧑‍🚀')
  const [missionSound, setMissionSound] = useState(false)
  const recentTemplates = useRef<string[]>([])
  const sessionUnitCounts = useRef<Record<string, number>>({})
  const recentSkillIds = useRef<string[]>([])
  const recentUnitIds = useRef<string[]>([])
  const questionStarted = useRef(Date.now())
  const questionPrompt = useRef<HTMLParagraphElement>(null)
  const nextButton = useRef<HTMLButtonElement>(null)
  const sessionSeed = useMemo(() => hashText(sessionId ?? playerId ?? 'level-up'), [sessionId, playerId])

  useEffect(() => {
    if (question) questionPrompt.current?.focus()
  }, [question])

  useEffect(() => {
    if (feedback && answered) nextButton.current?.focus()
  }, [answered, feedback])

  useEffect(() => {
    ;(async () => {
      const id = localStorage.getItem('levelup_player_id')
      setPlayerId(id)
      if (!id) { setError('No hay un jugador seleccionado.'); setLoading(false); return }
      try {
        const savedGame = localStorage.getItem(demoStorageKey(id))
        if (savedGame) {
          const demoGame = normalizeDemoState(JSON.parse(savedGame))
          setMissionAvatar(demoAvatarById(demoGame.avatarId).icon)
          setMissionSound(demoGame.soundEnabled)
        }
      } catch {
        setMissionAvatar('🧑‍🚀')
      }
      const supabase = createSupabaseBrowserClient()
      if (!supabase) { setError('Supabase no está configurado.'); setLoading(false); return }

      const { data: opened, error: openError } = await retryJwtFuture(async () =>
        await supabase.rpc('open_levelup_session', { p_player_id: id })
      )
      if (openError) { setError(userFacingError(openError, 'No se pudo abrir la misión.')); setLoading(false); return }
      const openedId = String((opened as { session_id?: string } | null)?.session_id ?? '')
      if (!openedId) { setError('No se pudo confirmar la misión abierta.'); setLoading(false); return }
      setSessionId(openedId)
      void reportProductEvent(id, 'mission_started', '/mission')

      const [attemptsResult, unitsResult, plansResult, statesResult] = await Promise.all([
        retryJwtFuture(async () => await supabase.from('attempts').select('correct,xp_awarded,skill_id,prompt_snapshot').eq('session_id', openedId).order('created_at', { ascending: true })),
        retryJwtFuture(async () => await supabase.from('curriculum_units').select('id,subject_id,sort_order').eq('active', true)),
        retryJwtFuture(async () => await supabase.from('player_curriculum_plans').select('player_id,subject_id,academic_year_start,pacing_mode,current_term,focus_unit_ids,updated_at').eq('player_id', id)),
        retryJwtFuture(async () => await supabase.from('player_skill_state').select('skill_id,mastery,confidence,difficulty,priority,last_practiced_at').eq('player_id', id)),
      ])

      if (attemptsResult.error) { setError(userFacingError(attemptsResult.error, 'No se pudo recuperar la misión.')); setLoading(false); return }
      if (unitsResult.error) { setError(userFacingError(unitsResult.error, 'No se pudo cargar el currículo activo.')); setLoading(false); return }
      if (plansResult.error) { setError(userFacingError(plansResult.error, 'No se pudieron cargar los planes curriculares.')); setLoading(false); return }
      if (statesResult.error) { setError(userFacingError(statesResult.error, 'No se pudo cargar el progreso adaptativo.')); setLoading(false); return }

      const activePlans = buildActiveSubjectPlans(id, unitsResult.data ?? [], (plansResult.data ?? []) as StoredPlan[])
      if (!activePlans.length) { setError('No hay materias activas disponibles.'); setLoading(false); return }
      setPlans(activePlans)

      const unitIds = unitsForActiveSubjects(activePlans)
      const { data: skillRows, error: skillsError } = await retryJwtFuture(async () =>
        await supabase
          .from('skills')
          .select('id,name,generator_key,unit_id')
          .eq('active', true)
          .in('unit_id', unitIds)
      )
      if (skillsError) { setError(userFacingError(skillsError, 'No se pudieron cargar las habilidades activas.')); setLoading(false); return }
      if (!skillRows?.length) { setError('No hay habilidades activas para las materias disponibles.'); setLoading(false); return }
      const loadedSkills = skillRows as SkillRow[]
      setSkills(loadedSkills)

      const stateMap: Record<string, SkillState> = {}
      ;(statesResult.data ?? []).forEach((row: any) => { stateMap[row.skill_id] = row })
      setStates(stateMap)

      const attempts = attemptsResult.data ?? []
      const skillToUnit = new Map(loadedSkills.map((skill) => [skill.id, skill.unit_id]))
      const counts: Record<string, number> = {}
      const historicalSkillIds: string[] = []
      const historicalUnitIds: string[] = []
      const recoveredSkillResults: Record<string, MissionSkillResult> = {}
      for (const attempt of attempts) {
        const skillId = String(attempt.skill_id ?? '')
        const unitId = skillToUnit.get(skillId)
        if (skillId) {
          const current = recoveredSkillResults[skillId] ?? { attempts: 0, correct: 0 }
          recoveredSkillResults[skillId] = {
            attempts: current.attempts + 1,
            correct: current.correct + Number(attempt.correct === true),
          }
        }
        if (!skillId || !unitId) continue
        counts[unitId] = (counts[unitId] ?? 0) + 1
        historicalSkillIds.unshift(skillId)
        historicalUnitIds.unshift(unitId)
      }
      setSessionSkillResults(recoveredSkillResults)
      sessionUnitCounts.current = counts
      recentSkillIds.current = historicalSkillIds.slice(0, RECENT_SKILL_WINDOW)
      recentUnitIds.current = historicalUnitIds.slice(0, RECENT_UNIT_WINDOW)

      setIndex(Math.min(SESSION_LENGTH, attempts.length))
      setCorrect(attempts.filter((attempt) => attempt.correct === true).length)
      setXp(attempts.reduce((sum, attempt) => sum + Number(attempt.xp_awarded ?? 0), 0))
      recentTemplates.current = attempts.slice(-10).map((attempt) => template(String(attempt.prompt_snapshot ?? ''))).filter(Boolean)
      setLoading(false)
    })()
  }, [])

  useEffect(() => {
    if (loading || error || question || !skills.length || !plans.length || !sessionId || index >= SESSION_LENGTH) return
    const subjectPlan = subjectForQuestion(plans, index, sessionSeed)
    if (!subjectPlan) { setError('No se pudo elegir una materia activa.'); return }
    const subjectSkills = skills.filter((skill) => subjectPlan.availableUnitIds.includes(skill.unit_id))
    if (!subjectSkills.length) { setError(`No hay habilidades activas para ${subjectDefinition(subjectPlan.subjectId)?.name ?? subjectPlan.subjectId}.`); return }

    const skill = chooseAdaptiveSkill({
      skills: subjectSkills,
      states,
      focusUnitIds: subjectPlan.focusUnitIds,
      reviewUnitIds: subjectPlan.reviewUnitIds,
      sessionUnitCounts: sessionUnitCounts.current,
      recentSkillIds: recentSkillIds.current,
      recentUnitIds: recentUnitIds.current,
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
  }, [loading, error, question, skills, plans, states, sessionId, sessionSeed, index])

  useEffect(() => {
    if (!sessionId || index < SESSION_LENGTH || completed || closing) return
    setClosing(true)
    ;(async () => {
      const supabase = createSupabaseBrowserClient()
      if (!supabase) { setError('No se pudo conectar para cerrar la misión.'); setClosing(false); return }
      const { data, error: closeError } = await retryJwtFuture(async () =>
        await supabase.rpc('complete_levelup_session', { p_session_id: sessionId })
      )
      if (closeError) { setError(userFacingError(closeError, 'No se pudo cerrar la misión.')); setClosing(false); return }
      const result = data as { completed?: boolean; attempts?: number; xp_earned?: number; coins_earned?: number; coins?: number; level_before?: number; level_after?: number }
      if (!result?.completed || Number(result.attempts) !== SESSION_LENGTH) { setError('El servidor no confirmó el cierre completo de la misión.'); setClosing(false); return }
      const earnedXp = Number(result.xp_earned ?? xp)
      setXp(earnedXp)
      if (Number(result.level_after ?? 0) > Number(result.level_before ?? 0)) setNewGameLevel(Number(result.level_after))
      if (playerId) {
        try {
          const key = demoStorageKey(playerId)
          const saved = localStorage.getItem(key)
          const currentGame = saved ? normalizeDemoState(JSON.parse(saved)) : normalizeDemoState(null)
          const award = awardDemoMission(currentGame, sessionId, correct, earnedXp)
          const serverReward = Number(result.coins_earned ?? award.reward)
          if (serverReward > 0) {
            localStorage.setItem(key, JSON.stringify({ ...award.state, coins: Number(result.coins ?? award.state.coins) }))
            playDemoSound(currentGame.soundEnabled, 'reward')
          }
          setCoinsAwarded(serverReward)
        } catch {
          setCoinsAwarded(0)
        }
      }
      setCompleted(true)
      setClosing(false)
      if (playerId) void reportProductEvent(playerId, 'mission_completed', '/mission')
    })()
  }, [index, sessionId, completed, closing, playerId, xp, correct])

  async function submit(optionIndex: number) {
    if (answered || !question || !playerId || !sessionId) return
    setAnswered(true)
    setSelectedOption(optionIndex)
    const ok = optionIndex === question.answerIndex
    playDemoSound(missionSound, ok ? 'correct' : 'incorrect')
    const responseMs = Math.min(3_600_000, Math.max(1, Date.now() - questionStarted.current))
    const supabase = createSupabaseBrowserClient()
    if (!supabase) { setAnswered(false); setFeedback('No se pudo conectar.'); return }
    const { data, error: submitError } = await retryIdempotentSubmit(async () =>
      await supabase.rpc('submit_levelup_attempt', {
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
    )
    if (submitError) { setAnswered(false); setSelectedOption(null); setFeedback(userFacingError(submitError, 'No se pudo guardar la respuesta.')); return }
    const result = data as { xp_awarded: number; mastery: number; confidence: number; difficulty: number; priority?: number; reconciled?: boolean }
    const unitId = skills.find((skill) => skill.id === question.skillId)?.unit_id
    if (unitId) {
      sessionUnitCounts.current = {
        ...sessionUnitCounts.current,
        [unitId]: (sessionUnitCounts.current[unitId] ?? 0) + 1,
      }
      recentSkillIds.current = [question.skillId, ...recentSkillIds.current.filter((id) => id !== question.skillId)].slice(0, RECENT_SKILL_WINDOW)
      recentUnitIds.current = [unitId, ...recentUnitIds.current].slice(0, RECENT_UNIT_WINDOW)
    }
    setXp((value) => value + Number(result.xp_awarded ?? 0))
    if (ok) setCorrect((value) => value + 1)
    setSessionSkillResults((current) => {
      const previous = current[question.skillId] ?? { attempts: 0, correct: 0 }
      return {
        ...current,
        [question.skillId]: {
          attempts: previous.attempts + 1,
          correct: previous.correct + Number(ok),
        },
      }
    })
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

  if (loading) return <section className="card loading-card" role="status" aria-live="polite"><p className="muted">Preparando misión multiasignatura…</p></section>
  if (error) return <section className="card" role="alert" aria-live="assertive"><span className="tag">ERROR DE MISIÓN</span><h1>No se puede continuar</h1><p className="muted">{error}</p><div className="action-row"><button className="btn primary" type="button" onClick={() => window.location.reload()}>REINTENTAR</button><Link className="btn dark" href="/world">VOLVER AL MUNDO</Link></div></section>
  if (index >= SESSION_LENGTH) {
    if (!completed) return <section className="card" role="status" aria-live="polite"><span className="tag">GUARDANDO RESULTADOS</span><h1>{closing ? 'Cerrando la misión…' : 'Confirmando resultados…'}</h1><p className="muted">Tu progreso se está validando en el servidor.</p></section>
    const accuracy = Math.round((correct / SESSION_LENGTH) * 100)
    const recap = buildMissionRecap(sessionSkillResults, Object.fromEntries(skills.map((skill) => [skill.id, skill.name])))
    return <section className="card" style={{ textAlign: 'center', padding: 45 }}>
      <div style={{ fontSize: 80 }}>🏆</div>
      <span className="tag">MISIÓN COMPLETADA</span>
      <h1>Sesión completada</h1>
      <p className="muted">{SESSION_LENGTH} retos · {accuracy}% precisión · +{xp} XP</p>
      {coinsAwarded > 0 && <p className="mission-reward">🪙 +{coinsAwarded} monedas</p>}
      {newGameLevel && <div className="metric" style={{ margin: '14px auto', maxWidth: 520 }}><b>⭐ ¡NIVEL {newGameLevel} DESBLOQUEADO!</b><p className="muted" style={{ marginBottom: 0 }}>Tu nivel de explorador ha subido. Revisa el mapa para descubrir nuevos accesos.</p></div>}
      <p className="muted">Resultados guardados. La próxima sesión utilizará esta evidencia para ajustar la práctica.</p>
      <div style={{ display: 'grid', gap: 10, margin: '20px 0', textAlign: 'left' }}>
        {recap.review.length > 0 && <div className="metric"><b>🎯 Para volver a practicar</b><p className="muted">{recap.review.map((item) => `${item.label} (${item.correct}/${item.attempts})`).join(' · ')}</p></div>}
        {recap.resolved.length > 0 && <div className="metric"><b>✨ Bien resuelto hoy</b><p className="muted">{recap.resolved.map((item) => `${item.label} (${item.correct}/${item.attempts})`).join(' · ')}</p></div>}
      </div>
      <div className="action-row" style={{ justifyContent: 'center' }}><Link className="btn primary" href="/world">VOLVER AL MUNDO</Link><Link className="btn dark" href="/shop">VISITAR LA TIENDA</Link></div>
    </section>
  }
  if (!question) return <section className="card" role="status" aria-live="polite"><p className="muted">Preparando el siguiente reto…</p></section>

  const subject = subjectDefinition(question.skillId.startsWith('M') ? 'math' : question.skillId.startsWith('L') ? 'spanish' : question.skillId.startsWith('E') ? 'english' : question.skillId.startsWith('G') ? 'geography_history' : 'biology_geology')
  const savedProgress = Math.min(SESSION_LENGTH, index + Number(answered && feedback))
  return <div className="mission-console">
    <section className="card mission-control">
      <div><span className="tag">{subject?.icon} {subject?.name ?? 'Currículo activo'}</span><h1>Reto {index + 1} de {SESSION_LENGTH}</h1><p className="muted">La misión rota entre las materias activas y adapta la dificultad a tu progreso.</p></div>
      <Link className="btn dark mission-exit" href="/world">SALIR AL MAPA</Link>
      <div className="energy-track" role="progressbar" aria-label="Progreso de la misión" aria-valuemin={0} aria-valuemax={SESSION_LENGTH} aria-valuenow={savedProgress} aria-valuetext={`${savedProgress} de ${SESSION_LENGTH} retos guardados`}>
        {Array.from({ length: SESSION_LENGTH }, (_, position) => <span key={position} className={position < savedProgress ? 'charged' : position === index ? 'active' : ''} aria-hidden="true">{position < savedProgress ? '⚡' : position + 1}</span>)}
      </div>
    </section>
    <div className="mission-stage">
      <aside className="mission-core" aria-label="Estado de la misión">
        <span className="mission-avatar" aria-label="Tu avatar">{missionAvatar}</span>
        <span className="core-city" aria-hidden="true">🗺️</span>
        <div className="core-orb" aria-hidden="true" style={{ '--mission-charge': `${Math.max(8, Math.round((savedProgress / SESSION_LENGTH) * 100))}%` } as CSSProperties}>⚡</div>
        <b>Misión {Math.round((savedProgress / SESSION_LENGTH) * 100)}%</b>
        <span>{correct} aciertos · {xp} XP</span>
        <small>Recompensa estimada: 🪙 {40 + correct * 5}</small>
      </aside>
      <section className="card mission-question">
        <span className="tag">{question.label} · dificultad {question.difficulty}/5</span>
        <p ref={questionPrompt} tabIndex={-1} style={{ fontSize: 24, fontWeight: 900 }}>{question.prompt}</p>
        <div className="answers">{question.options.map((option, i) => {
          const isCorrect = answered && i === question.answerIndex
          const isWrong = answered && i === selectedOption && !isCorrect
          const resultLabel = isCorrect ? ' · ✓ Correcta' : isWrong ? ' · ✕ Tu respuesta' : ''
          return <button key={i} className={`answer${isCorrect ? ' correct' : ''}${isWrong ? ' incorrect' : ''}`} disabled={answered} type="button" onClick={() => submit(i)} aria-label={`${String.fromCharCode(65 + i)}. ${option}${resultLabel}`}>{String.fromCharCode(65 + i)} · {option}{resultLabel}</button>
        })}</div>
        {answered && !feedback && <div className="metric" style={{ marginTop: 16 }} role="status" aria-live="polite"><b>Guardando respuesta…</b></div>}
        {feedback && <div className="metric" style={{ marginTop: 16 }} role={answered ? 'status' : 'alert'} aria-live={answered ? 'polite' : 'assertive'}><b>{feedback}</b></div>}
        {answered && feedback && <><div className="metric" style={{ marginTop: 10 }}><b>💡 Por qué</b><p className="muted" style={{ marginBottom: 0 }}>{question.solution}</p></div><button ref={nextButton} className="btn primary" type="button" style={{ marginTop: 14 }} onClick={next}>{index + 1 === SESSION_LENGTH ? 'TERMINAR SESIÓN' : 'SIGUIENTE RETO'}</button></>}
      </section>
    </div>
  </div>
}
