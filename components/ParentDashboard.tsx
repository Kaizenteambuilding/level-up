'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { isAuthenticationExpired, userFacingError } from '@/lib/userFacingError'
import { fetchCompletedActivity, fetchCompletedSkillEvidence } from '@/lib/progressQueries'
import {
  emergingSkills,
  evidenceCount,
  reinforcementSkills,
  skillAccuracy,
  strongestSkills,
  weeklyRecommendation,
  weightedMastery,
} from '@/lib/parentInsights'
import { buildUnitInsights, CurriculumSkill, unitStatusLabel } from '@/lib/curriculumInsights'
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
import { ACTIVE_SUBJECT_IDS, subjectDefinition, type SubjectId } from '@/lib/subjects'

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
    subject_id: string
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

type CurriculumSkillRow = CurriculumSkill & { subject_id: string }
type CurriculumUnitRow = { id: string; name: string; subject_id: string; sort_order: number }

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
  if (Number.isFinite(stored) && stored > 0) return Math.min(180, Math.max(1, Math.round(stored)))
  if (!session.ended_at) return 0
  const elapsed = new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()
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

function averageAccuracy(sessions: RecentSession[]) {
  const totals = sessions.reduce(
    (acc, session) => ({ correct: acc.correct + session.correct, attempts: acc.attempts + session.attempts }),
    { correct: 0, attempts: 0 }
  )
  return totals.attempts ? Math.round((totals.correct / totals.attempts) * 100) : 0
}

function skillName(skill: SkillState | undefined) {
  return skill?.skills?.name ?? skill?.skill_id ?? 'Sin datos suficientes'
}

function subjectName(subjectId: string) {
  return subjectDefinition(subjectId)?.name ?? subjectId
}

export default function ParentDashboard() {
  const router = useRouter()
  const [player, setPlayer] = useState<Player | null>(null)
  const [skills, setSkills] = useState<SkillState[]>([])
  const [skillEvidence, setSkillEvidence] = useState({ attempts: {} as Record<string, number>, correct: {} as Record<string, number> })
  const [curriculumSkills, setCurriculumSkills] = useState<CurriculumSkillRow[]>([])
  const [curriculumUnits, setCurriculumUnits] = useState<CurriculumUnitRow[]>([])
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
        const { data, error } = await supabase.from('players').select('id,alias,xp,daily_target_minutes').eq('id', savedPlayerId).maybeSingle()
        if (error) {
          setMessage(userFacingError(error, 'No se pudo cargar el jugador seleccionado.'))
          setLoading(false)
          return
        }
        selectedPlayer = data as Player | null
        if (!selectedPlayer) localStorage.removeItem('levelup_player_id')
      }

      if (!selectedPlayer) {
        const { data, error } = await supabase.from('players').select('id,alias,xp,daily_target_minutes').order('alias', { ascending: true })
        if (error) {
          setMessage(userFacingError(error, 'No se pudieron cargar los jugadores.'))
          setLoading(false)
          return
        }
        const players = (data ?? []) as Player[]
        if (!players.length) {
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

      const [activityResult, sessionResult, skillResult, evidenceResult, curriculumSkillResult, unitResult, planResult] = await Promise.all([
        fetchCompletedActivity(supabase, playerId),
        supabase.from('study_sessions').select('id,started_at,ended_at,actual_minutes,xp_earned').eq('player_id', playerId).eq('completed', true).eq('phase', 'done').not('ended_at', 'is', null).order('started_at', { ascending: false }).limit(7),
        supabase.from('player_skill_state').select('skill_id,mastery,confidence,difficulty,priority,skills!inner(name,unit_id,subject_id)').eq('player_id', playerId).eq('skills.active', true),
        fetchCompletedSkillEvidence(supabase, playerId),
        supabase.from('skills').select('id,name,unit_id,subject_id').eq('active', true).order('subject_id', { ascending: true }).order('sort_order', { ascending: true }),
        supabase.from('curriculum_units').select('id,name,subject_id,sort_order').eq('active', true).order('subject_id', { ascending: true }).order('sort_order', { ascending: true }),
        supabase.from('player_curriculum_plans').select('player_id,subject_id,academic_year_start,pacing_mode,current_term,focus_unit_ids,updated_at').eq('player_id', playerId).eq('subject_id', 'math').maybeSingle(),
      ])

      if (activityResult.error) warnings.push('No se pudieron cargar el tiempo, los días de entrenamiento y la racha.')
      else {
        const summary = activitySummary((activityResult.data ?? []) as ActivitySession[])
        setTodayMinutes(summary.todayMinutes)
        setTrainingDays(summary.totalTrainingDays)
        setStreak(summary.streak)
      }

      if (sessionResult.error) warnings.push('No se pudieron cargar las sesiones recientes.')
      else if (sessionResult.data?.length) {
        const sessionIds = sessionResult.data.map((session) => session.id)
        const { data: attemptsData, error: attemptsError } = await supabase.from('attempts').select('session_id,correct').in('session_id', sessionIds)
        if (attemptsError) warnings.push('No se pudieron cargar los aciertos de las sesiones recientes.')
        else {
          const counters = new Map<string, { attempts: number; correct: number }>()
          ;(attemptsData ?? []).forEach((attempt) => {
            const current = counters.get(attempt.session_id) ?? { attempts: 0, correct: 0 }
            current.attempts += 1
            if (attempt.correct === true) current.correct += 1
            counters.set(attempt.session_id, current)
          })
          setRecentSessions(sessionResult.data.map((session) => ({
            ...session,
            xp_earned: Number(session.xp_earned ?? 0),
            attempts: counters.get(session.id)?.attempts ?? 0,
            correct: counters.get(session.id)?.correct ?? 0,
          })) as RecentSession[])
        }
      }

      if (skillResult.error) warnings.push('No se pudieron cargar las habilidades adaptativas.')
      else setSkills((skillResult.data ?? []) as unknown as SkillState[])

      if (evidenceResult.error) warnings.push('No se pudo cargar la evidencia necesaria para ponderar el dominio.')
      else setSkillEvidence(evidenceResult.data ?? { attempts: {}, correct: {} })

      if (curriculumSkillResult.error) warnings.push('No se pudo cargar el currículo activo de todas las asignaturas.')
      else setCurriculumSkills((curriculumSkillResult.data ?? []) as CurriculumSkillRow[])

      if (unitResult.error) warnings.push('No se pudieron cargar las unidades curriculares activas.')
      else setCurriculumUnits((unitResult.data ?? []) as CurriculumUnitRow[])

      if (planResult.error) warnings.push('No se pudo cargar la programación de Matemáticas por trimestre.')
      else {
        const storedPlan = planResult.data as CurriculumPlan | null
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
      setPlanMessage('Selecciona al menos una unidad de Matemáticas que esté trabajando ahora.')
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
      setPlanMessage(userFacingError(error, 'No se pudo guardar el ritmo de Matemáticas.'))
      return
    }
    const saved = data as unknown as CurriculumPlan
    setCurriculumPlan(saved)
    const effective = effectiveCurriculumPlan(player.id, saved)
    setPlanTerm(effective.currentTerm)
    setPlanFocusUnits(effective.focusUnitIds)
    setPlanMessage('Plan guardado. Las próximas preguntas de Matemáticas respetarán este ritmo.')
  }

  const unitNames = useMemo(() => Object.fromEntries(curriculumUnits.map((unit) => [unit.id, unit.name])), [curriculumUnits])
  const unitOrder = useMemo(() => curriculumUnits.map((unit) => unit.id), [curriculumUnits])
  const unitSubjects = useMemo(() => Object.fromEntries(curriculumUnits.map((unit) => [unit.id, unit.subject_id])), [curriculumUnits])
  const unitInsights = useMemo(() => buildUnitInsights({ curriculumSkills, states: skills, evidence: skillEvidence, unitNames, unitOrder }), [curriculumSkills, skills, skillEvidence, unitNames, unitOrder])

  if (loading) return <main className="shell"><section className="card loading-card" role="status" aria-live="polite"><div><div className="loading-dot" aria-hidden="true" /><p className="muted">Cargando progreso real…</p></div></section></main>

  if (!player) {
    return <main className="shell"><section className="card"><h1>Panel padre</h1><p className="muted">{message}</p><div className="action-row"><button className="btn primary" type="button" onClick={() => window.location.reload()}>REINTENTAR</button><Link href="/parent/setup" className="btn dark">IR A JUGADORES</Link></div></section></main>
  }

  const strongest = strongestSkills(skills, skillEvidence)
  const reinforcement = reinforcementSkills(skills, skillEvidence)
  const emerging = emergingSkills(skills, skillEvidence)
  const masterySummary = weightedMastery(skills, skillEvidence)
  const evaluatedSkills = skills.filter((skill) => evidenceCount(skill, skillEvidence) > 0).length
  const recentBlock = recentSessions.slice(0, 3)
  const previousBlock = recentSessions.slice(3, 6)
  const recentAccuracy = averageAccuracy(recentBlock)
  const previousAccuracy = averageAccuracy(previousBlock)
  const accuracyDelta = recentBlock.length && previousBlock.length ? recentAccuracy - previousAccuracy : null
  const target = Math.max(1, Number(player.daily_target_minutes) || 35)
  const dailyProgress = Math.min(100, Math.round((todayMinutes / target) * 100))
  const recommendation = weeklyRecommendation({
    completedSessions: recentSessions.length,
    evaluatedSkills,
    totalSkills: curriculumSkills.length,
    recentAccuracy,
    accuracyDelta,
    focusName: reinforcement[0] ? skillName(reinforcement[0]) : undefined,
  })

  const subjectSummaries = ACTIVE_SUBJECT_IDS.map((subjectId) => {
    const subjectSkillIds = curriculumSkills.filter((skill) => skill.subject_id === subjectId).map((skill) => skill.id)
    const subjectStates = skills.filter((skill) => skill.skills?.subject_id === subjectId)
    const attempts = subjectSkillIds.reduce((sum, id) => sum + Number(skillEvidence.attempts[id] ?? 0), 0)
    const correct = subjectSkillIds.reduce((sum, id) => sum + Number(skillEvidence.correct[id] ?? 0), 0)
    const practiced = subjectSkillIds.filter((id) => Number(skillEvidence.attempts[id] ?? 0) > 0).length
    const mastery = weightedMastery(subjectStates, skillEvidence)
    return { subjectId, total: subjectSkillIds.length, practiced, attempts, accuracy: attempts ? Math.round((correct / attempts) * 100) : null, mastery: mastery.evidence ? mastery.value : null }
  })

  const effectivePlan = effectiveCurriculumPlan(player.id, curriculumPlan)
  const visibleFocusUnits = planMode === 'manual' ? planFocusUnits : effectivePlan.focusUnitIds
  const calibratedFocusUnits = visibleFocusUnits.filter((unitId) => {
    const skillIds = curriculumSkills.filter((skill) => skill.unit_id === unitId).map((skill) => skill.id)
    return skillIds.reduce((sum, skillId) => sum + Number(skillEvidence.attempts[skillId] ?? 0), 0) >= 2
  }).length
  const calibrationProgress = visibleFocusUnits.length ? Math.round((calibratedFocusUnits / visibleFocusUnits.length) * 100) : 0

  return (
    <main className="shell">
      <section className="card">
        <span className="tag">👨‍👦 PANEL PADRE · 5 ASIGNATURAS</span>
        <h1>{player.alias}</h1>
        <p className="muted">Resumen basado únicamente en misiones completadas y en el currículo activo.</p>
        <div className="grid two">
          <div className="metric"><b>{player.xp} XP</b><p className="muted">progreso acumulado</p></div>
          <div className="metric"><b>🔥 {streak}</b><p className="muted">días de racha actual</p></div>
          <div className="metric"><b>{trainingDays}</b><p className="muted">días con entrenamiento completado</p></div>
          <div className="metric"><b>{masterySummary.value}%</b><p className="muted">{masterySummary.evidence ? 'dominio medio ponderado por práctica' : 'sin práctica registrada'}</p></div>
          <div className="metric"><b>{evaluatedSkills}/{curriculumSkills.length || '—'}</b><p className="muted">habilidades con evidencia / currículo activo</p></div>
          <div className="metric"><b>{todayMinutes}/{target} min</b><p className="muted">entrenados hoy · objetivo diario</p><div className="bar" role="progressbar" aria-label="Progreso del objetivo diario" aria-valuemin={0} aria-valuemax={100} aria-valuenow={dailyProgress}><i style={{ width: `${dailyProgress}%` }} /></div></div>
        </div>
      </section>

      {dataWarnings.length > 0 && <section className="card"><span className="tag">⚠️ DATOS PARCIALES</span><h2>No se ha podido actualizar todo el panel</h2><ul className="muted">{dataWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul><button className="btn dark" type="button" onClick={() => window.location.reload()}>ACTUALIZAR DATOS</button></section>}

      <section className="card">
        <span className="tag">🧭 VISIÓN POR ASIGNATURA</span>
        <h2>Qué evidencia existe en cada materia</h2>
        <div className="grid two">
          {subjectSummaries.map((summary) => {
            const definition = subjectDefinition(summary.subjectId)
            return <div className="metric" key={summary.subjectId}><b>{definition?.icon ?? '📘'} {definition?.name ?? summary.subjectId}</b><p className="muted">{summary.practiced}/{summary.total || '—'} habilidades practicadas · {summary.attempts} respuestas</p><p className="muted" style={{ marginBottom: 0 }}>Precisión {summary.accuracy === null ? '—' : `${summary.accuracy}%`} · dominio {summary.mastery === null ? '—' : `${summary.mastery}%`}</p></div>
          })}
        </div>
      </section>

      <section className="card">
        <span className="tag">📚 RITMO DE MATEMÁTICAS</span>
        <h2>Qué contenidos de Matemáticas puede practicar ahora</h2>
        <p className="muted">El resto de asignaturas ya entra en los insights globales. El control manual por trimestre sigue limitado a Matemáticas hasta que exista una planificación equivalente para cada materia.</p>
        <fieldset className="curriculum-plan-options">
          <legend>Cómo avanza Matemáticas</legend>
          <label className={planMode === 'automatic' ? 'selected' : ''}><input type="radio" name="pacing-mode" checked={planMode === 'automatic'} onChange={() => { setPlanMode('automatic'); setPlanMessage('') }} /><span><b>Automático</b><small>LEVEL UP sigue el trimestre estimado según la fecha.</small></span></label>
          <label className={planMode === 'manual' ? 'selected' : ''}><input type="radio" name="pacing-mode" checked={planMode === 'manual'} onChange={() => { setPlanMode('manual'); setPlanFocusUnits(unitsForTerm(planTerm)); setPlanMessage('') }} /><span><b>Ritmo real del colegio</b><small>Tú eliges trimestre y unidades actuales de Matemáticas.</small></span></label>
        </fieldset>
        {planMode === 'automatic' ? <div className="metric curriculum-plan-summary"><b>{termLabel(effectivePlan.currentTerm)}</b><p className="muted">Foco automático: {effectivePlan.focusUnitIds.map((id) => unitNames[id] ?? id).join(' · ')}</p></div> : <><div className="curriculum-term-picker" role="group" aria-label="Trimestre actual">{([1, 2, 3] as CurriculumTerm[]).map((term) => <button key={term} type="button" className={planTerm === term ? 'selected' : ''} onClick={() => { setPlanTerm(term); setPlanFocusUnits(unitsForTerm(term)); setPlanMessage('') }}>{termLabel(term)}</button>)}</div><div className="curriculum-focus-grid">{unitsForTerm(planTerm).map((unitId) => <label key={unitId} className={planFocusUnits.includes(unitId) ? 'selected' : ''}><input type="checkbox" checked={planFocusUnits.includes(unitId)} onChange={() => { setPlanFocusUnits((current) => current.includes(unitId) ? current.filter((id) => id !== unitId) : [...current, unitId]); setPlanMessage('') }} /><span><b>{unitId}</b><small>{unitNames[unitId] ?? 'Unidad curricular'}</small></span></label>)}</div></>}
        <div className="metric curriculum-plan-summary"><b>🧭 Punto de partida · {calibratedFocusUnits}/{visibleFocusUnits.length || '—'} unidades calibradas</b><p className="muted">Se considera calibrada una unidad cuando ya hay al menos dos respuestas válidas.</p><div className="bar" role="progressbar" aria-label="Calibración del contenido actual" aria-valuemin={0} aria-valuemax={100} aria-valuenow={calibrationProgress}><i style={{ width: `${calibrationProgress}%` }} /></div></div>
        <div className="action-row curriculum-plan-actions"><button className="btn primary" type="button" disabled={savingPlan} onClick={saveCurriculumPlan}>{savingPlan ? 'GUARDANDO…' : 'GUARDAR RITMO DE MATEMÁTICAS'}</button></div>
        {planMessage && <p className="muted" role="status">{planMessage}</p>}
      </section>

      <section className="card"><span className="tag">📌 RECOMENDACIÓN PARA ESTA SEMANA</span><h2>{recommendation.title}</h2><p className="muted">{recommendation.detail}</p><p className="muted" style={{ marginBottom: 0 }}>La recomendación combina evidencia válida de las cinco asignaturas; una materia sin práctica no se interpreta como dificultad.</p></section>

      <section className="card">
        <span className="tag">🗺️ MAPA DEL CURRÍCULO</span><h2>Cobertura por unidades y asignaturas</h2>
        <p className="muted">“Sin práctica” significa únicamente que todavía no existe evidencia completada.</p>
        <div style={{ display: 'grid', gap: 10 }}>{unitInsights.map((unit) => <details className="metric curriculum-unit" key={unit.unitId}><summary><b>{subjectDefinition(unitSubjects[unit.unitId] as SubjectId)?.icon ?? '📘'} {subjectName(unitSubjects[unit.unitId])} · {unit.unitId} · {unit.unitName}</b><span className={`unit-status ${unit.status}`}>{unitStatusLabel(unit.status)}</span></summary><div className="grid two" style={{ marginTop: 12 }}><div><b>{unit.practicedSkills}/{unit.totalSkills}</b><p className="muted">habilidades practicadas</p></div><div><b>{unit.accuracy === null ? '—' : `${unit.accuracy}%`}</b><p className="muted">precisión en {unit.attempts} respuestas</p></div></div><div className="bar" role="progressbar" aria-label={`Cobertura de ${unit.unitName}`} aria-valuemin={0} aria-valuemax={unit.totalSkills || 1} aria-valuenow={unit.practicedSkills}><i style={{ width: `${unit.totalSkills ? Math.round((unit.practicedSkills / unit.totalSkills) * 100) : 0}%` }} /></div><p className="muted">{unit.averageMastery === null ? 'Dominio: todavía sin evidencia suficiente.' : `Dominio medio ponderado: ${unit.averageMastery}%.`}</p></details>)}</div>
      </section>

      <section className="card"><span className="tag">🎯 PRÓXIMOS FOCOS</span><h2>Lo que el motor propone practicar</h2>{reinforcement.length === 0 ? <p className="muted">No hay todavía evidencia suficiente para señalar una necesidad prioritaria.</p> : reinforcement.map((skill) => <div key={skill.skill_id} className="metric" style={{ marginBottom: 10 }}><b>{subjectDefinition(skill.skills?.subject_id as SubjectId)?.icon ?? '📘'} {skillName(skill)}</b><p className="muted">{subjectName(skill.skills?.subject_id ?? '')} · prioridad {Math.round(skill.priority)}/100 · dominio {Math.round(skill.mastery)}% · confianza {Math.round(skill.confidence)}% · precisión {skillAccuracy(skill, skillEvidence)}% en {evidenceCount(skill, skillEvidence)} respuestas válidas</p></div>)}</section>

      {emerging.length > 0 && <section className="card"><span className="tag">🌱 EVIDENCIA INICIAL</span><h2>Habilidades todavía sin diagnóstico fiable</h2><p className="muted">Una sola respuesta no se interpreta todavía como fortaleza ni dificultad.</p><p className="muted">{emerging.slice(0, 6).map((skill) => `${subjectDefinition(skill.skills?.subject_id as SubjectId)?.icon ?? '📘'} ${skillName(skill)}`).join(' · ')}{emerging.length > 6 ? ` · y ${emerging.length - 6} más` : ''}</p></section>}

      <section className="card"><span className="tag">🏆 PUNTOS FUERTES</span><h2>Habilidades con dominio y confianza suficientes</h2>{strongest.length === 0 ? <p className="muted">Todavía no hay suficiente confianza acumulada para señalar puntos fuertes.</p> : strongest.map((skill) => <div key={skill.skill_id} className="metric" style={{ marginBottom: 10 }}><b>{subjectDefinition(skill.skills?.subject_id as SubjectId)?.icon ?? '📘'} {skillName(skill)}</b><p className="muted">{subjectName(skill.skills?.subject_id ?? '')} · dominio {Math.round(skill.mastery)}% · confianza {Math.round(skill.confidence)}% · precisión {skillAccuracy(skill, skillEvidence)}% en {evidenceCount(skill, skillEvidence)} respuestas válidas</p></div>)}</section>

      <section className="card"><span className="tag">📈 TENDENCIA RECIENTE</span><h2>Cómo están yendo las últimas sesiones</h2>{recentBlock.length === 0 ? <p className="muted">Todavía no hay suficientes sesiones para calcular tendencia.</p> : <div className="grid two"><div className="metric"><b>{recentAccuracy}%</b><p className="muted">precisión media en las últimas {recentBlock.length} sesiones</p></div><div className="metric"><b>{accuracyDelta === null ? '—' : `${accuracyDelta > 0 ? '+' : ''}${accuracyDelta} pts`}</b><p className="muted">{accuracyDelta === null ? 'faltan sesiones para comparar' : 'frente al bloque anterior'}</p></div></div>}</section>

      <section className="card"><span className="tag">🗓️ HISTORIAL RECIENTE</span><h2>Últimas misiones</h2>{recentSessions.length === 0 ? <p className="muted">Todavía no hay misiones completadas.</p> : <div style={{ display: 'grid', gap: 10 }}>{recentSessions.map((session) => <div className="metric" key={session.id}><b>{new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(new Date(session.started_at))}</b><p className="muted" style={{ marginBottom: 0 }}>{session.correct}/{session.attempts} aciertos · {session.attempts ? Math.round((session.correct / session.attempts) * 100) : 0}% · +{session.xp_earned} XP · {sessionMinutes(session)} min</p></div>)}</div>}</section>

      <section className="card"><h2>Objetivo diario</h2><p className="muted">Hoy lleva {todayMinutes} de {target} minutos de entrenamiento.</p><div className="bar" role="progressbar" aria-label="Progreso del objetivo diario" aria-valuemin={0} aria-valuemax={100} aria-valuenow={dailyProgress} style={{ marginBottom: 16 }}><i style={{ width: `${dailyProgress}%` }} /></div><div className="action-row"><Link href="/player" className="btn primary">🎮 VOLVER A JUGAR</Link><Link href="/parent/setup" className="btn dark">👥 CAMBIAR JUGADOR</Link></div></section>
    </main>
  )
}
