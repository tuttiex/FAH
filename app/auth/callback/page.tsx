'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [message, setMessage] = useState('Confirming your account…')

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Error getting user:', userError)
        setMessage('Something went wrong confirming your account. Try logging in.')
        return
      }
      
      if (user) {
        router.push('/')
      } else {
        setMessage('Something went wrong confirming your account. Try logging in.')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex items-center justify-center flex-1 px-6 py-20">
      <p className="text-gray-600">{message}</p>
    </div>
  )
}