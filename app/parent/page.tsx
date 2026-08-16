'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { userFacingError } from '@/lib/userFacingError'

type Player = {
  id: string
  alias: string
  level: number
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

const ACTIVE_CURRICULUM_UNITS = ['M01','M02','M03','M04','M05','M06','M07','M08','M09','M10','M11','M12','M13','M14','M15']

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
  const [skillAttemptCounts, setSkillAttemptCounts] = useState<Record<string, number>>({})
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [trainingDays, setTrainingDays] = useState(0)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [dataWarnings, setDataWarnings] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient()
      if (!supabase) {
        setMessage('Supabase no configurado.')
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        localStorage.removeItem('levelup_player_id')
        router.replace('/login')
        return
      }

      let selectedPlayer: Player | null = null
      const savedPlayerId = localStorage.getItem('levelup_player_id')

      if (savedPlayerId) {
        const { data: savedPlayer, error } = await supabase
          .from('players')
          .select('id,alias,level,xp,daily_target_minutes')
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
          .select('id,alias,level,xp,daily_target_minutes')
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

      const { data: activityData, error: activityError } = await supabase
        .from('study_sessions')
        .select('started_at,ended_at,actual_minutes')
        .eq('player_id', playerId)
        .eq('completed', true)
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false })
        .limit(1000)

      if (activityError) {
        warnings.push('No se pudieron cargar el tiempo, los días de entrenamiento y la racha.')
      } else {
        const summary = activitySummary((activityData ?? []) as ActivitySession[])
        setTodayMinutes(summary.todayMinutes)
        setTrainingDays(summary.totalTrainingDays)
        setStreak(summary.streak)
      }

      const { data: sessionRows, error: sessionsError } = await supabase
        .from('study_sessions')
        .select('id,started_at,ended_at,actual_minutes,xp_earned')
        .eq('player_id', playerId)
        .eq('completed', true)
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false })
        .limit(7)

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

      const { data: skillData, error: skillError } = await supabase
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
        .in('skills.unit_id', ACTIVE_CURRICULUM_UNITS)

      if (skillError) {
        warnings.push('No se pudieron cargar las habilidades adaptativas.')
      } else {
        setSkills((skillData ?? []) as unknown as SkillState[])
      }

      const { data: evidenceData, error: evidenceError } = await supabase
        .from('attempts')
        .select('skill_id')
        .eq('player_id', playerId)
        .limit(5000)

      if (evidenceError) {
        warnings.push('No se pudo cargar la evidencia necesaria para ponderar el dominio.')
      } else {
        const counts: Record<string, number> = {}
        ;(evidenceData ?? []).forEach((attempt: any) => {
          const skillId = String(attempt.skill_id ?? '')
          if (!skillId) return
          counts[skillId] = (counts[skillId] ?? 0) + 1
        })
        setSkillAttemptCounts(counts)
      }

      setDataWarnings(warnings)
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return <main className="shell"><section className="card"><p className="muted">Cargando progreso real...</p></section></main>
  }

  if (!player) {
    return (
      <main className="shell">
        <section className="card">
          <h1>Panel padre</h1>
          <p className="muted">{message}</p>
          <Link href="/parent/setup" className="btn primary">IR A JUGADORES</Link>
        </section>
      </main>
    )
  }

  const byPriority = [...skills].sort(
    (a, b) => Number(b.priority) - Number(a.priority) || Number(a.mastery) - Number(b.mastery)
  )
  const reinforcement = byPriority.slice(0, 3)
  const strongest = [...skills]
    .filter(
      (skill) =>
        Number(skillAttemptCounts[skill.skill_id] ?? 0) > 0 &&
        Number(skill.confidence) >= 60
    )
    .sort(
      (a, b) => Number(b.mastery) - Number(a.mastery) || Number(b.confidence) - Number(a.confidence)
    )
    .slice(0, 3)

  const totalEvidence = skills.reduce(
    (sum, skill) => sum + Number(skillAttemptCounts[skill.skill_id] ?? 0),
    0
  )
  const averageMastery = skills.length > 0
    ? totalEvidence > 0
      ? Math.round(
          skills.reduce(
            (sum, skill) =>
              sum + Number(skill.mastery) * Number(skillAttemptCounts[skill.skill_id] ?? 0),
            0
          ) / totalEvidence
        )
      : 0
    : 0

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

  const attention = byPriority.find((skill) => skill.mastery < 60 || skill.confidence < 60) ?? byPriority[0]
  const consolidating = [...skills]
    .filter((skill) => skill.mastery >= 55 && skill.mastery < 80)
    .sort((a, b) => b.mastery - a.mastery)[0]
  const secure = [...skills]
    .filter((skill) => skill.mastery >= 80 && skill.confidence >= 70)
    .sort((a, b) => b.mastery - a.mastery)[0]

  return (
    <main className="shell">
      <section className="card">
        <span className="tag">👨‍👦 PANEL PADRE · DATOS REALES</span>
        <h1>{player.alias}</h1>
        <p className="muted">Resumen actualizado directamente desde Supabase.</p>
        <div className="grid two">
          <div className="metric"><b>Nivel {player.level}</b><p className="muted">{player.xp} XP totales</p></div>
          <div className="metric"><b>🔥 {streak}</b><p className="muted">días de racha actual</p></div>
          <div className="metric"><b>{trainingDays}</b><p className="muted">días con entrenamiento completado</p></div>
          <div className="metric"><b>{averageMastery}%</b><p className="muted">{totalEvidence > 0 ? 'dominio medio ponderado por práctica' : 'dominio medio · sin práctica registrada'}</p></div>
          <div className="metric"><b>{skills.length}</b><p className="muted">habilidades evaluadas</p></div>
          <div className="metric">
            <b>{todayMinutes}/{target} min</b><p className="muted">entrenados hoy · objetivo diario</p>
            <div className="bar"><i style={{ width: `${dailyProgress}%` }} /></div>
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
        </section>
      )}

      <section className="card">
        <span className="tag">🧭 LECTURA PEDAGÓGICA</span>
        <h2>Qué está ocurriendo con las habilidades</h2>
        {skills.length === 0 ? (
          <p className="muted">Todavía no hay suficiente información para hacer una lectura pedagógica.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            <div className="metric">
              <b>🎯 Prioridad principal de refuerzo · {skillName(attention)}</b>
              <p className="muted" style={{ marginBottom: 0 }}>
                Dominio {Math.round(attention?.mastery ?? 0)}% · confianza {Math.round(attention?.confidence ?? 0)}% · dificultad {attention?.difficulty ?? 1}/5. Es una de las señales de mayor necesidad actual y el motor la favorece junto con otras habilidades que necesitan práctica, sin perder variedad ni cobertura.
              </p>
            </div>

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
        <span className="tag">🎯 PRIORIDAD DE REFUERZO</span>
        <h2>Lo que el motor considera más urgente</h2>
        {reinforcement.length === 0 ? <p className="muted">Todavía no hay suficiente información.</p> : reinforcement.map((skill) => (
          <div key={skill.skill_id} className="metric" style={{ marginBottom: 10 }}>
            <b>{skill.skills?.name ?? skill.skill_id}</b>
            <p className="muted">Prioridad {Math.round(skill.priority)}/100 · dominio {Math.round(skill.mastery)}% · confianza {Math.round(skill.confidence)}% · dificultad {skill.difficulty}/5</p>
            <div className="bar"><i style={{ width: `${Math.round(skill.mastery)}%` }} /></div>
          </div>
        ))}
      </section>

      <section className="card">
        <span className="tag">🏆 PUNTOS FUERTES</span>
        <h2>Habilidades con dominio y confianza suficientes</h2>
        {strongest.length === 0 ? <p className="muted">Todavía no hay suficiente confianza acumulada para señalar puntos fuertes.</p> : strongest.map((skill) => (
          <div key={skill.skill_id} className="metric" style={{ marginBottom: 10 }}>
            <b>{skill.skills?.name ?? skill.skill_id}</b>
            <p className="muted">Dominio {Math.round(skill.mastery)}% · confianza {Math.round(skill.confidence)}%</p>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Objetivo diario</h2>
        <p className="muted">Hoy lleva {todayMinutes} de {target} minutos de entrenamiento.</p>
        <div className="bar" style={{ marginBottom: 16 }}><i style={{ width: `${dailyProgress}%` }} /></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/player" className="btn primary">🎮 VOLVER A JUGAR</Link>
          <Link href="/parent/setup" className="btn dark">👥 CAMBIAR JUGADOR</Link>
        </div>
      </section>
    </main>
  )
}
