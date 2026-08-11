'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'

type Player = {
  id: string
  alias: string
  level: number
  xp: number
  streak_days: number
  daily_target_minutes: number
}

export default function PlayerSetup() {
  const [parentName, setParentName] = useState('')
  const [familyName, setFamilyName] = useState('Familia LEVEL UP')
  const [alias, setAlias] = useState('')
  const [minutes, setMinutes] = useState(35)
  const [players, setPlayers] = useState<Player[]>([])
  const [message, setMessage] = useState('')
  const [ready, setReady] = useState(false)

  async function load() {
    const supabase = createSupabaseBrowserClient()

    if (!supabase) {
      setMessage('Supabase no configurado.')
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setMessage('Primero debes iniciar sesión.')
      return
    }

    const { data: profile } = await supabase
      .from('parent_profiles')
      .select('family_id,display_name')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.family_id) {
      setParentName(profile.display_name ?? '')

      const { data } = await supabase
        .from('players')
        .select('id,alias,level,xp,streak_days,daily_target_minutes')
        .order('alias')

      setPlayers((data ?? []) as Player[])
      setReady(true)
    } else {
      setReady(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function setupFamily() {
    const supabase = createSupabaseBrowserClient()

    if (!supabase) return

    if (!parentName.trim()) {
      setMessage('Escribe tu nombre.')
      return
    }

    const { error } = await supabase.rpc('setup_parent_family', {
      family_name: familyName,
      parent_name: parentName,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Familia creada correctamente.')
    await load()
  }

  async function createPlayer(e: FormEvent) {
    e.preventDefault()

    const supabase = createSupabaseBrowserClient()

    if (!supabase) return

    const { data: profile, error: profileError } = await supabase
      .from('parent_profiles')
      .select('family_id')
      .single()

    if (profileError || !profile?.family_id) {
      setMessage('Primero configura la familia.')
      return
    }

    const { error } = await supabase.from('players').insert({
      family_id: profile.family_id,
      alias: alias.trim(),
      daily_target_minutes: minutes,
      level: 1,
      xp: 0,
      coins: 0,
      streak_days: 0,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setAlias('')
    setMessage('Jugador creado y guardado en Supabase.')
    await load()
  }

  if (!ready) {
    return (
      <section className="card">
        <span className="tag">PASO 1</span>
        <h1>Configura tu familia</h1>
        <p className="muted">Solo se hace una vez.</p>

        <label>
          Tu nombre
          <input
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            style={{ width: '100%', padding: 12, margin: '6px 0 14px' }}
          />
        </label>

        <label>
          Nombre de la familia
          <input
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            style={{ width: '100%', padding: 12, margin: '6px 0 14px' }}
          />
        </label>

        <button className="btn primary" onClick={setupFamily}>
          CREAR FAMILIA
        </button>

        {message && <p className="muted">{message}</p>}
      </section>
    )
  }

  return (
    <>
      <section className="card">
        <span className="tag">PASO 2</span>
        <h1>Crea el jugador</h1>

        <form onSubmit={createPlayer}>
          <label>
            Nombre o alias del jugador
            <input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              required
              style={{ width: '100%', padding: 12, margin: '6px 0 14px' }}
            />
          </label>

          <label>
            Objetivo diario: <b>{minutes} minutos</b>
            <input
              type="range"
              min="20"
              max="50"
              step="5"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </label>

          <br />

          <button className="btn primary" type="submit">
            GUARDAR JUGADOR
          </button>
        </form>

        {message && <p className="muted">{message}</p>}
      </section>

      <section className="card">
        <h2>Jugadores guardados</h2>

        {players.length === 0 ? (
          <p className="muted">Todavía no hay jugadores.</p>
        ) : (
          players.map((p) => (
            <div className="metric" key={p.id} style={{ marginBottom: 10 }}>
              <b>{p.alias}</b>
              <p className="muted">
                Nivel {p.level} · {p.xp} XP · 🔥 {p.streak_days} · objetivo{' '}
                {p.daily_target_minutes} min
              </p>
            </div>
          ))
        )}
      </section>
    </>
  )
}
