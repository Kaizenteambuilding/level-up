'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { DemoAvatar, DemoGameDock, DemoGameError, DemoHud, DemoLoading, useDemoGamePlayer } from './DemoGameShell'
import { worldZoneById } from '@/lib/worldZones'

export default function ZonePreview() {
  const params = useParams<{ zone: string }>()
  const { player, game, loading, error } = useDemoGamePlayer()
  const zone = worldZoneById(params.zone)
  if (loading) return <DemoLoading />
  if (!zone) return <section className="card"><h1>Zona desconocida</h1><Link href="/world" className="btn primary">VOLVER AL MAPA</Link></section>
  if (!player || error) return <DemoGameError title="No se pudo abrir la zona" message={error} backHref="/world" backLabel="VOLVER AL MAPA" />
  const playableCount = zone.districts.filter((district) => district.availability === 'playable').length
  const allDistrictsPlayable = playableCount === zone.districts.length && zone.districts.length > 0
  return <><section className={`zone-preview ${zone.className}`}>
    <header className="zone-preview-top"><DemoAvatar player={player} game={game} /><DemoHud player={player} game={game} /></header>
    <div className="zone-preview-hero"><span className="zone-preview-icon" aria-hidden="true">{zone.icon}</span><span className="tag">{allDistrictsPlayable ? `${playableCount} DISTRITOS DISPONIBLES` : playableCount ? `${playableCount} DISTRITO${playableCount === 1 ? '' : 'S'} DISPONIBLE${playableCount === 1 ? '' : 'S'}` : 'DISPONIBLE PRÓXIMAMENTE'}</span><h1>{zone.name}</h1><h2>{zone.tagline}</h2><p>{zone.description}</p></div>
    <section className="nova-zone-message"><span aria-hidden="true">🤖</span><div><b>NOVA</b><p>{allDistrictsPlayable ? 'La zona está operativa: elige cualquiera de sus distritos para continuar la campaña y entrenar sus habilidades.' : playableCount ? 'Ya puedes entrar en los distritos marcados como disponibles. El resto se irá abriendo cuando su experiencia específica esté validada.' : 'La práctica curricular de las materias activas ya puede aparecer en la misión diaria. Estos distritos son campañas propias y estarán disponibles próximamente cuando su experiencia específica esté validada.'}</p></div></section>
    <div className="zone-districts">{zone.districts.map((district, index) => <article key={district.name}><span aria-hidden="true">{district.icon}</span><small>DISTRITO {index + 1}</small><h2>{district.name}</h2><p>{district.detail}</p>{district.availability === 'playable' && district.href ? <Link href={district.href} className="btn primary">ENTRAR AL DISTRITO</Link> : <b>🔒 DISPONIBLE PRÓXIMAMENTE</b>}</article>)}</div>
    <section className="zone-campaign"><div><span className="tag">{allDistrictsPlayable ? 'CAMPAÑA ACTIVA' : playableCount ? 'CAMPAÑA PARCIALMENTE ACTIVA' : 'CAMPAÑA EN DESARROLLO'}</span><h2>{zone.mission}</h2><p>{allDistrictsPlayable ? 'Todos los distritos de esta zona están disponibles. El curso, el trimestre y tu progreso deciden qué retos aparecen en cada sesión.' : 'El curso, el trimestre y tu progreso deciden qué retos aparecen en los distritos activos.'}</p></div><Link href="/world" className="btn primary">← VOLVER AL MUNDO</Link></section>
  </section><DemoGameDock active="world" /></>
}
