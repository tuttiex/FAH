'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [message, setMessage] = useState('Confirming your account…')

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push('/')
      }
    })

    // Fallback in case the event already fired before this mounted
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.push('/')
      } else {
        setMessage('Something went wrong confirming your account. Try logging in.')
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600">{message}</p>
    </div>
  )
}