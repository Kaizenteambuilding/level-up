'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const STALL_TEXT = 'Preparando el siguiente encargo de escritura'
const STALL_TIMEOUT_MS = 7000

export default function SpanishWritingStallRecovery() {
  const [stalled, setStalled] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    const scheduleCheck = () => {
      if (timer) clearTimeout(timer)
      const isPreparing = (document.body.textContent ?? '').includes(STALL_TEXT)
      if (!isPreparing) {
        setStalled(false)
        return
      }
      timer = setTimeout(() => {
        const stillPreparing = (document.body.textContent ?? '').includes(STALL_TEXT)
        setStalled(stillPreparing)
      }, STALL_TIMEOUT_MS)
    }

    scheduleCheck()
    const observer = new MutationObserver(scheduleCheck)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })

    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [])

  if (!stalled) return null

  return (
    <section className="card" role="alert" style={{ marginBottom: 16 }}>
      <span className="tag">SALA DE CRONISTAS</span>
      <h2>No se pudo preparar el siguiente encargo</h2>
      <p className="muted">La sala ha quedado bloqueada al generar la actividad. Puedes reintentar la sesión o entrar en práctica libre sin recompensas.</p>
      <div className="action-row">
        <button className="btn primary" type="button" onClick={() => window.location.reload()}>REINTENTAR</button>
        <Link className="btn dark" href="/zone/language/writing/replay">IR A PRÁCTICA LIBRE</Link>
        <Link className="btn dark" href="/zone/language">VOLVER A LA BIBLIOTECA</Link>
      </div>
    </section>
  )
}
