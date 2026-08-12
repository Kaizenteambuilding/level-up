'use client'

import { FormEvent, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ParentLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function signIn(e: FormEvent) {
    e.preventDefault()

    const supabase = createSupabaseBrowserClient()

    if (!supabase) {
      setMessage('Falta la configuración de Supabase.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setLoading(false)
      setMessage(error.message)
      return
    }

    // Si ya existe un jugador, vamos directamente a jugar.
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id')
      .limit(1)

    setLoading(false)

    if (playersError) {
      setMessage(playersError.message)
      return
    }

    if (players && players.length > 0) {
      localStorage.setItem('levelup_player_id', players[0].id)
      router.push('/player')
    } else {
      // Solo la primera vez se muestra la configuración.
      router.push('/parent/setup')
    }

    router.refresh()
  }

  async function signUp() {
    const supabase = createSupabaseBrowserClient()

    if (!supabase) {
      setMessage('Falta la configuración de Supabase.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage(
      'Cuenta creada. Revisa tu correo si Supabase pide confirmación y después inicia sesión.'
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
            required
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
            disabled={loading}
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
