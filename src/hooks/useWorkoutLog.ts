import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { SetLog } from '../types/workoutLog'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function useWorkoutLog(sessionId: string | undefined, performedOn: string = todayISO()) {
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null)
  const [setLogs, setSetLogs] = useState<SetLog[]>([])
  const [loading, setLoading] = useState(true)
  const pendingWrites = useRef<Record<string, Partial<SetLog>>>({})
  const writeTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false

    ;(async () => {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) {
        setLoading(false)
        return
      }

      const { data: existing } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('session_id', sessionId)
        .eq('performed_on', performedOn)
        .eq('user_id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (existing) {
        setWorkoutLogId(existing.id)
        const { data: logs } = await supabase
          .from('set_logs')
          .select('*')
          .eq('workout_log_id', existing.id)
        if (!cancelled && logs) setSetLogs(logs as SetLog[])
      } else {
        setWorkoutLogId(null)
        setSetLogs([])
      }
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [sessionId, performedOn])

  // Cree le workout_log seulement au premier vrai enregistrement d'une
  // perf, pas juste en consultant la seance.
  const ensureWorkoutLog = useCallback(async (): Promise<string | null> => {
    if (workoutLogId) return workoutLogId
    if (!sessionId) return null

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('workout_logs')
      .upsert(
        { user_id: user.id, session_id: sessionId, performed_on: performedOn },
        { onConflict: 'user_id,session_id,performed_on' }
      )
      .select()
      .single()

    if (error || !data) return null
    setWorkoutLogId(data.id)
    return data.id
  }, [workoutLogId, sessionId, performedOn])

  const getLog = useCallback(
    (sessionBlockId: string, setIndex: number) =>
      setLogs.find((l) => l.session_block_id === sessionBlockId && l.set_index === setIndex) ??
      null,
    [setLogs]
  )

  const updateSetLog = useCallback(
    (
      sessionBlockId: string,
      setIndex: number,
      patch: Partial<Pick<SetLog, 'actual_reps' | 'actual_weight' | 'completed' | 'comment'>>
    ) => {
      const key = `${sessionBlockId}:${setIndex}`

      // maj locale immediate (l'UI ne freeze pas en attendant le reseau)
      setSetLogs((prev) => {
        const idx = prev.findIndex(
          (l) => l.session_block_id === sessionBlockId && l.set_index === setIndex
        )
        if (idx === -1) {
          return [
            ...prev,
            {
              id: `temp-${key}`,
              workout_log_id: workoutLogId ?? '',
              session_block_id: sessionBlockId,
              set_index: setIndex,
              actual_reps: null,
              actual_weight: null,
              completed: false,
              comment: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...patch,
            } as SetLog,
          ]
        }
        const next = [...prev]
        next[idx] = { ...next[idx], ...patch }
        return next
      })

      // ecriture reseau regroupee (debounce), cree le workout_log a la volee
      pendingWrites.current[key] = { ...pendingWrites.current[key], ...patch }

      clearTimeout(writeTimers.current[key])
      writeTimers.current[key] = setTimeout(async () => {
        const finalPatch = pendingWrites.current[key]
        delete pendingWrites.current[key]
        if (!finalPatch) return

        const logId = await ensureWorkoutLog()
        if (!logId) return

        await supabase.from('set_logs').upsert(
          {
            workout_log_id: logId,
            session_block_id: sessionBlockId,
            set_index: setIndex,
            ...finalPatch,
          },
          { onConflict: 'workout_log_id,session_block_id,set_index' }
        )
      }, 500)
    },
    [ensureWorkoutLog, workoutLogId]
  )

  const saveFeedback = useCallback(
    async (feedback: {
      intensity_rating: number
      duration_rating: number
      relevance_rating: number
    }) => {
      const logId = await ensureWorkoutLog()
      if (!logId) return { error: 'Impossible de creer le journal de seance' }

      const { error } = await supabase.from('workout_logs').update(feedback).eq('id', logId)
      if (error) return { error: error.message }
      return { error: null }
    },
    [ensureWorkoutLog]
  )

  return { loading, getLog, updateSetLog, ensureWorkoutLog, saveFeedback }
}

export interface SessionFeedback {
  intensity_rating: number
  duration_rating: number
  relevance_rating: number
}
