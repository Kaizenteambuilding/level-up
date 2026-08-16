import type { SupabaseClient } from '@supabase/supabase-js'

const PAGE_SIZE = 1000

export type CompletedActivityRow = {
  id: string
  started_at: string
  ended_at: string | null
  actual_minutes: number | null
}

export async function fetchCompletedActivity(
  supabase: SupabaseClient,
  playerId: string
) {
  const rows: CompletedActivityRow[] = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('id,started_at,ended_at,actual_minutes')
      .eq('player_id', playerId)
      .eq('completed', true)
      .eq('phase', 'done')
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (error) return { data: null, error }

    const page = (data ?? []) as CompletedActivityRow[]
    rows.push(...page)
    if (page.length < PAGE_SIZE) return { data: rows, error: null }
  }
}

export type CompletedSkillEvidence = {
  attempts: Record<string, number>
  correct: Record<string, number>
}

export async function fetchCompletedSkillEvidence(
  supabase: SupabaseClient,
  playerId: string
) {
  const evidence: CompletedSkillEvidence = { attempts: {}, correct: {} }

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('attempts')
      .select(`
        id,
        skill_id,
        correct,
        study_sessions!inner (
          id
        )
      `)
      .eq('player_id', playerId)
      .eq('study_sessions.completed', true)
      .eq('study_sessions.phase', 'done')
      .not('study_sessions.ended_at', 'is', null)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) return { data: null, error }

    const page = data ?? []
    page.forEach((attempt: { skill_id: string | null; correct: boolean | null }) => {
      const skillId = String(attempt.skill_id ?? '')
      if (!skillId) return
      evidence.attempts[skillId] = (evidence.attempts[skillId] ?? 0) + 1
      if (attempt.correct === true) {
        evidence.correct[skillId] = (evidence.correct[skillId] ?? 0) + 1
      }
    })

    if (page.length < PAGE_SIZE) return { data: evidence, error: null }
  }
}
