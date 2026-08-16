import Link from 'next/link'

export default function Home() {
  return (
    <main className="shell">
      <section className="card hero">
        <span className="tag">LEVEL UP · 1º ESO</span>
        <h1>Aprende, explora y sube de nivel.</h1>
        <p className="muted">
          Entra al mundo de LEVEL UP, completa misiones adaptativas y convierte el aprendizaje en una aventura.
        </p>
        <div className="action-row">
          <Link className="btn primary" href="/login">
            ENTRAR
          </Link>
          <Link className="btn dark" href="/world">
            ABRIR EL MUNDO
          </Link>
          <Link className="btn dark" href="/parent">
            PANEL PADRE
          </Link>
        </div>
      </section>
    </main>
  )
}
