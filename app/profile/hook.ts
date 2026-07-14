'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [profileComplete, setProfileComplete] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('first_name, surname, email, proof_of_identity').eq('user_id', user.id).single()
        setProfileComplete(!!profile && !!(profile.first_name && profile.surname && profile.email && profile.proof_of_identity))
      }
      
      setLoading(false)
    }
    
    checkUser()
    
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        supabase.from('profiles').select('first_name, surname, email, proof_of_identity').eq('user_id', session.user.id).single().then(({ data }) => {
          setProfileComplete(!!data && !!(data.first_name && data.surname && data.email && data.proof_of_identity))
        })
      } else {
        setProfileComplete(false)
      }
    })
    
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  return { user, profileComplete, loading }
}