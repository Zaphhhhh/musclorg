import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { computeSets, resolveBaseWeight } from '../lib/computeSets'
import type { SessionBlock } from '../types/program'

export interface JournalSetLog {
  set_index: number
  actual_reps: number | null
  actual_weight: number | null
  completed: boolean
  comment: string | null
  exercise_name: string
  planned_reps: number | null
  planned_weight: number | null
}

export interface JournalEntry {
  id: string
  performed_on: string
  session_name: string
  duration_seconds: number | null
  intensity_rating: number | null
  duration_rating: number | null
  relevance_rating: number | null
  sets: JournalSetLog[]
}

export function useWorkoutHistory() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('workout_logs')
      .select(
        `
          id, performed_on, duration_seconds, intensity_rating, duration_rating, relevance_rating,
          session:sessions(name),
          set_logs(
            set_index, actual_reps, actual_weight, completed, comment,
            session_block:session_blocks(
              order_index, sets, reps, weight, weight_mode, weight_pct,
              set_overrides, set_reps_overrides, no_sets_mode,
              exercise:exercises(name, pr_weight)
            )
          )
        `
      )
      .order('performed_on', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const parsed: JournalEntry[] = (data ?? []).map((log) => {
      const session = log.session as unknown as { name: string } | null
      const rawSetLogs = (log.set_logs ?? []) as unknown as {
        set_index: number
        actual_reps: number | null
        actual_weight: number | null
        completed: boolean
        comment: string | null
        session_block:
          | (SessionBlock & { exercise: { name: string; pr_weight: number | null } | null })
          | null
      }[]

      return {
        id: log.id as string,
        performed_on: log.performed_on as string,
        session_name: session?.name ?? 'Seance',
        duration_seconds: log.duration_seconds as number | null,
        intensity_rating: log.intensity_rating as number | null,
        duration_rating: log.duration_rating as number | null,
        relevance_rating: log.relevance_rating as number | null,
        sets: rawSetLogs
          .map((sl) => {
            const block = sl.session_block
            const exercisePr = block?.exercise?.pr_weight ?? null

            // Poids/reps prevus recalcules exactement comme au moment de
            // la seance (mode %PR, surcharge par serie...), plutot que
            // les valeurs generiques du bloc — sinon la comparaison est
            // fausse des qu'un bloc utilise le %PR ou une surcharge.
            let plannedReps: number | null = null
            let plannedWeight: number | null = null
            if (block) {
              const baseWeight = resolveBaseWeight(block, exercisePr)
              const computed = computeSets(block, baseWeight, exercisePr)
              const cs = computed[sl.set_index]
              if (cs) {
                plannedReps = cs.reps === 'AMRAP' ? null : cs.reps
                plannedWeight = cs.weight
              }
            }

            return {
              set_index: sl.set_index,
              blockOrder: block?.order_index ?? 0,
              actual_reps: sl.actual_reps,
              actual_weight: sl.actual_weight,
              completed: sl.completed,
              comment: sl.comment,
              exercise_name: block?.exercise?.name ?? 'Exercice',
              planned_reps: plannedReps,
              planned_weight: plannedWeight,
            }
          })
          // d'abord par position du bloc dans la seance (l'ordre reel des
          // exos), puis par numero de serie a l'interieur de ce bloc —
          // sinon des series d'exos differents partageant le meme
          // set_index se retrouvaient melangees.
          .sort((a, b) => a.blockOrder - b.blockOrder || a.set_index - b.set_index)
          .map(({ blockOrder: _blockOrder, ...rest }) => rest),
      }
    })

    setEntries(parsed)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const deleteEntry = useCallback(async (id: string) => {
    const { error } = await supabase.from('workout_logs').delete().eq('id', id)
    if (error) return { error: error.message }

    // les set_logs partent en cascade (contrainte on delete cascade)
    setEntries((prev) => prev.filter((e) => e.id !== id))
    return { error: null }
  }, [])

  return { entries, loading, error, deleteEntry, refetch: fetchHistory }
}
