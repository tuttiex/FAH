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
        // Check if profile exists, redirect to profile if not
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase.from('profiles').select('id').eq('user_id', user.id).single().then(({ data: profile }) => {
              if (!profile) {
                router.push('/profile')
              } else {
                router.push('/')
              }
            })
          }
        })
      }
    })

    // Fallback in case the event already fired before this mounted
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const user = data.session.user
        supabase.from('profiles').select('id').eq('user_id', user.id).single().then(({ data: profile }) => {
          if (!profile) {
            router.push('/profile')
          } else {
            router.push('/')
          }
        })
      } else {
        setMessage('Something went wrong confirming your account. Try logging in.')
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [router])

  return (
      <div className="flex items-center justify-center flex-1 px-6 py-20">
      <p className="text-gray-600">{message}</p>
    </div>
  )
}