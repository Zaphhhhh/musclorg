import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface HistoryEntry {
  date: string // YYYY-MM-DD
  weight: number
  reps: number | null
}

export function useExerciseHistory(exerciseId: string | undefined) {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!exerciseId) {
      setEntries([])
      return
    }

    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)

      // 1. tous les blocs (dans tous les programmes) qui utilisent cet exo
      const { data: blocks, error: blocksError } = await supabase
        .from('session_blocks')
        .select('id')
        .eq('exercise_id', exerciseId)

      if (blocksError) {
        if (!cancelled) {
          setError(blocksError.message)
          setLoading(false)
        }
        return
      }

      const blockIds = (blocks ?? []).map((b) => b.id)
      if (blockIds.length === 0) {
        if (!cancelled) {
          setEntries([])
          setLoading(false)
        }
        return
      }

      // 2. toutes les perfs reelles enregistrees sur ces blocs
      const { data: logs, error: logsError } = await supabase
        .from('set_logs')
        .select('actual_reps, actual_weight, workout_log:workout_logs(performed_on)')
        .in('session_block_id', blockIds)
        .not('actual_weight', 'is', null)

      if (logsError) {
        if (!cancelled) {
          setError(logsError.message)
          setLoading(false)
        }
        return
      }

      if (cancelled) return

      const parsed = (logs ?? [])
        .map((l) => {
          const workoutLog = l.workout_log as unknown as { performed_on: string } | null
          return {
            date: workoutLog?.performed_on ?? '',
            weight: l.actual_weight as number,
            reps: l.actual_reps as number | null,
          }
        })
        .filter((e) => e.date)
        .sort((a, b) => a.date.localeCompare(b.date))

      setEntries(parsed)
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [exerciseId])

  return { entries, loading, error }
}
