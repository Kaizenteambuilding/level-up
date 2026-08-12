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

export default function PlayerDashboard() {
  const [player, setPlayer] = useState<Player | null>(null)
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

    let query = supabase
      .from('players')
      .select(
        'id,alias,level,xp,coins,streak_days,daily_target_minutes'
      )

    if (savedPlayerId) {
      query = query.eq('id', savedPlayerId)
    }

    const { data, error } = await query
      .order('xp', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    if (!data) {
      setMessage('Todavía no hay ningún jugador creado.')
      setLoading(false)
      return
    }

    setPlayer(data as Player)
    localStorage.setItem('levelup_player_id', data.id)
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

  return (
    <>
      <section
        className="card"
        style={{
          minHeight: 430,
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
          Objetivo diario: {player.daily_target_minutes} minutos
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
        </div>
      </section>
    </>
  )
}
