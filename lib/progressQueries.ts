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

export async function fetchSkillAttemptCounts(
  supabase: SupabaseClient,
  playerId: string
) {
  const counts: Record<string, number> = {}

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('attempts')
      .select('id,skill_id')
      .eq('player_id', playerId)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) return { data: null, error }

    const page = data ?? []
    page.forEach((attempt: { skill_id: string | null }) => {
      const skillId = String(attempt.skill_id ?? '')
      if (skillId) counts[skillId] = (counts[skillId] ?? 0) + 1
    })

    if (page.length < PAGE_SIZE) return { data: counts, error: null }
  }
}
