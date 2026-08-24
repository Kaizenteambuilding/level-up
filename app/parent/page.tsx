'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { isAuthenticationExpired, userFacingError } from '@/lib/userFacingError'
import {
  fetchCompletedActivity,
  fetchCompletedSkillEvidence,
} from '@/lib/progressQueries'
import {
  emergingSkills,
  evidenceCount,
  reinforcementSkills,
  skillAccuracy,
  strongestSkills,
  weeklyRecommendation,
  weightedMastery,
} from '@/lib/parentInsights'
import {
  buildUnitInsights,
  CurriculumSkill,
  unitStatusLabel,
} from '@/lib/curriculumInsights'
import {
  CurriculumPacingMode,
  CurriculumPlan,
  CurriculumTerm,
  effectiveCurriculumPlan,
  MATH_CURRICULUM_UNITS,
  schoolYearStart,
  termLabel,
  unitsForTerm,
} from '@/lib/curriculumPlan'

type Player = {
  id: string
  alias: string
  xp: number
  daily_target_minutes: number
}

type SkillState = {
  skill_id: string
  mastery: number
  confidence: number
  difficulty: number
  priority: number
  skills: {
    name: string
    unit_id: string
  } | null
}

type ActivitySession = {
  started_at: string
  ended_at: string | null
  actual_minutes: number | null
}

type RecentSession = ActivitySession & {
  id: string
  xp_earned: number
  correct: number
  attempts: number
}

const ACTIVE_CURRICULUM_UNITS = [...MATH_CURRICULUM_UNITS]

function localDayKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function previousLocalDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(12, 0, 0, 0)
  copy.setDate(copy.getDate() - 1)
  return copy
}

function sessionMinutes(session: ActivitySession) {
  const stored = Number(session.actual_minutes)
  if (Number.isFinite(stored) && stored > 0) {
    return Math.min(180, Math.max(1, Math.round(stored)))
  }

  if (!session.ended_at) return 0

  const elapsed =
    new Date(session.ended_at).getTime() -
    new Date(session.started_at).getTime()

  if (!Number.isFinite(elapsed) || elapsed <= 0) return 0
  return Math.min(180, Math.max(1, Math.round(elapsed / 60_000)))
}

function activitySummary(sessions: ActivitySession[]) {
  const trainingDays = new Set(sessions.map((session) => localDayKey(session.started_at)))
  const today = new Date()
  const todayKey = localDayKey(today)
  const todayMinutes = sessions
    .filter((session) => localDayKey(session.started_at) === todayKey)
    .reduce((sum, session) => sum + sessionMinutes(session), 0)

  let cursor = new Date(today)
  cursor.setHours(12, 0, 0, 0)
  if (!trainingDays.has(localDayKey(cursor))) cursor = previousLocalDay(cursor)

  let streak = 0
  while (trainingDays.has(localDayKey(cursor))) {
    streak += 1
    cursor = previousLocalDay(cursor)
  }

  return { todayMinutes, totalTrainingDays: trainingDays.size, streak }
}

function formatSessionDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

function sessionAccuracy(session: RecentSession) {
  return session.attempts > 0
    ? Math.round((session.correct / session.attempts) * 100)
    : 0
}

function averageAccuracy(sessions: RecentSession[]) {
  const totals = sessions.reduce(
    (acc, session) => ({
      correct: acc.correct + Number(session.correct || 0),
      attempts: acc.attempts + Number(session.attempts || 0),
    }),
    { correct: 0, attempts: 0 }
  )

  if (totals.attempts === 0) return 0
  return Math.round((totals.correct / totals.attempts) * 100)
}

function skillName(skill: SkillState | undefined) {
  return skill?.skills?.name ?? skill?.skill_id ?? 'Sin datos suficientes'
}

export default function Parent() {
  const router = useRouter()
  const [player, setPlayer] = useState<Player | null>(null)
  const [skills, setSkills] = useState<SkillState[]>([])
  const [skillEvidence, setSkillEvidence] = useState({
    attempts: {} as Record<string, number>,
    correct: {} as Record<string, number>,
  })
  const [activeSkillCount, setActiveSkillCount] = useState(0)
  const [curriculumSkills, setCurriculumSkills] = useState<CurriculumSkill[]>([])
  const [unitNames, setUnitNames] = useState<Record<string, string>>({})
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [trainingDays, setTrainingDays] = useState(0)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [dataWarnings, setDataWarnings] = useState<string[]>([])
  const [curriculumPlan, setCurriculumPlan] = useState<CurriculumPlan | null>(null)
  const [planMode, setPlanMode] = useState<CurriculumPacingMode>('automatic')
  const [planTerm, setPlanTerm] = useState<CurriculumTerm>(1)
  const [planFocusUnits, setPlanFocusUnits] = useState<string[]>([])
  const [savingPlan, setSavingPlan] = useState(false)
  const [planMessage, setPlanMessage] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createSupabaseBrowserClient()
      if (!supabase) {
        setMessage('Supabase no configurado.')
        setLoading(false)
        return
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (!user && (!userError || isAuthenticationExpired(userError))) {
        localStorage.removeItem('levelup_player_id')
        router.replace('/login')
        return
      }
      if (userError || !user) {
        setMessage(userFacingError(userError, 'No se pudo comprobar tu sesión.'))
        setLoading(false)
        return
      }

      let selectedPlayer: Player | null = null
      const savedPlayerId = localStorage.getItem('levelup_player_id')

      if (savedPlayerId) {
        const { data: savedPlayer, error } = await supabase
          .from('players')
          .select('id,alias,xp,daily_target_minutes')
          .eq('id', savedPlayerId)
          .maybeSingle()

        if (error) {
          setMessage(userFacingError(error, 'No se pudo cargar el jugador seleccionado.'))
          setLoading(false)
          return
        }
        if (savedPlayer) selectedPlayer = savedPlayer as Player
        else localStorage.removeItem('levelup_player_id')
      }

      if (!selectedPlayer) {
        const { data, error } = await supabase
          .from('players')
          .select('id,alias,xp,daily_target_minutes')
          .order('alias', { ascending: true })

        if (error) {
          setMessage(userFacingError(error, 'No se pudieron cargar los jugadores.'))
          setLoading(false)
          return
        }

        const players = (data ?? []) as Player[]
        if (players.length === 0) {
          setMessage('Todavía no hay ningún jugador creado.')
          setLoading(false)
          return
        }
        if (players.length > 1) {
          router.replace('/parent/setup')
          return
        }
        selectedPlayer = players[0]
        localStorage.setItem('levelup_player_id', selectedPlayer.id)
      }

      const playerId = selectedPlayer.id
      const warnings: string[] = []
      setPlayer(selectedPlayer)
      setMessage('')
      setDataWarnings([])

      const [
        { data: activityData, error: activityError },
        { data: sessionRows, error: sessionsError },
        { data: skillData, error: skillError },
        { data: evidenceData, error: evidenceError },
        { data: curriculumSkillData, error: curriculumSkillError },
        { data: unitData, error: unitError },
        { data: planData, error: planError },
      ] = await Promise.all([
        fetchCompletedActivity(supabase, playerId),
        supabase
          .from('study_sessions')
          .select('id,started_at,ended_at,actual_minutes,xp_earned')
          .eq('player_id', playerId)
          .eq('completed', true)
          .eq('phase', 'done')
          .not('ended_at', 'is', null)
          .order('started_at', { ascending: false })
          .limit(7),
        supabase
          .from('player_skill_state')
          .select(`
            skill_id,
            mastery,
            confidence,
            difficulty,
            priority,
            skills!inner (
              name,
              unit_id
            )
          `)
          .eq('player_id', playerId)
          .eq('skills.active', true)
          .in('skills.unit_id', ACTIVE_CURRICULUM_UNITS),
        fetchCompletedSkillEvidence(supabase, playerId),
        supabase
          .from('skills')
          .select('id,name,unit_id')
          .eq('active', true)
          .in('unit_id', ACTIVE_CURRICULUM_UNITS),
        supabase
          .from('curriculum_units')
          .select('id,name')
          .in('id', ACTIVE_CURRICULUM_UNITS)
          .order('sort_order', { ascending: true }),
        supabase
          .from('player_curriculum_plans')
          .select('player_id,subject_id,academic_year_start,pacing_mode,current_term,focus_unit_ids,updated_at')
          .eq('player_id', playerId)
          .eq('subject_id', 'math')
          .maybeSingle(),
      ])

      if (activityError) {
        warnings.push('No se pudieron cargar el tiempo, los días de entrenamiento y la racha.')
      } else {
        const summary = activitySummary((activityData ?? []) as ActivitySession[])
        setTodayMinutes(summary.todayMinutes)
        setTrainingDays(summary.totalTrainingDays)
        setStreak(summary.streak)
      }

      if (sessionsError) {
        warnings.push('No se pudieron cargar las sesiones recientes.')
      } else if (sessionRows && sessionRows.length > 0) {
        const sessionIds = sessionRows.map((session: any) => session.id)
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('attempts')
          .select('session_id,correct')
          .in('session_id', sessionIds)

        if (attemptsError) {
          warnings.push('No se pudieron cargar los aciertos de las sesiones recientes.')
        } else {
          const counters = new Map<string, { attempts: number; correct: number }>()
          ;(attemptsData ?? []).forEach((attempt: any) => {
            const current = counters.get(attempt.session_id) ?? { attempts: 0, correct: 0 }
            current.attempts += 1
            if (attempt.correct === true) current.correct += 1
            counters.set(attempt.session_id, current)
          })

          setRecentSessions(
            sessionRows.map((session: any) => {
              const counter = counters.get(session.id) ?? { attempts: 0, correct: 0 }
              return {
                ...session,
                xp_earned: Number(session.xp_earned ?? 0),
                attempts: counter.attempts,
                correct: counter.correct,
              }
            }) as RecentSession[]
          )
        }
      }

      if (skillError) {
        warnings.push('No se pudieron cargar las habilidades adaptativas.')
      } else {
        setSkills((skillData ?? []) as unknown as SkillState[])
      }

      if (evidenceError) {
        warnings.push('No se pudo cargar la evidencia necesaria para ponderar el dominio.')
      } else {
        setSkillEvidence(evidenceData ?? { attempts: {}, correct: {} })
      }

      if (curriculumSkillError) {
        warnings.push('No se pudo cargar el tamaño total del currículo activo.')
      } else {
        const rows = (curriculumSkillData ?? []) as CurriculumSkill[]
        setCurriculumSkills(rows)
        setActiveSkillCount(rows.length)
      }

      if (unitError) {
        warnings.push('No se pudieron cargar los nombres de las unidades curriculares.')
      } else {
        setUnitNames(
          Object.fromEntries((unitData ?? []).map((unit: any) => [unit.id, unit.name]))
        )
      }

      if (planError) {
        warnings.push('No se pudo cargar la programación por trimestre.')
      } else {
        const storedPlan = planData as CurriculumPlan | null
        const effective = effectiveCurriculumPlan(playerId, storedPlan)
        setCurriculumPlan(storedPlan)
        setPlanMode(storedPlan?.pacing_mode ?? 'automatic')
        setPlanTerm(effective.currentTerm)
        setPlanFocusUnits(effective.focusUnitIds)
      }

      setDataWarnings(warnings)
      setLoading(false)
    }

    load()
  }, [router])

  async function saveCurriculumPlan() {
    if (!player || savingPlan) return
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return
    if (planMode === 'manual' && planFocusUnits.length === 0) {
      setPlanMessage('Selecciona al menos una unidad que Mati esté trabajando ahora.')
      return
    }

    setSavingPlan(true)
    setPlanMessage('')
    const yearStart = curriculumPlan?.academic_year_start ?? schoolYearStart()
    const focus = planMode === 'manual' ? planFocusUnits : []
    const { data, error } = await supabase.rpc('set_player_curriculum_plan', {
      p_player_id: player.id,
      p_subject_id: 'math',
      p_academic_year_start: yearStart,
      p_pacing_mode: planMode,
      p_current_term: planTerm,
      p_focus_unit_ids: focus,
    })
    setSavingPlan(false)

    if (error) {
      setPlanMessage(userFacingError(error, 'No se pudo guardar el ritmo del curso.'))
      return
    }
    const saved = data as unknown as CurriculumPlan
    setCurriculumPlan(saved)
    const effective = effectiveCurriculumPlan(player.id, saved)
    setPlanTerm(effective.currentTerm)
    setPlanFocusUnits(effective.focusUnitIds)
    setPlanMessage('Plan guardado. Las próximas preguntas respetarán este ritmo.')
  }

  function changePlanTerm(term: CurriculumTerm) {
    setPlanTerm(term)
    setPlanFocusUnits(unitsForTerm(term))
    setPlanMessage('')
  }

  function toggleFocusUnit(unitId: string) {
    setPlanFocusUnits((current) => current.includes(unitId)
      ? current.filter((id) => id !== unitId)
      : [...current, unitId].sort())
    setPlanMessage('')
  }

  if (loading) {
    return <main className="shell"><section className="card loading-card" role="status" aria-live="polite"><div><div className="loading-dot" aria-hidden="true" /><p className="muted">Cargando progreso real…</p></div></section></main>
  }

  if (!player) {
    return (
      <main className="shell">
        <section className="card">
          <h1>Panel padre</h1>
          <p className="muted">{message}</p>
          <div className="action-row">
            <button className="btn primary" type="button" onClick={() => window.location.reload()}>REINTENTAR</button>
            <Link href="/parent/setup" className="btn dark">IR A JUGADORES</Link>
          </div>
        </section>
      </main>
    )
  }

  const strongest = strongestSkills(skills, skillEvidence)
  const reinforcement = reinforcementSkills(skills, skillEvidence)
  const emerging = emergingSkills(skills, skillEvidence)
  const masterySummary = weightedMastery(skills, skillEvidence)
  const totalEvidence = masterySummary.evidence
  const averageMastery = masterySummary.value

  const target = Math.max(1, Number(player.daily_target_minutes) || 35)
  const dailyProgress = Math.min(100, Math.round((todayMinutes / target) * 100))
  const recentBlock = recentSessions.slice(0, 3)
  const previousBlock = recentSessions.slice(3, 6)
  const recentAccuracy = averageAccuracy(recentBlock)
  const previousAccuracy = averageAccuracy(previousBlock)
  const accuracyDelta = recentBlock.length > 0 && previousBlock.length > 0
    ? recentAccuracy - previousAccuracy
    : null
  const recentMinutes = recentBlock.reduce((sum, session) => sum + sessionMinutes(session), 0)
  const recentXp = recentBlock.reduce((sum, session) => sum + Number(session.xp_earned ?? 0), 0)

  const evaluatedSkills = skills.filter(
    (skill) => evidenceCount(skill, skillEvidence) > 0
  ).length
  const attention = reinforcement[0]
  const consolidating = [...skills]
    .filter(
      (skill) =>
        evidenceCount(skill, skillEvidence) >= 2 &&
        skill.mastery >= 55 &&
        skill.mastery < 80
    )
    .sort((a, b) => b.mastery - a.mastery)[0]
  const secure = strongest[0]
  const recommendation = weeklyRecommendation({
    completedSessions: recentSessions.length,
    evaluatedSkills,
    totalSkills: activeSkillCount || ACTIVE_CURRICULUM_UNITS.length,
    recentAccuracy,
    accuracyDelta,
    focusName: attention ? skillName(attention) : undefined,
  })
  const unitInsights = buildUnitInsights({
    curriculumSkills,
    states: skills,
    evidence: skillEvidence,
    unitNames,
    unitOrder: ACTIVE_CURRICULUM_UNITS,
  })

  return (
    <main className="shell">
      <section className="card">
        <span className="tag">👨‍👦 PANEL PADRE · DATOS REALES</span>
        <h1>{player.alias}</h1>
        <p className="muted">Resumen actualizado directamente desde Supabase.</p>
        <div className="grid two">
          <div className="metric"><b>{player.xp} XP</b><p className="muted">progreso acumulado</p></div>
          <div className="metric"><b>🔥 {streak}</b><p className="muted">días de racha actual</p></div>
          <div className="metric"><b>{trainingDays}</b><p className="muted">días con entrenamiento completado</p></div>
          <div className="metric"><b>{averageMastery}%</b><p className="muted">{totalEvidence > 0 ? 'dominio medio ponderado por práctica' : 'dominio medio · sin práctica registrada'}</p></div>
          <div className="metric"><b>{evaluatedSkills}/{activeSkillCount || '—'}</b><p className="muted">habilidades con práctica válida del currículo activo</p></div>
          <div className="metric">
            <b>{todayMinutes}/{target} min</b><p className="muted">entrenados hoy · objetivo diario</p>
            <div className="bar" role="progressbar" aria-label="Progreso del objetivo diario" aria-valuemin={0} aria-valuemax={100} aria-valuenow={dailyProgress}><i style={{ width: `${dailyProgress}%` }} /></div>
          </div>
        </div>
      </section>

      {dataWarnings.length > 0 && (
        <section className="card">
          <span className="tag">⚠️ DATOS PARCIALES</span>
          <h2>No se ha podido actualizar todo el panel</h2>
          <p className="muted">Los datos visibles pueden estar incompletos. No interpretes un cero o un bloque vacío como falta de progreso.</p>
          <ul className="muted">
            {dataWarnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
          <button className="btn dark" type="button" onClick={() => window.location.reload()}>
            ACTUALIZAR DATOS
          </button>
        </section>
      )}

      <section className="card">
        <span className="tag">📚 RITMO DEL CURSO</span>
        <h2>Qué contenidos puede practicar ahora</h2>
        <p className="muted">El dominio decide la dificultad; este plan decide qué parte del currículo corresponde al momento escolar.</p>

        <fieldset className="curriculum-plan-options">
          <legend>Cómo avanza el temario</legend>
          <label className={planMode === 'automatic' ? 'selected' : ''}>
            <input
              type="radio"
              name="pacing-mode"
              checked={planMode === 'automatic'}
              onChange={() => { setPlanMode('automatic'); setPlanMessage('') }}
            />
            <span><b>Automático</b><small>LEVEL UP sigue el trimestre estimado según la fecha.</small></span>
          </label>
          <label className={planMode === 'manual' ? 'selected' : ''}>
            <input
              type="radio"
              name="pacing-mode"
              checked={planMode === 'manual'}
              onChange={() => { setPlanMode('manual'); setPlanFocusUnits(unitsForTerm(planTerm)); setPlanMessage('') }}
            />
            <span><b>Ritmo real del colegio</b><small>Tú eliges trimestre y unidades actuales.</small></span>
          </label>
        </fieldset>

        {planMode === 'automatic' ? (
          <div className="metric curriculum-plan-summary">
            <b>{termLabel(effectiveCurriculumPlan(player.id, curriculumPlan).currentTerm)}</b>
            <p className="muted">Foco automático: {effectiveCurriculumPlan(player.id, curriculumPlan).focusUnitIds.map((id) => unitNames[id] ?? id).join(' · ')}</p>
            <small className="muted">Puedes cambiar a “Ritmo real del colegio” si el centro lleva otro orden.</small>
          </div>
        ) : (
          <>
            <div className="curriculum-term-picker" role="group" aria-label="Trimestre actual">
              {([1, 2, 3] as CurriculumTerm[]).map((term) => (
                <button key={term} type="button" className={planTerm === term ? 'selected' : ''} onClick={() => changePlanTerm(term)}>
                  {termLabel(term)}
                </button>
              ))}
            </div>
            <p className="muted">Marca lo que está viendo ahora. Las unidades de trimestres anteriores quedan disponibles solo para repaso.</p>
            <div className="curriculum-focus-grid">
              {unitsForTerm(planTerm).map((unitId) => (
                <label key={unitId} className={planFocusUnits.includes(unitId) ? 'selected' : ''}>
                  <input type="checkbox" checked={planFocusUnits.includes(unitId)} onChange={() => toggleFocusUnit(unitId)} />
                  <span><b>{unitId}</b><small>{unitNames[unitId] ?? 'Unidad curricular'}</small></span>
                </label>
              ))}
            </div>
          </>
        )}

        <div className="action-row curriculum-plan-actions">
          <button className="btn primary" type="button" disabled={savingPlan} onClick={saveCurriculumPlan}>
            {savingPlan ? 'GUARDANDO…' : 'GUARDAR RITMO DEL CURSO'}
          </button>
        </div>
        {planMessage && <p className="muted" role="status">{planMessage}</p>}
      </section>

      <section className="card">
        <span className="tag">📌 RECOMENDACIÓN PARA ESTA SEMANA</span>
        <h2>{recommendation.title}</h2>
        <p className="muted">{recommendation.detail}</p>
        <p className="muted" style={{ marginBottom: 0 }}>Esta orientación usa únicamente misiones completadas; se actualizará automáticamente al acumular nueva evidencia.</p>
      </section>

      <section className="card">
        <span className="tag">🧭 LECTURA PEDAGÓGICA</span>
        <h2>Qué está ocurriendo con las habilidades</h2>
        {skills.length === 0 ? (
          <p className="muted">Todavía no hay suficiente información para hacer una lectura pedagógica.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {attention ? (
              <div className="metric">
                <b>🎯 Próximo foco de práctica · {skillName(attention)}</b>
                <p className="muted" style={{ marginBottom: 0 }}>
                  Dominio {Math.round(attention.mastery)}% · confianza {Math.round(attention.confidence)}% · {evidenceCount(attention, skillEvidence)} respuestas válidas · precisión {skillAccuracy(attention, skillEvidence)}%. Es una de las señales de mayor necesidad actual y el motor la favorece sin perder variedad.
                </p>
              </div>
            ) : (
              <div className="metric">
                <b>✅ Sin refuerzo prioritario ahora mismo</b>
                <p className="muted" style={{ marginBottom: 0 }}>Las habilidades practicadas cumplen los umbrales actuales de dominio y confianza.</p>
              </div>
            )}

            {consolidating && (
              <div className="metric">
                <b>🔧 En consolidación · {skillName(consolidating)}</b>
                <p className="muted" style={{ marginBottom: 0 }}>
                  Dominio {Math.round(consolidating.mastery)}% · confianza {Math.round(consolidating.confidence)}%. Ya hay base, pero todavía conviene repetirla en contextos variados antes de considerarla asentada.
                </p>
              </div>
            )}

            {secure && (
              <div className="metric">
                <b>✅ Más asentada · {skillName(secure)}</b>
                <p className="muted" style={{ marginBottom: 0 }}>
                  Dominio {Math.round(secure.mastery)}% · confianza {Math.round(secure.confidence)}%. Puede pasar a mantenimiento y aparecer con menor frecuencia que las prioridades de refuerzo.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="card">
        <span className="tag">📈 TENDENCIA RECIENTE</span>
        <h2>Cómo están yendo las últimas sesiones</h2>
        {recentBlock.length === 0 ? (
          <p className="muted">Todavía no hay suficientes sesiones para calcular tendencia.</p>
        ) : (
          <div className="grid two">
            <div className="metric"><b>{recentAccuracy}%</b><p className="muted">precisión media en las últimas {recentBlock.length} sesiones</p></div>
            <div className="metric">
              <b>{accuracyDelta === null ? '—' : `${accuracyDelta > 0 ? '+' : ''}${accuracyDelta} pts`}</b>
              <p className="muted">{accuracyDelta === null ? 'faltan sesiones para comparar' : accuracyDelta > 0 ? 'mejora frente al bloque anterior' : accuracyDelta < 0 ? 'baja frente al bloque anterior' : 'estable frente al bloque anterior'}</p>
            </div>
            <div className="metric"><b>{recentMinutes} min</b><p className="muted">tiempo total de las últimas {recentBlock.length} sesiones</p></div>
            <div className="metric"><b>+{recentXp} XP</b><p className="muted">ganados en las últimas {recentBlock.length} sesiones</p></div>
          </div>
        )}
      </section>

      <section className="card">
        <span className="tag">🗺️ MAPA DEL CURRÍCULO</span>
        <h2>Cobertura por unidades</h2>
        <p className="muted">Cada unidad separa cobertura, precisión y dominio. “Sin práctica” no significa dificultad: solo indica que todavía no existe evidencia completada.</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {unitInsights.map((unit) => (
            <details className="metric curriculum-unit" key={unit.unitId}>
              <summary>
                <b>{unit.unitId} · {unit.unitName}</b>
                <span className={`unit-status ${unit.status}`}>{unitStatusLabel(unit.status)}</span>
              </summary>
              <div className="grid two" style={{ marginTop: 12 }}>
                <div><b>{unit.practicedSkills}/{unit.totalSkills}</b><p className="muted">habilidades practicadas</p></div>
                <div><b>{unit.accuracy === null ? '—' : `${unit.accuracy}%`}</b><p className="muted">precisión en {unit.attempts} respuestas</p></div>
              </div>
              <div className="bar" role="progressbar" aria-label={`Cobertura de ${unit.unitName}`} aria-valuemin={0} aria-valuemax={unit.totalSkills || 1} aria-valuenow={unit.practicedSkills}>
                <i style={{ width: `${unit.totalSkills ? Math.round((unit.practicedSkills / unit.totalSkills) * 100) : 0}%` }} />
              </div>
              <p className="muted">{unit.averageMastery === null ? 'Dominio: todavía sin evidencia suficiente.' : `Dominio medio ponderado: ${unit.averageMastery}%.`}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="card">
        <span className="tag">🗓️ HISTORIAL RECIENTE</span>
        <h2>Últimas misiones</h2>
        {recentSessions.length === 0 ? (
          <p className="muted">Todavía no hay misiones completadas.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {recentSessions.map((session) => (
              <div className="metric" key={session.id}>
                <b>{formatSessionDate(session.started_at)}</b>
                <p className="muted" style={{ marginBottom: 0 }}>{session.correct}/{session.attempts} aciertos · {sessionAccuracy(session)}% · +{session.xp_earned} XP · {sessionMinutes(session)} min</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <span className="tag">🎯 PRÓXIMOS FOCOS</span>
        <h2>Lo que el motor propone practicar</h2>
        {reinforcement.length === 0 ? <p className="muted">No hay todavía evidencia suficiente para señalar una necesidad prioritaria, o las habilidades practicadas ya superan los umbrales actuales.</p> : reinforcement.map((skill) => (
          <div key={skill.skill_id} className="metric" style={{ marginBottom: 10 }}>
            <b>{skill.skills?.name ?? skill.skill_id}</b>
            <p className="muted">Prioridad {Math.round(skill.priority)}/100 · dominio {Math.round(skill.mastery)}% · confianza {Math.round(skill.confidence)}% · precisión {skillAccuracy(skill, skillEvidence)}% en {evidenceCount(skill, skillEvidence)} respuestas válidas · dificultad {skill.difficulty}/5</p>
            <div className="bar" role="progressbar" aria-label={`Dominio de ${skill.skills?.name ?? skill.skill_id}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(skill.mastery)}><i style={{ width: `${Math.round(skill.mastery)}%` }} /></div>
          </div>
        ))}
      </section>

      {emerging.length > 0 && (
        <section className="card">
          <span className="tag">🌱 EVIDENCIA INICIAL</span>
          <h2>Habilidades todavía sin diagnóstico fiable</h2>
          <p className="muted">Estas habilidades solo tienen una respuesta dentro de una misión completada. El panel no las presenta aún como fortaleza ni como dificultad.</p>
          <p className="muted" style={{ marginBottom: 0 }}>{emerging.slice(0, 5).map(skillName).join(' · ')}{emerging.length > 5 ? ` · y ${emerging.length - 5} más` : ''}</p>
        </section>
      )}

      <section className="card">
        <span className="tag">🏆 PUNTOS FUERTES</span>
        <h2>Habilidades con dominio y confianza suficientes</h2>
        {strongest.length === 0 ? <p className="muted">Todavía no hay suficiente confianza acumulada para señalar puntos fuertes.</p> : strongest.map((skill) => (
          <div key={skill.skill_id} className="metric" style={{ marginBottom: 10 }}>
            <b>{skill.skills?.name ?? skill.skill_id}</b>
            <p className="muted">Dominio {Math.round(skill.mastery)}% · confianza {Math.round(skill.confidence)}% · precisión {skillAccuracy(skill, skillEvidence)}% en {evidenceCount(skill, skillEvidence)} respuestas válidas</p>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Objetivo diario</h2>
        <p className="muted">Hoy lleva {todayMinutes} de {target} minutos de entrenamiento.</p>
        <div className="bar" role="progressbar" aria-label="Progreso del objetivo diario" aria-valuemin={0} aria-valuemax={100} aria-valuenow={dailyProgress} style={{ marginBottom: 16 }}><i style={{ width: `${dailyProgress}%` }} /></div>
        <div className="action-row">
          <Link href="/player" className="btn primary">🎮 VOLVER A JUGAR</Link>
          <Link href="/parent/setup" className="btn dark">👥 CAMBIAR JUGADOR</Link>
        </div>
      </section>
    </main>
  )
}
