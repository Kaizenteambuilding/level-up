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

    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    router.push('/parent/setup')
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

    setMessage('Cuenta creada. Ya puedes entrar.')
  }

  return (
    <section className="card">
      <span className="tag">ACCESO PADRE / MADRE</span>
      <h1>Entrar en LEVEL UP</h1>
      <p className="muted">
        Esta cuenta administrará los jugadores de tu familia.
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
            {loading ? 'ENTRANDO...' : 'ENTRAR'}
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
