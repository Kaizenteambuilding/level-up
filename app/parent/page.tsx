'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'

type Player = {
  id: string
  alias: string
  level: number
  xp: number
  streak_days: number
  daily_target_minutes: number
}

type SkillState = {
  skill_id: string
  mastery: number
  confidence: number
  difficulty: number
  skills: {
    name: string
    unit_id: string
  } | null
}

export default function Parent() {
  const [player, setPlayer] = useState<Player | null>(null)
  const [skills, setSkills] = useState<SkillState[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient()

      if (!supabase) {
        setMessage('Supabase no configurado.')
        setLoading(false)
        return
      }

      const playerId = localStorage.getItem('levelup_player_id')

      if (!playerId) {
        setMessage('No hay ningún jugador seleccionado.')
        setLoading(false)
        return
      }

      const { data: playerData, error: playerError } =
        await supabase
          .from('players')
          .select(
            'id,alias,level,xp,streak_days,daily_target_minutes'
          )
          .eq('id', playerId)
          .maybeSingle()

      if (playerError) {
        setMessage(playerError.message)
        setLoading(false)
        return
      }

      if (!playerData) {
        setMessage('No se ha encontrado el jugador.')
        setLoading(false)
        return
      }

      setPlayer(playerData as Player)

      const { data: skillData, error: skillError } =
        await supabase
          .from('player_skill_state')
          .select(`
            skill_id,
            mastery,
            confidence,
            difficulty,
            skills (
              name,
              unit_id
            )
          `)
          .eq('player_id', playerId)

      if (skillError) {
        setMessage(skillError.message)
      } else {
        setSkills((skillData ?? []) as unknown as SkillState[])
      }

      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return (
      <main className="shell">
        <section className="card">
          <p className="muted">
            Cargando progreso real...
          </p>
        </section>
      </main>
    )
  }

  if (!player) {
    return (
      <main className="shell">
        <section className="card">
          <h1>Panel padre</h1>
          <p className="muted">{message}</p>
          <Link href="/player" className="btn primary">
            VOLVER A JUGAR
          </Link>
        </section>
      </main>
    )
  }

  const sortedSkills = [...skills].sort(
    (a, b) => a.mastery - b.mastery
  )

  const weakest = sortedSkills.slice(0, 3)
  const strongest = [...sortedSkills]
    .reverse()
    .slice(0, 3)

  const averageMastery =
    skills.length > 0
      ? Math.round(
          skills.reduce(
            (sum, skill) => sum + Number(skill.mastery),
            0
          ) / skills.length
        )
      : 0

  return (
    <main className="shell">
      <section className="card">
        <span className="tag">
          👨‍👦 PANEL PADRE · DATOS REALES
        </span>

        <h1>{player.alias}</h1>

        <p className="muted">
          Resumen actualizado directamente desde Supabase.
        </p>

        <div className="grid two">
          <div className="metric">
            <b>Nivel {player.level}</b>
            <p className="muted">
              {player.xp} XP totales
            </p>
          </div>

          <div className="metric">
            <b>🔥 {player.streak_days}</b>
            <p className="muted">
              días de entrenamiento
            </p>
          </div>

          <div className="metric">
            <b>{averageMastery}%</b>
            <p className="muted">
              dominio medio
            </p>
          </div>

          <div className="metric">
            <b>{skills.length}</b>
            <p className="muted">
              habilidades evaluadas
            </p>
          </div>
        </div>
      </section>

      <section className="card">
        <span className="tag">
          🎯 PRIORIDAD DE REFUERZO
        </span>

        <h2>Lo que conviene trabajar</h2>

        {weakest.length === 0 ? (
          <p className="muted">
            Todavía no hay suficiente información.
          </p>
        ) : (
          weakest.map((skill) => (
            <div
              key={skill.skill_id}
              className="metric"
              style={{ marginBottom: 10 }}
            >
              <b>
                {skill.skills?.name ??
                  skill.skill_id}
              </b>

              <p className="muted">
                Dominio {Math.round(skill.mastery)}%
                {' · '}
                dificultad {skill.difficulty}/5
              </p>

              <div className="bar">
                <i
                  style={{
                    width: `${Math.round(
                      skill.mastery
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </section>

      <section className="card">
        <span className="tag">
          🏆 PUNTOS FUERTES
        </span>

        <h2>Habilidades más dominadas</h2>

        {strongest.map((skill) => (
          <div
            key={skill.skill_id}
            className="metric"
            style={{ marginBottom: 10 }}
          >
            <b>
              {skill.skills?.name ??
                skill.skill_id}
            </b>

            <p className="muted">
              Dominio {Math.round(skill.mastery)}%
            </p>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Objetivo diario</h2>

        <p className="muted">
          {player.daily_target_minutes} minutos de
          entrenamiento al día.
        </p>

        <Link href="/player" className="btn primary">
          🎮 VOLVER A JUGAR
        </Link>
      </section>
    </main>
  )
}