'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { fetchCompletedSkillEvidence } from '@/lib/progressQueries'
import { DemoAvatar, DemoGameDock, DemoGameError, DemoHud, DemoLoading, useDemoGamePlayer } from './DemoGameShell'
import { buildMathCampaign, nextCampaignDistrict } from '@/lib/mathCampaign'

type SkillRow = { id: string; name: string; unit_id: string }

const DISTRICTS = [
  { id: 'foundations', name: 'Puerto de los Números', icon: '⚓', units: ['M01', 'M02', 'M03'], description: 'Naturales, potencias, raíces y divisibilidad.' },
  { id: 'measure', name: 'Estación de Medidas', icon: '🚉', units: ['M04', 'M05', 'M06'], description: 'Enteros, decimales y sistema métrico.' },
  { id: 'fractions', name: 'Mercado de Fracciones', icon: '⚖️', units: ['M07', 'M08'], description: 'Fracciones, proporciones y porcentajes.' },
  { id: 'algebra', name: 'Torre del Álgebra', icon: '🗼', units: ['M09'], description: 'Expresiones, incógnitas y ecuaciones.' },
  { id: 'geometry', name: 'Distrito Geométrico', icon: '📐', units: ['M10', 'M11', 'M12'], description: 'Ángulos, figuras, perímetros y áreas.' },
  { id: 'data', name: 'Observatorio de Datos', icon: '🔭', units: ['M13', 'M14', 'M15'], description: 'Gráficas, estadística y probabilidad.' },
]

export default function MathCity() {
  const { player, game, loading, error } = useDemoGamePlayer()
  const [skills, setSkills] = useState<SkillRow[]>([])
  const [attempts, setAttempts] = useState<Record<string, number>>({})
  const [correct, setCorrect] = useState<Record<string, number>>({})
  const [progressLoading, setProgressLoading] = useState(true)
  const [warning, setWarning] = useState('')

  useEffect(() => {
    if (!player) return
    ;(async () => {
      const supabase = createSupabaseBrowserClient()
      if (!supabase) { setWarning('No se pudo cargar el progreso de los distritos.'); setProgressLoading(false); return }
      const [{ data: skillRows, error: skillError }, evidenceResult] = await Promise.all([
        supabase.from('skills').select('id,name,unit_id').eq('active', true).in('unit_id', DISTRICTS.flatMap((district) => district.units)),
        fetchCompletedSkillEvidence(supabase, player.id),
      ])
      if (skillError || evidenceResult.error) setWarning('El mapa está disponible, pero algunos datos de progreso no se han podido actualizar.')
      setSkills((skillRows ?? []) as SkillRow[])
      setAttempts(evidenceResult.data?.attempts ?? {})
      setCorrect(evidenceResult.data?.correct ?? {})
      setProgressLoading(false)
    })()
  }, [player])

  const districtProgress = useMemo(() => DISTRICTS.map((district) => {
    const districtSkills = skills.filter((skill) => district.units.includes(skill.unit_id))
    const practicedSkills = districtSkills.filter((skill) => Number(attempts[skill.id] ?? 0) > 0)
    const totalAttempts = practicedSkills.reduce((sum, skill) => sum + Number(attempts[skill.id] ?? 0), 0)
    const totalCorrect = practicedSkills.reduce((sum, skill) => sum + Number(correct[skill.id] ?? 0), 0)
    return { ...district, skills: districtSkills, practicedSkills: practicedSkills.length, totalAttempts, accuracy: totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : null }
  }), [skills, attempts, correct])
  const campaign = useMemo(() => buildMathCampaign(districtProgress.map((district) => ({ id: district.id, name: district.name, totalAttempts: district.totalAttempts, practicedSkills: district.practicedSkills, totalSkills: district.skills.length, accuracy: district.accuracy }))), [districtProgress])
  const nextDistrict = nextCampaignDistrict(campaign)
  const securedDistricts = campaign.filter((district) => district.status === 'secured').length

  if (loading) return <DemoLoading />
  if (!player || error) return <DemoGameError title="No se pudo abrir Ciudad Matemática" message={error} backHref="/world" backLabel="VOLVER AL MAPA" />

  return <>
    <section className="math-city-hero">
      <div className="city-skyline" aria-hidden="true">🏢 🏙️ 🗼 🏛️</div>
      <div className="city-header"><div><span className="tag">🏙️ ZONA ACADÉMICA REAL</span><h1>Ciudad Matemática</h1><p>Seis distritos reúnen todo el currículo de Matemáticas de 1.º de ESO.</p></div><div><DemoAvatar player={player} game={game} /><DemoHud player={player} game={game} /></div></div>
      <div className="action-row"><Link href="/mission/briefing" className="btn primary">▶ MISIÓN ADAPTATIVA</Link><Link href="/world" className="btn dark">← MAPA GLOBAL</Link></div>
    </section>
    {warning && <p className="status" role="status">{warning}</p>}
    <section className="city-campaign card" aria-label="Campaña de Ciudad Matemática">
      <div className="campaign-overview"><span className="tag">⚡ CAMPAÑA · RESTAURAR LA CIUDAD</span><h2>{securedDistricts} de {campaign.length} distritos estabilizados</h2><p className="muted">La campaña traduce la práctica real en una aventura visible. No sustituye al motor adaptativo ni altera qué preguntas necesita Mati.</p></div>
      <div className="campaign-route">{campaign.map((district, index) => <div key={district.id} className={`campaign-node ${district.status}`} title={district.objective}><span>{district.status === 'secured' ? '✓' : index + 1}</span><small>{district.progress}%</small></div>)}</div>
      {nextDistrict ? <div className="campaign-next"><b>🤖 NOVA RECOMIENDA</b><span>{nextDistrict.name}</span><p>{nextDistrict.objective}</p><Link href="/mission/briefing" className="btn primary">CONTINUAR CAMPAÑA</Link></div> : <div className="campaign-next secured"><b>🏆 CIUDAD ESTABILIZADA</b><span>Todos los distritos tienen evidencia sólida</span><p>Las misiones seguirán reforzando lo necesario según la evolución real.</p><Link href="/mission/briefing" className="btn primary">NUEVA EXPEDICIÓN</Link></div>}
    </section>
    <section className="district-grid" aria-label="Distritos de Ciudad Matemática">
      {districtProgress.map((district, index) => { const chapter = campaign[index]; return <article className={`district-card district-${index + 1} campaign-${chapter.status}`} key={district.id}>
        <span className="district-icon" aria-hidden="true">{district.icon}</span><span className="zone-state">{chapter.status === 'secured' ? '✓ ESTABILIZADO' : chapter.status === 'active' ? '⚡ EN EXPLORACIÓN' : `DISTRITO ${String(index + 1).padStart(2, '0')}`}</span><h2>{district.name}</h2><p>{district.description}</p>
        {progressLoading ? <p className="muted">Leyendo actividad real…</p> : district.totalAttempts > 0 ? <div className="district-evidence"><b>{district.accuracy}% precisión</b><span>{district.totalAttempts} intentos · {district.practicedSkills}/{district.skills.length} habilidades exploradas</span><div className="bar"><i style={{ width: `${district.accuracy}%` }} /></div></div> : <div className="district-evidence unexplored"><b>Territorio sin explorar</b><span>Aparecerán datos después de practicar estas habilidades.</span></div>}
        <div className="campaign-card-progress"><div className="bar" role="progressbar" aria-label={`Progreso de campaña en ${district.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={chapter.progress}><i style={{ width: `${chapter.progress}%` }} /></div><small>{chapter.objective}</small></div>
        <details><summary>Ver contenidos</summary><ul>{district.skills.length ? district.skills.map((skill) => <li key={skill.id}>{skill.name}</li>) : <li>Cargando contenidos curriculares…</li>}</ul></details>
      </article>})}
    </section>
    <section className="card city-explanation"><span className="tag">CÓMO FUNCIONA</span><h2>Una misión puede recorrer varios distritos</h2><p className="muted">LEVEL UP decide qué habilidades practicar utilizando el dominio y la evidencia real de Mati. El mapa permite entender dónde está cada contenido, pero no fuerza una ruta artificial ni altera la adaptación.</p><Link href="/mission/briefing" className="btn primary">ENTRAR EN MISIÓN</Link></section>
    <DemoGameDock active="world" />
  </>
}
