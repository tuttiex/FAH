'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        fetchUnreadCount(user.id)
      }
    }

    checkUser()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        fetchUnreadCount(session.user.id)
      } else {
        setUnreadCount(0)
      }
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchUnreadCount = async (userId: string) => {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('read', false)

    setUnreadCount(count || 0)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUnreadCount(0)
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
        <a href="/rent" className="font-semibold text-sm text-on-surface-variant hover:text-primary transition-colors duration-200">Rent</a>
        <a href="/list" className="font-semibold text-sm text-on-surface-variant hover:text-primary transition-colors duration-200">List</a>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:bg-primary hover:text-white transition-colors"
            aria-label="Profile menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 20C18 16.6863 15.3137 14 12 14C8.68629 14 6 16.6863 6 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-44 bg-white border border-outline-variant rounded-lg shadow-lg z-10">
              {user ? (
                <>
                  <a href="/profile" className="block px-4 py-2 text-on-surface hover:bg-green-tint transition-colors">Profile</a>
                  <a href="/messages" className="block px-4 py-2 text-on-surface hover:bg-green-tint transition-colors relative">
                    Messages
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-2 px-1.5 py-0.5 bg-primary text-white rounded-full text-xs font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </a>
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
        </div>
      </nav>

      {/* Mobile Menu Button */}
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
              <a href="/messages" className="block px-4 py-2 text-on-surface hover:bg-green-tint transition-colors relative">
                Messages
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-2 px-1.5 py-0.5 bg-primary text-white rounded-full text-xs font-bold">
                    {unreadCount}
                  </span>
                )}
              </a>
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