import Link from 'next/link'
import PlayerDashboard from '@/components/PlayerDashboard'

export default function PlayerPage() {
  return (
    <main className="shell">
      <PlayerDashboard />
      <section className="card">
        <span className="tag">🌍 COMUNIDAD</span>
        <h2>Exploradores</h2>
        <p className="muted">Mira quién más está recorriendo LEVEL UP y cómo avanza en el mundo, sin rankings ni interacción entre jugadores.</p>
        <Link href="/explorers" className="btn dark">VER EXPLORADORES</Link>
      </section>
    </main>
  )
}
