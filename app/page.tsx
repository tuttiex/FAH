'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Check if profile is complete
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, surname, email, proof_of_identity')
          .eq('user_id', user.id)
          .single()
        
        const isProfileComplete = profile && 
          profile.first_name && 
          profile.surname && 
          profile.email && 
          profile.proof_of_identity
        
        if (!isProfileComplete) {
          router.push('/profile')
          return
        }
      }
      
      setLoading(false)
    }
    
    checkUserAndProfile()
    
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })
    
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [router])

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </main>
    )
  }

  return (
    <main className="relative flex-1 flex items-center justify-center px-6 py-10 overflow-hidden">
      <svg className="roofline absolute top-1/2 left-1/2 w-min(820px,130vw) -translate-x-1/2 -translate-y-[54%] z-0 pointer-events-none" viewBox="0 0 820 260" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M40 220L410 30L780 220" stroke="#CDEEDB" strokeWidth="2" strokeLinecap="round"/>
        <path d="M120 220V150" stroke="#CDEEDB" strokeWidth="2" strokeLinecap="round"/>
        <path d="M700 220V150" stroke="#CDEEDB" strokeWidth="2" strokeLinecap="round"/>
      </svg>

      <div className="hero relative z-1 max-w-xl text-center flex flex-col items-center gap-10">
        <h1 className="m-0 font-display font-semibold text-[clamp(28px,4.6vw,42px)] leading-[1.28] tracking-tight text-ink">
          Welcome to FAH — <br className="hidden sm:inline" />the best place to <em className="font-normal text-green">list</em> and <em className="font-normal text-green">find</em> a home.
        </h1>

        <div className="actions flex gap-4 flex-wrap justify-center">
          <a 
            href="/list" 
            className="btn btn-primary flex items-center gap-2.25 px-7.5 py-3.5 rounded-xl font-semibold text-base no-underline cursor-pointer border border-solid border-transparent transition-all duration-150 active:scale-95 bg-green text-white hover:bg-[#0f9a51] focus-visible:outline-2 focus-visible:outline-green focus-visible:outline-offset-3"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 3V15M3 9H15" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            List
          </a>
          <a href="/rent" className="btn btn-secondary flex items-center gap-2.25 px-7.5 py-3.5 rounded-xl font-semibold text-base no-underline cursor-pointer border border-solid border-green transition-all duration-150 active:scale-95 bg-white text-green hover:bg-green-tint focus-visible:outline-2 focus-visible:outline-green focus-visible:outline-offset-3">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6.5" cy="6.5" r="3.2" stroke="#12AD5C" strokeWidth="1.6"/>
              <path d="M8.8 8.8L15 15M15 15V11M15 15H11" stroke="#12AD5C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Rent
          </a>
        </div>
      </div>
    </main>
  )
}