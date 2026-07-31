import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { SessionWithExercises } from '../types/program'

export function useSessionDetail(sessionId: string | undefined) {
  const [session, setSession] = useState<SessionWithExercises | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSession = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('sessions')
      .select('*, session_blocks(*, exercise:exercises(*))')
      .eq('id', sessionId)
      .order('order_index', { referencedTable: 'session_blocks' })
      .single()

    if (error) setError(error.message)
    else setSession(data as unknown as SessionWithExercises)

    setLoading(false)
  }, [sessionId])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  return { session, loading, error, refetch: fetchSession }
}
