import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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
            session_block:session_blocks(reps, weight, exercise:exercises(name))
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
        session_block: {
          reps: number
          weight: number | null
          exercise: { name: string } | null
        } | null
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
          .map((sl) => ({
            set_index: sl.set_index,
            actual_reps: sl.actual_reps,
            actual_weight: sl.actual_weight,
            completed: sl.completed,
            comment: sl.comment,
            exercise_name: sl.session_block?.exercise?.name ?? 'Exercice',
            planned_reps: sl.session_block?.reps ?? null,
            planned_weight: sl.session_block?.weight ?? null,
          }))
          .sort((a, b) => a.set_index - b.set_index),
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
