'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import CurriculumDailySession from '@/components/CurriculumDailySession'

export default function MissionGuard() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('Comprobando acceso...')

  useEffect(() => {
    let active = true

    async function checkAccess() {
      const supabase = createSupabaseBrowserClient()

      if (!supabase) {
        if (active) setMessage('Supabase no está configurado.')
        return
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (!active) return

      if (userError || !user) {
        localStorage.removeItem('levelup_player_id')
        router.replace('/login')
        return
      }

      const playerId = localStorage.getItem('levelup_player_id')

      if (!playerId) {
        router.replace('/parent/setup')
        return
      }

      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('id', playerId)
        .maybeSingle()

      if (!active) return

      if (playerError) {
        setMessage('No se pudo comprobar el jugador seleccionado.')
        return
      }

      if (!player) {
        localStorage.removeItem('levelup_player_id')
        router.replace('/parent/setup')
        return
      }

      setReady(true)
    }

    checkAccess()

    return () => {
      active = false
    }
  }, [router])

  if (!ready) {
    return (
      <section className="card">
        <p className="muted">{message}</p>
      </section>
    )
  }

  return <CurriculumDailySession />
}
