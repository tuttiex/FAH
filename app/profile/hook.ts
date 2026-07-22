'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [profileComplete, setProfileComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Extract profile check into a reusable function
  const checkProfileAndRedirect = async (userId: string | undefined) => {
    if (!userId) {
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, surname, email')
      .eq('user_id', userId)
      .single()
    
    const isComplete = !!profile && !!(profile.first_name && profile.surname && profile.email)
    setProfileComplete(isComplete)
    
    // Redirect to profile page if profile is incomplete
    if (!isComplete) {
      router.push('/profile')
    }
    
    setLoading(false)
  }

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      await checkProfileAndRedirect(user?.id)
    }
    
    checkUser()
    
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      // Check profile completeness on SIGNED_IN events
      if (event === 'SIGNED_IN' && session?.user) {
        checkProfileAndRedirect(session.user.id)
      } else if (!session?.user) {
        setProfileComplete(false)
      }
    })
    
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [router])

  return { user, profileComplete, loading }
}
