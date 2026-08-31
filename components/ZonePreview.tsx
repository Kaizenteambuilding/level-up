'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { DemoAvatar, DemoGameDock, DemoGameError, DemoHud, DemoLoading, useDemoGamePlayer } from './DemoGameShell'
import { worldZoneById } from '@/lib/worldZones'
import { createSupabaseBrowserClient } from '@/lib/supabase'

function madridDay(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

export default function ZonePreview() {
  const params = useParams<{ zone: string }>()
  const { player, game, loading, error } = useDemoGamePlayer()
  const [completedModes, setCompletedModes] = useState<Set<string>>(new Set())
  const zone = worldZoneById(params.zone)

  useEffect(() => {
    if (!player || !zone) return
    let active = true
    const modes = zone.districts.map((district) => district.mode).filter((mode): mode is string => Boolean(mode))
    if (!modes.length) return
    ;(async () => {
      const supabase = createSupabaseBrowserClient()
      if (!supabase) return
      const { data } = await supabase.from('study_sessions').select('mode,ended_at').eq('player_id', player.id).eq('completed', true).eq('phase', 'done').in('mode', modes).order('ended_at', { ascending: false }).limit(30)
      if (!active) return
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
      setCompletedModes(new Set((data ?? []).filter((session) => madridDay(session.ended_at) === today).map((session) => String(session.mode))))
    })()
    return () => { active = false }
  }, [player, zone])

  if (loading) return <DemoLoading />
  if (!zone) return <section className="card"><h1>Zona desconocida</h1><Link href="/world" className="btn primary">VOLVER AL MAPA</Link></section>
  if (!player || error) return <DemoGameError title="No se pudo abrir la zona" message={error} backHref="/world" backLabel="VOLVER AL MAPA" />
  const playableCount = zone.districts.filter((district) => district.availability === 'playable').length
  const allDistrictsPlayable = playableCount === zone.districts.length && zone.districts.length > 0
  const completedCount = zone.districts.filter((district) => district.mode && completedModes.has(district.mode)).length
  return <><section className={`zone-preview ${zone.className}`}>
    <header className="zone-preview-top"><DemoAvatar player={player} game={game} /><DemoHud player={player} game={game} /></header>
    <div className="zone-preview-hero"><span className="zone-preview-icon" aria-hidden="true">{zone.icon}</span><span className="tag">{completedCount ? `${completedCount}/${playableCount} DISTRITOS COMPLETADOS HOY` : allDistrictsPlayable ? `${playableCount} DISTRITOS DISPONIBLES` : playableCount ? `${playableCount} DISTRITO${playableCount === 1 ? '' : 'S'} DISPONIBLE${playableCount === 1 ? '' : 'S'}` : 'DISPONIBLE PRÓXIMAMENTE'}</span><h1>{zone.name}</h1><h2>{zone.tagline}</h2><p>{zone.description}</p></div>
    <section className="nova-zone-message"><span aria-hidden="true">🤖</span><div><b>NOVA</b><p>{completedCount === playableCount && playableCount > 0 ? 'Has completado los tres distritos de este mundo hoy. Puedes volver al mapa y elegir otra materia.' : completedCount ? `Ya has completado ${completedCount} distrito${completedCount === 1 ? '' : 's'} hoy. Elige otro para seguir avanzando.` : allDistrictsPlayable ? 'La zona está operativa: elige cualquiera de sus distritos para continuar la campaña y entrenar sus habilidades.' : playableCount ? 'Ya puedes entrar en los distritos marcados como disponibles. El resto se irá abriendo cuando su experiencia específica esté validada.' : 'La práctica curricular de las materias activas ya puede aparecer en la expedición diaria.'}</p></div></section>
    <div className="zone-districts">{zone.districts.map((district, index) => { const doneToday = Boolean(district.mode && completedModes.has(district.mode)); return <article key={district.name}><span aria-hidden="true">{doneToday ? '✅' : district.icon}</span><small>DISTRITO {index + 1}</small><h2>{district.name}</h2><p>{district.detail}</p>{doneToday ? <><b>✓ COMPLETADO HOY</b><p className="muted">Vuelve mañana para una nueva ronda.</p></> : district.availability === 'playable' && district.href ? <Link href={district.href} className="btn primary">ENTRAR AL DISTRITO</Link> : <b>🔒 DISPONIBLE PRÓXIMAMENTE</b>}</article> })}</div>
    <section className="zone-campaign"><div><span className="tag">{completedCount === playableCount && playableCount > 0 ? 'JORNADA COMPLETADA' : allDistrictsPlayable ? 'CAMPAÑA ACTIVA' : playableCount ? 'CAMPAÑA PARCIALMENTE ACTIVA' : 'CAMPAÑA EN DESARROLLO'}</span><h2>{zone.mission}</h2><p>{completedCount === playableCount && playableCount > 0 ? 'Los tres distritos están completados hoy. Explora otro mundo para seguir entrenando.' : allDistrictsPlayable ? 'Todos los distritos de esta zona están disponibles. El curso, el trimestre y tu progreso deciden qué retos aparecen en cada sesión.' : 'El curso, el trimestre y tu progreso deciden qué retos aparecen en los distritos activos.'}</p></div><Link href="/world" className="btn primary">← VOLVER AL MUNDO</Link></section>
  </section><DemoGameDock active="world" /></>
}
