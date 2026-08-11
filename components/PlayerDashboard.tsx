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
      setMessage('Debes iniciar sesión como padre/madre.')
      setLoading(false)
      return
    }

    const savedPlayerId = localStorage.getItem('levelup_player_id')

let query = supabase
  .from('players')
  .select('id,alias,level,xp,coins,streak_days,daily_target_minutes')

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
        <p className="muted">Cargando jugador...</p>
      </section>
    )
  }

  if (!player) {
    return (
      <section className="card">
        <h1>Sin jugador</h1>
        <p className="muted">{message}</p>
      </section>
    )
  }

  const currentLevelXP = player.xp % 500
  const progress = Math.round((currentLevelXP / 500) * 100)

  return (
    <>
      <section className="card">
        <span className="tag">PERFIL REAL · SUPABASE</span>

        <h1>{player.alias}</h1>

        <p className="muted">
          Este progreso ya no es una demo: viene directamente de la base
          de datos.
        </p>

        <div className="grid two">
          <div className="metric">
            <b>Nivel {player.level}</b>
            <p className="muted">{player.xp} XP totales</p>

            <div className="bar">
              <i style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="metric">
            <b>🔥 {player.streak_days}</b>
            <p className="muted">
              racha · objetivo {player.daily_target_minutes} min
            </p>
          </div>
        </div>

        <br />

        <Link href="/mission" className="btn primary">
          ▶ MISIÓN DE HOY
        </Link>
      </section>

      <section className="card">
        <h2>Progreso persistente</h2>

        <p className="muted">
          Completa una misión, gana XP y vuelve a esta pantalla. LEVEL UP
          leerá de nuevo el progreso guardado en Supabase.
        </p>
      </section>
    </>
  )
}
