'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { academicDestination, AcademicRecommendation } from '@/lib/academicRecommendation'
import { createSupabaseBrowserClient } from '@/lib/supabase'

export type GuideFallback = { title: string; message: string; href: string; action: string; icon: string }

export default function AcademicNextStep({ playerId, fallback }: { playerId: string; fallback: GuideFallback }) {
  const [recommendation, setRecommendation] = useState<AcademicRecommendation | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const supabase = createSupabaseBrowserClient()
      if (!supabase) return
      const { data: state } = await supabase
        .from('player_skill_state')
        .select('skill_id,mastery,priority')
        .eq('player_id', playerId)
        .order('priority', { ascending: false })
        .order('mastery', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (!active || !state?.skill_id) return

      const { data: skill } = await supabase
        .from('skills')
        .select('id,name,subject_id,unit_id,active')
        .eq('id', state.skill_id)
        .eq('active', true)
        .maybeSingle()
      if (!active || !skill?.id || !skill.subject_id || !skill.unit_id) return

      const target = academicDestination(String(skill.subject_id), String(skill.unit_id))
      setRecommendation({
        skillId: String(skill.id),
        skillName: String(skill.name ?? skill.id),
        subjectId: String(skill.subject_id),
        unitId: String(skill.unit_id),
        mastery: Number(state.mastery ?? 0),
        priority: Number(state.priority ?? 0),
        href: target.href,
        destination: target.destination,
      })
    })()
    return () => { active = false }
  }, [playerId])

  if (!recommendation) {
    return <section className="world-guide" aria-label="Siguiente objetivo recomendado"><div className="guide-character" aria-hidden="true">🤖</div><div><span className="tag">NOVA · GUÍA DE EXPLORACIÓN</span><h2>{fallback.icon} {fallback.title}</h2><p>{fallback.message}</p></div><Link href={fallback.href} className="btn primary">{fallback.action}</Link></section>
  }

  return <section className="world-guide" aria-label="Entrenamiento académico recomendado"><div className="guide-character" aria-hidden="true">🤖</div><div><span className="tag">NOVA · PRIORIDAD ACADÉMICA</span><h2>🎯 Entrena {recommendation.skillName}</h2><p>Es tu siguiente foco recomendado según tu progreso adaptativo. Dominio actual: {Math.round(recommendation.mastery)}%. Te llevo a {recommendation.destination}.</p></div><Link href={recommendation.href} className="btn primary">ENTRENAR AHORA</Link></section>
}
