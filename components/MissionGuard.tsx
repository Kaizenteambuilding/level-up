'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { isAuthenticationExpired, userFacingError } from '@/lib/userFacingError'

const CurriculumDailySession = dynamic(() => import('@/components/CurriculumDailySession'), { loading: () => <section className="card" aria-live="polite"><p className="muted">Preparando el motor de matemáticas...</p></section> })
const MultiSubjectDailySession = dynamic(() => import('@/components/MultiSubjectDailySession'), { loading: () => <section className="card" aria-live="polite"><p className="muted">Preparando el motor multiasignatura...</p></section> })
const EnglishTerminalSession = dynamic(() => import('@/components/EnglishTerminalSession'), { loading: () => <section className="card" aria-live="polite"><p className="muted">Preparando Terminal de palabras...</p></section> })
const EnglishConversationSession = dynamic(() => import('@/components/EnglishConversationSession'), { loading: () => <section className="card" aria-live="polite"><p className="muted">Preparando Plaza de conversación...</p></section> })

type MissionMode = 'daily' | 'english_terminal' | 'english_conversation'

export default function MissionGuard({ mode = 'daily' }: { mode?: MissionMode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('Comprobando acceso...')
  const [canRetry, setCanRetry] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const [onboardingMode, setOnboardingMode] = useState(false)

  useEffect(() => {
    let active = true
    async function checkAccess() {
      setReady(false); setCanRetry(false); setMessage('Comprobando acceso...')
      const supabase = createSupabaseBrowserClient()
      if (!supabase) { if (active) { setMessage('Supabase no está configurado.'); setCanRetry(true) }; return }
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (!active) return
      if (!user && (!userError || isAuthenticationExpired(userError))) { localStorage.removeItem('levelup_player_id'); router.replace('/login'); return }
      if (userError || !user) { setMessage(userFacingError(userError, 'No se pudo comprobar tu sesión.')); setCanRetry(true); return }
      const playerId = localStorage.getItem('levelup_player_id')
      if (!playerId) { router.replace('/parent/setup'); return }
      const { data: player, error: playerError } = await supabase.from('players').select('id,avatar').eq('id', playerId).maybeSingle()
      if (!active) return
      if (playerError) { setMessage(userFacingError(playerError, 'No se pudo comprobar el jugador seleccionado.')); setCanRetry(true); return }
      if (!player) { localStorage.removeItem('levelup_player_id'); router.replace('/parent/setup'); return }
      const avatar = player.avatar && typeof player.avatar === 'object' && !Array.isArray(player.avatar) ? player.avatar as Record<string, unknown> : {}
      const isOnboarding = new URLSearchParams(window.location.search).get('onboarding') === '1'
      setOnboardingMode(isOnboarding)
      const onboardingStarted = typeof avatar.onboarding_started_at === 'string'
      if (avatar.onboarding_completed !== true && (!isOnboarding || !onboardingStarted)) { router.replace('/onboarding'); return }
      setReady(true)
    }
    checkAccess()
    return () => { active = false }
  }, [router, retryKey])

  if (!ready) return <section className="card"><p className="muted">{message}</p>{canRetry && <button className="btn primary" type="button" onClick={() => setRetryKey((value) => value + 1)}>REINTENTAR</button>}</section>
  if (mode === 'english_terminal') return <EnglishTerminalSession />
  if (mode === 'english_conversation') return <EnglishConversationSession />
  return onboardingMode ? <CurriculumDailySession /> : <MultiSubjectDailySession />
}
