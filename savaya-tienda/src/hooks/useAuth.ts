'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!supabaseConfigured) {
      setIsLoading(false)
      return
    }
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch profile from DB whenever the authenticated user ID changes
  useEffect(() => {
    if (!user?.id || !supabaseConfigured) {
      setProfile(null)
      return
    }
    const supabase = createClient()
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setProfile(data ?? null))
  }, [user?.id])

  const signOut = useCallback(
    async (redirectTo = '/') => {
      if (supabaseConfigured) {
        const supabase = createClient()
        await supabase.auth.signOut()
      }
      setProfile(null)
      router.push(redirectTo)
      router.refresh()
    },
    [router],
  )

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    signOut,
  }
}
