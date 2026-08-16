import Link from 'next/link'

export default function Home() {
  return (
    <main className="shell">
      <section className="card hero">
        <span className="tag">LEVEL UP · 1º ESO</span>
        <h1>Entrena matemáticas con progreso adaptativo.</h1>
        <p className="muted">
          Inicia sesión para continuar con el jugador seleccionado, completar la misión diaria y consultar el progreso real.
        </p>
        <div className="action-row">
          <Link className="btn primary" href="/login">
            ENTRAR
          </Link>
          <Link className="btn dark" href="/player">
            IR AL JUGADOR
          </Link>
          <Link className="btn dark" href="/parent">
            PANEL PADRE
          </Link>
        </div>
      </section>
    </main>
  )
}
