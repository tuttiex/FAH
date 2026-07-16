'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    
    checkUser()
    
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })
    
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setDropdownOpen(false)
  }

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[1200px] z-50 flex justify-between items-center px-8 py-3 bg-white/80 backdrop-blur-md shadow-lg rounded-full border border-outline-variant/30">
      <a href="/" className="logo flex items-center gap-3 text-decoration-none">
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 15L15 5L26 15" stroke="#12AD5C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 12.5V25H23V12.5" stroke="#12AD5C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13 25V18H17V25" stroke="#12AD5C" strokeWidth="2.4" strokeLinecap="round"/>
        </svg>
        <div className="flex flex-col leading-none">
          <span className="font-display font-bold text-primary">FAH</span>
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">find a home</span>
        </div>
      </a>

      <nav className="hidden md:flex items-center gap-8">
        {user ? (
          <>
            <a href="/profile" className="font-semibold text-sm text-primary border-b-2 border-primary pb-1 transition-colors duration-200">Profile</a>
            <button 
              onClick={handleLogout}
              className="font-semibold text-sm text-on-surface-variant hover:text-primary transition-colors duration-200"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <a href="/login" className="font-semibold text-sm text-on-surface-variant hover:text-primary transition-colors duration-200">Login</a>
            <a href="/signup" className="font-semibold text-sm text-on-surface-variant hover:text-primary transition-colors duration-200">Sign Up</a>
          </>
        )}
      </nav>

      <button 
        className="md:hidden text-on-surface p-2"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-label="Menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Mobile Dropdown */}
      {dropdownOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-outline-variant rounded-lg shadow-lg z-10 md:hidden">
          {user ? (
            <>
              <a href="/profile" className="block px-4 py-2 text-on-surface hover:bg-green-tint transition-colors">Profile</a>
              <button 
                onClick={handleLogout}
                className="block w-full px-4 py-2 text-left text-on-surface hover:bg-green-tint transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a href="/login" className="block px-4 py-2 text-on-surface hover:bg-green-tint transition-colors">Login</a>
              <a href="/signup" className="block px-4 py-2 text-on-surface hover:bg-green-tint transition-colors">Sign Up</a>
            </>
          )}
        </div>
      )}
    </header>
  )
}