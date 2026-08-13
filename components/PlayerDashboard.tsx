'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'

type Player = {
  id: string
  alias: string
  level: number
  xp: number
  coins: number
  streak_days: number
  daily_target_minutes: number
}

type LastSession = {
  id: string
  started_at: string
  ended_at: string | null
  completed: boolean
  xp_earned: number
}

type PrioritySkill = {
  skill_id: string
  mastery: number
  confidence: number
  difficulty: number
  priority: number
  name: string
}

export default function PlayerDashboard() {
  const [player, setPlayer] = useState<Player | null>(null)
  const [lastSession, setLastSession] = useState<LastSession | null>(null)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionAttempts, setSessionAttempts] = useState(0)
  const [prioritySkills, setPrioritySkills] = useState<PrioritySkill[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

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
      setMessage('Debes iniciar sesión.')
      setLoading(false)
      return
    }

    const savedPlayerId = localStorage.getItem('levelup_player_id')

    let playerQuery = supabase
      .from('players')
      .select(
        'id,alias,level,xp,coins,streak_days,daily_target_minutes'
      )

    if (savedPlayerId) {
      playerQuery = playerQuery.eq('id', savedPlayerId)
    }

    const { data: playerData, error: playerError } = await playerQuery
      .order('xp', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (playerError) {
      setMessage(playerError.message)
      setLoading(false)
      return
    }

    if (!playerData) {
      setMessage('Todavía no hay ningún jugador creado.')
      setLoading(false)
      return
    }

    const currentPlayer = playerData as Player

    setPlayer(currentPlayer)
    localStorage.setItem('levelup_player_id', currentPlayer.id)

    // Última sesión completada
    const { data: sessionData } = await supabase
      .from('study_sessions')
      .select('id,started_at,ended_at,completed,xp_earned')
      .eq('player_id', currentPlayer.id)
      .eq('completed', true)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (sessionData) {
      setLastSession(sessionData as LastSession)

      // Resultados reales de esa sesión
      const { data: attemptsData } = await supabase
        .from('attempts')
        .select('correct')
        .eq('session_id', sessionData.id)

      const attempts = attemptsData ?? []

      setSessionAttempts(attempts.length)
      setSessionCorrect(
        attempts.filter((attempt: any) => attempt.correct === true).length
      )
    }

    // Habilidades con mayor necesidad de refuerzo
    const { data: stateData } = await supabase
      .from('player_skill_state')
      .select('skill_id,mastery,confidence,difficulty,priority')
      .eq('player_id', currentPlayer.id)
      .order('priority', { ascending: false })
      .limit(3)

    if (stateData && stateData.length > 0) {
      const skillIds = stateData.map((state: any) => state.skill_id)

      const { data: skillData } = await supabase
        .from('skills')
        .select('id,name')
        .in('id', skillIds)

      const skillNames = new Map(
        (skillData ?? []).map((skill: any) => [skill.id, skill.name])
      )

      setPrioritySkills(
        stateData.map((state: any) => ({
          ...state,
          name: skillNames.get(state.skill_id) ?? state.skill_id,
        }))
      )
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return (
      <section className="card">
        <p className="muted">Cargando partida...</p>
      </section>
    )
  }

  if (!player) {
    return (
      <section className="card">
        <h1>Primero crea un jugador</h1>
        <p className="muted">{message}</p>

        <Link href="/parent/setup" className="btn primary">
          CREAR PRIMER JUGADOR
        </Link>
      </section>
    )
  }

  const currentLevelXP = player.xp % 500
  const progress = Math.round((currentLevelXP / 500) * 100)

  const accuracy =
    sessionAttempts > 0
      ? Math.round((sessionCorrect / sessionAttempts) * 100)
      : 0

  return (
    <>
      <section
        className="card"
        style={{
          minHeight: 420,
          display: 'grid',
          alignContent: 'center',
        }}
      >
        <span className="tag">🎮 PARTIDA DE HOY</span>

        <h1>{player.alias}</h1>

        <p className="muted">
          Nivel {player.level} · {player.xp} XP · 🔥 {player.streak_days} días
        </p>

        <div className="bar">
          <i style={{ width: `${progress}%` }} />
        </div>

        <p className="muted">
          {currentLevelXP}/500 XP para avanzar de nivel
        </p>

        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            marginTop: 14,
          }}
        >
          <Link
            href="/mission"
            className="btn primary"
            style={{
              fontSize: 18,
              padding: '16px 22px',
            }}
          >
            ▶ MISIÓN DE HOY
          </Link>

          <Link href="/parent" className="btn dark">
            👨‍👦 PANEL PADRE
          </Link>
        </div>
      </section>

      <section className="card">
        <span className="tag">📊 ÚLTIMA MISIÓN</span>

        <h2>Tu última partida</h2>

        {lastSession ? (
          <div className="grid two">
            <div className="metric">
              <b>{accuracy}%</b>
              <p className="muted">
                {sessionCorrect}/{sessionAttempts} respuestas correctas
              </p>
            </div>

            <div className="metric">
              <b>+{lastSession.xp_earned} XP</b>
              <p className="muted">ganados en la última sesión</p>
            </div>
          </div>
        ) : (
          <p className="muted">
            Completa tu primera misión para ver aquí tus resultados.
          </p>
        )}
      </section>

      <section className="card">
        <span className="tag">🎯 ENTRENAMIENTO ADAPTATIVO</span>

        <h2>LEVEL UP recomienda reforzar</h2>

        {prioritySkills.length > 0 ? (
          <div style={{ display: 'grid', gap: 10 }}>
            {prioritySkills.map((skill) => (
              <div className="metric" key={skill.skill_id}>
                <b>{skill.name}</b>

                <p className="muted">
                  Dominio {skill.mastery}% · dificultad {skill.difficulty}/5
                </p>

                <div className="bar">
                  <i style={{ width: `${skill.mastery}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            Todavía no hay suficientes datos para recomendar habilidades.
          </p>
        )}
      </section>

      <section className="card">
        <h2>Tu progreso</h2>

        <div className="grid two">
          <div className="metric">
            <b>Nivel {player.level}</b>
            <p className="muted">{player.xp} XP totales</p>
          </div>

          <div className="metric">
            <b>🔥 {player.streak_days}</b>
            <p className="muted">días de entrenamiento</p>
          </div>

          <div className="metric">
            <b>🪙 {player.coins}</b>
            <p className="muted">monedas</p>
          </div>

          <div className="metric">
            <b>{player.daily_target_minutes} min</b>
            <p className="muted">objetivo diario</p>
          </div>
        </div>
      </section>
    </>
  )
}