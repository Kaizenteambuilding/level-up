export default function Loading() {
  return (
    <main className="shell" aria-busy="true">
      <section className="card loading-card" role="status" aria-live="polite">
        <div>
          <div className="loading-dot" aria-hidden="true" />
          <b>Cargando LEVEL UP…</b>
          <p className="muted">Preparando tu progreso.</p>
        </div>
      </section>
    </main>
  )
}
