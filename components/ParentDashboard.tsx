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
  schoolYearStart,
  termLabel,
  unitsForTerm,
} from '@/lib/curriculumPlan'
import { ACTIVE_SUBJECT_IDS, subjectDefinition } from '@/lib/subjects'

type Player = { id: string; alias: string; xp: number; daily_target_minutes: number }
type SkillState = {
  skill_id: string
  mastery: number
  confidence: number
  difficulty: number
  priority: number
  skills: { name: string; unit_id: string; subject_id: string } | null
}
type ActivitySession = { started_at: string; ended_at: string | null; actual_minutes: number | null }
type RecentSession = ActivitySession & { id: string; xp_earned: number; correct: number; attempts: number }
type CurriculumSkillRow = CurriculumSkill & { subject_id: string }
type CurriculumUnitRow = { id: string; name: string; subject_id: string; sort_order: number }
type NamedSkill = { skill_id: string; skills?: { name: string } | null }

function localDayKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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

function summarizeActivity(sessions: ActivitySession[]) {
  const days = new Set(sessions.map((session) => localDayKey(session.started_at)))
  const today = new Date()
  const todayMinutes = sessions.filter((session) => localDayKey(session.started_at) === localDayKey(today)).reduce((sum, session) => sum + sessionMinutes(session), 0)
  let cursor = new Date(today)
  cursor.setHours(12, 0, 0, 0)
  if (!days.has(localDayKey(cursor))) cursor = previousLocalDay(cursor)
  let streak = 0
  while (days.has(localDayKey(cursor))) {
    streak += 1
    cursor = previousLocalDay(cursor)
  }
  return { todayMinutes, trainingDays: days.size, streak }
}

function averageAccuracy(sessions: RecentSession[]) {
  const totals = sessions.reduce((acc, session) => ({ correct: acc.correct + session.correct, attempts: acc.attempts + session.attempts }), { correct: 0, attempts: 0 })
  return totals.attempts ? Math.round((totals.correct / totals.attempts) * 100) : 0
}

function skillName(skill: NamedSkill | undefined) {
  return skill?.skills?.name ?? skill?.skill_id ?? 'Sin datos suficientes'
}

function subjectName(subjectId: string) {
  return subjectDefinition(subjectId)?.name ?? subjectId
}

export default function ParentDashboard() {
  const router = useRouter()
  const [player, setPlayer] = useState<Player | null>(null)
  const [skills, setSkills] = useState<SkillState[]>([])
  const [evidence, setEvidence] = useState({ attempts: {} as Record<string, number>, correct: {} as Record<string, number> })
  const [curriculumSkills, setCurriculumSkills] = useState<CurriculumSkillRow[]>([])
  const [curriculumUnits, setCurriculumUnits] = useState<CurriculumUnitRow[]>([])
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [trainingDays, setTrainingDays] = useState(0)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [mathPlan, setMathPlan] = useState<CurriculumPlan | null>(null)
  const [planMode, setPlanMode] = useState<CurriculumPacingMode>('automatic')
  const [planTerm, setPlanTerm] = useState<CurriculumTerm>(1)
  const [planFocusUnits, setPlanFocusUnits] = useState<string[]>([])
  const [savingPlan, setSavingPlan] = useState(false)
  const [planMessage, setPlanMessage] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient()
      if (!supabase) { setMessage('Supabase no configurado.'); setLoading(false); return }

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (!user && (!userError || isAuthenticationExpired(userError))) { localStorage.removeItem('levelup_player_id'); router.replace('/login'); return }
      if (userError || !user) { setMessage(userFacingError(userError, 'No se pudo comprobar tu sesión.')); setLoading(false); return }

      let selectedPlayer: Player | null = null
      const savedPlayerId = localStorage.getItem('levelup_player_id')
      if (savedPlayerId) {
        const result = await supabase.from('players').select('id,alias,xp,daily_target_minutes').eq('id', savedPlayerId).maybeSingle()
        if (result.error) { setMessage(userFacingError(result.error, 'No se pudo cargar el jugador seleccionado.')); setLoading(false); return }
        selectedPlayer = result.data as Player | null
        if (!selectedPlayer) localStorage.removeItem('levelup_player_id')
      }
      if (!selectedPlayer) {
        const result = await supabase.from('players').select('id,alias,xp,daily_target_minutes').order('alias', { ascending: true })
        if (result.error) { setMessage(userFacingError(result.error, 'No se pudieron cargar los jugadores.')); setLoading(false); return }
        const players = (result.data ?? []) as Player[]
        if (!players.length) { setMessage('Todavía no hay ningún jugador creado.'); setLoading(false); return }
        if (players.length > 1) { router.replace('/parent/setup'); return }
        selectedPlayer = players[0]
        localStorage.setItem('levelup_player_id', selectedPlayer.id)
      }

      const playerId = selectedPlayer.id
      setPlayer(selectedPlayer)
      const partial: string[] = []
      const [activity, sessions, states, completedEvidence, activeSkills, units, plan] = await Promise.all([
        fetchCompletedActivity(supabase, playerId),
        supabase.from('study_sessions').select('id,started_at,ended_at,actual_minutes,xp_earned').eq('player_id', playerId).eq('completed', true).eq('phase', 'done').not('ended_at', 'is', null).order('started_at', { ascending: false }).limit(7),
        supabase.from('player_skill_state').select('skill_id,mastery,confidence,difficulty,priority,skills!inner(name,unit_id,subject_id)').eq('player_id', playerId).eq('skills.active', true),
        fetchCompletedSkillEvidence(supabase, playerId),
        supabase.from('skills').select('id,name,unit_id,subject_id').eq('active', true).order('subject_id', { ascending: true }).order('sort_order', { ascending: true }),
        supabase.from('curriculum_units').select('id,name,subject_id,sort_order').eq('active', true).order('subject_id', { ascending: true }).order('sort_order', { ascending: true }),
        supabase.from('player_curriculum_plans').select('player_id,subject_id,academic_year_start,pacing_mode,current_term,focus_unit_ids,updated_at').eq('player_id', playerId).eq('subject_id', 'math').maybeSingle(),
      ])

      if (activity.error) partial.push('No se pudieron cargar el tiempo, los días de entrenamiento y la racha.')
      else { const summary = summarizeActivity((activity.data ?? []) as ActivitySession[]); setTodayMinutes(summary.todayMinutes); setTrainingDays(summary.trainingDays); setStreak(summary.streak) }

      if (states.error) partial.push('No se pudieron cargar las habilidades adaptativas.')
      else setSkills((states.data ?? []) as unknown as SkillState[])
      if (completedEvidence.error) partial.push('No se pudo cargar la evidencia de misiones completadas.')
      else setEvidence(completedEvidence.data ?? { attempts: {}, correct: {} })
      if (activeSkills.error) partial.push('No se pudo cargar el currículo activo de todas las asignaturas.')
      else setCurriculumSkills((activeSkills.data ?? []) as CurriculumSkillRow[])
      if (units.error) partial.push('No se pudieron cargar las unidades curriculares activas.')
      else setCurriculumUnits((units.data ?? []) as CurriculumUnitRow[])

      if (sessions.error) partial.push('No se pudieron cargar las sesiones recientes.')
      else if (sessions.data?.length) {
        const sessionIds = sessions.data.map((session) => session.id)
        const attemptsResult = await supabase.from('attempts').select('session_id,correct').in('session_id', sessionIds)
        if (attemptsResult.error) partial.push('No se pudieron cargar los aciertos de las sesiones recientes.')
        else {
          const counters = new Map<string, { attempts: number; correct: number }>()
          for (const attempt of attemptsResult.data ?? []) {
            if (!attempt.session_id) continue
            const current = counters.get(attempt.session_id) ?? { attempts: 0, correct: 0 }
            current.attempts += 1
            if (attempt.correct === true) current.correct += 1
            counters.set(attempt.session_id, current)
          }
          setRecentSessions(sessions.data.map((session) => ({ ...session, xp_earned: Number(session.xp_earned ?? 0), attempts: counters.get(session.id)?.attempts ?? 0, correct: counters.get(session.id)?.correct ?? 0 })) as RecentSession[])
        }
      }

      if (plan.error) partial.push('No se pudo cargar la programación de Matemáticas por trimestre.')
      else {
        const stored = plan.data as CurriculumPlan | null
        const effective = effectiveCurriculumPlan(playerId, stored)
        setMathPlan(stored)
        setPlanMode(stored?.pacing_mode ?? 'automatic')
        setPlanTerm(effective.currentTerm)
        setPlanFocusUnits(effective.focusUnitIds)
      }
      setWarnings(partial)
      setLoading(false)
    }
    load()
  }, [router])

  async function saveMathPlan() {
    if (!player || savingPlan) return
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return
    if (planMode === 'manual' && !planFocusUnits.length) { setPlanMessage('Selecciona al menos una unidad de Matemáticas.'); return }
    setSavingPlan(true); setPlanMessage('')
    const { data, error } = await supabase.rpc('set_player_curriculum_plan', {
      p_player_id: player.id,
      p_subject_id: 'math',
      p_academic_year_start: mathPlan?.academic_year_start ?? schoolYearStart(),
      p_pacing_mode: planMode,
      p_current_term: planTerm,
      p_focus_unit_ids: planMode === 'manual' ? planFocusUnits : [],
    })
    setSavingPlan(false)
    if (error) { setPlanMessage(userFacingError(error, 'No se pudo guardar el ritmo de Matemáticas.')); return }
    const saved = data as unknown as CurriculumPlan
    setMathPlan(saved)
    const effective = effectiveCurriculumPlan(player.id, saved)
    setPlanTerm(effective.currentTerm); setPlanFocusUnits(effective.focusUnitIds)
    setPlanMessage('Plan guardado. Las próximas preguntas de Matemáticas respetarán este ritmo.')
  }

  const unitNames = useMemo(() => Object.fromEntries(curriculumUnits.map((unit) => [unit.id, unit.name])), [curriculumUnits])
  const unitSubjects = useMemo(() => Object.fromEntries(curriculumUnits.map((unit) => [unit.id, unit.subject_id])), [curriculumUnits])
  const unitInsights = useMemo(() => buildUnitInsights({ curriculumSkills, states: skills, evidence, unitNames, unitOrder: curriculumUnits.map((unit) => unit.id) }), [curriculumSkills, curriculumUnits, skills, evidence, unitNames])

  if (loading) return <main className="shell"><section className="card loading-card" role="status" aria-live="polite"><p className="muted">Cargando progreso real…</p></section></main>
  if (!player) return <main className="shell"><section className="card"><h1>Panel padre</h1><p className="muted">{message}</p><div className="action-row"><button className="btn primary" onClick={() => window.location.reload()}>REINTENTAR</button><Link href="/parent/setup" className="btn dark">IR A JUGADORES</Link></div></section></main>

  const strongest = strongestSkills(skills, evidence)
  const reinforcement = reinforcementSkills(skills, evidence)
  const emerging = emergingSkills(skills, evidence)
  const mastery = weightedMastery(skills, evidence)
  const evaluatedSkills = skills.filter((skill) => evidenceCount(skill, evidence) > 0).length
  const recentBlock = recentSessions.slice(0, 3)
  const previousBlock = recentSessions.slice(3, 6)
  const recentAccuracy = averageAccuracy(recentBlock)
  const previousAccuracy = averageAccuracy(previousBlock)
  const accuracyDelta = recentBlock.length && previousBlock.length ? recentAccuracy - previousAccuracy : null
  const recommendation = weeklyRecommendation({ completedSessions: recentSessions.length, evaluatedSkills, totalSkills: curriculumSkills.length, recentAccuracy, accuracyDelta, focusName: reinforcement[0] ? skillName(reinforcement[0]) : undefined })
  const target = Math.max(1, Number(player.daily_target_minutes) || 35)
  const dailyProgress = Math.min(100, Math.round((todayMinutes / target) * 100))
  const skillSubject = (skillId: string) => curriculumSkills.find((skill) => skill.id === skillId)?.subject_id ?? ''
  const mathEffective = effectiveCurriculumPlan(player.id, mathPlan)
  const visibleFocusUnits = planMode === 'manual' ? planFocusUnits : mathEffective.focusUnitIds
  const calibrated = visibleFocusUnits.filter((unitId) => curriculumSkills.filter((skill) => skill.unit_id === unitId).reduce((sum, skill) => sum + Number(evidence.attempts[skill.id] ?? 0), 0) >= 2).length
  const calibrationProgress = visibleFocusUnits.length ? Math.round((calibrated / visibleFocusUnits.length) * 100) : 0

  const subjectSummaries = ACTIVE_SUBJECT_IDS.map((subjectId) => {
    const ids = curriculumSkills.filter((skill) => skill.subject_id === subjectId).map((skill) => skill.id)
    const subjectStates = skills.filter((skill) => skill.skills?.subject_id === subjectId)
    const attempts = ids.reduce((sum, id) => sum + Number(evidence.attempts[id] ?? 0), 0)
    const correct = ids.reduce((sum, id) => sum + Number(evidence.correct[id] ?? 0), 0)
    const subjectMastery = weightedMastery(subjectStates, evidence)
    return { subjectId, total: ids.length, practiced: ids.filter((id) => Number(evidence.attempts[id] ?? 0) > 0).length, attempts, accuracy: attempts ? Math.round((correct / attempts) * 100) : null, mastery: subjectMastery.evidence ? subjectMastery.value : null }
  })

  return <main className="shell">
    <section className="card">
      <span className="tag">👨‍👦 PANEL PADRE · 5 ASIGNATURAS</span><h1>{player.alias}</h1><p className="muted">Resumen basado en misiones completadas y currículo activo.</p>
      <div className="grid two"><div className="metric"><b>{player.xp} XP</b><p className="muted">progreso acumulado</p></div><div className="metric"><b>🔥 {streak}</b><p className="muted">racha actual</p></div><div className="metric"><b>{trainingDays}</b><p className="muted">días con entrenamiento</p></div><div className="metric"><b>{mastery.value}%</b><p className="muted">{mastery.evidence ? 'dominio ponderado' : 'sin práctica registrada'}</p></div><div className="metric"><b>{evaluatedSkills}/{curriculumSkills.length || '—'}</b><p className="muted">habilidades con evidencia / activas</p></div><div className="metric"><b>{todayMinutes}/{target} min</b><p className="muted">hoy / objetivo</p><div className="bar" role="progressbar" aria-label="Progreso del objetivo diario" aria-valuemin={0} aria-valuemax={100} aria-valuenow={dailyProgress}><i style={{ width: `${dailyProgress}%` }} /></div></div></div>
    </section>

    {warnings.length > 0 && <section className="card"><span className="tag">⚠️ DATOS PARCIALES</span><h2>No se ha podido actualizar todo el panel</h2><ul className="muted">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></section>}

    <section className="card"><span className="tag">🧭 VISIÓN POR ASIGNATURA</span><h2>Evidencia en cada materia</h2><div className="grid two">{subjectSummaries.map((summary) => { const def = subjectDefinition(summary.subjectId); return <div className="metric" key={summary.subjectId}><b>{def?.icon ?? '📘'} {def?.name ?? summary.subjectId}</b><p className="muted">{summary.practiced}/{summary.total || '—'} habilidades · {summary.attempts} respuestas</p><p className="muted">Precisión {summary.accuracy === null ? '—' : `${summary.accuracy}%`} · dominio {summary.mastery === null ? '—' : `${summary.mastery}%`}</p></div> })}</div></section>

    <section className="card"><span className="tag">📚 RITMO DE MATEMÁTICAS</span><h2>Planificación por trimestre</h2><p className="muted">Los insights globales cubren las cinco asignaturas. El control manual por trimestre sigue limitado a Matemáticas.</p><fieldset className="curriculum-plan-options"><legend>Cómo avanza Matemáticas</legend><label className={planMode === 'automatic' ? 'selected' : ''}><input type="radio" name="pacing-mode" checked={planMode === 'automatic'} onChange={() => { setPlanMode('automatic'); setPlanMessage('') }} /><span><b>Automático</b><small>Usa el trimestre estimado.</small></span></label><label className={planMode === 'manual' ? 'selected' : ''}><input type="radio" name="pacing-mode" checked={planMode === 'manual'} onChange={() => { setPlanMode('manual'); setPlanFocusUnits(unitsForTerm(planTerm)); setPlanMessage('') }} /><span><b>Ritmo real del colegio</b><small>Elige trimestre y unidades actuales.</small></span></label></fieldset>{planMode === 'automatic' ? <div className="metric"><b>{termLabel(mathEffective.currentTerm)}</b><p className="muted">Foco: {mathEffective.focusUnitIds.map((id) => unitNames[id] ?? id).join(' · ')}</p></div> : <><div className="curriculum-term-picker" role="group" aria-label="Trimestre actual">{([1, 2, 3] as CurriculumTerm[]).map((term) => <button key={term} type="button" className={planTerm === term ? 'selected' : ''} onClick={() => { setPlanTerm(term); setPlanFocusUnits(unitsForTerm(term)); setPlanMessage('') }}>{termLabel(term)}</button>)}</div><div className="curriculum-focus-grid">{unitsForTerm(planTerm).map((unitId) => <label key={unitId} className={planFocusUnits.includes(unitId) ? 'selected' : ''}><input type="checkbox" checked={planFocusUnits.includes(unitId)} onChange={() => setPlanFocusUnits((current) => current.includes(unitId) ? current.filter((id) => id !== unitId) : [...current, unitId])} /><span><b>{unitId}</b><small>{unitNames[unitId] ?? 'Unidad curricular'}</small></span></label>)}</div></>}<div className="metric"><b>🧭 {calibrated}/{visibleFocusUnits.length || '—'} unidades calibradas</b><div className="bar" role="progressbar" aria-label="Calibración de Matemáticas" aria-valuemin={0} aria-valuemax={100} aria-valuenow={calibrationProgress}><i style={{ width: `${calibrationProgress}%` }} /></div></div><button className="btn primary" type="button" disabled={savingPlan} onClick={saveMathPlan}>{savingPlan ? 'GUARDANDO…' : 'GUARDAR RITMO DE MATEMÁTICAS'}</button>{planMessage && <p className="muted" role="status">{planMessage}</p>}</section>

    <section className="card"><span className="tag">📌 RECOMENDACIÓN PARA ESTA SEMANA</span><h2>{recommendation.title}</h2><p className="muted">{recommendation.detail}</p><p className="muted">Combina evidencia válida de las cinco asignaturas; una materia sin práctica no se interpreta como dificultad.</p></section>

    <section className="card"><span className="tag">🗺️ MAPA DEL CURRÍCULO</span><h2>Cobertura por unidades y asignaturas</h2><div style={{ display: 'grid', gap: 10 }}>{unitInsights.map((unit) => <details className="metric curriculum-unit" key={unit.unitId}><summary><b>{subjectDefinition(unitSubjects[unit.unitId])?.icon ?? '📘'} {subjectName(unitSubjects[unit.unitId])} · {unit.unitId} · {unit.unitName}</b><span className={`unit-status ${unit.status}`}>{unitStatusLabel(unit.status)}</span></summary><div className="grid two"><div><b>{unit.practicedSkills}/{unit.totalSkills}</b><p className="muted">habilidades practicadas</p></div><div><b>{unit.accuracy === null ? '—' : `${unit.accuracy}%`}</b><p className="muted">precisión · {unit.attempts} respuestas</p></div></div><p className="muted">{unit.averageMastery === null ? 'Dominio: sin evidencia suficiente.' : `Dominio ponderado: ${unit.averageMastery}%.`}</p></details>)}</div></section>

    <section className="card"><span className="tag">🎯 PRÓXIMOS FOCOS</span><h2>Prioridades de práctica</h2>{reinforcement.length === 0 ? <p className="muted">No hay evidencia suficiente para señalar una prioridad.</p> : reinforcement.map((skill) => { const sid = skillSubject(skill.skill_id); return <div className="metric" key={skill.skill_id}><b>{subjectDefinition(sid)?.icon ?? '📘'} {skillName(skill)}</b><p className="muted">{subjectName(sid)} · prioridad {Math.round(skill.priority)}/100 · dominio {Math.round(skill.mastery)}% · precisión {skillAccuracy(skill, evidence)}% en {evidenceCount(skill, evidence)} respuestas</p></div> })}</section>

    {emerging.length > 0 && <section className="card"><span className="tag">🌱 EVIDENCIA INICIAL</span><h2>Todavía sin diagnóstico fiable</h2><p className="muted">Una sola respuesta no se interpreta como fortaleza ni dificultad.</p><p className="muted">{emerging.slice(0, 6).map((skill) => `${subjectDefinition(skillSubject(skill.skill_id))?.icon ?? '📘'} ${skillName(skill)}`).join(' · ')}</p></section>}

    <section className="card"><span className="tag">🏆 PUNTOS FUERTES</span><h2>Habilidades asentadas</h2>{strongest.length === 0 ? <p className="muted">Todavía no hay suficiente confianza acumulada.</p> : strongest.map((skill) => { const sid = skillSubject(skill.skill_id); return <div className="metric" key={skill.skill_id}><b>{subjectDefinition(sid)?.icon ?? '📘'} {skillName(skill)}</b><p className="muted">{subjectName(sid)} · dominio {Math.round(skill.mastery)}% · confianza {Math.round(skill.confidence)}% · precisión {skillAccuracy(skill, evidence)}%</p></div> })}</section>

    <section className="card"><span className="tag">📈 TENDENCIA RECIENTE</span><h2>Últimas sesiones</h2><div className="grid two"><div className="metric"><b>{recentAccuracy}%</b><p className="muted">precisión reciente</p></div><div className="metric"><b>{accuracyDelta === null ? '—' : `${accuracyDelta > 0 ? '+' : ''}${accuracyDelta} pts`}</b><p className="muted">frente al bloque anterior</p></div></div><div style={{ display: 'grid', gap: 10 }}>{recentSessions.map((session) => <div className="metric" key={session.id}><b>{new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(new Date(session.started_at))}</b><p className="muted">{session.correct}/{session.attempts} aciertos · +{session.xp_earned} XP · {sessionMinutes(session)} min</p></div>)}</div></section>

    <section className="card"><div className="action-row"><Link href="/player" className="btn primary">🎮 VOLVER A JUGAR</Link><Link href="/parent/setup" className="btn dark">👥 CAMBIAR JUGADOR</Link></div></section>
  </main>
}
