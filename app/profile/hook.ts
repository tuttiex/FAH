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

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Error getting user:', userError)
      }
      
      setUser(user)
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, surname, email')
          .eq('user_id', user.id)
          .single()
        
        const isComplete = !!profile && !!(profile?.first_name && profile?.surname && profile?.email)
        setProfileComplete(isComplete)
      }
      
      setLoading(false)
    }
    
    checkUser()
    
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfileComplete(false)
        setLoading(false)
        return
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        setProfileComplete(true)
        setLoading(false)
      }
    })
    
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [router])

  return { user, profileComplete, loading }
}
