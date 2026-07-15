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
    <main className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105" 
               style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560518883-46a0e18d7b5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}>
          </div>
          <div className="absolute inset-0 hero-overlay"></div>
        </div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <h1 className="font-display font-bold text-[clamp(32px,4.6vw,48px)] text-white drop-shadow-lg leading-tight">
            Welcome to FAH — the best place to list and find a home
          </h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a 
              href="/list" 
              className="flex items-center justify-center gap-2 px-8 py-4 bg-primary-container text-white rounded-xl font-semibold text-base shadow-lg transition-all duration-150 active:scale-[0.95] hover:brightness-110 w-full sm:w-auto"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 3V15M3 9H15" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              List
            </a>
            <a 
              href="/rent" 
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white border-[1.5px] border-primary-container text-primary-container rounded-xl font-semibold text-base shadow-lg transition-all duration-150 active:scale-[0.95] hover:bg-primary-container/5 w-full sm:w-auto"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="6.5" cy="6.5" r="3.2" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M8.8 8.8L15 15M15 15V11M15 15H11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Rent
            </a>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/80">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </section>

      {/* Search Bar Section */}
      <section className="relative -mt-16 z-20 px-4 max-w-[1280px] mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-4 border border-outline-variant/30">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface-variant flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              LOCATION
            </label>
            <input 
              type="text" 
              placeholder="Where are you looking?" 
              className="w-full bg-transparent border-none focus:ring-0 font-base text-base p-0 placeholder:text-on-surface-variant/40"
            />
          </div>
          <div className="space-y-2 md:border-l md:border-outline-variant/30 md:pl-6">
            <label className="text-sm font-semibold text-on-surface-variant flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              PROPERTY TYPE
            </label>
            <select className="w-full bg-transparent border-none focus:ring-0 font-base text-base p-0 appearance-none text-on-surface-variant">
              <option>House</option>
              <option>Shop</option>
              <option>Land</option>
            </select>
          </div>
          <div className="space-y-2 md:border-l md:border-outline-variant/30 md:pl-6">
            <label className="text-sm font-semibold text-on-surface-variant flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1v22M17 5H9c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              BUDGET
            </label>
            <input 
              type="text" 
              placeholder="₦500,000 - ₦2,000,000" 
              className="w-full bg-transparent border-none focus:ring-0 font-base text-base p-0 placeholder:text-on-surface-variant/40"
            />
          </div>
          <div className="flex items-end">
            <button className="w-full py-4 bg-primary text-white rounded-xl font-semibold text-base active:scale-[0.96] transition-transform flex items-center justify-center gap-2">
              Search Properties
            </button>
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-16 px-4 max-w-[1280px] mx-auto">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-primary tracking-widest">DISCOVER</p>
            <h2 className="font-display font-bold text-3xl text-on-surface">Curated Collections</h2>
          </div>
          <button className="text-primary font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
            View All Categories 
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
          {/* Bento Item 1 */}
          <div className="md:col-span-8 group relative rounded-2xl overflow-hidden shadow-sm border border-secondary-container/50 bg-secondary-container/20">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                 style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560518883-46a0e18d7b5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')" }}>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 text-white">
              <span className="px-3 py-1 bg-primary text-white rounded-full font-semibold text-xs mb-3 inline-block">PREMIUM</span>
              <h3 className="font-display font-bold text-2xl mb-2">Luxury Homes</h3>
              <p className="font-base text-base text-white/80 max-w-md">Experience elevated living in our exclusively curated properties.</p>
            </div>
          </div>
          
          {/* Bento Item 2 */}
          <div className="md:col-span-4 group relative rounded-2xl overflow-hidden shadow-sm border border-secondary-container/50">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                 style={{ backgroundImage: "url('https://images.unsplash.com/photo-1564013737116-d26613c0a412?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')" }}>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 text-white">
              <h3 className="font-display font-bold text-xl mb-2">Family Homes</h3>
              <p className="font-base text-base text-white/80">Spacious living for you and yours.</p>
            </div>
          </div>
          
          {/* Bento Item 3 */}
          <div className="md:col-span-4 group relative rounded-2xl overflow-hidden shadow-sm border border-secondary-container/50">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                 style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560184897-697e54a20a0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')" }}>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 text-white">
              <h3 className="font-display font-bold text-xl mb-2">Commercial Shops</h3>
              <p className="font-base text-base text-white/80">Prime retail spaces for your business.</p>
            </div>
          </div>
          
          {/* Bento Item 4 */}
          <div className="md:col-span-8 group relative rounded-2xl overflow-hidden shadow-sm border border-secondary-container/50 bg-secondary-container/20">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                 style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500076037252-9b7d6c07840c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')" }}>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 text-white">
              <h3 className="font-display font-bold text-2xl mb-2">Land Properties</h3>
              <p className="font-base text-base text-white/80">Invest in your future with prime land opportunities.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}