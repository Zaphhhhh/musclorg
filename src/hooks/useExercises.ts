import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Exercise, ExerciseInput } from '../types/exercise'

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchExercises = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setExercises(data as Exercise[])

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchExercises()
  }, [fetchExercises])

  const createExercise = useCallback(async (input: ExerciseInput) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Utilisateur non connecte' }

    const { data, error } = await supabase
      .from('exercises')
      .insert({ ...input, user_id: user.id })
      .select()
      .single()

    if (error) return { error: error.message }

    setExercises((prev) => [data as Exercise, ...prev])
    return { error: null }
  }, [])

  const updateExercise = useCallback(async (id: string, input: Partial<ExerciseInput>) => {
    const { data, error } = await supabase
      .from('exercises')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) return { error: error.message }

    setExercises((prev) => prev.map((ex) => (ex.id === id ? (data as Exercise) : ex)))
    return { error: null }
  }, [])

  const deleteExercise = useCallback(async (id: string) => {
    const { error } = await supabase.from('exercises').delete().eq('id', id)

    if (error) return { error: error.message }

    setExercises((prev) => prev.filter((ex) => ex.id !== id))
    return { error: null }
  }, [])

  return {
    exercises,
    loading,
    error,
    createExercise,
    updateExercise,
    deleteExercise,
    refetch: fetchExercises,
  }
}
