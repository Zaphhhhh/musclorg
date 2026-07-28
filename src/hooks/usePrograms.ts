import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Program } from '../types/program'

export function usePrograms() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrograms = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setPrograms(data as Program[])

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPrograms()
  }, [fetchPrograms])

  const createProgram = useCallback(async (name: string, description: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const user = session?.user
    if (!user) return { error: 'Utilisateur non connecte', data: null }

    const { data, error } = await supabase
      .from('programs')
      .insert({ name, description: description || null, owner_id: user.id })
      .select()
      .single()

    if (error) return { error: error.message, data: null }

    setPrograms((prev) => [data as Program, ...prev])
    return { error: null, data: data as Program }
  }, [])

  const deleteProgram = useCallback(async (id: string) => {
    const { error } = await supabase.from('programs').delete().eq('id', id)
    if (error) return { error: error.message }

    setPrograms((prev) => prev.filter((p) => p.id !== id))
    return { error: null }
  }, [])

  return { programs, loading, error, createProgram, deleteProgram, refetch: fetchPrograms }
}
