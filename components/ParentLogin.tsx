'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { userFacingError } from '@/lib/userFacingError'
import { useRouter } from 'next/navigation'

export default function ParentLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const authLocked = useRef(false)

  function authMessage(error: { code?: string; message: string }) {
    if (error.code === 'invalid_credentials') return 'El email o la contraseña no son correctos.'
    if (error.code === 'email_not_confirmed') return 'Confirma primero el correo electrónico y vuelve a intentarlo.'
    if (error.code === 'user_already_exists' || error.code === 'email_exists') return 'Ya existe una cuenta con este correo.'
    if (error.code === 'weak_password') return 'La contraseña no cumple los requisitos de seguridad.'
    if (error.code === 'over_request_rate_limit' || error.code === 'over_email_send_rate_limit') return 'Demasiados intentos seguidos. Espera un momento y vuelve a probar.'
    return 'No se pudo completar el acceso. Inténtalo de nuevo.'
  }

  useEffect(() => {
    ;(async () => {
      const supabase = createSupabaseBrowserClient()

      if (!supabase) {
        setCheckingSession(false)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setCheckingSession(false)
        return
      }

      const { data: players, error } = await supabase
        .from('players')
        .select('id,alias')
        .order('alias', { ascending: true })

      if (error) {
        setMessage(userFacingError(error, 'No se pudieron cargar los jugadores.'))
        setCheckingSession(false)
        return
      }

      if (players?.length === 1) {
        localStorage.setItem('levelup_player_id', players[0].id)
        router.replace('/player')
      } else {
        localStorage.removeItem('levelup_player_id')
        router.replace('/parent/setup')
      }
    })()
  }, [router])

  async function signIn(e: FormEvent) {
    e.preventDefault()
    if (authLocked.current) return

    const supabase = createSupabaseBrowserClient()

    if (!supabase) {
      setMessage('Falta la configuración de Supabase.')
      return
    }

    authLocked.current = true
    setLoading(true)
    setMessage('')
    localStorage.removeItem('levelup_player_id')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      authLocked.current = false
      setLoading(false)
      setMessage(authMessage(error))
      return
    }

    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id,alias')
      .order('alias', { ascending: true })

    authLocked.current = false
    setLoading(false)

    if (playersError) {
      setMessage(userFacingError(playersError, 'Has entrado, pero no se pudieron cargar los jugadores.'))
      return
    }

    if (players?.length === 1) {
      localStorage.setItem('levelup_player_id', players[0].id)
      router.push('/player')
    } else {
      router.push('/parent/setup')
    }

    router.refresh()
  }

  async function signUp() {
    if (authLocked.current) return
    const supabase = createSupabaseBrowserClient()

    if (!supabase) {
      setMessage('Falta la configuración de Supabase.')
      return
    }

    authLocked.current = true
    setLoading(true)
    setMessage('')
    localStorage.removeItem('levelup_player_id')

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })

    authLocked.current = false
    setLoading(false)

    if (error) {
      setMessage(authMessage(error))
      return
    }

    if (data.session) {
      router.push('/parent/setup')
      router.refresh()
      return
    }

    setMessage(
      'Cuenta creada. Revisa tu correo si Supabase pide confirmación y después inicia sesión.'
    )
  }

  if (checkingSession) {
    return (
      <section className="card">
        <p className="muted">Comprobando sesión...</p>
      </section>
    )
  }

  return (
    <section className="card">
      <span className="tag">ACCESO PADRE / MADRE</span>
      <h1>Entrar en LEVEL UP</h1>

      <p className="muted">
        Entra una vez y LEVEL UP abrirá directamente el perfil de juego.
      </p>

      <form onSubmit={signIn}>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
            style={{
              width: '100%',
              padding: 12,
              marginTop: 6,
              marginBottom: 14,
            }}
          />
        </label>

        <label>
          Contraseña
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            style={{
              width: '100%',
              padding: 12,
              marginTop: 6,
              marginBottom: 14,
            }}
          />
        </label>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn primary"
            disabled={loading}
            type="submit"
          >
            {loading ? 'ENTRANDO...' : 'ENTRAR Y JUGAR'}
          </button>

          <button
            className="btn dark"
            disabled={loading || !email.trim() || password.length < 6}
            type="button"
            onClick={signUp}
          >
            CREAR CUENTA
          </button>
        </div>
      </form>

      {message && <p className="muted">{message}</p>}
    </section>
  )
}
