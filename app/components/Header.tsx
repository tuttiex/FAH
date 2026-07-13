'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [profileComplete, setProfileComplete] = useState(false)
  
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Check if profile exists
        const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single()
        setProfileComplete(!!profile)
      }
    }
    
    checkUser()
    
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        supabase.from('profiles').select('id').eq('user_id', session.user.id).single().then(({ data }) => {
          setProfileComplete(!!data)
        })
      } else {
        setProfileComplete(false)
      }
    })
    
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfileComplete(false)
    setDropdownOpen(false)
  }
  
  return (
    <header className="flex items-center justify-between px-8 py-7">
      <a href="/" className="logo flex items-center gap-2.5 text-decoration-none text-ink" aria-label="FAH home">
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 15L15 5L26 15" stroke="#12AD5C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 12.5V25H23V12.5" stroke="#12AD5C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13 25V18H17V25" stroke="#12AD5C" strokeWidth="2.4" strokeLinecap="round"/>
        </svg>
        <div className="flex flex-col">
          <span className="font-display font-semibold text-[21px] tracking-tight">FAH</span>
          <span className="text-sm text-ink-soft -mt-1">find a home</span>
        </div>
      </a>

      <div className="relative">
        <button 
          className="login-btn flex items-center justify-center w-10 h-10 rounded-full border border-solid border-green-tint-strong bg-white cursor-pointer transition-all duration-150 hover:bg-green-tint hover:border-green focus-visible:outline-2 focus-visible:outline-green focus-visible:outline-offset-2" 
          aria-label="Account menu"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9" cy="6" r="3" stroke="#12AD5C" strokeWidth="1.6"/>
            <path d="M3.5 15C4.3 12 6.4 10.5 9 10.5C11.6 10.5 13.7 12 14.5 15" stroke="#12AD5C" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
        <div className={`${dropdownOpen ? '' : 'hidden'} absolute right-0 mt-2 w-48 bg-white border border-green-tint-strong rounded-lg shadow-lg z-10`}>
          {user ? (
            <>
              <a href="/profile" className="block px-4 py-2 text-ink hover:bg-green-tint">Profile</a>
              <button 
                onClick={handleLogout}
                className="block w-full px-4 py-2 text-left text-ink hover:bg-green-tint"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <a href="/login" className="block px-4 py-2 text-ink hover:bg-green-tint">Log In</a>
              <a href="/signup" className="block px-4 py-2 text-ink hover:bg-green-tint">Sign Up</a>
            </>
          )}
        </div>
      </div>
    </header>
  )
}