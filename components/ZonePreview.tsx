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
  return <><section className={`zone-preview ${zone.className}`}>
    <header className="zone-preview-top"><DemoAvatar player={player} game={game} /><DemoHud player={player} game={game} /></header>
    <div className="zone-preview-hero"><span className="zone-preview-icon" aria-hidden="true">{zone.icon}</span><span className="tag">VISTA PREVIA · ZONA EN CONSTRUCCIÓN</span><h1>{zone.name}</h1><h2>{zone.tagline}</h2><p>{zone.description}</p></div>
    <section className="nova-zone-message"><span aria-hidden="true">🤖</span><div><b>NOVA</b><p>Esta zona ya tiene mapa e historia, pero sus ejercicios todavía no están conectados. No ganarás XP aquí hasta que su contenido curricular esté validado.</p></div></section>
    <div className="zone-districts">{zone.districts.map((district, index) => <article key={district.name}><span aria-hidden="true">{district.icon}</span><small>DISTRITO {index + 1}</small><h2>{district.name}</h2><p>{district.detail}</p><b>🔒 EN PREPARACIÓN</b></article>)}</div>
    <section className="zone-campaign"><div><span className="tag">FUTURA CAMPAÑA</span><h2>{zone.mission}</h2><p>Cuando activemos esta asignatura, el curso y el trimestre de Mati decidirán qué misiones aparecen.</p></div><Link href="/world" className="btn primary">← VOLVER AL MUNDO</Link></section>
  </section><DemoGameDock active="world" /></>
}
