'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { isAuthenticationExpired, userFacingError } from '@/lib/userFacingError'
import { useRouter } from 'next/navigation'

type Player = {
  id: string
  alias: string
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
    setLoading(true)
    const supabase = createSupabaseBrowserClient()

    if (!supabase) {
      setMessage('Supabase no configurado.')
      setLoading(false)
      return
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

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

    const { data: profile, error: profileError } = await supabase
      .from('parent_profiles')
      .select('family_id,display_name')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      setMessage(userFacingError(profileError, 'No se pudo cargar la configuración familiar.'))
      setLoading(false)
      return
    }

    if (profile?.family_id) {
      setParentName(profile.display_name ?? '')

      const { data, error } = await supabase
        .from('players')
        .select('id,alias,xp,streak_days,daily_target_minutes')
        .order('alias')

      if (error) {
        setMessage(userFacingError(error, 'No se pudieron cargar los jugadores.'))
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
      setMessage(userFacingError(error, 'No se pudo crear la familia.'))
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

    const { data: createdPlayer, error } = await supabase.rpc(
      'create_levelup_player',
      {
        p_alias: alias.trim(),
        p_daily_target_minutes: minutes,
      }
    )

    actionLocked.current = false
    setSaving(false)

    const createdPlayerId = String(
      (createdPlayer as { player_id?: string } | null)?.player_id ?? ''
    )

    if (error || !createdPlayerId) {
      setMessage(userFacingError(error, 'No se pudo crear el jugador.'))
      return
    }

    localStorage.setItem('levelup_player_id', createdPlayerId)
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
      setMessage(userFacingError(error, 'No se pudo cerrar la sesión.'))
      return
    }

    localStorage.removeItem('levelup_player_id')
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <section className="card loading-card" role="status" aria-live="polite">
        <div><div className="loading-dot" aria-hidden="true" /><p className="muted">Cargando familia…</p></div>
      </section>
    )
  }

  if (!ready) {
    return (
      <section className="card">
        <span className="tag">PASO 1</span>
        <h1>Configura tu familia</h1>
        <p className="muted">Solo se hace una vez.</p>

        <form onSubmit={(event) => { event.preventDefault(); setupFamily() }}>
          <label className="form-field">
            Tu nombre
            <input
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              autoComplete="name"
              required
              maxLength={80}
            />
          </label>

          <label className="form-field">
            Nombre de la familia
            <input
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              required
              maxLength={80}
            />
          </label>

          <div className="action-row">
            <button className="btn primary" disabled={saving} type="submit">
              {saving ? 'CREANDO...' : 'CREAR FAMILIA'}
            </button>

            <button
              className="btn dark"
              disabled={saving}
              onClick={signOut}
              type="button"
            >
              CERRAR SESIÓN
            </button>
          </div>
        </form>

        {message && <p className="muted" role="status" aria-live="polite">{message}</p>}
      </section>
    )
  }

  return (
    <>
      <section className="card">
        <span className="tag">PASO 2</span>
        <h1>Crea el jugador</h1>

        <form onSubmit={createPlayer}>
          <label className="form-field">
            Nombre o alias del jugador
            <input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              required
              maxLength={40}
            />
          </label>

          <label className="form-field">
            Objetivo diario: <b>{minutes} minutos</b>
            <input
              type="range"
              min="20"
              max="50"
              step="5"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
          </label>

          <button className="btn primary" disabled={saving} type="submit">
            {saving ? 'GUARDANDO...' : 'GUARDAR JUGADOR'}
          </button>
        </form>

        {message && <p className="muted status" role="status" aria-live="polite">{message}</p>}
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
                {p.xp} XP · objetivo {p.daily_target_minutes} min
              </p>
              <button className="btn primary" type="button" onClick={() => selectPlayer(p)}>
                JUGAR COMO {p.alias.toUpperCase()}
              </button>
            </div>
          ))
        )}

        <button
          className="btn dark"
          type="button"
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
