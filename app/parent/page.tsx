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
  const trainingDays = new Set(
    sessions.map((session) => localDayKey(session.started_at))
  )

  const today = new Date()
  const todayKey = localDayKey(today)
  const todayMinutes = sessions
    .filter((session) => localDayKey(session.started_at) === todayKey)
    .reduce((sum, session) => sum + sessionMinutes(session), 0)

  let cursor = new Date(today)
  cursor.setHours(12, 0, 0, 0)

  if (!trainingDays.has(localDayKey(cursor))) {
    cursor = previousLocalDay(cursor)
  }

  let streak = 0
  while (trainingDays.has(localDayKey(cursor))) {
    streak += 1
    cursor = previousLocalDay(cursor)
  }

  return {
    todayMinutes,
    totalTrainingDays: trainingDays.size,
    streak,
  }
}

export default function Parent() {
  const router = useRouter()
  const [player, setPlayer] = useState<Player | null>(null)
  const [skills, setSkills] = useState<SkillState[]>([])
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

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        localStorage.removeItem('levelup_player_id')
        router.replace('/login')
        return
      }

      let selectedPlayer: Player | null = null
      const savedPlayerId = localStorage.getItem('levelup_player_id')

      if (savedPlayerId) {
        const { data: savedPlayer, error: savedPlayerError } = await supabase
          .from('players')
          .select('id,alias,level,xp,daily_target_minutes')
          .eq('id', savedPlayerId)
          .maybeSingle()

        if (savedPlayerError) {
          setMessage(savedPlayerError.message)
          setLoading(false)
          return
        }

        if (savedPlayer) {
          selectedPlayer = savedPlayer as Player
        } else {
          localStorage.removeItem('levelup_player_id')
        }
      }

      if (!selectedPlayer) {
        const { data: availablePlayers, error: playersError } = await supabase
          .from('players')
          .select('id,alias,level,xp,daily_target_minutes')
          .order('alias', { ascending: true })

        if (playersError) {
          setMessage(playersError.message)
          setLoading(false)
          return
        }

        const players = (availablePlayers ?? []) as Player[]

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

      const { data: skillData, error: skillError } = await supabase
        .from('player_skill_state')
        .select(`
          skill_id,
          mastery,
          confidence,
          difficulty,
          skills (
            name,
            unit_id
          )
        `)
        .eq('player_id', playerId)

      if (!skillError) {
        setSkills((skillData ?? []) as unknown as SkillState[])
      }

      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return (
      <main className="shell">
        <section className="card">
          <p className="muted">Cargando progreso real...</p>
        </section>
      </main>
    )
  }

  if (!player) {
    return (
      <main className="shell">
        <section className="card">
          <h1>Panel padre</h1>
          <p className="muted">{message}</p>
          <Link href="/parent/setup" className="btn primary">
            IR A JUGADORES
          </Link>
        </section>
      </main>
    )
  }

  const sortedSkills = [...skills].sort(
    (a, b) => a.mastery - b.mastery
  )

  const weakest = sortedSkills.slice(0, 3)
  const strongest = [...sortedSkills].reverse().slice(0, 3)

  const averageMastery =
    skills.length > 0
      ? Math.round(
          skills.reduce(
            (sum, skill) => sum + Number(skill.mastery),
            0
          ) / skills.length
        )
      : 0

  const target = Math.max(1, Number(player.daily_target_minutes) || 35)
  const dailyProgress = Math.min(100, Math.round((todayMinutes / target) * 100))

  return (
    <main className="shell">
      <section className="card">
        <span className="tag">👨‍👦 PANEL PADRE · DATOS REALES</span>

        <h1>{player.alias}</h1>

        <p className="muted">
          Resumen actualizado directamente desde Supabase.
        </p>

        <div className="grid two">
          <div className="metric">
            <b>Nivel {player.level}</b>
            <p className="muted">{player.xp} XP totales</p>
          </div>

          <div className="metric">
            <b>🔥 {streak}</b>
            <p className="muted">días de racha actual</p>
          </div>

          <div className="metric">
            <b>{trainingDays}</b>
            <p className="muted">días con entrenamiento completado</p>
          </div>

          <div className="metric">
            <b>{averageMastery}%</b>
            <p className="muted">dominio medio</p>
          </div>

          <div className="metric">
            <b>{skills.length}</b>
            <p className="muted">habilidades evaluadas</p>
          </div>

          <div className="metric">
            <b>{todayMinutes}/{target} min</b>
            <p className="muted">entrenados hoy · objetivo diario</p>
            <div className="bar">
              <i style={{ width: `${dailyProgress}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <span className="tag">🎯 PRIORIDAD DE REFUERZO</span>

        <h2>Lo que conviene trabajar</h2>

        {weakest.length === 0 ? (
          <p className="muted">
            Todavía no hay suficiente información.
          </p>
        ) : (
          weakest.map((skill) => (
            <div
              key={skill.skill_id}
              className="metric"
              style={{ marginBottom: 10 }}
            >
              <b>{skill.skills?.name ?? skill.skill_id}</b>

              <p className="muted">
                Dominio {Math.round(skill.mastery)}%
                {' · '}
                dificultad {skill.difficulty}/5
              </p>

              <div className="bar">
                <i
                  style={{
                    width: `${Math.round(skill.mastery)}%`,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </section>

      <section className="card">
        <span className="tag">🏆 PUNTOS FUERTES</span>

        <h2>Habilidades más dominadas</h2>

        {strongest.length === 0 ? (
          <p className="muted">Todavía no hay suficiente información.</p>
        ) : (
          strongest.map((skill) => (
            <div
              key={skill.skill_id}
              className="metric"
              style={{ marginBottom: 10 }}
            >
              <b>{skill.skills?.name ?? skill.skill_id}</b>

              <p className="muted">
                Dominio {Math.round(skill.mastery)}%
              </p>
            </div>
          ))
        )}
      </section>

      <section className="card">
        <h2>Objetivo diario</h2>

        <p className="muted">
          Hoy lleva {todayMinutes} de {target} minutos de entrenamiento.
        </p>

        <div className="bar" style={{ marginBottom: 16 }}>
          <i style={{ width: `${dailyProgress}%` }} />
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/player" className="btn primary">
            🎮 VOLVER A JUGAR
          </Link>

          <Link href="/parent/setup" className="btn dark">
            👥 CAMBIAR JUGADOR
          </Link>
        </div>
      </section>
    </main>
  )
}
