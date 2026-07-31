import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useLastPerformedSession(sessionIds: string[]) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const key = sessionIds.join(',')

  useEffect(() => {
    if (sessionIds.length === 0) {
      setSessionId(null)
      setLoading(false)
      return
    }

    let cancelled = false

    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('workout_logs')
        .select('session_id, performed_on')
        .in('session_id', sessionIds)
        .order('performed_on', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!cancelled) {
        setSessionId(data?.session_id ?? null)
        setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { sessionId, loading }
}
