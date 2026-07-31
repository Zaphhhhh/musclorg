import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile, ProfileInput } from '../types/profile'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) setError(error.message)
    else setProfile(data as Profile)

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const updateProfile = useCallback(async (input: ProfileInput) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Utilisateur non connecte' }

    const { data, error } = await supabase
      .from('profiles')
      .update(input)
      .eq('id', user.id)
      .select()
      .single()

    if (error) return { error: error.message }

    setProfile(data as Profile)
    return { error: null }
  }, [])

  return { profile, loading, error, updateProfile, refetch: fetchProfile }
}
