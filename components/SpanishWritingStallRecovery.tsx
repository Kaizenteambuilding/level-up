'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const STALL_TEXT = 'Preparando el siguiente encargo de escritura'
const STALL_TIMEOUT_MS = 5000

export default function SpanishWritingStallRecovery() {
  const [stalled, setStalled] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stillPreparing = (document.body.textContent ?? '').includes(STALL_TEXT)
      setStalled(stillPreparing)
    }, STALL_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [])

  if (!stalled) return null

  return (
    <section className="card" role="alert" style={{ marginBottom: 16 }}>
      <span className="tag">SALA DE CRONISTAS</span>
      <h2>No se pudo preparar el encargo</h2>
      <p className="muted">La sesión diaria está abierta, pero el generador no ha arrancado. Puedes volver a intentarlo o continuar inmediatamente en práctica libre.</p>
      <div className="action-row">
        <button className="btn primary" type="button" onClick={() => window.location.reload()}>REINTENTAR SESIÓN</button>
        <Link className="btn dark" href="/zone/language/writing/replay">CONTINUAR EN PRÁCTICA LIBRE</Link>
        <Link className="btn dark" href="/zone/language">VOLVER A LA BIBLIOTECA</Link>
      </div>
    </section>
  )
}
