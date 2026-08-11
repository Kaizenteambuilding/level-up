'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'

type TestState = {
  status: 'idle' | 'loading' | 'ok' | 'error'
  message: string
  detail?: string
}

export default function SupabaseConnectionTest(){
  const [state,setState] = useState<TestState>({
    status:'idle',
    message:'Pulsa el botón para comprobar la conexión.'
  })

  async function testConnection(){
    setState({status:'loading',message:'Comprobando conexión con Supabase...'})

    try{
      const supabase = createSupabaseBrowserClient()

      if(!supabase){
        setState({
          status:'error',
          message:'Faltan las variables de entorno de Supabase.',
          detail:'Comprueba NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en Vercel.'
        })
        return
      }

      const { data, error } = await supabase
        .from('skills')
        .select('id,name,subject_id')
        .limit(5)

      if(error){
        setState({
          status:'error',
          message:'LEVEL UP ha llegado a Supabase, pero Supabase ha devuelto un error.',
          detail:error.message
        })
        return
      }

      setState({
        status:'ok',
        message:'✅ LEVEL UP está conectado correctamente con Supabase.',
        detail:`Supabase ha devuelto ${data?.length ?? 0} habilidades de prueba.`
      })
    }catch(e){
      setState({
        status:'error',
        message:'No se ha podido completar la prueba.',
        detail:e instanceof Error ? e.message : String(e)
      })
    }
  }

  const border =
    state.status === 'ok' ? '#7ce448' :
    state.status === 'error' ? '#ff6872' :
    '#31516c'

  return <section className="card" style={{borderColor:border}}>
    <span className="tag">PRUEBA REAL</span>
    <h1>LEVEL UP ↔ Supabase</h1>
    <p className="muted">{state.message}</p>
    {state.detail && <div className="metric"><b>Detalle</b><p className="muted">{state.detail}</p></div>}
    <br/>
    <button
      className="btn primary"
      onClick={testConnection}
      disabled={state.status === 'loading'}
    >
      {state.status === 'loading' ? 'COMPROBANDO...' : 'COMPROBAR CONEXIÓN'}
    </button>
  </section>
}
