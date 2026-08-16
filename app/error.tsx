'use client'

import Link from 'next/link'

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="shell">
      <section className="card" role="alert">
        <span className="tag">ALGO NO HA SALIDO BIEN</span>
        <h1>No hemos podido abrir esta pantalla</h1>
        <p className="muted">
          Tu progreso guardado sigue a salvo. Puedes reintentar o volver al jugador.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn primary" type="button" onClick={reset}>
            REINTENTAR
          </button>
          <Link href="/player" className="btn dark">
            VOLVER AL JUGADOR
          </Link>
        </div>
      </section>
    </main>
  )
}
