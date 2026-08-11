import Link from 'next/link'
export default function Player(){
  return <main className="shell"><section className="card">
    <span className="tag">MATÍAS · NIVEL 10</span><h1>Misión de hoy</h1>
    <p className="muted">34 minutos · Matemáticas prioritarias · MiniBoss al final.</p>
    <Link className="btn primary" href="/mission">▶ EMPEZAR MISIÓN</Link>
  </section></main>
}
