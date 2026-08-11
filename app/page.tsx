import Link from 'next/link'
export default function Home(){
  return <main className="shell">
    <section className="card" style={{minHeight:480,display:'grid',alignContent:'center'}}>
      <span className="tag">LEVEL UP v20 · APP REAL</span>
      <h1>Tu aventura ya tiene backend.</h1>
      <p className="muted">Proyecto Next.js preparado para Supabase, sesiones adaptativas, Bosses y panel del padre.</p>
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        <Link className="btn primary" href="/login">ENTRAR</Link>
        <Link className="btn dark" href="/player">VER DEMO JUGADOR</Link>
      </div>
    </section>
  </main>
}
