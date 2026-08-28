import Link from 'next/link'
import MissionGuard from '@/components/MissionGuard'

export default function SpanishWritingPage() {
  return <main className="shell game-shell">
    <MissionGuard mode="spanish_writing" />
    <section className="card" style={{ marginTop: 16, textAlign: 'center' }}>
      <span className="tag">PRÁCTICA LIBRE</span>
      <h2>¿Quieres seguir escribiendo?</h2>
      <p className="muted">Practica otros 10 encargos sin modificar las recompensas ni el progreso diario.</p>
      <div className="action-row" style={{ justifyContent: 'center' }}>
        <Link className="btn dark" href="/zone/language/writing/replay">ABRIR PRÁCTICA LIBRE</Link>
      </div>
    </section>
  </main>
}
