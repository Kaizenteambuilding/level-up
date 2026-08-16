import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="shell">
      <section className="card">
        <span className="tag">ERROR 404</span>
        <h1>Esta pantalla no existe</h1>
        <p className="muted">
          El enlace puede estar incompleto o pertenecer a una versión anterior de Level Up.
        </p>
        <div className="action-row">
          <Link href="/player" className="btn primary">
            IR AL JUGADOR
          </Link>
          <Link href="/" className="btn dark">
            VOLVER AL INICIO
          </Link>
        </div>
      </section>
    </main>
  )
}
