'use client'

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="es">
      <body>
        <main className="shell">
          <section className="card" role="alert">
            <span className="tag">ERROR DE LEVEL UP</span>
            <h1>No se ha podido cargar la aplicación</h1>
            <p className="muted">
              Los datos ya guardados no se han perdido. Intenta cargar Level Up de nuevo.
            </p>
            <div className="action-row">
              <button className="btn primary" type="button" onClick={reset}>
                REINTENTAR
              </button>
              <a href="/" className="btn dark">
                IR AL INICIO
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  )
}
