'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Player = {
  id: string
  alias: string
  level: number
  xp: number
  streak_days: number
  daily_target_minutes: number
}

export default function PlayerSetup() {
  const router = useRouter()
  const [parentName, setParentName] = useState('')
  const [familyName, setFamilyName] = useState('Familia LEVEL UP')
  const [alias, setAlias] = useState('')
  const [minutes, setMinutes] = useState(35)
  const [players, setPlayers] = useState<Player[]>([])
  const [message, setMessage] = useState('')
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const actionLocked = useRef(false)

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

    const { data: profile, error: profileError } = await supabase
      .from('parent_profiles')
      .select('family_id,display_name')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      setMessage(profileError.message)
      setLoading(false)
      return
    }

    if (profile?.family_id) {
      setParentName(profile.display_name ?? '')

      const { data, error } = await supabase
        .from('players')
        .select('id,alias,level,xp,streak_days,daily_target_minutes')
        .order('alias')

      if (error) {
        setMessage(error.message)
        setLoading(false)
        return
      }

      setPlayers((data ?? []) as Player[])
      setReady(true)
    } else {
      setPlayers([])
      setReady(false)
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function setupFamily() {
    if (actionLocked.current) return
    const supabase = createSupabaseBrowserClient()

    if (!supabase) return

    if (!parentName.trim() || !familyName.trim()) {
      setMessage('Escribe tu nombre y el nombre de la familia.')
      return
    }

    actionLocked.current = true
    setSaving(true)
    setMessage('')

    const { error } = await supabase.rpc('setup_parent_family', {
      family_name: familyName.trim(),
      parent_name: parentName.trim(),
    })

    actionLocked.current = false
    setSaving(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Familia creada correctamente.')
    await load()
  }

  async function createPlayer(e: FormEvent) {
    e.preventDefault()
    if (actionLocked.current) return

    const supabase = createSupabaseBrowserClient()

    if (!supabase) return

    if (!alias.trim()) {
      setMessage('Escribe un nombre o alias para el jugador.')
      return
    }

    actionLocked.current = true
    setSaving(true)
    setMessage('')

    const { data: profile, error: profileError } = await supabase
      .from('parent_profiles')
      .select('family_id')
      .single()

    if (profileError || !profile?.family_id) {
      actionLocked.current = false
      setSaving(false)
      setMessage('Primero configura la familia.')
      return
    }

    const { data: createdPlayer, error } = await supabase
      .from('players')
      .insert({
        family_id: profile.family_id,
        alias: alias.trim(),
        daily_target_minutes: minutes,
        level: 1,
        xp: 0,
        coins: 0,
        streak_days: 0,
      })
      .select('id')
      .single()

    actionLocked.current = false
    setSaving(false)

    if (error || !createdPlayer) {
      setMessage(error?.message ?? 'No se pudo crear el jugador.')
      return
    }

    localStorage.setItem('levelup_player_id', createdPlayer.id)
    setAlias('')
    setMessage('Jugador creado y seleccionado.')
    await load()
  }

  function selectPlayer(player: Player) {
    localStorage.setItem('levelup_player_id', player.id)
    router.push('/player')
    router.refresh()
  }

  async function signOut() {
    if (actionLocked.current) return
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return

    actionLocked.current = true
    setSaving(true)
    const { error } = await supabase.auth.signOut()
    actionLocked.current = false
    setSaving(false)

    if (error) {
      setMessage(error.message)
      return
    }

    localStorage.removeItem('levelup_player_id')
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <section className="card">
        <p className="muted">Cargando familia...</p>
      </section>
    )
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

        <button className="btn primary" disabled={saving} onClick={setupFamily}>
          {saving ? 'CREANDO...' : 'CREAR FAMILIA'}
        </button>

        <button
          className="btn dark"
          disabled={saving}
          onClick={signOut}
          style={{ marginLeft: 10 }}
        >
          CERRAR SESIÓN
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
              maxLength={40}
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

          <button className="btn primary" disabled={saving} type="submit">
            {saving ? 'GUARDANDO...' : 'GUARDAR JUGADOR'}
          </button>
        </form>

        {message && <p className="muted">{message}</p>}
      </section>

      <section className="card">
        <h2>Jugadores guardados</h2>
        <p className="muted">Elige quién va a jugar.</p>

        {players.length === 0 ? (
          <p className="muted">Todavía no hay jugadores.</p>
        ) : (
          players.map((p) => (
            <div className="metric" key={p.id} style={{ marginBottom: 10 }}>
              <b>{p.alias}</b>
              <p className="muted">
                Nivel {p.level} · {p.xp} XP · objetivo {p.daily_target_minutes} min
              </p>
              <button className="btn primary" onClick={() => selectPlayer(p)}>
                JUGAR COMO {p.alias.toUpperCase()}
              </button>
            </div>
          ))
        )}

        <button
          className="btn dark"
          disabled={saving}
          onClick={signOut}
          style={{ marginTop: 12 }}
        >
          CERRAR SESIÓN
        </button>
      </section>
    </>
  )
}