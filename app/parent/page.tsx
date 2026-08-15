'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'

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
  const valid = sessions.filter((session) => session.attempts > 0)
  if (valid.length === 0) return 0
  return Math.round(
    valid.reduce((sum, session) => sum + sessionAccuracy(session), 0) /
      valid.length
  )
}

function skillName(skill: SkillState | undefined) {
  return skill?.skills?.name ?? skill?.skill_id ?? 'Sin datos suficientes'
}

export default function Parent() {
  const router = useRouter()
  const [player, setPlayer] = useState<Player | null>(null)
  const [skills, setSkills] = useState<SkillState[]>([])
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [trainingDays, setTrainingDays] = useState(0)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

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
          setMessage(error.message)
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
          setMessage(error.message)
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
      setPlayer(selectedPlayer)
      setMessage('')

      const { data: activityData, error: activityError } = await supabase
        .from('study_sessions')
        .select('started_at,ended_at,actual_minutes')
        .eq('player_id', playerId)
        .eq('completed', true)
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false })
        .limit(1000)

      if (!activityError) {
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

      if (!sessionsError && sessionRows && sessionRows.length > 0) {
        const sessionIds = sessionRows.map((session: any) => session.id)
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('attempts')
          .select('session_id,correct')
          .in('session_id', sessionIds)

        if (!attemptsError) {
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
          skills (
            name,
            unit_id
          )
        `)
        .eq('player_id', playerId)

      if (!skillError) setSkills((skillData ?? []) as unknown as SkillState[])
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

  const sortedSkills = [...skills].sort((a, b) => a.mastery - b.mastery)
  const weakest = sortedSkills.slice(0, 3)
  const strongest = [...sortedSkills].reverse().slice(0, 3)
  const averageMastery = skills.length > 0
    ? Math.round(skills.reduce((sum, skill) => sum + Number(skill.mastery), 0) / skills.length)
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

  const byPriority = [...skills].sort((a, b) => Number(b.priority) - Number(a.priority))
  const attention = byPriority.find((skill) => skill.mastery < 60 || skill.confidence < 60) ?? byPriority[0]
  const consolidating = [...skills]
    .filter((skill) => skill.mastery >= 55 && skill.mastery < 80)
    .sort((a, b) => b.mastery - a.mastery)[0]
  const secure = [...skills]
    .filter((skill) => skill.mastery >= 80 && skill.confidence >= 70)
    .sort((a, b) => b.mastery - a.mastery)[0] ?? strongest[0]

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
          <div className="metric"><b>{averageMastery}%</b><p className="muted">dominio medio</p></div>
          <div className="metric"><b>{skills.length}</b><p className="muted">habilidades evaluadas</p></div>
          <div className="metric">
            <b>{todayMinutes}/{target} min</b><p className="muted">entrenados hoy · objetivo diario</p>
            <div className="bar"><i style={{ width: `${dailyProgress}%` }} /></div>
          </div>
        </div>
      </section>

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
        <h2>Lo que conviene trabajar</h2>
        {weakest.length === 0 ? <p className="muted">Todavía no hay suficiente información.</p> : weakest.map((skill) => (
          <div key={skill.skill_id} className="metric" style={{ marginBottom: 10 }}>
            <b>{skill.skills?.name ?? skill.skill_id}</b>
            <p className="muted">Dominio {Math.round(skill.mastery)}% · dificultad {skill.difficulty}/5</p>
            <div className="bar"><i style={{ width: `${Math.round(skill.mastery)}%` }} /></div>
          </div>
        ))}
      </section>

      <section className="card">
        <span className="tag">🏆 PUNTOS FUERTES</span>
        <h2>Habilidades más dominadas</h2>
        {strongest.length === 0 ? <p className="muted">Todavía no hay suficiente información.</p> : strongest.map((skill) => (
          <div key={skill.skill_id} className="metric" style={{ marginBottom: 10 }}>
            <b>{skill.skills?.name ?? skill.skill_id}</b>
            <p className="muted">Dominio {Math.round(skill.mastery)}%</p>
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
