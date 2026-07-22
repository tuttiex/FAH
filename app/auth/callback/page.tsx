'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [message, setMessage] = useState('Confirming your account…')

  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Error getting user:', userError)
        setMessage('Something went wrong confirming your account. Try logging in.')
        return
      }
      
      if (user) {
        // Check if profile is complete (proof_of_identity is now optional)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, surname, email')
          .eq('user_id', user.id)
          .single()
        
        // PGRST116 means no rows found - expected for new users
        // Other errors should be logged
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError)
        }
        
        const isProfileComplete = profile && 
          profile.first_name && 
          profile.surname && 
          profile.email
        
        if (isProfileComplete) {
          router.push('/')
        } else {
          router.push('/profile')
        }
      } else {
        setMessage('Something went wrong confirming your account. Try logging in.')
      }
    }

    checkProfileAndRedirect()
  }, [router])

  return (
    <div className="flex items-center justify-center flex-1 px-6 py-20">
      <p className="text-gray-600">{message}</p>
    </div>
  )
}