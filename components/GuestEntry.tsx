'use client'

import { FormEvent, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { userFacingError } from '@/lib/userFacingError'

export default function GuestEntry() {
  const router = useRouter()
  const [alias, setAlias] = useState('')
  const [readyAlias, setReadyAlias] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const locked = useRef(false)

  async function enterAsGuest(event: FormEvent) {
    event.preventDefault()
    if (locked.current) return

    const cleanAlias = alias.trim()
    if (cleanAlias.length < 2 || cleanAlias.length > 30) {
      setMessage('Escribe un nombre o apodo de entre 2 y 30 caracteres.')
      return
    }

    const supabase = createSupabaseBrowserClient()
    if (!supabase) {
      setMessage('No se pudo conectar con LEVEL UP.')
      return
    }

    locked.current = true
    setLoading(true)
    setMessage('Preparando tu partida…')

    try {
      const { data: currentSession } = await supabase.auth.getSession()
      if (currentSession.session) {
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) throw signOutError
      }

      localStorage.removeItem('levelup_player_id')
      localStorage.removeItem('levelup_guest_session')

      const { data: anonymousData, error: anonymousError } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            levelup_guest: true,
            guest_alias: cleanAlias,
          },
        },
      })

      if (anonymousError || !anonymousData.user) {
        throw anonymousError ?? new Error('No se pudo crear la sesión de invitado')
      }

      const shortId = anonymousData.user.id.slice(0, 8)
      const { error: familyError } = await supabase.rpc('setup_parent_family', {
        family_name: `Invitado ${cleanAlias} ${shortId}`,
        parent_name: 'Invitado LEVEL UP',
      })
      if (familyError) throw familyError

      const { data: createdPlayer, error: playerError } = await supabase.rpc('create_levelup_player', {
        p_alias: cleanAlias,
        p_daily_target_minutes: 35,
      })
      const playerId = String((createdPlayer as { player_id?: string } | null)?.player_id ?? '')
      if (playerError || !playerId) {
        throw playerError ?? new Error('No se pudo crear el jugador invitado')
      }

      localStorage.setItem('levelup_player_id', playerId)
      localStorage.setItem('levelup_guest_session', '1')
      setReadyAlias(cleanAlias)
      setMessage('')
      setLoading(false)
    } catch (cause) {
      await supabase.auth.signOut().catch(() => undefined)
      localStorage.removeItem('levelup_player_id')
      localStorage.removeItem('levelup_guest_session')
      const detail = cause instanceof Error ? cause.message.toLowerCase() : ''
      if (detail.includes('anonymous') || detail.includes('provider')) {
        setMessage('El acceso de invitados todavía no está activado en el servidor.')
      } else {
        setMessage(userFacingError(cause as { message?: string } | null, 'No se pudo preparar la partida de invitado.'))
      }
      locked.current = false
      setLoading(false)
    }
  }

  function startAdventure() {
    router.push('/world')
    router.refresh()
  }

  if (readyAlias) {
    return (
      <section className="card hero" style={{ maxWidth: 680, margin: '40px auto', textAlign: 'center' }}>
        <span className="tag">✨ PARTIDA LISTA</span>
        <h1>¡Bienvenido, {readyAlias}!</h1>
        <p className="muted" style={{ fontSize: 18 }}>
          Tu aventura de LEVEL UP ya está preparada. Lo que consigas jugando se guardará automáticamente en este navegador.
        </p>

        <div className="metric" style={{ marginTop: 18, textAlign: 'left' }}>
          <b>💾 Tu progreso se queda en este dispositivo</b>
          <p className="muted" style={{ marginBottom: 0 }}>
            Para continuar otro día, vuelve a entrar desde este mismo navegador y dispositivo. Si borras los datos del navegador o cambias de dispositivo, la partida de invitado no se podrá recuperar.
          </p>
        </div>

        <button className="btn primary" type="button" onClick={startAdventure} style={{ marginTop: 22, fontSize: 18, padding: '16px 24px' }}>
          🚀 EMPEZAR AVENTURA
        </button>
      </section>
    )
  }

  return (
    <section className="card hero" style={{ maxWidth: 680, margin: '40px auto' }}>
      <span className="tag">🎮 MODO INVITADO</span>
      <h1>Entra y juega</h1>
      <p className="muted">
        No necesitas email, contraseña ni registro. Escribe tu nombre o apodo y LEVEL UP creará una partida independiente para este dispositivo.
      </p>

      <form onSubmit={enterAsGuest}>
        <label className="form-field">
          Nombre o apodo
          <input
            value={alias}
            onChange={(event) => setAlias(event.target.value)}
            placeholder="Ej. Alex"
            autoComplete="nickname"
            maxLength={30}
            required
            disabled={loading}
          />
        </label>

        <button className="btn primary" type="submit" disabled={loading || alias.trim().length < 2} style={{ fontSize: 18, padding: '16px 24px' }}>
          {loading ? 'PREPARANDO PARTIDA…' : '▶ ENTRAR A JUGAR'}
        </button>
      </form>

      {message && <p className="muted status" role="status" aria-live="polite">{message}</p>}

      <div className="metric" style={{ marginTop: 18 }}>
        <b>Importante</b>
        <p className="muted" style={{ marginBottom: 0 }}>
          Esta partida queda vinculada a este navegador. Si se borran los datos del navegador o se cambia de dispositivo, no podremos recuperar el progreso del invitado.
        </p>
      </div>

      <div className="action-row" style={{ marginTop: 18 }}>
        <Link href="/login" className="btn dark">SOY PADRE / MADRE</Link>
      </div>
    </section>
  )
}
