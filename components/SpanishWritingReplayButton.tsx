'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function SpanishWritingReplayButton() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const check = () => {
      const text = document.body.textContent ?? ''
      setShow(text.includes('SALA COMPLETADA HOY') || text.includes('Práctica de escritura terminada'))
    }
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])

  if (!show) return null

  return <div className="card" style={{ marginTop: 16, textAlign: 'center' }}><p className="muted">Puedes seguir practicando sin cambiar XP, monedas ni la finalización de hoy.</p><Link className="btn primary" href="/zone/language/writing/replay">VOLVER A PRACTICAR</Link></div>
}
