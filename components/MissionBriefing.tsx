'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { DemoAvatar, DemoGameDock, DemoGameError, DemoHud, DemoLoading, useDemoGamePlayer } from './DemoGameShell'

type OpenMission = { id: string; attempts: number }

export default function MissionBriefing() {
  const [onboarding, setOnboarding] = useState(false)
  const [openMission, setOpenMission] = useState<OpenMission | null>(null)
  useEffect(() => setOnboarding(new URLSearchParams(window.location.search).get('onboarding') === '1'), [])
  const { player, game, loading, error } = useDemoGamePlayer({ allowIncompleteOnboarding: 'onboarding-query' })

  useEffect(() => {
    if (!player) return
    let active = true
    ;(async () => {
      const supabase = createSupabaseBrowserClient()
      if (!supabase) return
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: session } = await supabase
        .from('study_sessions')
        .select('id')
        .eq('player_id', player.id)
        .eq('mode', 'daily')
        .eq('completed', false)
        .is('ended_at', null)
        .gte('started_at', cutoff)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!active || !session) return
      const { count } = await supabase
        .from('attempts')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', session.id)
      if (active) setOpenMission({ id: session.id, attempts: Math.min(10, Number(count ?? 0)) })
    })()
    return () => { active = false }
  }, [player])

  if (loading) return <DemoLoading />
  if (!player || error) return <DemoGameError title="No se pudo preparar la misión" message={error} backHref="/world" backLabel="VOLVER AL MAPA" />

  const missionProgress = openMission?.attempts ?? 0
  const hasProgress = missionProgress > 0

  return (<>
    <section className="mission-briefing">
      <div className="briefing-visual" aria-hidden="true"><span>🏙️</span><i>➗</i><i>📐</i><i>⅗</i></div>
      <div className="briefing-content">
        <span className="tag">CIUDAD MATEMÁTICA · {hasProgress ? 'MISIÓN EN CURSO' : 'MISIÓN DIARIA'}</span>
        <h1>{hasProgress ? 'El núcleo te espera' : 'El núcleo de los números'}</h1>
        <p>{hasProgress ? `Ya has completado ${missionProgress} de 10 retos. Tu avance está guardado y continuarás exactamente donde lo dejaste.` : 'La ciudad necesita energía. Cada reto correcto activa una parte del núcleo y mejora la recompensa final.'}</p>
        <div className="briefing-objectives">
          <div><b>🎯 Objetivo</b><span>{hasProgress ? `${missionProgress}/10 retos completados` : 'Completar 10 retos adaptativos'}</span></div>
          <div><b>⭐ Progreso real</b><span>XP, dominio y currículo</span></div>
          <div><b>🪙 Recompensa real</b><span>40 base + 5 por acierto</span></div>
        </div>
        {hasProgress && <div className="bar" role="progressbar" aria-label="Progreso de la misión guardada" aria-valuemin={0} aria-valuemax={10} aria-valuenow={missionProgress}><i style={{ width: `${missionProgress * 10}%` }} /></div>}
        <div className="briefing-player"><DemoAvatar player={player} game={game} /><DemoHud player={player} game={game} /></div>
        <div className="action-row">
          <Link href={onboarding ? '/mission?onboarding=1' : '/mission'} className="btn primary">▶ {hasProgress ? 'CONTINUAR MISIÓN' : 'EMPEZAR MISIÓN'}</Link>
          <Link href={onboarding ? '/onboarding?step=world' : '/world'} className="btn dark">← {onboarding ? 'VOLVER CON NOVA' : 'VOLVER AL MAPA'}</Link>
        </div>
        <p className="demo-notice">{hasProgress ? 'No perderás las respuestas ya guardadas. La misión se reanuda automáticamente durante 24 horas.' : 'La misión, el XP y las monedas se guardan de forma segura en la cuenta.'}</p>
      </div>
    </section>
    <DemoGameDock active="mission" />
  </>)
}
