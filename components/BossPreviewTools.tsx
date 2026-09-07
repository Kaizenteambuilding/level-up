'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function BossPreviewTools() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const host = window.location.hostname
    setVisible(host.includes('git-feature-quarter-boss-lab') || host.includes('level-up-a544-'))
  }, [])

  if (!visible) return null

  return (
    <section className="card" style={{ maxWidth: 820, margin: '16px auto 40px', textAlign: 'center', border: '1px dashed rgba(160,132,255,.55)' }}>
      <span className="tag">🧪 SOLO PREVIEW</span>
      <h2>Probar el combate fuera de fecha</h2>
      <p className="muted">La ruta real mantiene el calendario y la racha del servidor. Este botón abre únicamente el laboratorio local para revisar las 15 preguntas, impactos y pantallas de victoria/derrota sin escribir en Supabase.</p>
      <Link href="/lab/boss" className="btn primary">🧪 ABRIR MODO DE PRUEBA</Link>
    </section>
  )
}
