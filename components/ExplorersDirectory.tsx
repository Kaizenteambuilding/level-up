'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { gameRank } from '@/lib/gameProgression'
import { isAuthenticationExpired, userFacingError } from '@/lib/userFacingError'

type ExplorerProfile = {
  player_id: string
  alias: string
  avatar_id: 'astronaut' | 'ninja' | 'mage' | 'scientist'
  level: number
  level_progress_percent: number
  completed_expeditions: number
}

const AVATAR_ICON: Record<ExplorerProfile['avatar_id'], string> = {
  astronaut: '🧑‍🚀',
  ninja: '🥷',
  mage: '🧙‍♂️',
  scientist: '🧑‍🔬',
}

export default function ExplorersDirectory() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<ExplorerProfile[]>([])
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient()
      if (!supabase) { setMessage('Supabase no configurado.'); setLoading(false); return }

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (!user && (!userError || isAuthenticationExpired(userError))) { router.replace('/login'); return }
      if (userError || !user) { setMessage(userFacingError(userError, 'No se pudo comprobar tu sesión.')); setLoading(false); return }

      setCurrentPlayerId(localStorage.getItem('levelup_player_id'))
      const client = supabase as any
      const { data, error } = await client
        .from('player_public_profiles')
        .select('player_id,alias,avatar_id,level,level_progress_percent,completed_expeditions')
        .order('alias', { ascending: true })

      if (error) { setMessage(userFacingError(error, 'No se pudieron cargar los exploradores.')); setLoading(false); return }
      setProfiles((data ?? []) as ExplorerProfile[])
      setLoading(false)
    }
    load()
  }, [router])

  const others = useMemo(() => profiles.filter((profile) => profile.player_id !== currentPlayerId), [profiles, currentPlayerId])
  const current = useMemo(() => profiles.find((profile) => profile.player_id === currentPlayerId) ?? null, [profiles, currentPlayerId])
  const ordered = current ? [current, ...others] : profiles

  if (loading) return <section className="card loading-card" role="status" aria-live="polite"><p className="muted">Buscando exploradores…</p></section>

  return <>
    <section className="card hero">
      <span className="tag">🌍 EXPLORADORES</span>
      <h1>Otros jugadores recorren este mundo contigo</h1>
      <p className="muted">Aquí solo se comparte progreso general de juego. No hay rankings, chat, retos entre jugadores ni datos académicos.</p>
      <div className="action-row"><Link href="/player" className="btn dark">← VOLVER A MI PARTIDA</Link><Link href="/world" className="btn dark">🗺️ MUNDO</Link></div>
    </section>

    {message && <section className="card"><p className="status" role="alert">{message}</p></section>}

    {!message && <section className="card">
      <span className="tag">👥 COMUNIDAD DE SOLO LECTURA</span>
      <h2>{profiles.length} exploradores</h2>
      <p className="muted">Las tarjetas están ordenadas alfabéticamente, no por nivel ni rendimiento.</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14,marginTop:16}}>
        {ordered.map((profile) => {
          const isCurrent = profile.player_id === currentPlayerId
          const progress = Math.max(0, Math.min(100, Number(profile.level_progress_percent) || 0))
          return <article className="metric" key={profile.player_id} style={{padding:18}}>
            <div style={{fontSize:42,lineHeight:1}} aria-hidden="true">{AVATAR_ICON[profile.avatar_id] ?? '🧑‍🚀'}</div>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginTop:10}}><b style={{fontSize:18}}>{profile.alias}</b>{isCurrent && <span className="tag">TÚ</span>}</div>
            <p className="muted" style={{margin:'6px 0 10px'}}>Nivel {profile.level} · {gameRank(profile.level)}</p>
            <div className="bar" role="progressbar" aria-label={`Progreso del nivel de ${profile.alias}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><i style={{width:`${progress}%`}}/></div>
            <p className="muted" style={{margin:'8px 0 0'}}>{progress}% hacia el siguiente nivel · {profile.completed_expeditions} expediciones completadas</p>
          </article>
        })}
      </div>
      {profiles.length === 0 && <p className="muted">Todavía no hay exploradores visibles.</p>}
    </section>}

    <section className="card"><span className="tag">🔒 PRIVACIDAD</span><h2>Lo que no se comparte</h2><p className="muted">No mostramos respuestas, notas, aciertos, fallos, asignaturas, minutos de estudio, monedas, correo, familia ni información del panel padre.</p></section>
  </>
}
