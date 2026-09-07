'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'

type BossStatus = {
  term: number
  unlock_date: string
  streak_days: number
  required_streak_days: number
  passed: boolean
  retry_at: string | null
  available: boolean
}

export default function QuarterBossPortal() {
  const [status, setStatus] = useState<BossStatus | null>(null)

  useEffect(() => {
    ;(async () => {
      const playerId = localStorage.getItem('levelup_player_id')
      const supabase = createSupabaseBrowserClient()
      if (!playerId || !supabase) return
      const db = supabase as any
      const { data, error } = await db.rpc('get_levelup_boss_status', { p_player_id: playerId, p_subject_id: 'math' })
      if (!error && data) setStatus(data as BossStatus)
    })()
  }, [])

  if (!status || status.term <= 0) return null

  const ready = status.streak_days >= status.required_streak_days
  return (
    <section className="card" style={{ marginTop: 18, textAlign: 'center', border: '1px solid rgba(255,202,87,.45)', background: 'radial-gradient(circle at 50% 0%,rgba(122,82,255,.20),rgba(10,14,28,.96) 62%)' }}>
      <span className="tag">⚔️ EVENTO DE FIN DE TRIMESTRE</span>
      <h2 style={{ fontSize: 'clamp(1.8rem,5vw,3rem)', marginBottom: 8 }}>EL PORTAL DE LOS ULTIMATE BOSS SE HA ABIERTO</h2>
      <p className="muted">Los cinco guardianes del trimestre ya pueden ser desafiados.</p>
      <p><strong>🔥 Racha actual: {status.streak_days}/{status.required_streak_days} días consecutivos</strong></p>
      {ready ? (
        <Link className="btn primary" href="/boss">⚔️ ENTRAR AL PORTAL</Link>
      ) : (
        <p className="muted">Mantén la racha hasta {status.required_streak_days} días para poder combatir.</p>
      )}
    </section>
  )
}
