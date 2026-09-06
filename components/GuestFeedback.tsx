'use client'

import { useEffect, useState } from 'react'
import { reportProductEvent } from '@/lib/productTelemetry'

type FunAnswer = 'love' | 'ok' | 'no'
type ClarityAnswer = 'easy' | 'some' | 'lost'
type MoreAnswer = 'yes' | 'maybe' | 'no'

export default function GuestFeedback() {
  const [guest, setGuest] = useState(false)
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [fun, setFun] = useState<FunAnswer | ''>('')
  const [clarity, setClarity] = useState<ClarityAnswer | ''>('')
  const [more, setMore] = useState<MoreAnswer | ''>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const isGuest = localStorage.getItem('levelup_guest_session') === '1'
    setGuest(isGuest)
    const playerId = localStorage.getItem('levelup_player_id')
    if (playerId && localStorage.getItem(`levelup_guest_feedback_${playerId}`) === '1') {
      setSubmitted(true)
    }
  }, [])

  if (!guest) return null

  async function submitFeedback() {
    if (!fun || !clarity || !more || saving) return
    const playerId = localStorage.getItem('levelup_player_id')
    if (!playerId) return

    setSaving(true)
    const route = `/world?fun=${fun}&clarity=${clarity}&more=${more}`
    await reportProductEvent(playerId, 'beta_feedback', route)
    localStorage.setItem(`levelup_guest_feedback_${playerId}`, '1')
    setSubmitted(true)
    setSaving(false)
  }

  if (submitted) {
    return (
      <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 40 }}>
        <button className="btn dark" type="button" disabled style={{ opacity: 0.9 }}>
          ✅ Gracias por tu opinión
        </button>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 40, maxWidth: 'calc(100vw - 36px)' }}>
      {!open ? (
        <button className="btn primary" type="button" onClick={() => setOpen(true)}>
          💬 ¿QUÉ TE HA PARECIDO?
        </button>
      ) : (
        <section className="card" aria-label="Opinión sobre LEVEL UP" style={{ width: 340, maxWidth: '100%', boxShadow: '0 18px 60px rgba(0,0,0,.35)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <div>
              <span className="tag">BETA</span>
              <h2 style={{ marginBottom: 4 }}>Ayúdanos a mejorar</h2>
            </div>
            <button className="btn dark" type="button" onClick={() => setOpen(false)} aria-label="Cerrar opinión">✕</button>
          </div>

          <p className="muted">Son solo 3 preguntas. No tienes que escribir nada.</p>

          <fieldset style={{ border: 0, padding: 0, margin: '18px 0' }}>
            <legend><b>1. ¿Te ha gustado jugar?</b></legend>
            <div className="action-row" style={{ marginTop: 10 }}>
              <button type="button" className={fun === 'love' ? 'btn primary' : 'btn dark'} onClick={() => setFun('love')}>😍 Mucho</button>
              <button type="button" className={fun === 'ok' ? 'btn primary' : 'btn dark'} onClick={() => setFun('ok')}>🙂 Está bien</button>
              <button type="button" className={fun === 'no' ? 'btn primary' : 'btn dark'} onClick={() => setFun('no')}>😕 No mucho</button>
            </div>
          </fieldset>

          <fieldset style={{ border: 0, padding: 0, margin: '18px 0' }}>
            <legend><b>2. ¿Sabías qué hacer?</b></legend>
            <div className="action-row" style={{ marginTop: 10 }}>
              <button type="button" className={clarity === 'easy' ? 'btn primary' : 'btn dark'} onClick={() => setClarity('easy')}>✅ Sí</button>
              <button type="button" className={clarity === 'some' ? 'btn primary' : 'btn dark'} onClick={() => setClarity('some')}>🤔 A veces</button>
              <button type="button" className={clarity === 'lost' ? 'btn primary' : 'btn dark'} onClick={() => setClarity('lost')}>❓ Me perdí</button>
            </div>
          </fieldset>

          <fieldset style={{ border: 0, padding: 0, margin: '18px 0' }}>
            <legend><b>3. ¿Volverías a jugar otro día?</b></legend>
            <div className="action-row" style={{ marginTop: 10 }}>
              <button type="button" className={more === 'yes' ? 'btn primary' : 'btn dark'} onClick={() => setMore('yes')}>🚀 Sí</button>
              <button type="button" className={more === 'maybe' ? 'btn primary' : 'btn dark'} onClick={() => setMore('maybe')}>🤷 Puede</button>
              <button type="button" className={more === 'no' ? 'btn primary' : 'btn dark'} onClick={() => setMore('no')}>👋 No</button>
            </div>
          </fieldset>

          <button className="btn primary" type="button" disabled={!fun || !clarity || !more || saving} onClick={submitFeedback} style={{ width: '100%' }}>
            {saving ? 'GUARDANDO…' : 'ENVIAR OPINIÓN'}
          </button>
        </section>
      )}
    </div>
  )
}
