import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile, ProfileInput } from '../types/profile'

// Cache en memoire (persiste entre les changements de page dans l'onglet,
// pas entre rechargements). Evite le flash "email au lieu du pseudo" a
// chaque montage de page, le temps que le fetch reponde.
let cachedProfile: Profile | null = null

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(cachedProfile)
  const [loading, setLoading] = useState(!cachedProfile)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!cachedProfile) setLoading(true)
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
    else {
      cachedProfile = data as Profile
      setProfile(cachedProfile)
    }

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

    cachedProfile = data as Profile
    setProfile(cachedProfile)
    return { error: null }
  }, [])

  return { profile, loading, error, updateProfile, refetch: fetchProfile }
}
